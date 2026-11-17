import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Share,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrderDetails, useCancelOrderMutation, useSettings } from '../hooks';
import { useCart } from '../context/CartContext';
import AuthRequiredModal from '../components/AuthRequiredModal';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  BoltIcon,
  CloseIcon,
} from '../components/Icons';

export default function OrderDetailPage({
  route,
  navigation,
  orderId: propOrderId,
  initialOrder: propInitialOrder = null,
  onBack: propOnBack,
  onReorderSuccess: propOnReorderSuccess,
}) {
  const orderId = route?.params?.orderId || route?.params?.id || propOrderId;
  const initialOrder = route?.params?.initialOrder || route?.params?.order || propInitialOrder;
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const onBack = propOnBack || (() => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate('MainTabs');
    }
  });
  const onReorderSuccess = propOnReorderSuccess || (() => navigation?.navigate('Cart'));
  const targetId = orderId || initialOrder?._id;
  const {
    data: fetchedOrder,
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useOrderDetails(targetId, {
    initialData: initialOrder || undefined,
  });

  const cancelOrderMutation = useCancelOrderMutation();
  const order = fetchedOrder || initialOrder;
  const loading = queryLoading && !order;
  const error = queryError ? (queryError.message || 'Failed to retrieve order details') : null;

  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of requirements');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [reordering, setReordering] = useState(false);

  const { data: settings } = useSettings();
  const storeName = settings?.store?.name || 'Voltline Electricals';
  const storeGstin = settings?.store?.gstin || '19AAACV2026E1Z5';
  const taxRate = settings?.commerce?.taxRate ?? 18;
  const halfTax = Math.round((taxRate / 2) * 10) / 10;

  const { addToCart } = useCart();

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

  // Handle Cancel Order
  const handleConfirmCancel = async () => {
    if (!order?._id) return;
    setCancelling(true);
    try {
      await cancelOrderMutation.mutateAsync({ id: order._id, reason: cancelReason });
      await refetch();
      setShowCancelModal(false);
      if (Platform.OS === 'web') {
        window.alert('Order has been cancelled successfully.');
      } else {
        Alert.alert('Order Cancelled', 'Your order has been cancelled.');
      }
    } catch (err) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Failed to cancel order');
      } else {
        Alert.alert('Cancel Error', err.message);
      }
    } finally {
      setCancelling(false);
    }
  };

  // Reorder all items in this order
  const handleReorderAll = async () => {
    if (!order?.items || order.items.length === 0) return;
    setReordering(true);
    try {
      for (const itm of order.items) {
        const itemPayload = {
          _id: itm.item?._id || itm.item || itm._id,
          name: itm.name,
          price: itm.price,
          brand: itm.brand || 'Voltline',
          type: itm.type || 'service',
        };
        await addToCart(itemPayload, itm.quantity || 1);
      }

      if (onReorderSuccess) {
        onReorderSuccess();
      } else if (Platform.OS === 'web') {
        window.alert('All items from this order have been added to your cart!');
      } else {
        Alert.alert('Items Added to Cart', 'All items have been added to your cart.');
      }
    } catch (err) {
      console.error('Reorder error:', err);
      if (err?.code === 'AUTH_REQUIRED' || err?.message?.toLowerCase().includes('log in')) {
        setAuthModalVisible(true);
      } else {
        Alert.alert('Error', err?.message || 'Failed to reorder items.');
      }
    } finally {
      setReordering(false);
    }
  };

  // Share order summary / reference
  const handleShareOrder = async () => {
    if (!order) return;
    const message = `${storeName} Order #${order.orderNumber}\nTotal: ₹${order.summary?.grandTotal || 0}\nStatus: ${order.orderStatus}\nDelivery to: ${order.shippingAddress?.street}, ${order.shippingAddress?.city}`;
    if (Platform.OS === 'web') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(message);
        window.alert('Order details copied to clipboard!');
      }
    } else {
      try {
        await Share.share({ message });
      } catch (_e) {
        // Ignore share dismiss
      }
    }
  };

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.backButtonOutline} onPress={onBack}>
            <Text style={styles.backButtonOutlineText}>GO BACK TO ORDERS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const orderStatus = order?.orderStatus || 'Placed';
  const isCancellable = ['placed', 'confirmed'].includes(orderStatus.toLowerCase());

  const getStatusTheme = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'placed':
        return {
          bg: '#eff6ff',
          color: '#1d4ed8',
          border: '#bfdbfe',
          icon: '📝',
          title: 'Order Placed',
        };
      case 'confirmed':
        return {
          bg: '#f0fdf4',
          color: '#15803d',
          border: '#bbf7d0',
          icon: '⚡',
          title: 'Confirmed & Scheduled',
        };
      case 'processing':
        return {
          bg: '#fffbeb',
          color: '#b45309',
          border: '#fde68a',
          icon: '📦',
          title: 'Packing & Quality Check',
        };
      case 'out for delivery':
      case 'dispatched':
        return {
          bg: '#faf5ff',
          color: '#7e22ce',
          border: '#e9d5ff',
          icon: '🚚',
          title: 'Out for Site Delivery',
        };
      case 'delivered':
        return {
          bg: '#f0fdf4',
          color: '#15803d',
          border: '#bbf7d0',
          icon: '✅',
          title: 'Delivered to Site',
        };
      case 'cancelled':
        return {
          bg: '#fef2f2',
          color: '#b91c1c',
          border: '#fecaca',
          icon: '❌',
          title: 'Order Cancelled',
        };
      default:
        return {
          bg: '#eff6ff',
          color: '#1d4ed8',
          border: '#bfdbfe',
          icon: '📝',
          title: `Order ${status || 'Placed'}`,
        };
    }
  };

  const statusTheme = getStatusTheme(orderStatus);

  const formattedDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const isInclusive = (order?.summary?.gstType || settings?.commerce?.gstType) === 'inclusive';
  const subtotal = order?.summary?.subtotal || 0;
  const discount = order?.summary?.discount || 0;
  const taxable = Math.max(0, subtotal - discount);

  const gstTotal = Math.round((taxable * (taxRate / 100)) * 100) / 100;
  const cgst = Math.round((gstTotal / 2) * 100) / 100;
  const sgst = Math.round((gstTotal - cgst) * 100) / 100;
  const baseAmount = isInclusive ? Math.max(0, taxable - gstTotal) : taxable;

  const shippingFee = order?.summary?.shippingFee || 0;
  const grandTotal = order?.summary?.grandTotal || (isInclusive ? (taxable + shippingFee) : (taxable + gstTotal + shippingFee));

  // Stages for visual step tracker
  const stages = [
    { key: 'placed', label: 'Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'dispatched', label: 'Dispatched' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getStageIndex = (st) => {
    switch ((st || '').toLowerCase()) {
      case 'cancelled':
        return -1;
      case 'delivered':
        return 3;
      case 'out for delivery':
      case 'dispatched':
        return 2;
      case 'processing':
        return 1;
      case 'confirmed':
        return 1;
      case 'placed':
        return 0;
      default:
        return 0;
    }
  };

  const currentStageIdx = getStageIndex(orderStatus);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={onBack}>
          <ArrowLeftIcon size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>ORDER DETAILS & INVOICE</Text>
          <Text style={styles.title} numberOfLines={1}>
            {order?.orderNumber}
          </Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7} onPress={handleShareOrder}>
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

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
        {/* Status Hero Card */}
        <View
          style={[
            styles.statusHeroCard,
            { backgroundColor: statusTheme.bg, borderColor: statusTheme.border },
          ]}
        >
          <View style={styles.statusHeroTop}>
            <View style={styles.statusHeroIconBox}>
              <Text style={{ fontSize: 22 }}>{statusTheme.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusHeroTitle, { color: statusTheme.color }]}>
                {statusTheme.title}
              </Text>
              <Text style={styles.statusHeroDate}>{formattedDate}</Text>
            </View>
            <View
              style={[
                styles.statusHeroPill,
                { backgroundColor: '#ffffff', borderColor: statusTheme.border },
              ]}
            >
              <Text style={[styles.statusHeroPillText, { color: statusTheme.color }]}>
                {orderStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Step Progress Tracker */}
          {orderStatus.toLowerCase() !== 'cancelled' ? (
            <View style={styles.trackerContainer}>
              <View style={styles.trackerLineTrack}>
                <View
                  style={[
                    styles.trackerLineFill,
                    {
                      width: `${Math.round((currentStageIdx / (stages.length - 1)) * 100)}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.trackerStepsRow}>
                {stages.map((stage, idx) => {
                  const isCompleted = idx <= currentStageIdx;
                  return (
                    <View key={stage.key} style={styles.trackerStepItem}>
                      <View
                        style={[
                          styles.trackerDot,
                          isCompleted && styles.trackerDotActive,
                        ]}
                      >
                        {isCompleted && (
                          <CheckCircleIcon size={12} color="#ffffff" />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.trackerStepLabel,
                          isCompleted && styles.trackerStepLabelActive,
                        ]}
                      >
                        {stage.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.cancelledBox}>
              <Text style={styles.cancelledText}>
                Reason: {order.cancelReason || 'Cancelled by customer'}
              </Text>
            </View>
          )}
        </View>

        {/* Ordered Materials & Services */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={styles.sectionCardTitle}>
              Ordered Supplies & Services ({order?.items?.length || 0})
            </Text>
            <Text style={styles.sectionCardSub}>ISI Certified Materials</Text>
          </View>

          <View style={styles.itemsList}>
            {(order?.items || []).map((item, idx) => (
              <View key={item._id || idx} style={styles.itemRow}>
                <View style={styles.itemIconCircle}>
                  <Text style={{ fontSize: 18 }}>
                    {item.type === 'product' ? '📦' : '⚡'}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.itemTagRow}>
                    <Text style={styles.itemBrand}>
                      {(item.brand || 'VOLTLINE').toUpperCase()}
                    </Text>
                    <View
                      style={[
                        styles.itemTypeBadge,
                        item.type === 'product'
                          ? styles.itemTypeProduct
                          : styles.itemTypeService,
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemTypeBadgeText,
                          item.type === 'product'
                            ? { color: '#16a34a' }
                            : { color: '#2563eb' },
                        ]}
                      >
                        {item.type === 'product' ? 'PRODUCT' : 'SERVICE'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Qty: {item.quantity || 1} • Unit Price: ₹{item.price}
                  </Text>
                </View>

                <View style={styles.itemPriceCol}>
                  <Text style={styles.itemPriceTotal}>
                    ₹{(item.price || 0) * (item.quantity || 1)}
                  </Text>
                  <Text style={styles.itemTaxIncluded}>
                    {order?.summary?.gstType === 'exclusive' ? '+ GST' : 'Inc. GST'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Site Delivery Address */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>📍 Job Site / Delivery Address</Text>
          <View style={styles.addressBlock}>
            <Text style={styles.recipientName}>
              {order?.shippingAddress?.fullName}
            </Text>
            <Text style={styles.recipientPhone}>
              📞 {order?.shippingAddress?.phone}
            </Text>
            <Text style={styles.addressStreet}>
              {order?.shippingAddress?.street}
            </Text>
            <Text style={styles.addressCity}>
              {order?.shippingAddress?.city}, {order?.shippingAddress?.state} -{' '}
              {order?.shippingAddress?.postalCode}
            </Text>
            {!!order?.shippingAddress?.deliveryNotes && (
              <View style={styles.deliveryNotesCard}>
                <Text style={styles.deliveryNotesText}>
                  📝 Instructions: {order.shippingAddress.deliveryNotes}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment & Invoice Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.paymentRowTop}>
            <Text style={styles.sectionCardTitle}>💳 Payment & Tax Invoice</Text>
            <TouchableOpacity
              style={styles.invoiceBtn}
              activeOpacity={0.8}
              onPress={() => setShowInvoiceModal(true)}
            >
              <Text style={styles.invoiceBtnText}>📄 View Tax Invoice</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paymentInfoRow}>
            <View style={styles.paymentMethodPill}>
              <Text style={{ fontSize: 16 }}>
                {order?.payment?.method === 'COD'
                  ? '💵'
                  : order?.payment?.method === 'UPI'
                  ? '📱'
                  : '💳'}
              </Text>
              <View>
                <Text style={styles.paymentMethodName}>
                  {order?.payment?.method === 'COD'
                    ? 'Cash on Delivery (COD)'
                    : order?.payment?.method === 'UPI'
                    ? 'UPI Instant Pay'
                    : 'Credit / Debit Card'}
                </Text>
                <Text style={styles.paymentStatusSub}>
                  Status: {order?.payment?.status || 'Pending'}
                </Text>
              </View>
            </View>
          </View>

          {/* Breakdown Table */}
          <View style={styles.billTable}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Items Subtotal</Text>
              <Text style={styles.billVal}>₹{subtotal}</Text>
            </View>

            {discount > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#16a34a' }]}>
                  Promotional Discount ({order?.summary?.couponCode || 'PROMO'})
                </Text>
                <Text style={[styles.billVal, { color: '#16a34a' }]}>
                  -₹{discount}
                </Text>
              </View>
            )}

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>CGST ({halfTax}%)</Text>
              <Text style={styles.billVal}>₹{cgst}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>SGST ({halfTax}%)</Text>
              <Text style={styles.billVal}>₹{sgst}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Site Delivery</Text>
              <Text
                style={[
                  styles.billVal,
                  shippingFee === 0 && { color: '#16a34a', fontWeight: '700' },
                ]}
              >
                {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.billRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalVal}>₹{grandTotal}</Text>
            </View>
          </View>
        </View>

        {/* Live Timeline History */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>⏱️ Timeline History</Text>
          <View style={styles.timelineList}>
            {(order?.timeline || []).map((step, idx) => (
              <View key={step._id || idx} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineStatusTitle}>{step.status}</Text>
                  <Text style={styles.timelineNoteText}>
                    {step.note || 'Status milestone updated'}
                  </Text>
                  {step.time && (
                    <Text style={styles.timelineTimeText}>
                      {new Date(step.time).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
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

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.reorderBtn}
            activeOpacity={0.85}
            onPress={handleReorderAll}
            disabled={reordering}
          >
            {reordering ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <BoltIcon size={16} color="#ffffff" />
                <Text style={styles.reorderBtnText}>REORDER ALL ITEMS</Text>
              </>
            )}
          </TouchableOpacity>

          {isCancellable && (
            <TouchableOpacity
              style={styles.cancelActionBtn}
              activeOpacity={0.8}
              onPress={() => setShowCancelModal(true)}
            >
              <Text style={styles.cancelActionBtnText}>Cancel This Order</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* CANCEL ORDER CONFIRMATION MODAL */}
      <Modal
        visible={showCancelModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModalCard}>
            <View style={styles.cancelModalIcon}>
              <Text style={{ fontSize: 28 }}>⚠️</Text>
            </View>
            <Text style={styles.cancelModalTitle}>Cancel Order #{order?.orderNumber}?</Text>
            <Text style={styles.cancelModalSub}>
              Are you sure you want to cancel this order? Reserved items and site dispatch will be released.
            </Text>

            <View style={styles.reasonsList}>
              {['Change of project requirements', 'Ordered incorrect quantity / model', 'Found alternative brand', 'Delay in site work'].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    cancelReason === reason && styles.reasonOptionActive,
                  ]}
                  onPress={() => setCancelReason(reason)}
                >
                  <Text style={styles.reasonOptionText}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelModalKeepBtn}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.cancelModalKeepText}>Keep Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelModalConfirmBtn}
                onPress={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.cancelModalConfirmText}>Confirm Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* GST TAX INVOICE MODAL */}
      <Modal
        visible={showInvoiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.invoiceSheet}>
            <View style={styles.invoiceHeader}>
              <View>
                <Text style={styles.invoiceBrand}>{storeName.toUpperCase()}</Text>
                <Text style={styles.invoiceGstin}>GSTIN: {storeGstin}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)} style={{ padding: 6 }}>
                <CloseIcon size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              <View style={styles.invoiceMetaBox}>
                <View>
                  <Text style={styles.invoiceMetaLabel}>INVOICE NO.</Text>
                  <Text style={styles.invoiceMetaVal}>INV-{order?.orderNumber?.replace('VOLT-', '')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.invoiceMetaLabel}>DATE</Text>
                  <Text style={styles.invoiceMetaVal}>{order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : formattedDate}</Text>
                </View>
              </View>

              <View style={styles.invoiceBilledTo}>
                <Text style={styles.invoiceBilledLabel}>BILLED TO (SITE RECIPIENT):</Text>
                <Text style={styles.invoiceBilledName}>{order?.shippingAddress?.fullName}</Text>
                <Text style={styles.invoiceBilledAddress}>
                  {order?.shippingAddress?.street}, {order?.shippingAddress?.city} - {order?.shippingAddress?.postalCode}
                </Text>
                <Text style={styles.invoiceBilledAddress}>Phone: {order?.shippingAddress?.phone}</Text>
              </View>

              {/* Items Table */}
              <View style={styles.invoiceTable}>
                <View style={styles.invoiceTableHeader}>
                  <Text style={[styles.invoiceTh, { flex: 2 }]}>Item / Description</Text>
                  <Text style={[styles.invoiceTh, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                  <Text style={[styles.invoiceTh, { flex: 1, textAlign: 'right' }]}>Rate</Text>
                  <Text style={[styles.invoiceTh, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                </View>

                {(order?.items || []).map((itm, i) => (
                  <View key={i} style={styles.invoiceTableRow}>
                    <Text style={[styles.invoiceTd, { flex: 2, fontWeight: '700' }]} numberOfLines={2}>
                      {itm.name}
                    </Text>
                    <Text style={[styles.invoiceTd, { flex: 1, textAlign: 'center' }]}>
                      {itm.quantity || 1}
                    </Text>
                    <Text style={[styles.invoiceTd, { flex: 1, textAlign: 'right' }]}>
                      ₹{itm.price}
                    </Text>
                    <Text style={[styles.invoiceTd, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>
                      ₹{(itm.price || 0) * (itm.quantity || 1)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Invoice Totals */}
              <View style={styles.invoiceTotals}>
                <View style={styles.invoiceTotalRow}>
                  <Text style={styles.invoiceTotalLabel}>Taxable Value:</Text>
                  <Text style={styles.invoiceTotalVal}>₹{baseAmount}</Text>
                </View>
                <View style={styles.invoiceTotalRow}>
                  <Text style={styles.invoiceTotalLabel}>CGST ({halfTax}%):</Text>
                  <Text style={styles.invoiceTotalVal}>₹{cgst}</Text>
                </View>
                <View style={styles.invoiceTotalRow}>
                  <Text style={styles.invoiceTotalLabel}>SGST ({halfTax}%):</Text>
                  <Text style={styles.invoiceTotalVal}>₹{sgst}</Text>
                </View>
                <View style={styles.invoiceTotalRow}>
                  <Text style={styles.invoiceTotalLabel}>Delivery Charges:</Text>
                  <Text style={styles.invoiceTotalVal}>₹{shippingFee}</Text>
                </View>
                <View style={[styles.invoiceTotalRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 6, marginTop: 4 }]}>
                  <Text style={[styles.invoiceTotalLabel, { fontWeight: '800', color: '#0f172a' }]}>Total Invoice Value:</Text>
                  <Text style={[styles.invoiceTotalVal, { fontWeight: '800', color: '#2563eb', fontSize: 16 }]}>₹{grandTotal}</Text>
                </View>
              </View>

              <View style={styles.invoiceFooter}>
                <CheckCircleIcon size={14} color="#16a34a" />
                <Text style={styles.invoiceFooterText}>This is a computer generated invoice valid without signature.</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  shareBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  errorSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButtonOutline: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  backButtonOutlineText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 16,
  },
  statusHeroCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  statusHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusHeroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusHeroTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  statusHeroDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusHeroPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusHeroPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trackerContainer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    position: 'relative',
  },
  trackerLineTrack: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  trackerLineFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  trackerStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackerStepItem: {
    alignItems: 'center',
    width: 60,
  },
  trackerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackerDotActive: {
    backgroundColor: '#2563eb',
  },
  trackerStepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  trackerStepLabelActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  cancelledBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  cancelledText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionCardSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  itemIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  itemTypeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  itemTypeProduct: {
    backgroundColor: '#f0fdf4',
  },
  itemTypeService: {
    backgroundColor: '#eff6ff',
  },
  itemTypeBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  itemPriceCol: {
    alignItems: 'flex-end',
  },
  itemPriceTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  itemTaxIncluded: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  addressBlock: {
    marginTop: 8,
  },
  recipientName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  recipientPhone: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 2,
  },
  addressStreet: {
    fontSize: 12,
    color: '#334155',
    marginTop: 4,
    lineHeight: 18,
  },
  addressCity: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  deliveryNotesCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  deliveryNotesText: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '600',
  },
  paymentRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  invoiceBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  invoiceBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  paymentInfoRow: {
    marginBottom: 12,
  },
  paymentMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentMethodName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  paymentStatusSub: {
    fontSize: 10,
    color: '#64748b',
  },
  billTable: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    gap: 6,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  billVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
  },
  timelineList: {
    marginTop: 10,
    gap: 12,
    paddingLeft: 4,
  },
  timelineItem: {
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
  timelineStatusTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  timelineNoteText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  timelineTimeText: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 6,
  },
  reorderBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
  },
  reorderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelActionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  cancelActionBtnText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
  },

  // Cancel Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cancelModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  cancelModalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  cancelModalSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 16,
  },
  reasonsList: {
    width: '100%',
    marginVertical: 10,
    gap: 6,
  },
  reasonOption: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  reasonOptionActive: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  reasonOptionText: {
    fontSize: 11,
    color: '#334155',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    width: '100%',
  },
  cancelModalKeepBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  cancelModalKeepText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  cancelModalConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },
  cancelModalConfirmText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Invoice Sheet
  invoiceSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  invoiceBrand: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  invoiceGstin: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },
  invoiceMetaBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  invoiceMetaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  invoiceMetaVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  invoiceBilledTo: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  invoiceBilledLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  invoiceBilledName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  invoiceBilledAddress: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  invoiceTable: {
    paddingVertical: 10,
  },
  invoiceTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 6,
    marginBottom: 6,
  },
  invoiceTh: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  invoiceTableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  invoiceTd: {
    fontSize: 10,
    color: '#334155',
  },
  invoiceTotals: {
    paddingTop: 8,
    gap: 4,
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invoiceTotalLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  invoiceTotalVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  invoiceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  invoiceFooterText: {
    fontSize: 9,
    color: '#64748b',
  },
});
