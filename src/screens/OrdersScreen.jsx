import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useOrders, useCancelOrderMutation } from '../hooks';
import { useAuth } from '../context/AuthContext';
import OrderService from '../../services/orderService';
import {
  PackageIcon,
  CheckCircleIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
} from '../components/Icons';

export default function OrdersScreen({
  navigation,
  onBack: propOnBack,
  onExploreShop: propOnExploreShop,
  onSelectOrder: propOnSelectOrder,
  onNavigateToAuth: propOnNavigateToAuth,
}) {
  const onBack = propOnBack || (() => navigation?.goBack());
  const onExploreShop = propOnExploreShop || (() => navigation?.navigate('Shop'));
  const onSelectOrder = propOnSelectOrder || ((order) => navigation?.navigate('OrderDetail', { orderId: order._id }));
  const onNavigateToAuth = propOnNavigateToAuth || ((screen) => navigation?.navigate(screen === 'signup' ? 'SignUp' : 'Login'));
  const { user, isAuthenticated } = useAuth();
  const userId = user?._id || user?.id;

  // Fetch individual user orders with memoized select to avoid unnecessary data transforms and re-renders
  const {
    data: orders = [],
    isLoading: loading,
    refetch,
  } = useOrders(userId, {
    enabled: Boolean(userId),
    select: useCallback((rawOrders) => {
      if (!Array.isArray(rawOrders)) return [];
      return rawOrders.map((order) => ({
        ...order,
        id: order._id || order.id,
      }));
    }, []),
  });

  const cancelOrderMutation = useCancelOrderMutation();

  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'active', 'delivered', 'cancelled'
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Cancel order handler
  const handleCancelOrder = (order) => {
    const doCancel = async () => {
      setCancellingId(order._id);
      try {
        await cancelOrderMutation.mutateAsync({ id: order._id, reason: 'Cancelled by user request' });
      } catch (err) {
        if (Platform.OS === 'web') {
          window.alert(err.message || 'Failed to cancel order');
        } else {
          Alert.alert('Cancel Failed', err.message);
        }
      } finally {
        setCancellingId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) {
        doCancel();
      }
    } else {
      Alert.alert(
        'Cancel Order',
        `Are you sure you want to cancel order ${order.orderNumber}?`,
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes, Cancel', style: 'destructive', onPress: doCancel },
        ]
      );
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const st = (order.orderStatus || 'Confirmed').toLowerCase();
    if (filterTab === 'active') {
      return ['placed', 'confirmed', 'processing', 'out for delivery'].includes(st);
    }
    if (filterTab === 'delivered') {
      return st === 'delivered';
    }
    if (filterTab === 'cancelled') {
      return st === 'cancelled';
    }
    return true;
  });

  const getStatusColor = (status = 'Confirmed') => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
      case 'cancelled':
        return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
      case 'out for delivery':
        return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' };
      case 'processing':
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
      default:
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ArrowLeftIcon size={20} color="#0f172a" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>SITE DELIVERIES & INVOICES</Text>
          <Text style={styles.title}>My Orders</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabPill, filterTab === 'all' && styles.tabPillActive]}
          onPress={() => setFilterTab('all')}
        >
          <Text
            style={[styles.tabPillText, filterTab === 'all' && styles.tabPillTextActive]}
          >
            All ({orders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, filterTab === 'active' && styles.tabPillActive]}
          onPress={() => setFilterTab('active')}
        >
          <Text
            style={[
              styles.tabPillText,
              filterTab === 'active' && styles.tabPillTextActive,
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, filterTab === 'delivered' && styles.tabPillActive]}
          onPress={() => setFilterTab('delivered')}
        >
          <Text
            style={[
              styles.tabPillText,
              filterTab === 'delivered' && styles.tabPillTextActive,
            ]}
          >
            Delivered
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, filterTab === 'cancelled' && styles.tabPillActive]}
          onPress={() => setFilterTab('cancelled')}
        >
          <Text
            style={[
              styles.tabPillText,
              filterTab === 'cancelled' && styles.tabPillTextActive,
            ]}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching order records...</Text>
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={{ fontSize: 32 }}>🔒</Text>
          </View>
          <Text style={styles.emptyTitle}>Sign In to View Orders</Text>
          <Text style={styles.emptySubtitle}>
            Please sign in to your account to view and track your individual orders, invoices, and service dispatches.
          </Text>
          {onNavigateToAuth ? (
            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.85}
              onPress={() => onNavigateToAuth('login')}
            >
              <BoltIcon size={16} color="#ffffff" />
              <Text style={styles.exploreBtnText}>SIGN IN TO ACCOUNT</Text>
            </TouchableOpacity>
          ) : onExploreShop ? (
            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.85}
              onPress={onExploreShop}
            >
              <BoltIcon size={16} color="#ffffff" />
              <Text style={styles.exploreBtnText}>EXPLORE ELECTRICAL CATALOG</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <PackageIcon size={36} color="#2563eb" />
          </View>
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptySubtitle}>
            {filterTab === 'all'
              ? 'You have not placed any electrical orders yet. Explore our catalog of materials and technician services.'
              : `No orders found under the "${filterTab}" filter.`}
          </Text>
          {onExploreShop && (
            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.85}
              onPress={onExploreShop}
            >
              <BoltIcon size={16} color="#ffffff" />
              <Text style={styles.exploreBtnText}>EXPLORE ELECTRICAL CATALOG</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order._id;
            const statusStyle = getStatusColor(order.orderStatus);
            const dateStr = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
              : 'Recent Order';

            const itemsCount = (order.items || []).reduce(
              (acc, itm) => acc + (itm.quantity || 1),
              0
            );

            const isCancellable = ['placed', 'confirmed'].includes(
              (order.orderStatus || '').toLowerCase()
            );

            return (
              <View key={order._id} style={styles.orderCard}>
                {/* Order Top Bar */}
                <View style={styles.orderTopBar}>
                  <View>
                    <View style={styles.orderNumRow}>
                      <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    </View>
                    <Text style={styles.orderDate}>{dateStr}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: statusStyle.bg,
                        borderColor: statusStyle.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: statusStyle.text },
                      ]}
                    >
                      {order.orderStatus || 'Confirmed'}
                    </Text>
                  </View>
                </View>

                {/* Items preview */}
                <View style={styles.itemsPreviewList}>
                  {(order.items || []).map((itm, idx) => (
                    <View key={itm._id || idx} style={styles.previewItemRow}>
                      <View style={styles.previewItemDot}>
                        <Text style={styles.itemDotIcon}>
                          {itm.type === 'product' ? '📦' : '⚡'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.previewItemName} numberOfLines={1}>
                          {itm.name}
                        </Text>
                        <Text style={styles.previewItemSub}>
                          Qty: {itm.quantity || 1} • ₹{itm.price} each
                        </Text>
                      </View>
                      <Text style={styles.previewItemTotal}>
                        ₹{(itm.price || 0) * (itm.quantity || 1)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Card Summary Row */}
                <View style={styles.cardSummaryRow}>
                  <View>
                    <Text style={styles.cardSummaryLabel}>
                      Total Payable ({itemsCount} items)
                    </Text>
                    <Text style={styles.cardGrandTotal}>
                      ₹{order.summary?.grandTotal || 0}
                    </Text>
                  </View>

                  <View style={styles.paymentMethodPill}>
                    <Text style={styles.paymentMethodText}>
                      {order.payment?.method === 'COD'
                        ? '💵 Cash on Delivery'
                        : order.payment?.method === 'UPI'
                          ? '📱 UPI Paid'
                          : '💳 Card Payment'}
                    </Text>
                  </View>
                </View>

                {/* Primary Action: Open Dedicated Order Detail Page */}
                <TouchableOpacity
                  style={styles.viewDetailFullBtn}
                  activeOpacity={0.85}
                  onPress={() => onSelectOrder && onSelectOrder(order)}
                >
                  <View style={styles.viewDetailFullBtnLeft}>
                    <PackageIcon size={16} color="#ffffff" />
                    <Text style={styles.viewDetailFullBtnText}>
                      VIEW ORDER DETAILS & TRACKING
                    </Text>
                  </View>
                  <ChevronRightIcon size={16} color="#ffffff" />
                </TouchableOpacity>

                {/* Toggle Details Button */}
                <TouchableOpacity
                  style={styles.detailsToggle}
                  activeOpacity={0.7}
                  onPress={() =>
                    setExpandedOrderId(isExpanded ? null : order._id)
                  }
                >
                  <Text style={styles.detailsToggleText}>
                    {isExpanded ? 'Hide Quick Summary' : 'Quick Summary & Timeline'}
                  </Text>
                  <Text style={styles.detailsToggleArrow}>
                    {isExpanded ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {/* Expanded Section */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Delivery Address */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>
                        📍 Site Delivery Address
                      </Text>
                      <Text style={styles.addressName}>
                        {order.shippingAddress?.fullName} • {order.shippingAddress?.phone}
                      </Text>
                      <Text style={styles.addressLine}>
                        {order.shippingAddress?.street}, {order.shippingAddress?.city} -{' '}
                        {order.shippingAddress?.postalCode}
                      </Text>
                      {!!order.shippingAddress?.deliveryNotes && (
                        <Text style={styles.deliveryNotes}>
                          Note: {order.shippingAddress.deliveryNotes}
                        </Text>
                      )}
                    </View>

                    {/* Timeline Progression */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>
                        ⏱️ Order & Dispatch Timeline
                      </Text>
                      <View style={styles.timelineList}>
                        {(order.timeline || []).map((step, sIdx) => (
                          <View key={step._id || sIdx} style={styles.timelineStep}>
                            <View style={styles.timelineDot} />
                            <View style={styles.timelineTextCol}>
                              <Text style={styles.timelineStatus}>
                                {step.status}
                              </Text>
                              <Text style={styles.timelineNote}>
                                {step.note || 'Status updated'}
                              </Text>
                              {step.time && (
                                <Text style={styles.timelineTime}>
                                  {new Date(step.time).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Tax & GST Breakdown */}
                    <View style={styles.invoiceBreakdownBox}>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Subtotal</Text>
                        <Text style={styles.invoiceVal}>
                          ₹{order.summary?.subtotal || 0}
                        </Text>
                      </View>
                      {order.summary?.discount > 0 && (
                        <View style={styles.invoiceRow}>
                          <Text style={[styles.invoiceLabel, { color: '#16a34a' }]}>
                            Discount ({order.summary?.couponCode || 'PROMO'})
                          </Text>
                          <Text style={[styles.invoiceVal, { color: '#16a34a' }]}>
                            -₹{order.summary.discount}
                          </Text>
                        </View>
                      )}
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>GST (18% itemized)</Text>
                        <Text style={styles.invoiceVal}>
                          ₹{order.summary?.tax || 0}
                        </Text>
                      </View>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Site Delivery Fee</Text>
                        <Text style={styles.invoiceVal}>
                          {order.summary?.shippingFee === 0
                            ? 'FREE'
                            : `₹${order.summary?.shippingFee || 0}`}
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionButtonsRow}>
                      {isCancellable && (
                        <TouchableOpacity
                          style={styles.cancelOrderBtn}
                          activeOpacity={0.8}
                          onPress={() => handleCancelOrder(order)}
                          disabled={cancellingId === order._id}
                        >
                          {cancellingId === order._id ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                          ) : (
                            <Text style={styles.cancelOrderText}>Cancel Order</Text>
                          )}
                        </TouchableOpacity>
                      )}

                      <View style={styles.taxPill}>
                        <CheckCircleIcon size={14} color="#16a34a" />
                        <Text style={styles.taxPillText}>GST Tax Invoice Ready</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  refreshBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabPillTextActive: {
    color: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  orderNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  orderDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itemsPreviewList: {
    paddingVertical: 10,
    gap: 8,
  },
  previewItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewItemDot: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemDotIcon: {
    fontSize: 12,
  },
  previewItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  previewItemSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  previewItemTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  cardSummaryLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  cardGrandTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
  },
  paymentMethodPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentMethodText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  detailsToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    marginTop: 4,
  },
  detailsToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  detailsToggleArrow: {
    fontSize: 10,
    color: '#2563eb',
  },
  expandedContent: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    gap: 12,
  },
  detailSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  addressName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  addressLine: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  deliveryNotes: {
    fontSize: 10,
    color: '#d97706',
    marginTop: 4,
    fontStyle: 'italic',
  },
  timelineList: {
    gap: 8,
    paddingLeft: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginTop: 4,
  },
  timelineTextCol: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  timelineNote: {
    fontSize: 10,
    color: '#64748b',
  },
  timelineTime: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  invoiceBreakdownBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invoiceLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  invoiceVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelOrderBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelOrderText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
  },
  taxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  taxPillText: {
    fontSize: 10,
    color: '#15803d',
    fontWeight: '700',
  },
  viewDetailFullBtn: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  viewDetailFullBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewDetailFullBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
