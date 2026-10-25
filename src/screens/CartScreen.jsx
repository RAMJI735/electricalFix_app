import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import OrderService from '../../services/orderService';
import AddressService from '../../services/addressService';
import { getCurrentUserLocation } from '../utils/locationHelper';
import {
  BoltIcon,
  TrashIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  CloseIcon,
  PackageIcon,
} from '../components/Icons';

export default function CartScreen({
  onExploreShop,
  onNavigateToOrders,
  onNavigateToAuth,
}) {
  const {
    cart,
    cartItems,
    totalCartCount,
    loading,
    updating,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    fetchCart,
  } = useCart();

  const { user, isAuthenticated } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [itemActionLoadingId, setItemActionLoadingId] = useState(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Checkout Modal state
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // Address and payment form
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Kolkata');
  const [pincode, setPincode] = useState('700091');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [checkoutCoords, setCheckoutCoords] = useState(null);
  const [checkoutLocating, setCheckoutLocating] = useState(false);
  const [checkoutLocationMsg, setCheckoutLocationMsg] = useState('');
  const [formError, setFormError] = useState('');

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);

  // Fetch saved addresses when checkout opens
  useEffect(() => {
    if (isCheckoutVisible) {
      const fetchAddresses = async () => {
        try {
          const list = await AddressService.getAddresses();
          if (Array.isArray(list) && list.length > 0) {
            setSavedAddresses(list);
            const def = list.find((a) => a.isDefault) || list[0];
            setSelectedAddressId(def._id);
            setFullName(def.fullName || '');
            setPhone(def.phone || '');
            setStreet(def.street || '');
            setCity(def.city || 'Kolkata');
            setPincode(def.postalCode || def.pincode || '700091');
          } else {
            setSavedAddresses([]);
            setSelectedAddressId('new');
          }
        } catch (err) {
          // Non-fatal
        }
      };
      fetchAddresses();
    }
  }, [isCheckoutVisible]);

  // Computations
  const subtotal =
    cart?.totalPrice ||
    cartItems.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
  const discount = cart?.discount || (cart?.couponCode ? Math.round(subtotal * 0.1) : 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const gst = cart?.tax || Math.round(taxableAmount * 0.18);
  const delivery = subtotal > 2000 || subtotal === 0 ? 0 : 150;
  const grandTotal = cart?.grandTotal || taxableAmount + gst + delivery;

  const freeDeliveryThreshold = 2000;
  const freeDeliveryProgress = Math.min(1, subtotal / freeDeliveryThreshold);
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  // Apply Coupon Handler
  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    try {
      await applyCoupon(code);
      setCouponInput('');
    } catch (err) {
      setCouponError(err.message || 'Invalid or expired coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove Coupon Handler
  const handleRemoveCoupon = async () => {
    setCouponLoading(true);
    try {
      await removeCoupon();
      setCouponError('');
    } catch (err) {
      // Ignore
    } finally {
      setCouponLoading(false);
    }
  };

  // Update item quantity with loading indicator
  const handleUpdateQty = async (targetId, newQty) => {
    setItemActionLoadingId(targetId);
    try {
      await updateQuantity(targetId, newQty);
    } catch (err) {
      console.warn('Failed to update quantity:', err);
    } finally {
      setItemActionLoadingId(null);
    }
  };

  // Remove item with loading indicator
  const handleRemoveItem = async (targetId) => {
    setItemActionLoadingId(targetId);
    try {
      await removeFromCart(targetId);
    } catch (err) {
      console.warn('Failed to remove item:', err);
    } finally {
      setItemActionLoadingId(null);
    }
  };

  // Clear Cart Confirmation
  const handleClearCart = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Clear all electrical items from your cart?')) {
        clearCart();
      }
    } else {
      Alert.alert(
        'Clear Cart',
        'Are you sure you want to remove all items from your cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: clearCart },
        ]
      );
    }
  };

  // GPS Site Location Detection in Checkout
  const handleCheckoutDetectLocation = async () => {
    setCheckoutLocating(true);
    setFormError('');
    setCheckoutLocationMsg('');
    try {
      const res = await getCurrentUserLocation();
      if (res.success && res.coords) {
        setCheckoutCoords(res.coords);
        setCheckoutLocationMsg(
          `📍 GPS Site Location Pinned: ${res.coords.latitude.toFixed(4)}°, ${res.coords.longitude.toFixed(4)}° (±${res.coords.accuracy}m)`
        );

        if (res.address) {
          if (res.address.street && !street) setStreet(res.address.street);
          if (res.address.city) setCity(res.address.city);
          if (res.address.postalCode && !pincode) setPincode(res.address.postalCode);
        }
      } else {
        setFormError(res.error || 'Failed to detect current GPS location.');
      }
    } catch (err) {
      setFormError(err.message || 'Error detecting site GPS coordinates.');
    } finally {
      setCheckoutLocating(false);
    }
  };

  // Handle Place Order with full field validations
  const handlePlaceOrder = async () => {
    if (!fullName || fullName.trim().length < 2) {
      setFormError('Please enter recipient or contractor name (min 2 characters)');
      return;
    }

    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)');
      return;
    }

    if (!street || street.trim().length < 5) {
      setFormError('Please enter complete street or plot address (at least 5 characters)');
      return;
    }

    if (!city || city.trim().length < 2) {
      setFormError('Please enter city name');
      return;
    }

    const cleanPin = pincode ? pincode.replace(/\D/g, '') : '';
    if (!cleanPin || cleanPin.length !== 6 || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setFormError('Please enter a valid 6-digit Indian PIN code (cannot start with 0)');
      return;
    }

    setFormError('');
    setPlacingOrder(true);

    try {
      const orderPayload = {
        shippingAddress: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          street: street.trim(),
          city: city.trim(),
          postalCode: cleanPin,
          country: 'India',
          deliveryNotes: deliveryNotes.trim(),
          coordinates: checkoutCoords ? {
            latitude: checkoutCoords.latitude,
            longitude: checkoutCoords.longitude,
            accuracy: checkoutCoords.accuracy || null,
          } : undefined,
        },
        paymentMethod,
        deliveryNotes: deliveryNotes.trim(),
        couponCode: cart?.couponCode || '',
        clearCartOnSuccess: true,
      };

      const createdOrder = await OrderService.createOrder(orderPayload);

      // Immediately empty cart state across UI and backend
      try {
        await clearCart();
      } catch (clearErr) {
        await fetchCart();
      }

      // Save address in background if user opted in
      if (selectedAddressId === 'new' && saveAddressForFuture) {
        AddressService.createAddress({
          fullName: fullName.trim(),
          phone: cleanPhone,
          street: street.trim(),
          city: city.trim(),
          postalCode: cleanPin,
          country: 'India',
          addressType: 'site',
          isDefault: savedAddresses.length === 0,
          coordinates: checkoutCoords || undefined,
        }).catch((err) => console.warn('Address auto-save notice:', err));
      }

      setIsCheckoutVisible(false);
      setOrderSuccessData(createdOrder);
    } catch (err) {
      setFormError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Refresh Handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCart();
      if (user) {
        const list = await AddressService.getAddresses();
        if (Array.isArray(list)) setSavedAddresses(list);
      }
    } catch (e) {
      // Non-fatal
    } finally {
      setRefreshing(false);
    }
  };

  // Loading Screen
  if (loading && cartItems.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your electrical cart...</Text>
      </View>
    );
  }

  // Empty Screen
  if (cartItems.length === 0 && !orderSuccessData) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#f8fafc' }}
        contentContainerStyle={[styles.emptyContainer, { flexGrow: 1 }]}
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
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIcon}>{isAuthenticated ? '🛒' : '🔒'}</Text>
        </View>
        <Text style={styles.emptyTitle}>
          {isAuthenticated ? 'Your Electrical Cart is Empty' : 'Sign In to Access Your Cart'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isAuthenticated
            ? 'Add premium copper wires, MCBs, modular switches, and certified installation services.'
            : 'You are currently browsing the catalog as a visitor. Sign in or register to add items to your cart, save delivery sites, and place orders.'}
        </Text>

        {!isAuthenticated && onNavigateToAuth && (
          <TouchableOpacity
            style={[styles.exploreBtn, { backgroundColor: '#2563eb', marginBottom: 12 }]}
            activeOpacity={0.85}
            onPress={() => onNavigateToAuth('login')}
          >
            <BoltIcon size={16} color="#ffffff" />
            <Text style={styles.exploreBtnText}>LOG IN TO CONSOLE</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={!isAuthenticated ? styles.viewOrdersOutlineBtn : styles.exploreBtn}
          activeOpacity={0.85}
          onPress={onExploreShop}
        >
          <BoltIcon size={16} color={!isAuthenticated ? '#2563eb' : '#ffffff'} />
          <Text style={!isAuthenticated ? styles.viewOrdersOutlineText : styles.exploreBtnText}>BROWSE CATALOG (VIEW ONLY)</Text>
        </TouchableOpacity>

        {isAuthenticated && onNavigateToOrders && (
          <TouchableOpacity
            style={styles.viewOrdersOutlineBtn}
            activeOpacity={0.8}
            onPress={onNavigateToOrders}
          >
            <PackageIcon size={16} color="#2563eb" />
            <Text style={styles.viewOrdersOutlineText}>VIEW MY ORDERS & INVOICES</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ORDER & SITE MATERIALS</Text>
          <Text style={styles.title}>Cart & Supplies</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{totalCartCount} ITEMS</Text>
          </View>
          {cartItems.length > 0 && (
            <TouchableOpacity onPress={handleClearCart} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Free Delivery Meter */}
      <View style={styles.deliveryProgressCard}>
        <View style={styles.deliveryProgressHeader}>
          <Text style={styles.deliveryProgressTitle}>
            {subtotal >= freeDeliveryThreshold
              ? '🎉 FREE Site Delivery Unlocked!'
              : `Add ₹${amountNeededForFreeDelivery} more for FREE Delivery`}
          </Text>
          <Text style={styles.deliveryProgressThreshold}>Goal: ₹2,000</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.round(freeDeliveryProgress * 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* Cart Items List */}
      <ScrollView
        style={styles.itemsScroll}
        contentContainerStyle={styles.itemsContent}
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
        {updating && (
          <View style={styles.updatingBanner}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.updatingText}>Syncing cart with server...</Text>
          </View>
        )}

        {cartItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={styles.itemTopTags}>
                  <Text style={styles.itemBrand}>{(item.brand || 'VOLTLINE').toUpperCase()}</Text>
                  <View
                    style={[
                      styles.typeBadge,
                      item.type === 'product' ? styles.typeProduct : styles.typeService,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        item.type === 'product'
                          ? styles.typeProductText
                          : styles.typeServiceText,
                      ]}
                    >
                      {item.type === 'product' ? 'PRODUCT' : 'SERVICE'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                {!!item.spec && (
                  <Text style={styles.itemSpec} numberOfLines={1}>
                    {item.spec}
                  </Text>
                )}
              </View>

              <View style={styles.itemPriceCol}>
                <Text style={styles.itemPrice}>₹{item.price * (item.quantity || 1)}</Text>
                {item.quantity > 1 && (
                  <Text style={styles.unitPrice}>₹{item.price} each</Text>
                )}
              </View>
            </View>

            {/* Stepper & Remove */}
            <View style={styles.stepperRow}>
              {(() => {
                const isItemLoading = itemActionLoadingId === item.id;
                return (
                  <>
                    <View style={[styles.stepper, isItemLoading && { opacity: 0.6 }]}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        activeOpacity={0.7}
                        disabled={isItemLoading}
                        onPress={() => handleUpdateQty(item.id, (item.quantity || 1) - 1)}
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </TouchableOpacity>
                      {isItemLoading ? (
                        <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
                          <ActivityIndicator size="small" color="#2563eb" />
                        </View>
                      ) : (
                        <Text style={styles.qtyText}>{item.quantity || 1}</Text>
                      )}
                      <TouchableOpacity
                        style={styles.stepBtn}
                        activeOpacity={0.7}
                        disabled={isItemLoading}
                        onPress={() => handleUpdateQty(item.id, (item.quantity || 1) + 1)}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.removeBtn, isItemLoading && { opacity: 0.6 }]}
                      activeOpacity={0.7}
                      disabled={isItemLoading}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      {isItemLoading ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <>
                          <TrashIcon size={14} color="#ef4444" />
                          <Text style={styles.removeText}>Remove</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>
          </View>
        ))}

        {/* Promo / Coupon Box */}
        <View style={styles.couponCard}>
          <Text style={styles.couponCardTitle}>Contractor Discount & Coupons</Text>
          {cart?.couponCode ? (
            <View style={styles.appliedCouponRow}>
              <View style={styles.couponPill}>
                <Text style={styles.couponPillText}>🏷️ {cart.couponCode} APPLIED</Text>
                <Text style={styles.couponDiscountText}>-₹{discount} OFF</Text>
              </View>
              <TouchableOpacity
                onPress={handleRemoveCoupon}
                disabled={couponLoading}
                style={styles.removeCouponBtn}
              >
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.couponInputRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter code (e.g. VOLT10)"
                  placeholderTextColor="#94a3b8"
                  value={couponInput}
                  onChangeText={(val) => {
                    setCouponInput(val.toUpperCase());
                    setCouponError('');
                  }}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.applyCouponBtn}
                  activeOpacity={0.8}
                  onPress={() => handleApplyCoupon()}
                  disabled={couponLoading}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.applyCouponBtnText}>APPLY</Text>
                  )}
                </TouchableOpacity>
              </View>
              {!!couponError && (
                <Text style={styles.couponErrorText}>{couponError}</Text>
              )}
              {/* Quick Suggestion Badge */}
              <TouchableOpacity
                style={styles.suggestedBadge}
                activeOpacity={0.7}
                onPress={() => handleApplyCoupon('VOLT10')}
              >
                <Text style={styles.suggestedBadgeText}>
                  ⚡ Tap to apply <Text style={{ fontWeight: '800' }}>VOLT10</Text> for 10% instant discount
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Bill Breakdown</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>₹{subtotal}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#16a34a' }]}>
                Promotional Discount
              </Text>
              <Text style={[styles.summaryVal, { color: '#16a34a' }]}>
                -₹{discount}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST (18% itemized)</Text>
            <Text style={styles.summaryVal}>₹{gst}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Site Delivery</Text>
            <Text
              style={[
                styles.summaryVal,
                delivery === 0 && { color: '#16a34a', fontWeight: '700' },
              ]}
            >
              {delivery === 0 ? 'FREE' : `₹${delivery}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalVal}>₹{grandTotal}</Text>
          </View>
        </View>

        {/* Quality Guarantees */}
        <View style={styles.guaranteeRow}>
          <View style={styles.guaranteeItem}>
            <ShieldCheckIcon size={16} color="#2563eb" />
            <Text style={styles.guaranteeText}>100% Genuine ISI Mark</Text>
          </View>
          <View style={styles.guaranteeItem}>
            <CheckCircleIcon size={16} color="#10b981" />
            <Text style={styles.guaranteeText}>GST Tax Invoice</Text>
          </View>
          <View style={styles.guaranteeItem}>
            <BoltIcon size={16} color="#f59e0b" />
            <Text style={styles.guaranteeText}>Priority Dispatch</Text>
          </View>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          style={styles.checkoutBtn}
          activeOpacity={0.85}
          onPress={() => {
            if (!isAuthenticated) {
              if (onNavigateToAuth) onNavigateToAuth('login');
              return;
            }
            setIsCheckoutVisible(true);
          }}
        >
          <View style={styles.checkoutBtnLeft}>
            <BoltIcon size={18} color="#ffffff" />
            <Text style={styles.checkoutBtnText}>PROCEED TO SECURE CHECKOUT</Text>
          </View>
          <Text style={styles.checkoutBtnPrice}>₹{grandTotal}</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CHECKOUT MODAL */}
      <Modal
        visible={isCheckoutVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setIsCheckoutVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>VOLTLINE ELECTRICAL</Text>
                <Text style={styles.modalTitle}>Confirm Order & Delivery</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setIsCheckoutVisible(false)}
              >
                <CloseIcon size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            >
              {!!formError && (
                <View style={styles.formErrorBox}>
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              )}

              {/* Delivery Details */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.formSectionTitle}>📍 Delivery / Job Site Address</Text>
                {savedAddresses.length > 0 && selectedAddressId !== 'new' && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedAddressId('new');
                      setFullName(user?.name || '');
                      setPhone(user?.phone || '');
                      setStreet('');
                      setCity('Kolkata');
                      setPincode('700091');
                    }}
                  >
                    <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: '700' }}>+ New Address</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Saved Addresses Selector Pills */}
              {savedAddresses.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr._id;
                      return (
                        <TouchableOpacity
                          key={addr._id}
                          style={[
                            styles.savedAddrPill,
                            isSelected && styles.savedAddrPillActive,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedAddressId(addr._id);
                            setFullName(addr.fullName || '');
                            setPhone(addr.phone || '');
                            setStreet(addr.street || '');
                            setCity(addr.city || 'Kolkata');
                            setPincode(addr.postalCode || addr.pincode || '700091');
                          }}
                        >
                          <Text style={{ fontSize: 12 }}>
                            {addr.addressType === 'home' ? '🏠' : addr.addressType === 'work' ? '🏢' : '⚡'}
                          </Text>
                          <View>
                            <Text
                              style={[
                                styles.savedAddrPillTitle,
                                isSelected && styles.savedAddrPillTitleActive,
                              ]}
                              numberOfLines={1}
                            >
                              {addr.fullName}
                            </Text>
                            <Text style={styles.savedAddrPillSub} numberOfLines={1}>
                              {addr.city} - {addr.postalCode || addr.pincode}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Selected Address Summary Card or Input Fields */}
              {selectedAddressId !== 'new' ? (
                <View style={styles.selectedAddressPreviewCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.selectedAddrName}>{fullName}</Text>
                      <Text style={styles.selectedAddrPhone}>📞 {phone}</Text>
                      <Text style={styles.selectedAddrStreet}>{street}</Text>
                      <Text style={styles.selectedAddrCity}>{city} - {pincode}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.changeAddrBtn}
                      onPress={() => setSelectedAddressId('new')}
                    >
                      <Text style={styles.changeAddrBtnText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  {/* GPS Auto-Detect Site Location Button */}
                  <View style={{ marginBottom: 12 }}>
                    <TouchableOpacity
                      style={styles.checkoutGpsBtn}
                      activeOpacity={0.8}
                      onPress={handleCheckoutDetectLocation}
                      disabled={checkoutLocating}
                    >
                      {checkoutLocating ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ActivityIndicator size="small" color="#ffffff" />
                          <Text style={styles.checkoutGpsBtnText}>DETECTING GPS SITE LOCATION...</Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 14 }}>📍</Text>
                          <Text style={styles.checkoutGpsBtnText}>USE CURRENT GPS SITE LOCATION</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* GPS Feedback Pill */}
                    {!!checkoutLocationMsg && (
                      <View style={styles.checkoutGpsPill}>
                        <CheckCircleIcon size={12} color="#16a34a" />
                        <Text style={styles.checkoutGpsPillText}>{checkoutLocationMsg}</Text>
                        <TouchableOpacity onPress={() => { setCheckoutCoords(null); setCheckoutLocationMsg(''); }}>
                          <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '700' }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Recipient / Contractor Name *</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="e.g. Ramesh Kumar"
                      placeholderTextColor="#94a3b8"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mobile Phone (for delivery OTP) *</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="e.g. 9876543210"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Street / Building / Plot Address *</Text>
                    <TextInput
                      style={[styles.inputField, { height: 60 }]}
                      placeholder="e.g. Plot 42, Sector 5, Near Tech Park"
                      placeholderTextColor="#94a3b8"
                      multiline
                      value={street}
                      onChangeText={setStreet}
                    />
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>City *</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="City"
                        placeholderTextColor="#94a3b8"
                        value={city}
                        onChangeText={setCity}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>PIN Code *</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="700091"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                        value={pincode}
                        onChangeText={setPincode}
                      />
                    </View>
                  </View>

                  {/* Save to Address Book Checkbox */}
                  <TouchableOpacity
                    style={styles.saveAddrCheckboxRow}
                    activeOpacity={0.8}
                    onPress={() => setSaveAddressForFuture(!saveAddressForFuture)}
                  >
                    <View style={[styles.saveAddrBox, saveAddressForFuture && styles.saveAddrBoxActive]}>
                      {saveAddressForFuture && <CheckCircleIcon size={12} color="#ffffff" />}
                    </View>
                    <Text style={styles.saveAddrLabel}>Save this address to my Address Book</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={[styles.inputGroup, { marginTop: 8 }]}>
                <Text style={styles.inputLabel}>Site Instructions / Technician Notes</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Call 1 hour prior to arrival"
                  placeholderTextColor="#94a3b8"
                  value={deliveryNotes}
                  onChangeText={setDeliveryNotes}
                />
              </View>

              {/* Payment Method Selector */}
              <Text style={[styles.formSectionTitle, { marginTop: 16 }]}>
                💳 Payment Method
              </Text>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'COD' && styles.paymentOptionActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setPaymentMethod('COD')}
              >
                <View style={styles.paymentLeft}>
                  <Text style={styles.paymentIcon}>💵</Text>
                  <View>
                    <Text style={styles.paymentName}>Cash on Delivery (COD)</Text>
                    <Text style={styles.paymentSub}>
                      Pay upon physical delivery or after service installation
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    paymentMethod === 'COD' && styles.radioCircleActive,
                  ]}
                >
                  {paymentMethod === 'COD' && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'UPI' && styles.paymentOptionActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setPaymentMethod('UPI')}
              >
                <View style={styles.paymentLeft}>
                  <Text style={styles.paymentIcon}>📱</Text>
                  <View>
                    <Text style={styles.paymentName}>UPI / QR Instant Pay</Text>
                    <Text style={styles.paymentSub}>
                      Google Pay, PhonePe, Paytm, or BHIM
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    paymentMethod === 'UPI' && styles.radioCircleActive,
                  ]}
                >
                  {paymentMethod === 'UPI' && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'CARD' && styles.paymentOptionActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setPaymentMethod('CARD')}
              >
                <View style={styles.paymentLeft}>
                  <Text style={styles.paymentIcon}>💳</Text>
                  <View>
                    <Text style={styles.paymentName}>Credit / Debit Card</Text>
                    <Text style={styles.paymentSub}>
                      Visa, MasterCard, RuPay with 3D Secure OTP
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    paymentMethod === 'CARD' && styles.radioCircleActive,
                  ]}
                >
                  {paymentMethod === 'CARD' && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>

              {/* Order Final Summary */}
              <View style={styles.modalSummaryBox}>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>
                    Items ({totalCartCount})
                  </Text>
                  <Text style={styles.modalSummaryVal}>₹{subtotal}</Text>
                </View>
                {discount > 0 && (
                  <View style={styles.modalSummaryRow}>
                    <Text style={[styles.modalSummaryLabel, { color: '#16a34a' }]}>
                      Discount
                    </Text>
                    <Text style={[styles.modalSummaryVal, { color: '#16a34a' }]}>
                      -₹{discount}
                    </Text>
                  </View>
                )}
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>GST (18%)</Text>
                  <Text style={styles.modalSummaryVal}>₹{gst}</Text>
                </View>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>Delivery</Text>
                  <Text
                    style={[
                      styles.modalSummaryVal,
                      delivery === 0 && { color: '#16a34a', fontWeight: '700' },
                    ]}
                  >
                    {delivery === 0 ? 'FREE' : `₹${delivery}`}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalGrandLabel}>Total Payable</Text>
                  <Text style={styles.modalGrandVal}>₹{grandTotal}</Text>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.confirmOrderBtn}
                activeOpacity={0.85}
                onPress={handlePlaceOrder}
                disabled={placingOrder}
              >
                {placingOrder ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.confirmOrderBtnText}>GENERATING ORDER...</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <BoltIcon size={18} color="#ffffff" />
                    <Text style={styles.confirmOrderBtnText}>
                      CONFIRM & PLACE ORDER (₹{grandTotal})
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ORDER SUCCESS MODAL */}
      <Modal
        visible={!!orderSuccessData}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setOrderSuccessData(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <CheckCircleIcon size={36} color="#16a34a" />
            </View>

            <Text style={styles.successTitle}>Order Placed Successfully!</Text>
            <Text style={styles.successSub}>
              Your Voltline electrical order has been confirmed.
            </Text>

            <View style={styles.orderNumberBox}>
              <Text style={styles.orderNumberLabel}>ORDER REFERENCE NUMBER</Text>
              <Text style={styles.orderNumberText}>
                {orderSuccessData?.orderNumber || 'VOLT-ORD'}
              </Text>
            </View>

            <View style={styles.successSummaryBox}>
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Total Amount</Text>
                <Text style={styles.successVal}>
                  ₹{orderSuccessData?.summary?.grandTotal || grandTotal}
                </Text>
              </View>
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Payment</Text>
                <Text style={styles.successVal}>
                  {orderSuccessData?.payment?.method || paymentMethod}
                </Text>
              </View>
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Site Address</Text>
                <Text style={styles.successVal} numberOfLines={1}>
                  {orderSuccessData?.shippingAddress?.street || street},{' '}
                  {orderSuccessData?.shippingAddress?.city || city}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewOrdersBtn}
              activeOpacity={0.85}
              onPress={() => {
                const data = orderSuccessData;
                setOrderSuccessData(null);
                if (onNavigateToOrders) {
                  onNavigateToOrders(data);
                }
              }}
            >
              <PackageIcon size={16} color="#ffffff" />
              <Text style={styles.viewOrdersBtnText}>TRACK ORDER & INVOICE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueShopBtn}
              activeOpacity={0.8}
              onPress={() => {
                setOrderSuccessData(null);
                onExploreShop && onExploreShop();
              }}
            >
              <Text style={styles.continueShopBtnText}>CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  clearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  deliveryProgressCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deliveryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  deliveryProgressTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  deliveryProgressThreshold: {
    fontSize: 10,
    color: '#64748b',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  itemsScroll: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 12,
  },
  updatingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  updatingText: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemTopTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeProduct: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  typeProductText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#16a34a',
  },
  typeService: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  typeServiceText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#2563eb',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 18,
    marginBottom: 2,
  },
  itemSpec: {
    fontSize: 11,
    color: '#64748b',
  },
  itemPriceCol: {
    alignItems: 'flex-end',
    marginLeft: 6,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  unitPrice: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepBtn: {
    width: 32,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  qtyText: {
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  removeText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  couponCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  couponCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  applyCouponBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyCouponBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appliedCouponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  couponPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  couponDiscountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  removeCouponBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeCouponText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  couponErrorText: {
    fontSize: 10,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '600',
  },
  suggestedBadge: {
    marginTop: 8,
    backgroundColor: '#eff6ff',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  suggestedBadgeText: {
    fontSize: 10,
    color: '#1e40af',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
  },
  guaranteeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guaranteeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  checkoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checkoutBtnPrice: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  viewOrdersOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  viewOrdersOutlineText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '86%',
    flexShrink: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    paddingTop: 12,
    flexShrink: 1,
  },
  formErrorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  formErrorText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '600',
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  paymentOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  paymentIcon: {
    fontSize: 20,
  },
  paymentName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  paymentSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#2563eb',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  modalSummaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalSummaryLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  modalSummaryVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalGrandLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalGrandVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
  },
  confirmOrderBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  confirmOrderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Success Modal
  successCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  orderNumberBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 14,
    width: '100%',
  },
  orderNumberLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1d4ed8',
    letterSpacing: 0.8,
  },
  orderNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e40af',
    marginTop: 2,
  },
  successSummaryBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 6,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  successVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: '60%',
  },
  viewOrdersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    marginBottom: 10,
  },
  viewOrdersBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  continueShopBtn: {
    paddingVertical: 8,
  },
  continueShopBtnText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  savedAddrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    minWidth: 140,
  },
  savedAddrPillActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  savedAddrPillTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  savedAddrPillTitleActive: {
    color: '#1d4ed8',
  },
  savedAddrPillSub: {
    fontSize: 10,
    color: '#64748b',
  },
  selectedAddressPreviewCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 6,
  },
  selectedAddrName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  selectedAddrPhone: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
    marginTop: 2,
  },
  selectedAddrStreet: {
    fontSize: 12,
    color: '#1e293b',
    marginTop: 4,
  },
  selectedAddrCity: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  changeAddrBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  changeAddrBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  saveAddrCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 2,
  },
  saveAddrBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  saveAddrBoxActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  saveAddrLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  checkoutGpsBtn: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutGpsBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checkoutGpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 6,
    gap: 6,
  },
  checkoutGpsPillText: {
    flex: 1,
    fontSize: 10,
    color: '#15803d',
    fontWeight: '600',
  },
});

