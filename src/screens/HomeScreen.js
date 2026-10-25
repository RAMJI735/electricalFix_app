import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '../constants/theme';
import { ELECTRICAL_CATEGORIES, MOCK_PRODUCTS } from '../constants/mockData';
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

const PAGE_SIZE = 4;

export default function HomeScreen({ onSelectCategory, onAddToCart, onNavigateToShop, onSelectService, onNavigateToCart }) {
  const { isInCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination states for products feed
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);

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

  const loadCategories = useCallback(async () => {
    try {
      const backendCategories = await CategoryService.getCategories();
      if (backendCategories && backendCategories.length > 0) {
        const formatted = backendCategories.map((c) => ({
          id: c._id || c.id,
          name: c.categoryName || c.name,
          icon: c.icon || '⚡',
        }));
        setCategories([{ id: 'all', name: 'All Products', icon: '⚡' }, ...formatted]);
      }
    } catch (err) {
      // Fallback to local default categories
    } finally {
      setLoadingCategories(false);
    }
  }, []);

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
          const res = await CategoryService.getServicesPaginated({
            categoryId: 'all',
            page: pageToLoad,
            limit: PAGE_SIZE,
            search: searchQuery,
          });
          backendItems = res.items || [];
          hasNext = res.hasNextPage;
        } catch (err) {
          console.warn('Backend products fetch failed:', err.message);
        }

        const formattedBackend = backendItems.map((item) => ({
          id: item._id || item.id,
          name: item.serviceName || item.productName || item.name,
          brand: item.brand || 'VOLTLINE',
          model: item.model || '',
          spec: item.estimated_time
            ? `⏱ ${item.estimated_time} • Warranty: ${item.warranty || '90 Days'}`
            : (item.description || item.spec || 'Certified Electrical Equipment'),
          price: item.price || 499,
          originalPrice: Math.round((item.price || 499) * 1.25),
          rating: 4.8,
          reviews: 58,
          badge: item.type === 'service' ? 'SERVICE' : 'VERIFIED',
          category: item.category?._id || item.category || 'general',
          isBackend: true,
        }));

        // const matchingMocks = MOCK_PRODUCTS.filter((m) => {
        //   if (!searchQuery) return true;
        //   return (
        //     m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        //     m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        //     m.spec.toLowerCase().includes(searchQuery.toLowerCase())
        //   );
        // });

        const combined = [...formattedBackend];
        const uniquePool = Array.from(
          new Map(combined.map((item) => [item.id, item])).values()
        );

        const start = (pageToLoad - 1) * PAGE_SIZE;
        const pageItems = uniquePool.slice(start, start + PAGE_SIZE);
        const canLoadMore = start + PAGE_SIZE < uniquePool.length || hasNext;

        if (pageToLoad === 1) {
          setProducts(pageItems);
        } else {
          setProducts((prev) => {
            const merged = [...prev, ...pageItems];
            return Array.from(new Map(merged.map((i) => [i.id, i])).values());
          });
        }

        setPage(pageToLoad);
        setHasMore(canLoadMore);
      } catch (err) {
        console.error('Error loading products page in HomeScreen:', err);
      } finally {
        setLoadingProducts(false);
        setLoadingMore(false);
      }
    },
    [searchQuery]
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProductsPage(1);
  }, [loadProductsPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCategories(), loadProductsPage(1, true)]);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingProducts && !loadingMore && hasMore) {
      loadProductsPage(page + 1);
    }
  };

  const renderProductItem = ({ item: product }) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      activeOpacity={0.88}
      onPress={() => onSelectService && onSelectService(product)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{product.badge}</Text>
        </View>
        <View style={styles.ratingPill}>
          <StarIcon size={12} color="#f59e0b" />
          <Text style={styles.ratingText}>{product.rating}</Text>
        </View>
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
          <Text style={styles.price}>₹{product.price}</Text>
          <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
        </View>
        {(() => {
          const pid = product._id || product.id;
          const isAdding = addingProductId === pid;
          const inCart = isInCart(product);

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

  const renderHeader = () => (
    <View>
      {/* Top Brand Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>E+</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>VOLTLINE STORE</Text>
            <Text style={styles.brandSubtitle}>Certified Electrical Supplies & Parts</Text>
          </View>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>NEXT-DAY DISPATCH</Text>
        </View>
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

      {/* Hero Electrical Sale Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroTag}>
          <BoltIcon size={14} color="#f59e0b" />
          <Text style={styles.heroTagText}>HIGH VOLTAGE DEALS</Text>
        </View>
        <Text style={styles.heroTitle}>Heavy Duty Cables & Modular Gear</Text>
        <Text style={styles.heroSubtitle}>
          Up to 35% discount on ISI certified wires and industrial breakers.
        </Text>
        <TouchableOpacity
          style={styles.heroButton}
          activeOpacity={0.85}
          onPress={() => onNavigateToShop?.('wires')}
        >
          <Text style={styles.heroButtonText}>EXPLORE WIRE CATALOG  →</Text>
        </TouchableOpacity>
      </View>

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
                if (onSelectCategory) onSelectCategory(cat.id);
                if (onNavigateToShop) onNavigateToShop(cat.id);
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
        <Text style={styles.sectionTitle}>Bestselling & Verified Equipment</Text>
        <TouchableOpacity onPress={() => onNavigateToShop?.('all')}>
          <Text style={styles.seeAllText}>See Catalog</Text>
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
            All {products.length} featured items loaded
          </Text>
          <View style={styles.endOfListDivider} />
        </View>
      )}

      {/* Contractor Assurance Banner */}
      <View style={styles.assuranceCard}>
        <View style={styles.assuranceItem}>
          <CheckCircleIcon size={20} color="#10b981" />
          <View style={styles.assuranceTextCol}>
            <Text style={styles.assuranceTitle}>100% Genuine ISI Mark</Text>
            <Text style={styles.assuranceDesc}>Direct from authorized brand distributors</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.assuranceItem}>
          <CheckCircleIcon size={20} color="#2563eb" />
          <View style={styles.assuranceTextCol}>
            <Text style={styles.assuranceTitle}>Site Delivery Available</Text>
            <Text style={styles.assuranceDesc}>Bulk dispatch for commercial & residential</Text>
          </View>
        </View>
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
        <Text style={styles.emptyText}>No equipment found matching "{searchQuery}"</Text>
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
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.4}
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1d64f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadgeText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
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
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    marginLeft: 8,
  },
  heroBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroTagText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  heroButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  clearSearchText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  productsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  productCard: {
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
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeContainer: {
    backgroundColor: '#eff6ff',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563eb',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
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
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingHorizontal: 10,
  },
  goToCartButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  assuranceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
    marginBottom: 16,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  assuranceDesc: {
    fontSize: 11,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  footerLoader: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  footerLoaderText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  endOfListWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
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
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
});
