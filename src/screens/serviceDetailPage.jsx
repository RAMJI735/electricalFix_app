import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useServiceDetails, useSettings } from '../hooks';
import { Skeleton } from '../components/Skeleton';
import {
  BoltIcon,
  StarIcon,
  CheckCircleIcon,
  CartIcon,
  ArrowLeftIcon,
} from '../components/Icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AuthRequiredModal from '../components/AuthRequiredModal';

export default function ServiceDetailPage({
  route,
  navigation,
  serviceId: propServiceId,
  initialService: propInitialService = null,
  onBack: propOnBack,
  onAddToCart,
  onNavigateToCart,
}) {
  const serviceId =
    route?.params?.serviceId ||
    route?.params?.id ||
    route?.params?.service?._id ||
    route?.params?.service?.id ||
    route?.params?.product?._id ||
    route?.params?.product?.id ||
    propServiceId;

  const initialService =
    route?.params?.initialService ||
    route?.params?.service ||
    route?.params?.product ||
    route?.params?.item ||
    propInitialService;

  const resolvedServiceId = serviceId || initialService?._id || initialService?.id;
  const onBack = useCallback(() => {
    if (propOnBack) {
      propOnBack();
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate('MainTabs');
    }
  }, [propOnBack, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        onBack();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [onBack])
  );
  const { isInCart, addToCart } = useCart();
  const { commerce } = useSettings();
  const gstType = commerce?.gstType || 'exclusive';
  const taxRate = commerce?.taxRate ?? 18;
  const { isAuthenticated } = useAuth();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  // Fetch full details using TanStack Query hook
  const {
    data: fetchedService,
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useServiceDetails(resolvedServiceId, {
    initialData: initialService || undefined,
  });

  const service = fetchedService || initialService;
  const hasService = Boolean(
    service && (service._id || service.id || service.serviceName || service.name)
  );
  const loading = queryLoading && !hasService;
  const error = queryError
    ? (queryError.message || 'Failed to load details')
    : (!resolvedServiceId && !hasService)
    ? 'Product or service not found.'
    : (!hasService && !queryLoading)
    ? 'Product or service not found.'
    : null;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.race([
        refetch(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch (_e) {
      // Non-fatal
    } finally {
      setRefreshing(false);
    }
  };

  const inCart = Boolean((service && isInCart(service)) || added);
  const isInStock = Boolean(
    service &&
    service.inStock !== false &&
    (service.stock === undefined || service.stock === null || Number(service.stock) > 0)
  );

  const handleAdd = async () => {
    if (inCart) {
      if (onNavigateToCart) {
        onNavigateToCart();
      } else if (navigation?.navigate) {
        navigation.navigate('MainTabs', { screen: 'Cart' });
      }
      return;
    }

    if (!isInStock) {
      return;
    }

    if (!isAuthenticated) {
      setAuthModalVisible(true);
      return;
    }

    if (service) {
      setAdding(true);
      try {
        const itemPayload = {
          id: service._id || service.id,
          _id: service._id || service.id,
          name: service.serviceName || service.name,
          price: service.price,
          brand: service.brand || 'Voltline',
          type: service.type || 'service',
          image: service.image || '',
          category: typeof service.category === 'object' ? service.category?._id : (service.category || ''),
          spec: service.estimated_time
            ? `⏱ ${service.estimated_time} • Warranty: ${service.warranty || '90 Days'}`
            : (service.description || 'Electrical Material / Service'),
        };

        if (onAddToCart) {
          const res = await onAddToCart(itemPayload);
          if (res !== false) {
            setAdded(true);
          } else {
            setAuthModalVisible(true);
          }
        } else {
          await addToCart(itemPayload, 1);
          setAdded(true);
        }
      } catch (err) {
        console.warn('Failed to add to cart:', err);
        if (
          err?.code === 'AUTH_REQUIRED' ||
          err?.message?.toLowerCase().includes('log in') ||
          err?.message?.toLowerCase().includes('auth') ||
          err?.response?.status === 401
        ) {
          setAuthModalVisible(true);
        }
      } finally {
        setAdding(false);
      }
    }
  };

  const categoryName =
    typeof service?.category === 'object'
      ? service?.category?.categoryName
      : (service?.category || 'Electrical');

  const currentPrice = Number(service?.price) || 0;
  const origPrice =
    Number(service?.originalPrice) && Number(service?.originalPrice) > currentPrice
      ? Number(service?.originalPrice)
      : Number(service?.effectiveOriginalPrice) || Math.round(currentPrice * 1.25);
  const discountPercent =
    origPrice > currentPrice
      ? Math.round(((origPrice - currentPrice) / origPrice) * 100)
      : 0;

  const isServiceType = service?.type === 'service';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <ArrowLeftIcon size={18} color="#0f172a" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {isServiceType ? 'Service Details' : 'Product Details'}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Main Body */}
      {loading ? (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Skeleton width="100%" height={220} borderRadius={18} style={{ marginBottom: 16 }} />
          <Skeleton width={100} height={20} borderRadius={6} style={{ marginBottom: 10 }} />
          <Skeleton width="85%" height={26} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={18} borderRadius={6} style={{ marginBottom: 18 }} />
          <View style={styles.specsRow}>
            <Skeleton width="30%" height={70} borderRadius={14} />
            <Skeleton width="30%" height={70} borderRadius={14} />
            <Skeleton width="30%" height={70} borderRadius={14} />
          </View>
          <Skeleton width="100%" height={120} borderRadius={16} style={{ marginVertical: 16 }} />
        </ScrollView>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to load details</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: '#f1f5f9', marginTop: 10 }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={[styles.retryButtonText, { color: '#334155' }]}>Go Back</Text>
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
          {/* Hero Image */}
          {service?.image ? (
            <View style={styles.heroImageContainer}>
              <Image
                source={{ uri: service.image }}
                style={styles.heroImage}
                resizeMode="contain"
              />
              {discountPercent > 0 && (
                <View style={styles.imageDiscountBadge}>
                  <Text style={styles.imageDiscountText}>{discountPercent}% OFF</Text>
                </View>
              )}
            </View>
          ) : null}

          {/* Breadcrumb / Category & Rating */}
          <View style={styles.metaRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{categoryName}</Text>
            </View>

            <View style={styles.ratingBadge}>
              <StarIcon size={13} color="#f59e0b" />
              <Text style={styles.ratingText}>{service?.rating || 4.8}</Text>
              <Text style={styles.ratingReviewsText}>
                ({service?.reviewsCount || service?.reviews || 48})
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.serviceName}>{service?.serviceName || service?.name}</Text>

          {/* Brand/Model subtitle */}
          {!!service?.brand && (
            <Text style={styles.brandSubtitle}>
              By <Text style={styles.brandHighlight}>{service.brand}</Text>
              {service?.model ? ` • Model: ${service.model}` : ''}
            </Text>
          )}

          {/* Price Box */}
          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceLabel}>Price</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>₹{currentPrice}</Text>
                {origPrice > currentPrice && (
                  <Text style={styles.priceStrikethrough}>₹{origPrice}</Text>
                )}
                {discountPercent > 0 && (
                  <View style={styles.discountPill}>
                    <Text style={styles.discountText}>{discountPercent}% off</Text>
                  </View>
                )}
              </View>
              <Text style={styles.taxSubtext}>
                {gstType === 'inclusive' ? `Inclusive of ${taxRate}% GST` : `+ ${taxRate}% GST extra at checkout`}
              </Text>
            </View>
          </View>

          {/* 3 Highlights */}
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
              <Text style={styles.specBoxTitle}>Technician</Text>
              <Text style={styles.specBoxValue}>Verified Pro</Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>
              {isServiceType ? 'About this Service' : 'Product Overview'}
            </Text>
            <Text style={styles.descriptionText}>
              {service?.description ||
                `Professional ${service?.serviceName || 'electrical service'} provided by certified electricians. Includes full diagnostic inspection, safety load clearance, and verified genuine replacement parts.`}
            </Text>
          </View>

          {/* What's Included */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>
              {isServiceType ? "What's Included" : 'Key Features'}
            </Text>
            <View style={styles.checklist}>
              {Array.isArray(service?.features) && service.features.length > 0 ? (
                service.features.map((feat, idx) => (
                  <View key={idx} style={styles.checkItem}>
                    <CheckCircleIcon size={16} color="#10b981" />
                    <Text style={styles.checkItemText}>{feat}</Text>
                  </View>
                ))
              ) : (
                <>
                  <View style={styles.checkItem}>
                    <CheckCircleIcon size={16} color="#10b981" />
                    <Text style={styles.checkItemText}>
                      On-site inspection and electrical safety testing
                    </Text>
                  </View>
                  <View style={styles.checkItem}>
                    <CheckCircleIcon size={16} color="#10b981" />
                    <Text style={styles.checkItemText}>
                      Certified technician with digital diagnostic equipment
                    </Text>
                  </View>
                  <View style={styles.checkItem}>
                    <CheckCircleIcon size={16} color="#10b981" />
                    <Text style={styles.checkItemText}>
                      Genuine replacement components with warranty
                    </Text>
                  </View>
                  <View style={styles.checkItem}>
                    <CheckCircleIcon size={16} color="#10b981" />
                    <Text style={styles.checkItemText}>
                      Post-repair testing and cleanup
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Assurance Banner */}
          <View style={styles.protectionBanner}>
            <View style={styles.protectionHeader}>
              <CheckCircleIcon size={18} color="#2563eb" />
              <Text style={styles.protectionTitle}>Voltline Assurance</Text>
            </View>
            <Text style={styles.protectionDesc}>
              Backed by our 90-day hassle-free service warranty. If an issue reoccurs, our technician revisits at zero extra charge.
            </Text>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* Docked Bottom Action Bar */}
      {!loading && !error && service && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomPriceLabel}>Total Price</Text>
            <Text style={styles.bottomPrice}>₹{currentPrice}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addCartBtn,
              inCart && styles.addCartBtnSuccess,
              !isInStock && !inCart && styles.addCartBtnDisabled,
              adding && styles.addCartBtnLoading,
            ]}
            activeOpacity={0.85}
            disabled={adding || (!inCart && !isInStock)}
            onPress={handleAdd}
          >
            {adding ? (
              <View style={styles.buttonInnerRow}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.addCartBtnText}>Adding...</Text>
              </View>
            ) : inCart ? (
              <View style={styles.buttonInnerRow}>
                <CartIcon size={16} color="#ffffff" focused />
                <Text style={styles.addCartBtnText}>Go to Cart</Text>
              </View>
            ) : isInStock ? (
              <View style={styles.buttonInnerRow}>
                <BoltIcon size={15} color="#ffffff" />
                <Text style={styles.addCartBtnText}>
                  {isServiceType ? 'Book Service' : 'Add to Cart'}
                </Text>
              </View>
            ) : (
              <Text style={styles.addCartBtnText}>Out of Stock</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <AuthRequiredModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        navigation={navigation}
      />
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
  },
  heroImageContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  heroImage: {
    width: '88%',
    height: '88%',
  },
  imageDiscountBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#16a34a',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  imageDiscountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: '#eff6ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  ratingReviewsText: {
    fontSize: 11,
    color: '#b45309',
  },
  serviceName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  brandHighlight: {
    fontWeight: '600',
    color: '#334155',
  },
  priceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  priceStrikethrough: {
    fontSize: 15,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  discountPill: {
    backgroundColor: '#dcfce7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  taxSubtext: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  specBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  specIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  specBoxTitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  specBoxValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
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
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginBottom: 16,
  },
  protectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  protectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  protectionDesc: {
    fontSize: 12,
    color: '#1e40af',
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
    borderRadius: 10,
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
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  bottomPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addCartBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  addCartBtnSuccess: {
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
  },
  addCartBtnDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  addCartBtnLoading: {
    opacity: 0.8,
  },
  addCartBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
