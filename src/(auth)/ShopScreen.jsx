import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ELECTRICAL_CATEGORIES, MOCK_PRODUCTS } from '../constants/mockData';
import CategoryService from '../../services/categoryService';
import { useCart } from '../context/CartContext';
import {
  SearchIcon,
  StarIcon,
  BoltIcon,
  CartIcon,
} from '../components/Icons';
import { ProductCardSkeleton, CategoryPillSkeleton } from '../components/Skeleton';

export default function ShopScreen({ initialCategory = 'all', onAddToCart, onSelectService, onNavigateToCart }) {
  const { isInCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(ELECTRICAL_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [backendItems, setBackendItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
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

  // 1. Fetch Categories from backend on mount
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const backendCategories = await CategoryService.getCategories();
        if (backendCategories && backendCategories.length > 0 && isMounted) {
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
        if (isMounted) setLoadingCategories(false);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Services/Products by Category ID when selectedCategory changes
  useEffect(() => {
    let isMounted = true;
    const loadServicesForCategory = async () => {
      setLoadingItems(true);
      try {
        let items = [];
        if (!selectedCategory || selectedCategory === 'all') {
          // If "all", fetch all services
          items = await CategoryService.getServicesByCategoryId('all');
        } else {
          // Call service by Category ID
          items = await CategoryService.getServicesByCategoryId(selectedCategory);
        }

        if (isMounted) {
          if (items && items.length > 0) {
            const formatted = items.map((item) => ({
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
            setBackendItems(formatted);
          } else {
            setBackendItems([]);
          }
        }
      } catch (error) {
        if (isMounted) {
          setBackendItems([]);
        }
      } finally {
        if (isMounted) {
          setLoadingItems(false);
        }
      }
    };

    loadServicesForCategory();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  // Combined product list: backend items first, plus mock catalog fallback
  const allAvailableItems = [
    ...backendItems,
    ...MOCK_PRODUCTS.filter(
      (m) =>
        selectedCategory === 'all' ||
        m.category === selectedCategory ||
        backendItems.length === 0
    ),
  ];

  // Remove duplicates by id
  const uniqueItems = Array.from(
    new Map(allAvailableItems.map((item) => [item.id, item])).values()
  );

  const filteredProducts = uniqueItems.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.spec.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CATALOG & INVENTORY</Text>
          <Text style={styles.title}>Electrical Shop</Text>
        </View>
        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'ITEM' : 'ITEMS'}
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchIcon size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by wire gauge, brand, switch type..."
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

      {/* Category Pills */}
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
            categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.pill,
                    isSelected && styles.pillActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.pillIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.pillText,
                      isSelected && styles.pillTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Products List */}
      <ScrollView
        style={styles.productsScroll}
        contentContainerStyle={styles.productsContent}
        showsVerticalScrollIndicator={false}
      >
        {loadingItems ? (
          <>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No electrical services found</Text>
            <Text style={styles.emptySub}>
              Try searching with different keywords or select a different category filter.
            </Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => onSelectService && onSelectService(product)}
            >
              <View style={styles.cardTop}>
                <View style={styles.brandRow}>
                  <Text style={styles.brandText}>{product.brand.toUpperCase()}</Text>
                  <View style={styles.badgePill}>
                    <Text style={styles.badgePillText}>{product.badge}</Text>
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
                <Text style={styles.productModel}>Model: {product.model}</Text>
              )}
              <Text style={styles.productSpec}>{product.spec}</Text>

              <View style={styles.cardBottom}>
                <View>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{product.price}</Text>
                    <Text style={styles.origPrice}>₹{product.originalPrice}</Text>
                  </View>
                  <Text style={styles.taxText}>Inc. 18% GST • In Stock</Text>
                </View>

                {(() => {
                  const pid = product._id || product.id;
                  const isAdding = addingProductId === pid;
                  const inCart = isInCart(product);

                  return (
                    <TouchableOpacity
                      style={[
                        styles.addToCartBtn,
                        inCart && styles.goToCartBtn,
                        isAdding && styles.addToCartBtnLoading,
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
                  );
                })()}
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 90 }} />
      </ScrollView>
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#eff6ff',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
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
});
