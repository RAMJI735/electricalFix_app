import React, { useState, useEffect, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ELECTRICAL_CATEGORIES } from '../constants/mockData';
import { useCategories, serviceKeys } from '../hooks';
import CategoryService from '../../services/categoryService';
import { useCart } from '../context/CartContext';
import {
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
  initialCategory = 'all',
  onAddToCart,
  onSelectService,
  onNavigateToCart,
}) {
  const queryClient = useQueryClient();
  const { isInCart } = useCart();

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(ELECTRICAL_CATEGORIES);
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

  useEffect(() => {
    setSelectedCategory(initialCategory || 'all');
  }, [initialCategory]);

  useEffect(() => {
    if (categoryData?.length) {
      const formattedCategories = categoryData.map((category) => ({
        id: category._id || category.id,
        name: category.categoryName || category.name,
        icon: category.icon || '⚡',
      }));

      setCategories([
        { id: 'all', name: 'All Products', icon: '⚡' },
        ...formattedCategories,
      ]);
    } else if (!loadingCategories) {
      setCategories(ELECTRICAL_CATEGORIES);
    }
  }, [categoryData, loadingCategories]);

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

        const queryKey = serviceKeys.paginated(queryParams);

        if (isRefresh) {
          await queryClient.invalidateQueries({ queryKey });
        }

        const response = await queryClient.fetchQuery({
          queryKey,
          queryFn: () =>
            CategoryService.getServicesPaginated(queryParams),
          staleTime: 1000 * 60, // 1 minute
        });

        const backendItems =
          response?.items ||
          response?.data ||
          [];

        const hasNext = Boolean(
          response?.hasNextPage
        );

        const formattedItems = backendItems.map((item) => {
          const price = item.price ?? 499;

          return {
            ...item,
            id: item._id || item.id,
            name:
              item.serviceName ||
              item.productName ||
              item.name ||
              'Unnamed Product',
            brand: item.brand || 'VOLTLINE',
            model: item.model || '',
            spec: item.estimated_time
              ? `⏱ ${item.estimated_time} • Warranty: ${item.warranty || '90 Days'
              }`
              : item.description ||
              item.spec ||
              'Certified Electrical Equipment',
            price,
            originalPrice: Math.round(price * 1.25),
            rating: 4.8,
            reviews: 58,
            badge:
              item.type === 'service'
                ? 'SERVICE'
                : 'VERIFIED',
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
    loadPage(1);
  }, [loadPage]);

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        refetchCategories(),
        loadPage(1, true),
      ]);
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

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => onSelectService?.(product)}
      >
        <View style={styles.cardTop}>
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>
              {(product.brand || 'VOLTLINE').toUpperCase()}
            </Text>

            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>
                {product.badge}
              </Text>
            </View>
          </View>

          <View style={styles.ratingBadge}>
            <StarIcon size={12} color="#f59e0b" />
            <Text style={styles.ratingText}>
              {product.rating} ({product.reviews})
            </Text>
          </View>
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
              <Text style={styles.origPrice}>
                ₹{product.originalPrice}
              </Text>
            </View>

            <Text style={styles.taxText}>
              Inc. 18% GST • In Stock
            </Text>
          </View>

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
        <View>
          <Text style={styles.eyebrow}>CATALOG & INVENTORY</Text>
          <Text style={styles.title}>Electrical Shop</Text>
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
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.pillIcon}>{category.icon}</Text>

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
        data={displayedItems}
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
            <View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
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
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 42,
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
    paddingBottom: 8,
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
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
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
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
});