import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  RefreshControl,
  ActivityIndicator,
  ImageBackground,
  useWindowDimensions,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../constants/theme';
import { ELECTRICAL_CATEGORIES } from '../constants/mockData';
import { useCategories, useSettings } from '../hooks';
import CategoryService from '../../services/categoryService';
import { useCart } from '../context/CartContext';
import {
  SearchIcon,
  BoltIcon,
  StarIcon,
  CheckCircleIcon,
  CartIcon,
} from '../components/Icons';
import { CategoryCircleSkeleton, ProductCardSkeleton } from '../components/Skeleton';

const PAGE_SIZE = 6;

export default function HomeScreen({
  onSelectCategory: propOnSelectCategory,
  onAddToCart: propOnAddToCart,
  onNavigateToShop: propOnNavigateToShop,
  onSelectService: propOnSelectService,
  onNavigateToCart: propOnNavigateToCart,
}) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  const { isInCart, addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const onSelectCategory =
    propOnSelectCategory ||
    ((id) => navigation.navigate('Shop', { categoryId: id }));
  const onNavigateToShop =
    propOnNavigateToShop ||
    ((id = 'all') => navigation.navigate('Shop', { categoryId: id }));
  const onSelectService =
    propOnSelectService ||
    ((service) =>
      navigation.navigate('ServiceDetail', {
        serviceId: service.id || service._id,
      }));
  const onNavigateToCart =
    propOnNavigateToCart || (() => navigation.navigate('Cart'));
  const onAddToCart =
    propOnAddToCart ||
    (async (product) => {
      try {
        return await addToCart(product, 1);
      } catch (e) {
        console.warn('Add to cart fallback error:', e);
      }
    });

  // Dynamic Store & App Settings
  const {
    banners,
    announcement,
    assurances,
    storeName,
    tagline,
    refetch: refetchSettings,
  } = useSettings();

  // Pagination states for products feed
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);

  // Persistent reference for double back press tracking
  const lastBackPressTime = useRef(0);

  // Double back press to exit app when on Home screen
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) {
          BackHandler.exitApp();
          return true;
        }

        lastBackPressTime.current = now;
        if (Platform.OS === 'android') {
          ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        }
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => {
        lastBackPressTime.current = 0;
        subscription.remove();
      };
    }, [])
  );

  const handleAddToCartClick = async (product) => {
    const pid = product._id || product.id;
    if (addingProductId) return;
    setAddingProductId(pid);
    try {
      if (onAddToCart) {
        await onAddToCart(product);
      }
    } catch (err) {
      console.warn('Failed to add to cart:', err);
    } finally {
      setAddingProductId(null);
    }
  };

  const {
    data: categoryData,
    isLoading: loadingCategories,
    refetch: refetchCategories,
  } = useCategories();

  // Sync categories whenever TanStack Query updates data
  useEffect(() => {
    if (categoryData && categoryData.length > 0) {
      const formatted = categoryData.map((c) => ({
        id: c._id || c.id,
        name: c.categoryName || c.name,
        icon: c.icon || '⚡',
      }));
      setCategories([{ id: 'all', name: 'All Products', icon: '⚡' }, ...formatted]);
    } else if (!loadingCategories) {
      setCategories(ELECTRICAL_CATEGORIES);
    }
  }, [categoryData, loadingCategories]);

  const loadProductsPage = useCallback(
    async (pageToLoad = 1, isRefresh = false) => {
      if (pageToLoad === 1) {
        if (!isRefresh) setLoadingProducts(true);
      } else {
        setLoadingMore(true);
      }

      try {
        let backendItems = [];
        let hasNext = false;

        try {
          const queryKey = [
            'services',
            'paginated',
            {
              categoryId: 'all',
              page: pageToLoad,
              limit: PAGE_SIZE,
              search: searchQuery.trim(),
            },
          ];

          const res = await queryClient.fetchQuery({
            queryKey,
            queryFn: () =>
              CategoryService.getServicesPaginated({
                categoryId: 'all',
                page: pageToLoad,
                limit: PAGE_SIZE,
                search: searchQuery.trim(),
              }),
            staleTime: isRefresh ? 0 : 1000 * 60,
          });
          backendItems = res?.items || [];
          hasNext = Boolean(res?.hasNextPage);
        } catch (err) {
          console.warn('Backend products fetch failed:', err.message);
        }

        const formattedBackend = backendItems.map((item) => {
          const price = Number(item.price) || 0;
          const origPrice =
            Number(item.originalPrice) && Number(item.originalPrice) > price
              ? Number(item.originalPrice)
              : Number(item.effectiveOriginalPrice) || Math.round(price * 1.25);
          const discount =
            origPrice > price
              ? Math.round(((origPrice - price) / origPrice) * 100)
              : 0;

          return {
            ...item,
            id: item._id || item.id,
            name: item.serviceName || item.productName || item.name || 'Electrical Item',
            brand: item.brand || 'VOLTLINE',
            model: item.model || '',
            spec: item.estimated_time
              ? `⏱ ${item.estimated_time} • Warranty: ${item.warranty || '90 Days'}`
              : (item.description || item.spec || 'Certified Electrical Equipment'),
            price,
            originalPrice: origPrice,
            discountPercentage: discount,
            rating: typeof item.rating === 'number' ? item.rating : 4.8,
            reviews:
              typeof item.reviewsCount === 'number'
                ? item.reviewsCount
                : item.reviews || 48,
            badge:
              item.badge || (item.type === 'service' ? 'SERVICE' : 'VERIFIED'),
            inStock:
              item.inStock !== false &&
              (item.stock === undefined || item.stock > 0),
            image:
              item.image ||
              (Array.isArray(item.images) ? item.images[0] : '') ||
              '',
            category: item.category?._id || item.category || 'general',
            isBackend: true,
          };
        });

        const combined = [...formattedBackend];
        const uniquePool = Array.from(
          new Map(combined.map((item) => [item.id, item])).values()
        );

        if (pageToLoad === 1) {
          setProducts(uniquePool);
        } else {
          setProducts((prev) => {
            const merged = [...prev, ...uniquePool];
            return Array.from(new Map(merged.map((i) => [i.id, i])).values());
          });
        }

        setPage(pageToLoad);
        setHasMore(hasNext);
      } catch (err) {
        console.error('Error loading products page in HomeScreen:', err);
      } finally {
        setLoadingProducts(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, queryClient]
  );

  useEffect(() => {
    loadProductsPage(1);
  }, [loadProductsPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.race([
        Promise.allSettled([
          refetchSettings(),
          refetchCategories(),
          loadProductsPage(1, true),
        ]),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch (_e) {
      // Non-fatal
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingProducts && !loadingMore && hasMore) {
      loadProductsPage(page + 1);
    }
  };


  // Dynamic Hero Banners Setup
  const bannerRef = useRef(null);
  const isInteracting = useRef(false);

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const { width: screenWidth } = useWindowDimensions();

  const activeBanners = (banners || [])
    .filter((item) => item.active)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Compute exact banner width matching search bar and cards
  const bannerWidth =
    containerWidth > 0
      ? containerWidth
      : Math.max(280, screenWidth - 32);

  const handleBannerLayout = useCallback(
    (event) => {
      const { width } = event.nativeEvent.layout;
      if (width > 0 && Math.abs(width - containerWidth) > 1) {
        setContainerWidth(width);
      }
    },
    [containerWidth]
  );

  // Auto-scroll hero banner carousel safely (only when screen is actively focused)
  useEffect(() => {
    if (!isFocused || activeBanners.length <= 1 || bannerWidth <= 0) return;

    const interval = setInterval(() => {
      if (isInteracting.current || !bannerRef.current) return;

      setActiveBannerIndex((prev) => {
        const nextIndex = (prev + 1) % activeBanners.length;
        requestAnimationFrame(() => {
          if (bannerRef.current && bannerWidth > 0) {
            try {
              bannerRef.current.scrollTo({
                x: nextIndex * bannerWidth,
                y: 0,
                animated: true,
              });
            } catch (_err) {
              // Non-fatal if view unmounted during animation
            }
          }
        });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isFocused, activeBanners.length, bannerWidth]);

  const handleScroll = useCallback(
    (event) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      if (bannerWidth > 0 && activeBanners.length > 0) {
        const index = Math.round(offsetX / bannerWidth);
        const clampedIndex = Math.max(
          0,
          Math.min(activeBanners.length - 1, index)
        );
        setActiveBannerIndex((prev) =>
          prev !== clampedIndex ? clampedIndex : prev
        );
      }
    },
    [bannerWidth, activeBanners.length]
  );

  const handleScrollBeginDrag = useCallback(() => {
    isInteracting.current = true;
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    setTimeout(() => {
      isInteracting.current = false;
    }, 2000);
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      if (bannerWidth > 0 && activeBanners.length > 0) {
        const index = Math.round(offsetX / bannerWidth);
        const clampedIndex = Math.max(
          0,
          Math.min(activeBanners.length - 1, index)
        );
        setActiveBannerIndex(clampedIndex);
      }
      setTimeout(() => {
        isInteracting.current = false;
      }, 2000);
    },
    [bannerWidth, activeBanners.length]
  );




  const renderProductItem = ({ item: product }) => {
    const pid = product._id || product.id;
    const isAdding = addingProductId === pid;
    const inCart = isInCart(product);
    const isAvailable = product.inStock !== false;

    return (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        activeOpacity={0.88}
        onPress={() => onSelectService && onSelectService(product)}
      >
        {/* Product Media with Badges */}
        <View style={styles.productImageContainer}>
          {product.image ? (
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <BoltIcon size={36} color="#94a3b8" />
            </View>
          )}

          <View style={styles.cardHeaderOverlay}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{product.badge}</Text>
            </View>
            <View style={styles.ratingPill}>
              <StarIcon size={12} color="#f59e0b" />
              <Text style={styles.ratingText}>
                {product.rating} ({product.reviews})
              </Text>
            </View>
          </View>

          {product.discountPercentage > 0 && (
            <View style={styles.discountTag}>
              <Text style={styles.discountTagText}>
                {product.discountPercentage}% OFF
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.productBrand}>{product.brand.toUpperCase()}</Text>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productSpec} numberOfLines={1}>
          {product.spec}
        </Text>

        <View style={styles.priceRow}>
          <View>
            <View style={styles.priceGroup}>
              <Text style={styles.price}>₹{product.price}</Text>
              {product.originalPrice > product.price && (
                <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
              )}
            </View>
            <Text style={styles.stockLabel}>
              {isAvailable ? '✓ In Stock' : '⚠️ Out of Stock'}
            </Text>
          </View>

          {(() => {
            if (!isAvailable) {
              return (
                <View style={styles.outOfStockBtn}>
                  <Text style={styles.outOfStockBtnText}>UNAVAILABLE</Text>
                </View>
              );
            }

            return (
              <TouchableOpacity
                style={[
                  styles.addButton,
                  inCart && styles.goToCartButton,
                  isAdding && styles.addButtonLoading,
                ]}
                activeOpacity={0.8}
                disabled={isAdding}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  if (inCart) {
                    onNavigateToCart && onNavigateToCart();
                  } else {
                    handleAddToCartClick(product);
                  }
                }}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : inCart ? (
                  <View style={styles.btnContentRow}>
                    <CartIcon size={12} color="#ffffff" focused />
                    <Text style={styles.goToCartButtonText}>GO TO CART</Text>
                  </View>
                ) : (
                  <Text style={styles.addButtonText}>+ ADD</Text>
                )}
              </TouchableOpacity>
            );
          })()}
        </View>
      </TouchableOpacity>
    );
  };


  const BannerContent = ({ item, onNavigateToShop }) => (
    <View style={styles.bannerContent}>
      {!!item.tag && (
        <Text style={styles.bannerTagText}>
          {item.tag}
        </Text>
      )}

      {!!item.title && (
        <Text style={styles.bannerTitleText}>
          {item.title}
        </Text>
      )}

      {!!item.subtitle && (
        <Text style={styles.bannerSubtitleText}>
          {item.subtitle}
        </Text>
      )}

      {!!item.discountText && (
        <Text style={styles.bannerDiscountText}>
          {item.discountText}
        </Text>
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.bannerButton}
        onPress={() =>
          onNavigateToShop?.(item.targetCategory || 'all')
        }
      >
        <Text style={styles.bannerButtonText}>
          {item.buttonText || 'SHOP NOW →'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Top Brand Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.brandLogoImage}
              resizeMode="cover"
            />
          </View>
          <View>
            <Text style={styles.brandTitle}>{storeName || 'ElectricalFix'}</Text>
            <Text style={styles.brandSubtitle}>{tagline || 'Power in Motion'}</Text>
          </View>
        </View>
        {announcement?.enabled && (
          <View style={styles.liveBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveText} numberOfLines={1}>
              {announcement.text?.includes('DISPATCH') ? 'NEXT-DAY DISPATCH' : 'LIVE OFFER'}
            </Text>
          </View>
        )}
      </View>

      {/* Quick Search Input */}
      <View style={styles.searchWrapper}>
        <SearchIcon size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search wires, MCBs, LED panels, switches..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearchText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dynamic Hero Banner Carousel - Perfectly Centered */}
      {activeBanners.length > 0 && (
        <View style={styles.bannerWrapper} onLayout={handleBannerLayout}>
          <ScrollView
            ref={bannerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={bannerWidth}
            snapToAlignment="center"
            decelerationRate="fast"
            disableIntervalMomentum
            style={{ width: bannerWidth }}
            contentContainerStyle={styles.bannerScrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollEnd={handleMomentumScrollEnd}
          >
            {activeBanners.map((item, index) => (
              <View
                key={item._id || item.id || `banner-${index}`}
                style={{
                  width: bannerWidth,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.95}
                  style={styles.bannerCard}
                  onPress={() =>
                    onNavigateToShop?.(item.targetCategory || 'all')
                  }
                >
                  {item.image ? (
                    <ImageBackground
                      source={{ uri: item.image }}
                      style={styles.bannerImageBackground}
                      imageStyle={styles.bannerImage}
                      resizeMode="cover"
                    >
                      <View style={styles.bannerOverlay}>
                        <BannerContent
                          item={item}
                          onNavigateToShop={onNavigateToShop}
                        />
                      </View>
                    </ImageBackground>
                  ) : (
                    <View style={styles.bannerFallback}>
                      <BannerContent
                        item={item}
                        onNavigateToShop={onNavigateToShop}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          {activeBanners.length > 1 && (
            <View style={styles.paginationRow}>
              {activeBanners.map((item, index) => {
                const isActive = activeBannerIndex === index;
                return (
                  <TouchableOpacity
                    key={item._id || item.id || `dot-${index}`}
                    activeOpacity={0.7}
                    onPress={() => {
                      setActiveBannerIndex(index);
                      bannerRef.current?.scrollTo({
                        x: index * bannerWidth,
                        y: 0,
                        animated: true,
                      });
                    }}
                    style={[
                      styles.dot,
                      isActive && styles.dotActive,
                    ]}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Categories Row */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <TouchableOpacity onPress={() => onNavigateToShop?.('all')}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {loadingCategories ? (
          <>
            <CategoryCircleSkeleton />
            <CategoryCircleSkeleton />
            <CategoryCircleSkeleton />
            <CategoryCircleSkeleton />
            <CategoryCircleSkeleton />
          </>
        ) : (
          categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              activeOpacity={0.75}
              onPress={() => {
                const navigateAction = onSelectCategory || onNavigateToShop;
                if (navigateAction) navigateAction(cat.id);
              }}
            >
              <View style={styles.categoryIconCircle}>
                <Text style={styles.categoryEmoji}>{cat.icon}</Text>
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Featured Electrical Equipment Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Verified Electrical Catalog</Text>
        <TouchableOpacity onPress={() => onNavigateToShop?.('all')}>
          <Text style={styles.seeAllText}>See Full Catalog</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View>
      {loadingMore && (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.footerLoaderText}>Loading more equipment...</Text>
        </View>
      )}

      {!hasMore && products.length > 0 && (
        <View style={styles.endOfListWrapper}>
          <View style={styles.endOfListDivider} />
          <Text style={styles.endOfListText}>
            All {products.length} catalog items loaded
          </Text>
          <View style={styles.endOfListDivider} />
        </View>
      )}

      {/* Dynamic Contractor Assurances */}
      <View style={styles.assuranceCard}>
        {assurances.length > 0 ? (
          assurances.map((assur, idx) => (
            <React.Fragment key={assur._id || idx}>
              {idx > 0 && <View style={styles.divider} />}
              <View style={styles.assuranceItem}>
                <CheckCircleIcon
                  size={20}
                  color={idx % 2 === 0 ? '#10b981' : '#2563eb'}
                />
                <View style={styles.assuranceTextCol}>
                  <Text style={styles.assuranceTitle}>{assur.title}</Text>
                  {assur.description ? (
                    <Text style={styles.assuranceDesc}>{assur.description}</Text>
                  ) : null}
                </View>
              </View>
            </React.Fragment>
          ))
        ) : (
          <>
            <View style={styles.assuranceItem}>
              <CheckCircleIcon size={20} color="#10b981" />
              <View style={styles.assuranceTextCol}>
                <Text style={styles.assuranceTitle}>100% Genuine ISI Mark</Text>
                <Text style={styles.assuranceDesc}>
                  Direct from authorized brand distributors
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.assuranceItem}>
              <CheckCircleIcon size={20} color="#2563eb" />
              <View style={styles.assuranceTextCol}>
                <Text style={styles.assuranceTitle}>Site Delivery Available</Text>
                <Text style={styles.assuranceDesc}>
                  Bulk dispatch for commercial & residential
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={{ height: 80 }} />
    </View>
  );

  const renderEmpty = () => {
    if (loadingProducts) {
      return (
        <View style={{ gap: 12, marginBottom: 16 }}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {`No equipment found matching "${searchQuery}"`}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      data={products}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderProductItem}
      ListHeaderComponent={renderHeader()}
      ListFooterComponent={renderFooter()}
      ListEmptyComponent={renderEmpty()}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.4}
      removeClippedSubviews={false}
      maxToRenderPerBatch={6}
      windowSize={5}
      initialNumToRender={4}
      updateCellsBatchingPeriod={50}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary || '#2563eb']}
          tintColor={colors.primary || '#2563eb'}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803d',
    letterSpacing: 0.3,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    marginLeft: 8,
  },
  clearSearchText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  bannerWrapper: {
    marginTop: 4,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  bannerScrollContent: {
    alignItems: 'center',
  },
  bannerCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#102B50',
  },
  bannerImageBackground: {
    minHeight: 210,
    justifyContent: 'center',
  },
  bannerImage: {
    borderRadius: 16,
  },
  bannerOverlay: {
    minHeight: 210,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    padding: 20,
  },
  bannerFallback: {
    minHeight: 210,
    justifyContent: 'center',
    backgroundColor: '#102B50',
    padding: 20,
    borderRadius: 16,
  },
  bannerContent: {
    alignItems: 'flex-start',
  },
  bannerTagText: {
    marginBottom: 6,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#fef08a',
  },
  bannerTitleText: {
    marginBottom: 4,
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 28,
  },
  bannerSubtitleText: {
    marginBottom: 6,
    fontSize: 12,
    color: '#f1f5f9',
    lineHeight: 16,
  },
  bannerDiscountText: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '900',
    color: '#fde047',
  },
  bannerButton: {
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bannerButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#102b50',
    letterSpacing: 0.5,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    gap: 6,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#2563eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  categoriesScroll: {
    paddingRight: 8,
    gap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    width: 84,
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 16,
  },
  productImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  cardHeaderOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.3,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 3,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  discountTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  discountTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  productBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 18,
    marginBottom: 4,
  },
  productSpec: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  originalPrice: {
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  stockLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
    marginTop: 1,
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonLoading: {
    opacity: 0.85,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goToCartButton: {
    backgroundColor: '#059669',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  goToCartButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  outOfStockBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  outOfStockBtnText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  assuranceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    marginTop: 8,
  },
  assuranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  assuranceTextCol: {
    flex: 1,
  },
  assuranceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  assuranceDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  endOfListWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  endOfListDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  endOfListText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
});
