import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useServiceDetails } from '../hooks';
import ServiceService from '../../services/serviceService';
import { Skeleton } from '../components/Skeleton';
import {
  BoltIcon,
  StarIcon,
  CheckCircleIcon,
  CartIcon,
} from '../components/Icons';
import { useCart } from '../context/CartContext';

export default function ServiceDetailPage({
  serviceId,
  initialService = null,
  onBack,
  onAddToCart,
  onNavigateToCart,
}) {
  const { isInCart } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  // Fetch full details using TanStack Query hook
  const {
    data: fetchedService,
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useServiceDetails(serviceId, {
    initialData: initialService || undefined,
  });

  const service = fetchedService || initialService;
  const loading = queryLoading && !service;
  const error = queryError ? (queryError.message || 'Failed to load service details') : null;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const inCart = Boolean((service && isInCart(service)) || added);

  const handleAdd = async () => {
    if (inCart) {
      onNavigateToCart && onNavigateToCart();
      return;
    }
    if (service && onAddToCart) {
      setAdding(true);
      try {
        const res = await onAddToCart({
          id: service._id || service.id,
          _id: service._id || service.id,
          name: service.serviceName || service.name,
          price: service.price,
          brand: service.brand || 'VOLTLINE',
          type: service.type || 'service',
          image: service.image || '',
          spec: service.estimated_time
            ? `⏱ ${service.estimated_time} • Warranty: ${service.warranty || '90 Days'}`
            : (service.description || 'Electrical Material / Service'),
        });
        if (res !== false) {
          setAdded(true);
        }
      } catch (err) {
        console.warn('Failed to add to cart:', err);
      } finally {
        setAdding(false);
      }
    }
  };

  const categoryName =
    typeof service?.category === 'object'
      ? service?.category?.categoryName
      : 'Electrical';
  const categoryIcon =
    typeof service?.category === 'object'
      ? service?.category?.icon || '⚡'
      : '⚡';

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonArrow}>←</Text>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          Service Details
        </Text>

        <View style={styles.verifiedHeaderBadge}>
          <Text style={styles.verifiedHeaderText}>ISI CERTIFIED</Text>
        </View>
      </View>

      {/* Main Body */}
      {loading ? (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Skeleton placeholders */}
          <Skeleton width={120} height={22} borderRadius={6} style={{ marginBottom: 12 }} />
          <Skeleton width="90%" height={26} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={18} borderRadius={6} style={{ marginBottom: 20 }} />

          {/* Specs grid skeleton */}
          <View style={styles.specsRow}>
            <Skeleton width="30%" height={70} borderRadius={10} />
            <Skeleton width="30%" height={70} borderRadius={10} />
            <Skeleton width="30%" height={70} borderRadius={10} />
          </View>

          <Skeleton width="100%" height={100} borderRadius={12} style={{ marginVertical: 20 }} />
          <Skeleton width="100%" height={150} borderRadius={12} />
        </ScrollView>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to load service details</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              if (serviceId) {
                setLoading(true);
                ServiceService.getServiceById(serviceId)
                  .then(setService)
                  .catch((e) => setError(e.message))
                  .finally(() => setLoading(false));
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
              tintColor="#2563eb"
            />
          }
        >
          {/* Category & Status Pill */}
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeIcon}>{categoryIcon}</Text>
              <Text style={styles.categoryBadgeText}>{categoryName.toUpperCase()}</Text>
            </View>

            <View style={styles.typeBadge}>
              <BoltIcon size={12} color="#1d4ed8" />
              <Text style={styles.typeBadgeText}>
                {service?.type === 'product' ? 'PRODUCT' : 'SERVICE'}
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusBadgeText}>ACTIVE</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.serviceName}>{service?.serviceName || service?.name}</Text>

          {/* Brand & Model Row */}
          {(service?.brand || service?.model) && (
            <View style={styles.metaRow}>
              {!!service?.brand && (
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>BRAND:</Text>
                  <Text style={styles.metaValue}>{service.brand}</Text>
                </View>
              )}
              {!!service?.model && (
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>MODEL:</Text>
                  <Text style={styles.metaValue}>{service.model}</Text>
                </View>
              )}
            </View>
          )}

          {/* Price Box */}
          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceLabel}>Service Cost</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>₹{service?.price}</Text>
                <Text style={styles.priceStrikethrough}>
                  ₹{Math.round((service?.price || 499) * 1.25)}
                </Text>
                <View style={styles.discountPill}>
                  <Text style={styles.discountText}>20% OFF</Text>
                </View>
              </View>
              <Text style={styles.taxSubtext}>Includes 18% GST & Technician Charges</Text>
            </View>

            <View style={styles.ratingBox}>
              <StarIcon size={16} color="#f59e0b" />
              <Text style={styles.ratingNumber}>4.9</Text>
              <Text style={styles.ratingReviews}>48+ reviews</Text>
            </View>
          </View>

          {/* 3-Column Highlights Grid */}
          <View style={styles.specsRow}>
            <View style={styles.specBox}>
              <Text style={styles.specIcon}>⏱</Text>
              <Text style={styles.specBoxTitle}>Duration</Text>
              <Text style={styles.specBoxValue}>
                {service?.estimated_time || '1-2 Hours'}
              </Text>
            </View>

            <View style={styles.specBox}>
              <Text style={styles.specIcon}>🛡</Text>
              <Text style={styles.specBoxTitle}>Warranty</Text>
              <Text style={styles.specBoxValue}>
                {service?.warranty || '90 Days'}
              </Text>
            </View>

            <View style={styles.specBox}>
              <Text style={styles.specIcon}>👨‍🔧</Text>
              <Text style={styles.specBoxTitle}>Electrician</Text>
              <Text style={styles.specBoxValue}>Verified Pro</Text>
            </View>
          </View>

          {/* Service Description Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Service Overview</Text>
            <Text style={styles.descriptionText}>
              {service?.description ||
                `Complete ${service?.serviceName || 'electrical service'} provided by licensed electricians. Includes diagnostic testing, high-voltage safety clearance, genuine parts replacement, and official ISI certification documentation.`}
            </Text>
          </View>

          {/* What's Included Checklist */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>What's Included</Text>
            <View style={styles.checklist}>
              <View style={styles.checkItem}>
                <CheckCircleIcon size={18} color="#10b981" />
                <Text style={styles.checkItemText}>
                  On-site comprehensive inspection & safety testing
                </Text>
              </View>
              <View style={styles.checkItem}>
                <CheckCircleIcon size={18} color="#10b981" />
                <Text style={styles.checkItemText}>
                  Certified electrical technician equipped with digital testers
                </Text>
              </View>
              <View style={styles.checkItem}>
                <CheckCircleIcon size={18} color="#10b981" />
                <Text style={styles.checkItemText}>
                  100% genuine replacement components with manufacturer warranty
                </Text>
              </View>
              <View style={styles.checkItem}>
                <CheckCircleIcon size={18} color="#10b981" />
                <Text style={styles.checkItemText}>
                  Clean up of installation debris & post-repair load testing
                </Text>
              </View>
            </View>
          </View>

          {/* Voltline Protection Banner */}
          <View style={styles.protectionBanner}>
            <View style={styles.protectionHeader}>
              <CheckCircleIcon size={18} color="#2563eb" />
              <Text style={styles.protectionTitle}>Voltline SafeGuard Guarantee</Text>
            </View>
            <Text style={styles.protectionDesc}>
              Every repair is backed by a 90-day hassle-free service guarantee. If the issue reoccurs, our technician revisits at zero extra charge.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Docked Bottom Bar */}
      {!loading && !error && service && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomPriceLabel}>Total Price</Text>
            <Text style={styles.bottomPrice}>₹{service.price}</Text>
          </View>

          <TouchableOpacity
            style={[styles.addCartBtn, inCart && styles.addCartBtnSuccess, adding && styles.addCartBtnLoading]}
            activeOpacity={0.85}
            disabled={adding}
            onPress={handleAdd}
          >
            {adding ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.addCartBtnText}>ADDING TO CART...</Text>
              </View>
            ) : inCart ? (
              <>
                <CartIcon size={16} color="#ffffff" focused />
                <Text style={styles.addCartBtnText}>GO TO CART</Text>
              </>
            ) : (
              <>
                <BoltIcon size={16} color="#ffffff" />
                <Text style={styles.addCartBtnText}>BOOK / ADD TO CART</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 8,
    gap: 4,
  },
  backButtonArrow: {
    fontSize: 18,
    color: '#2563eb',
    fontWeight: '700',
  },
  backButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: 160,
  },
  verifiedHeaderBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  verifiedHeaderText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  categoryBadgeIcon: {
    fontSize: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  serviceName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 28,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  priceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  priceStrikethrough: {
    fontSize: 14,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  discountPill: {
    backgroundColor: '#fef3c7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
  },
  taxSubtext: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 4,
  },
  ratingBox: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  ratingReviews: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  specBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  specIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  specBoxTitle: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  specBoxValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  checklist: {
    gap: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkItemText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  protectionBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 16,
  },
  protectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  protectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e40af',
  },
  protectionDesc: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPriceLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  addCartBtnSuccess: {
    backgroundColor: '#16a34a',
  },
  addCartBtnLoading: {
    opacity: 0.85,
    paddingHorizontal: 16,
  },
  addCartBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
