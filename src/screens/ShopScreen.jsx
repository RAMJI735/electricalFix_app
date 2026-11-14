import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { ELECTRICAL_CATEGORIES } from '../constants/mockData';
import { useCategories, useSettings } from '../hooks';
import CategoryService from '../../services/categoryService';
import { useCart } from '../context/CartContext';
import {
  ArrowLeftIcon,
  SearchIcon,
  StarIcon,
  BoltIcon,
  CartIcon,
} from '../components/Icons';
import {
  ProductCardSkeleton,
  CategoryPillSkeleton,
} from '../components/Skeleton';

const PAGE_SIZE = 4;

export default function ShopScreen({
  route,
  navigation,
  initialCategory: propInitialCategory = 'all',
  onBack: propOnBack,
  onAddToCart,
  onSelectService,
  onNavigateToCart,
}) {
  const currentCategory = route?.params?.categoryId || route?.params?.category || propInitialCategory || 'all';
  const queryClient = useQueryClient();
  const { isInCart } = useCart();
  const { commerce } = useSettings();
  const gstType = commerce?.gstType || 'exclusive';
  const taxRate = commerce?.taxRate ?? 18;

  const handleBack = useCallback(() => {
    if (propOnBack) {
      propOnBack();
    } else if (navigation?.jumpTo) {
      navigation.jumpTo('Home');
    } else if (navigation?.navigate) {
      navigation.navigate('Home');
    }
  }, [propOnBack, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [handleBack])
  );

  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [prevInitialCategory, setPrevInitialCategory] = useState(currentCategory);

  if (currentCategory !== prevInitialCategory) {
    setPrevInitialCategory(currentCategory);
    setSelectedCategory(currentCategory);
    setDisplayedItems([]);
    setLoadingItems(true);
  }

  const handleSelectCategory = useCallback((categoryId) => {
    if (categoryId === selectedCategory) return;
    setDisplayedItems([]);
    setLoadingItems(true);
    setSelectedCategory(categoryId);
  }, [selectedCategory]);

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [addingProductId, setAddingProductId] = useState(null);

  const {
    data: categoryData,
    isLoading: loadingCategories,
    refetch: refetchCategories,
  } = useCategories();

  const categories = useMemo(() => {
    if (categoryData?.length) {
      return [
        { id: 'all', name: 'All Products', icon: '⚡' },
        ...categoryData.map((category) => ({
          id: category._id || category.id,
          name: category.categoryName || category.name,
          icon: category.icon || '⚡',
        })),
      ];
    }
    return ELECTRICAL_CATEGORIES;
  }, [categoryData]);

  const loadPage = useCallback(
    async (pageToLoad = 1, isRefresh = false) => {
      if (pageToLoad === 1) {
        if (!isRefresh) setLoadingItems(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const queryParams = {
          page: pageToLoad,
          limit: PAGE_SIZE,
          search: searchQuery.trim(),
          type: 'product',
          categoryId: selectedCategory || 'all',
        };

        const queryKey = ['services', 'paginated', queryParams];

        const response = await queryClient.fetchQuery({
          queryKey,
          queryFn: () =>
            CategoryService.getServicesPaginated(queryParams),
          staleTime: isRefresh ? 0 : 1000 * 60,
        });

        const backendItems =
          response?.items ||
          response?.data ||
          [];

        const hasNext = Boolean(
          response?.hasNextPage
        );

        const formattedItems = backendItems.map((item) => {
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
            name:
              item.serviceName ||
              item.productName ||
              item.name ||
              'Electrical Product',
            brand: item.brand || 'VOLTLINE',
            model: item.model || '',
            spec: item.estimated_time
              ? `⏱ ${item.estimated_time} • Warranty: ${item.warranty || '90 Days'}`
              : item.description ||
                item.spec ||
                'Certified Electrical Equipment',
            price,
            originalPrice: origPrice,
            discountPercentage: discount,
            rating: typeof item.rating === 'number' ? item.rating : 4.8,
            reviews:
              typeof item.reviewsCount === 'number'
                ? item.reviewsCount
                : item.reviews || 48,
            badge:
              item.badge ||
              (item.type === 'service' ? 'SERVICE' : 'VERIFIED'),
            inStock:
              item.inStock !== false &&
              (item.stock === undefined || item.stock > 0),
            image:
              item.image ||
              (Array.isArray(item.images) ? item.images[0] : '') ||
              '',
            category:
              item.category?._id ||
              item.category ||
              'general',
            isBackend: true,
          };
        });

        const uniqueItems = Array.from(
          new Map(
            formattedItems.map((item) => [
              item.id,
              item,
            ])
          ).values()
        );

        if (pageToLoad === 1) {
          setDisplayedItems(uniqueItems);
        } else {
          setDisplayedItems((previousItems) =>
            Array.from(
              new Map(
                [...previousItems, ...uniqueItems].map(
                  (item) => [item.id, item]
                )
              ).values()
            )
          );
        }

        setTotalItemsCount(
          pageToLoad === 1
            ? response?.total ?? uniqueItems.length
            : (response?.total ?? 0)
        );

        setPage(pageToLoad);
        setHasMore(hasNext);
      } catch (error) {
        console.error(
          'Error fetching products:',
          error
        );
      } finally {
        setLoadingItems(false);
        setLoadingMore(false);
      }
    },
    [
      queryClient,
      selectedCategory,
      searchQuery,
    ]
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await loadPage(1);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [loadPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.race([
        Promise.allSettled([
          refetchCategories(),
          loadPage(1, true),
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
    if (!loadingItems && !loadingMore && hasMore) {
      loadPage(page + 1);
    }
  };

  const handleAddToCartClick = async (product) => {
    const productId = product._id || product.id;

    if (addingProductId || !onAddToCart) return;

    setAddingProductId(productId);

    try {
      await onAddToCart(product);
    } catch (error) {
      console.warn('Failed to add to cart:', error);
    } finally {
      setAddingProductId(null);
    }
  };

  const renderProductItem = ({ item: product }) => {
    const productId = product._id || product.id;
    const isAdding = addingProductId === productId;
    const inCart = isInCart(product);
    const isAvailable = product.inStock !== false;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => onSelectService?.(product)}
      >
        {/* Product Media with Badges */}
        <View style={styles.cardImageContainer}>
          {product.image ? (
            <Image
              source={{ uri: product.image }}
              style={styles.cardImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <BoltIcon size={32} color="#94a3b8" />
            </View>
          )}

          <View style={styles.cardHeaderOverlay}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{product.badge}</Text>
            </View>
            <View style={styles.ratingBadge}>
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

        <View style={styles.brandRow}>
          <Text style={styles.brandText}>
            {(product.brand || 'VOLTLINE').toUpperCase()}
          </Text>
        </View>

        <Text style={styles.productName}>{product.name}</Text>

        {!!product.model && (
          <Text style={styles.productModel}>
            Model: {product.model}
          </Text>
        )}

        <Text style={styles.productSpec}>{product.spec}</Text>

        <View style={styles.cardBottom}>
          <View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{product.price}</Text>
              {product.originalPrice > product.price && (
                <Text style={styles.origPrice}>₹{product.originalPrice}</Text>
              )}
            </View>

            <Text style={styles.taxText}>
              {isAvailable
                ? `${gstType === 'inclusive' ? `Inc. ${taxRate}% GST` : `+ ${taxRate}% GST`} • In Stock`
                : '⚠️ Currently Out of Stock'}
            </Text>
          </View>

          {!isAvailable ? (
            <View style={styles.outOfStockBtn}>
              <Text style={styles.outOfStockText}>UNAVAILABLE</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.addToCartBtn,
                inCart && styles.goToCartBtn,
                isAdding && styles.addToCartBtnLoading,
              ]}
              activeOpacity={0.8}
              disabled={isAdding}
              onPress={(event) => {
                event?.stopPropagation?.();
                if (inCart) {
                  onNavigateToCart?.();
                } else {
                  handleAddToCartClick(product);
                }
              }}
            >
              {isAdding ? (
                <View style={styles.loadingButtonContent}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.addToCartText}>ADDING...</Text>
                </View>
              ) : inCart ? (
                <>
                  <CartIcon size={14} color="#ffffff" focused />
                  <Text style={styles.goToCartText}>GO TO CART</Text>
                </>
              ) : (
                <>
                  <BoltIcon size={14} color="#ffffff" />
                  <Text style={styles.addToCartText}>ADD TO CART</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.footerLoaderText}>
            Loading more items...
          </Text>
        </View>
      );
    }

    if (!hasMore && displayedItems.length > 0) {
      return (
        <View style={styles.endOfListWrapper}>
          <View style={styles.endOfListDivider} />
          <Text style={styles.endOfListText}>
            All {displayedItems.length} items loaded
          </Text>
          <View style={styles.endOfListDivider} />
        </View>
      );
    }

    return <View style={styles.footerSpace} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={handleBack}
          >
            <ArrowLeftIcon size={18} color="#0f172a" />
          </TouchableOpacity>
          <View>
            <Text style={styles.eyebrow}>CATALOG & INVENTORY</Text>
            <Text style={styles.title}>Electrical Shop</Text>
          </View>
        </View>

        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>
            {loadingItems
              ? '...'
              : `${totalItemsCount} ${totalItemsCount === 1 ? 'ITEM' : 'ITEMS'
              }`}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchIcon size={18} color="#64748b" />

        <TextInput
          style={styles.searchInput}
          placeholder="Filter by wire gauge, brand, switch type..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {!!searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearchText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.pillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {loadingCategories ? (
            <>
              <CategoryPillSkeleton />
              <CategoryPillSkeleton />
              <CategoryPillSkeleton />
              <CategoryPillSkeleton />
              <CategoryPillSkeleton />
            </>
          ) : (
            categories.map((category) => {
              const isSelected = selectedCategory === category.id;

              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.pill,
                    isSelected && styles.pillActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleSelectCategory(category.id)}
                >
                  {isSelected && loadingItems ? (
                    <ActivityIndicator
                      size="small"
                      color="#2563eb"
                      style={{ marginRight: 6 }}
                    />
                  ) : (
                    <Text style={styles.pillIcon}>{category.icon}</Text>
                  )}

                  <Text
                    style={[
                      styles.pillText,
                      isSelected && styles.pillTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      <FlatList
        data={loadingItems ? [] : displayedItems}
        keyExtractor={(item, index) =>
          String(item.id ?? index)
        }
        renderItem={renderProductItem}
        style={styles.productsScroll}
        contentContainerStyle={styles.productsContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={6}
        windowSize={5}
        initialNumToRender={4}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        ListEmptyComponent={
          loadingItems ? (
            <View style={styles.skeletonContainer}>
              <View style={styles.categoryLoadingBadge}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.categoryLoadingBadgeText}>
                  Loading {categories.find((c) => c.id === selectedCategory)?.name || 'category'} products...
                </Text>
              </View>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>
                No electrical services found
              </Text>
              <Text style={styles.emptySub}>
                Try searching with different keywords or select a
                different category filter.
              </Text>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.resetButtonText}>
                  Reset Filters
                </Text>
              </TouchableOpacity>
            </View>
          )
        }
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  itemCountBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  itemCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  },
  pillsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  pillsScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    gap: 6,
  },
  pillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  pillIcon: {
    fontSize: 13,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  productsScroll: {
    flex: 1,
  },
  productsContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardImageContainer: {
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
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
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
  outOfStockBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  outOfStockText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  badgePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 20,
    marginBottom: 2,
  },
  productModel: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 4,
  },
  productSpec: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  origPrice: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  taxText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 2,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 5,
  },
  addToCartBtnLoading: {
    opacity: 0.85,
    paddingHorizontal: 12,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  goToCartBtn: {
    backgroundColor: '#059669',
  },
  goToCartText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  footerLoader: {
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  footerSpace: {
    height: 90,
  },
  endOfListWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 12,
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
  categoryLoadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  categoryLoadingBadgeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  skeletonContainer: {
    paddingTop: 6,
  },
});