import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import AddressService from '../../services/addressService';
import { useAuth } from '../context/AuthContext';
import { getCurrentUserLocation } from '../utils/locationHelper';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  CloseIcon,
  TrashIcon,
  BoltIcon,
} from '../components/Icons';

export default function AddressScreen({ onBack, onSelectAddress }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Kolkata');
  const [state, setState] = useState('West Bengal');
  const [postalCode, setPostalCode] = useState('700091');
  const [addressType, setAddressType] = useState('site');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch addresses
  const loadAddresses = useCallback(async () => {
    try {
      const data = await AddressService.getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load addresses:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAddresses();
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setFullName(user?.name || '');
    setPhone(user?.phone || '');
    setAlternatePhone('');
    setStreet('');
    setLandmark('');
    setCity('Kolkata');
    setState('West Bengal');
    setPostalCode('700091');
    setAddressType('site');
    setDeliveryInstructions('');
    setIsDefault(addresses.length === 0);
    setCoordinates(null);
    setLocationSuccessMsg('');
    setFieldErrors({});
    setModalError('');
    setModalVisible(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (addr) => {
    setEditingAddressId(addr._id);
    setFullName(addr.fullName || '');
    setPhone(addr.phone || '');
    setAlternatePhone(addr.alternatePhone || '');
    setStreet(addr.street || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city || 'Kolkata');
    setState(addr.state || 'West Bengal');
    setPostalCode(addr.postalCode || addr.pincode || '');
    setAddressType(addr.addressType || 'site');
    setDeliveryInstructions(addr.deliveryInstructions || '');
    setIsDefault(Boolean(addr.isDefault));
    setCoordinates(addr.coordinates || (addr.location?.coordinates ? {
      latitude: addr.location.coordinates[1],
      longitude: addr.location.coordinates[0],
    } : null));
    setLocationSuccessMsg(addr.coordinates?.latitude ? `📍 GPS Pinned: ${addr.coordinates.latitude.toFixed(4)}°, ${addr.coordinates.longitude.toFixed(4)}°` : '');
    setFieldErrors({});
    setModalError('');
    setModalVisible(true);
  };

  // GPS Current Location Detector Handler
  const handleDetectCurrentLocation = async () => {
    setLocating(true);
    setModalError('');
    setLocationSuccessMsg('');
    try {
      const res = await getCurrentUserLocation();
      if (res.success && res.coords) {
        setCoordinates(res.coords);
        setLocationSuccessMsg(
          `📍 GPS Coordinates Pinned: ${res.coords.latitude.toFixed(4)}° N, ${res.coords.longitude.toFixed(4)}° E (±${res.coords.accuracy}m)`
        );

        // Auto-fill address components if available and fields are empty
        if (res.address) {
          if (res.address.street && (!street || street.trim() === '')) {
            setStreet(res.address.street);
          }
          if (res.address.city) {
            setCity(res.address.city);
          }
          if (res.address.state) {
            setState(res.address.state);
          }
          if (res.address.postalCode && (!postalCode || postalCode.trim() === '')) {
            setPostalCode(res.address.postalCode);
          }
        }
      } else {
        setModalError(res.error || 'Unable to retrieve GPS coordinates.');
      }
    } catch (err) {
      setModalError(err.message || 'GPS location detection failed.');
    } finally {
      setLocating(false);
    }
  };

  // Save Address Handler with comprehensive validations
  const handleSaveAddress = async () => {
    const errors = {};

    // 1. Full name validation
    if (!fullName || fullName.trim().length < 2) {
      errors.fullName = 'Contractor or recipient name must be at least 2 characters';
    } else if (fullName.trim().length > 100) {
      errors.fullName = 'Name cannot exceed 100 characters';
    }

    // 2. Mobile Phone validation (10 digits starting with 6-9)
    const cleanedPhone = phone ? phone.replace(/\D/g, '') : '';
    if (!cleanedPhone) {
      errors.phone = 'Mobile phone number is required';
    } else if (cleanedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanedPhone)) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
    }

    // 3. Alternate Phone (optional, but valid if given)
    const cleanedAlt = alternatePhone ? alternatePhone.replace(/\D/g, '') : '';
    if (cleanedAlt && (cleanedAlt.length !== 10 || !/^[6-9]\d{9}$/.test(cleanedAlt))) {
      errors.alternatePhone = 'Alternate phone must be a valid 10-digit mobile number';
    }

    // 4. Street address validation (min 5 characters)
    if (!street || street.trim().length < 5) {
      errors.street = 'Street / Plot address must be at least 5 characters for accurate delivery';
    } else if (street.trim().length > 250) {
      errors.street = 'Street address cannot exceed 250 characters';
    }

    // 5. City validation
    if (!city || city.trim().length < 2) {
      errors.city = 'City name is required (min 2 characters)';
    }

    // 6. PIN Code validation (6 digits starting with 1-9)
    const cleanedPin = postalCode ? postalCode.replace(/\D/g, '') : '';
    if (!cleanedPin) {
      errors.postalCode = 'Postal PIN code is required';
    } else if (cleanedPin.length !== 6 || !/^[1-9][0-9]{5}$/.test(cleanedPin)) {
      errors.postalCode = 'Enter a valid 6-digit Indian PIN code (cannot start with 0)';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setModalError(Object.values(errors)[0]);
      return;
    }

    setSaving(true);
    setModalError('');

    try {
      const payload = {
        fullName: fullName.trim(),
        phone: cleanedPhone,
        alternatePhone: cleanedAlt,
        street: street.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: cleanedPin,
        country: 'India',
        addressType,
        deliveryInstructions: deliveryInstructions.trim(),
        isDefault,
        coordinates: coordinates ? {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          accuracy: coordinates.accuracy || null,
        } : undefined,
      };

      if (editingAddressId) {
        await AddressService.updateAddress(editingAddressId, payload);
      } else {
        await AddressService.createAddress(payload);
      }

      setModalVisible(false);
      await loadAddresses();
    } catch (err) {
      setModalError(err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  // Set Default Address Handler
  const handleSetDefault = async (addrId) => {
    setActionLoadingId(addrId);
    try {
      await AddressService.setDefaultAddress(addrId);
      await loadAddresses();
    } catch (err) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Failed to set default address');
      } else {
        Alert.alert('Error', err.message);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Address Handler
  const handleDeleteAddress = (addr) => {
    const doDelete = async () => {
      setActionLoadingId(addr._id);
      try {
        await AddressService.deleteAddress(addr._id);
        await loadAddresses();
      } catch (err) {
        if (Platform.OS === 'web') {
          window.alert(err.message || 'Failed to delete address');
        } else {
          Alert.alert('Error', err.message);
        }
      } finally {
        setActionLoadingId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete address for ${addr.fullName}?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Address',
        `Are you sure you want to delete address for ${addr.fullName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const getAddressTypeIcon = (type = 'site') => {
    switch (type.toLowerCase()) {
      case 'home':
        return '🏠';
      case 'work':
        return '🏢';
      case 'warehouse':
        return '📦';
      default:
        return '⚡';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ArrowLeftIcon size={20} color="#0f172a" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>SITE & DELIVERY LOCATIONS</Text>
          <Text style={styles.title}>Delivery Addresses</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={handleOpenAddModal}>
          <Text style={styles.addBtnText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching saved addresses...</Text>
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={{ fontSize: 36 }}>📍</Text>
          </View>
          <Text style={styles.emptyTitle}>No Addresses Saved</Text>
          <Text style={styles.emptySubtitle}>
            Save your project site addresses, residential properties, or warehouse locations for instant checkout.
          </Text>
          <TouchableOpacity style={styles.primaryAddBtn} activeOpacity={0.85} onPress={handleOpenAddModal}>
            <BoltIcon size={16} color="#ffffff" />
            <Text style={styles.primaryAddBtnText}>ADD YOUR FIRST ADDRESS</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {addresses.map((addr) => (
            <TouchableOpacity
              key={addr._id}
              style={[styles.addressCard, addr.isDefault && styles.addressCardDefault]}
              activeOpacity={onSelectAddress ? 0.7 : 1}
              onPress={() => onSelectAddress && onSelectAddress(addr)}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeIcon}>{getAddressTypeIcon(addr.addressType)}</Text>
                  <Text style={styles.typeText}>{(addr.addressType || 'site').toUpperCase()}</Text>
                </View>

                {addr.isDefault ? (
                  <View style={styles.defaultBadge}>
                    <CheckCircleIcon size={12} color="#16a34a" />
                    <Text style={styles.defaultBadgeText}>DEFAULT SITE</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.setDefaultBtn}
                    onPress={() => handleSetDefault(addr._id)}
                    disabled={actionLoadingId === addr._id}
                  >
                    <Text style={styles.setDefaultText}>Set as Default</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Recipient Details */}
              <Text style={styles.recipientName}>{addr.fullName}</Text>
              <Text style={styles.recipientPhone}>📞 {addr.phone}</Text>

              {/* Address Details */}
              <Text style={styles.streetText}>{addr.street}</Text>
              {!!addr.landmark && (
                <Text style={styles.landmarkText}>Landmark: {addr.landmark}</Text>
              )}
              <Text style={styles.cityStateText}>
                {addr.city}, {addr.state} - {addr.postalCode || addr.pincode}
              </Text>

              {/* GPS Coordinates Tag */}
              {(addr.coordinates?.latitude || addr.location?.coordinates) && (
                <View style={styles.cardGpsBadge}>
                  <Text style={styles.cardGpsBadgeText}>
                    📍 GPS Pinned: {(addr.coordinates?.latitude ?? addr.location?.coordinates[1]).toFixed(4)}°, {(addr.coordinates?.longitude ?? addr.location?.coordinates[0]).toFixed(4)}°
                  </Text>
                </View>
              )}

              {/* Bottom Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.7}
                  onPress={() => handleOpenEditModal(addr)}
                >
                  <Text style={styles.actionBtnText}>✏️ Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: '#fee2e2' }]}
                  activeOpacity={0.7}
                  onPress={() => handleDeleteAddress(addr)}
                  disabled={actionLoadingId === addr._id}
                >
                  {actionLoadingId === addr._id ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>🗑️ Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* ADD / EDIT MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>VOLTLINE ADDRESS BOOK</Text>
                <Text style={styles.modalTitle}>
                  {editingAddressId ? 'Edit Delivery Address' : 'Add New Site Address'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <CloseIcon size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {!!modalError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{modalError}</Text>
                </View>
              )}

              {/* GPS Auto-Detect Location Button */}
              <View style={styles.gpsContainer}>
                <TouchableOpacity
                  style={[styles.gpsDetectBtn, locating && styles.gpsDetectBtnLoading]}
                  activeOpacity={0.8}
                  onPress={handleDetectCurrentLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <View style={styles.gpsBtnRow}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.gpsDetectBtnText}>DETECTING GPS SITE LOCATION...</Text>
                    </View>
                  ) : (
                    <View style={styles.gpsBtnRow}>
                      <Text style={{ fontSize: 15 }}>📍</Text>
                      <Text style={styles.gpsDetectBtnText}>USE CURRENT GPS SITE LOCATION</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* GPS Coordinates Feedback Badge */}
                {!!locationSuccessMsg && (
                  <View style={styles.gpsSuccessPill}>
                    <CheckCircleIcon size={14} color="#16a34a" />
                    <Text style={styles.gpsSuccessText} numberOfLines={2}>
                      {locationSuccessMsg}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setCoordinates(null);
                        setLocationSuccessMsg('');
                      }}
                      style={styles.clearGpsBtn}
                    >
                      <Text style={styles.clearGpsText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Address Type Selector */}
              <Text style={styles.inputLabel}>Location Type</Text>
              <View style={styles.typeSelectorRow}>
                {['site', 'work', 'home', 'warehouse'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeOption, addressType === t && styles.typeOptionActive]}
                    onPress={() => setAddressType(t)}
                  >
                    <Text style={styles.typeOptionIcon}>{getAddressTypeIcon(t)}</Text>
                    <Text
                      style={[
                        styles.typeOptionText,
                        addressType === t && styles.typeOptionTextActive,
                      ]}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Inputs with real-time field error indicators */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recipient / Site Supervisor Name *</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    fieldErrors.fullName && styles.inputFieldError,
                  ]}
                  placeholder="e.g. Rahul Sen"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    if (fieldErrors.fullName) {
                      setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                    }
                  }}
                />
                {!!fieldErrors.fullName && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.fullName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone (10 digits) *</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    fieldErrors.phone && styles.inputFieldError,
                  ]}
                  placeholder="e.g. 9830112233"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (fieldErrors.phone) {
                      setFieldErrors((prev) => ({ ...prev, phone: '' }));
                    }
                  }}
                />
                {!!fieldErrors.phone && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.phone}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Alternate Mobile (Optional)</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    fieldErrors.alternatePhone && styles.inputFieldError,
                  ]}
                  placeholder="e.g. 9830998877"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={alternatePhone}
                  onChangeText={(val) => {
                    setAlternatePhone(val);
                    if (fieldErrors.alternatePhone) {
                      setFieldErrors((prev) => ({ ...prev, alternatePhone: '' }));
                    }
                  }}
                />
                {!!fieldErrors.alternatePhone && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.alternatePhone}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Plot / Building / Street Address (min 5 chars) *</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    { height: 56 },
                    fieldErrors.street && styles.inputFieldError,
                  ]}
                  placeholder="e.g. Plot 42, Sector 5, Salt Lake"
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={street}
                  onChangeText={(val) => {
                    setStreet(val);
                    if (fieldErrors.street) {
                      setFieldErrors((prev) => ({ ...prev, street: '' }));
                    }
                  }}
                />
                {!!fieldErrors.street && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.street}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Landmark / Nearby Site Reference</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Near DLF Tower 1"
                  placeholderTextColor="#94a3b8"
                  value={landmark}
                  onChangeText={setLandmark}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TextInput
                    style={[
                      styles.inputField,
                      fieldErrors.city && styles.inputFieldError,
                    ]}
                    placeholder="Kolkata"
                    placeholderTextColor="#94a3b8"
                    value={city}
                    onChangeText={(val) => {
                      setCity(val);
                      if (fieldErrors.city) {
                        setFieldErrors((prev) => ({ ...prev, city: '' }));
                      }
                    }}
                  />
                  {!!fieldErrors.city && (
                    <Text style={styles.fieldErrorText}>{fieldErrors.city}</Text>
                  )}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>PIN Code (6 digits) *</Text>
                  <TextInput
                    style={[
                      styles.inputField,
                      fieldErrors.postalCode && styles.inputFieldError,
                    ]}
                    placeholder="700091"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    maxLength={6}
                    value={postalCode}
                    onChangeText={(val) => {
                      setPostalCode(val);
                      if (fieldErrors.postalCode) {
                        setFieldErrors((prev) => ({ ...prev, postalCode: '' }));
                      }
                    }}
                  />
                  {!!fieldErrors.postalCode && (
                    <Text style={styles.fieldErrorText}>{fieldErrors.postalCode}</Text>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="West Bengal"
                  placeholderTextColor="#94a3b8"
                  value={state}
                  onChangeText={setState}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Site Delivery Instructions (Optional)</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Call security gate prior to delivery"
                  placeholderTextColor="#94a3b8"
                  value={deliveryInstructions}
                  onChangeText={setDeliveryInstructions}
                />
              </View>

              {/* Default toggle */}
              <TouchableOpacity
                style={styles.toggleRow}
                activeOpacity={0.8}
                onPress={() => setIsDefault(!isDefault)}
              >
                <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
                  {isDefault && <CheckCircleIcon size={14} color="#ffffff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Set as Primary Site Address</Text>
                  <Text style={styles.toggleSub}>
                    Use this address by default for upcoming orders & electrical dispatches
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                activeOpacity={0.85}
                onPress={handleSaveAddress}
                disabled={saving}
              >
                {saving ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.saveBtnText}>SAVING ADDRESS...</Text>
                  </View>
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingAddressId ? 'UPDATE ADDRESS' : 'SAVE SITE ADDRESS'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  addBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
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
    paddingHorizontal: 16,
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  primaryAddBtnText: {
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
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  addressCardDefault: {
    borderColor: '#93c5fd',
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeIcon: {
    fontSize: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.4,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  setDefaultBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  setDefaultText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '700',
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  recipientPhone: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  streetText: {
    fontSize: 12,
    color: '#334155',
    marginTop: 6,
    lineHeight: 18,
  },
  landmarkText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2,
  },
  cityStateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
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
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 16,
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
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '600',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  typeOptionIcon: {
    fontSize: 12,
  },
  typeOptionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  typeOptionTextActive: {
    color: '#2563eb',
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6,
    marginBottom: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // GPS Location Elements
  cardGpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 2,
  },
  cardGpsBadgeText: {
    fontSize: 10,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  gpsContainer: {
    marginBottom: 14,
  },
  gpsDetectBtn: {
    backgroundColor: '#1e3a8a',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  gpsDetectBtnLoading: {
    backgroundColor: '#3b82f6',
  },
  gpsBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsDetectBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  gpsSuccessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    gap: 6,
  },
  gpsSuccessText: {
    flex: 1,
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
  },
  clearGpsBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearGpsText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  // Input Error Styling
  inputFieldError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  fieldErrorText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    marginLeft: 2,
  },
});
