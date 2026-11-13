import React, { useState, useCallback } from 'react';
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
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeftIcon, CheckCircleIcon, BoltIcon, CloseIcon } from '../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useOrders, useAddresses, useSettings } from '../hooks';

export default function ProfileScreen({
  navigation,
  onBack: propOnBack,
  onNavigateToAuth: propOnNavigateToAuth,
  onNavigateToOrders: propOnNavigateToOrders,
  onNavigateToAddresses: propOnNavigateToAddresses,
}) {
  const onBack = useCallback(() => {
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
  const onNavigateToOrders = propOnNavigateToOrders || (() => navigation?.navigate('Orders'));
  const onNavigateToAddresses = propOnNavigateToAddresses || (() => navigation?.navigate('Addresses'));
  const onNavigateToAuth = propOnNavigateToAuth || ((screen) => navigation?.navigate(screen === 'signup' ? 'SignUp' : 'Login'));
  const { user, isAuthenticated, logout, updateProfile, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic Store & App Settings
  const {
    storeName,
    tagline,
    supportEmail,
    supportPhone,
    whatsappNumber,
    officeAddress,
    city,
    state,
    pincode,
    gstin,
    termsAndConditions,
    privacyPolicy,
    refetch: refetchSettings,
  } = useSettings();

  const { data: orders = [], refetch: refetchOrders } = useOrders({
    enabled: isAuthenticated,
  });
  const { data: addresses = [], refetch: refetchAddresses } = useAddresses({
    enabled: isAuthenticated,
  });

  // Modal States
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showCertificatesModal, setShowCertificatesModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Profile Form States
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [companyInput, setCompanyInput] = useState(user?.companyName || '');
  const [gstinInput, setGstinInput] = useState(user?.gstin || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const openEditProfile = () => {
    setNameInput(user?.name || '');
    setPhoneInput(user?.phone || '');
    setCompanyInput(user?.companyName || '');
    setGstinInput(user?.gstin || '');
    setProfileMsg('');
    setShowEditProfile(true);
  };

  const orderCount = isAuthenticated && Array.isArray(orders) ? orders.length : 0;
  const siteCount = isAuthenticated && Array.isArray(addresses) ? addresses.length : 0;
  const rawSum = isAuthenticated && Array.isArray(orders)
    ? orders.reduce((acc, o) => acc + (o.summary?.grandTotal || 0), 0)
    : 0;
  const totalSpent =
    rawSum >= 1000 ? (rawSum / 1000).toFixed(1) + 'k' : rawSum.toString();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.race([
        Promise.allSettled([
          isAuthenticated ? refetchOrders() : Promise.resolve(),
          isAuthenticated ? refetchAddresses() : Promise.resolve(),
          refetchSettings(),
          isAuthenticated && refreshProfile ? refreshProfile() : Promise.resolve(),
        ]),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch (_e) {
      // Non-fatal
    } finally {
      setRefreshing(false);
    }
  };

  const displayName = user?.name || (isAuthenticated ? 'Electrical Contractor' : 'Guest Contractor');
  const displayEmail = user?.email || (isAuthenticated ? 'contractor@voltline.in' : 'Not signed in');
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    if (onNavigateToAuth) {
      onNavigateToAuth('login');
    }
  };

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) {
      setProfileMsg('Please enter your name');
      return;
    }
    setUpdatingProfile(true);
    setProfileMsg('');
    try {
      if (updateProfile) {
        await updateProfile({
          name: nameInput.trim(),
          phone: phoneInput.trim(),
          companyName: companyInput.trim(),
          gstin: gstinInput.trim().toUpperCase(),
        });
      }
      setShowEditProfile(false);
      if (Platform.OS === 'web') {
        window.alert('Profile updated successfully!');
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (err) {
      setProfileMsg(err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={onBack}
          >
            <ArrowLeftIcon size={18} color="#0f172a" />
          </TouchableOpacity>
          <View>
            <Text style={styles.eyebrow}>CLIENT DASHBOARD</Text>
            <Text style={styles.title}>Account & Services</Text>
          </View>
        </View>
      </View>

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials || 'VL'}</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{displayName}</Text>
            <CheckCircleIcon size={16} color="#2563eb" />
          </View>
          <Text style={styles.userEmail}>{displayEmail}</Text>
          {!!user?.phone && (
            <Text style={styles.userPhone}>📞 {user.phone}</Text>
          )}
          {!!user?.companyName && (
            <Text style={styles.userCompany}>🏢 {user.companyName}</Text>
          )}

          <View style={styles.badgeActionsRow}>
            <View style={styles.tierBadge}>
              <BoltIcon size={12} color="#f59e0b" />
              <Text style={styles.tierText}>
                {!isAuthenticated
                  ? 'GUEST VISITOR'
                  : user?.role === 'admin'
                  ? 'SYSTEM ADMINISTRATOR'
                  : 'TIER 1 CERTIFIED BUYER'}
              </Text>
            </View>

            {isAuthenticated && (
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={openEditProfile}
              >
                <Text style={styles.editProfileBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{orderCount}</Text>
          <Text style={styles.statLabel}>Orders Placed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>₹{totalSpent}</Text>
          <Text style={styles.statLabel}>Total Supplies</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{siteCount}</Text>
          <Text style={styles.statLabel}>Active Sites</Text>
        </View>
      </View>

      {/* Account Settings / Actions */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account & Services</Text>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => onNavigateToOrders && onNavigateToOrders()}
        >
          <Text style={styles.menuIcon}>📦</Text>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>Order History & GST Invoices</Text>
            <Text style={styles.menuSub}>
              Track dispatches, delivery progress & download GST invoices
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => onNavigateToAddresses && onNavigateToAddresses()}
        >
          <Text style={styles.menuIcon}>📍</Text>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>Delivery Addresses</Text>
            <Text style={styles.menuSub}>
              Project sites, warehouses, office delivery addresses
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setShowCertificatesModal(true)}
        >
          <Text style={styles.menuIcon}>⚡</Text>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>Warranty & Product Certificates</Text>
            <Text style={styles.menuSub}>
              Verify Havells, Polycab & Schneider ISI certificates
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setShowSupportModal(true)}
        >
          <Text style={styles.menuIcon}>📞</Text>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>Store Details & Support Hotline</Text>
            <Text style={styles.menuSub}>
              Warehouse contact, WhatsApp support, GSTIN details
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setShowTermsModal(true)}
        >
          <Text style={styles.menuIcon}>📜</Text>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>Terms & Conditions</Text>
            <Text style={styles.menuSub}>
              Quality guarantees, returns, warranties & contractor terms
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setShowPrivacyModal(true)}
        >
          <Text style={styles.menuIcon}>🔒</Text>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>Privacy Policy</Text>
            <Text style={styles.menuSub}>
              Data protection, zero card storage & privacy rights
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Auth Switcher */}
      <View style={styles.authCard}>
        <Text style={styles.authTitle}>
          {isAuthenticated ? 'Session & Security' : 'Sign In to Your Account'}
        </Text>
        <Text style={styles.authSub}>
          {isAuthenticated
            ? `Logged in as ${displayEmail}`
            : 'Access your order history and wholesale contractor pricing.'}
        </Text>

        {isAuthenticated ? (
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Text style={styles.logoutBtnText}>LOG OUT OF CONSOLE</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.authButtons}>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => onNavigateToAuth && onNavigateToAuth('login')}
            >
              <Text style={styles.loginBtnText}>Go to Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => onNavigateToAuth && onNavigateToAuth('signup')}
            >
              <Text style={styles.signupBtnText}>Register New</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 90 }} />

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Contractor Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <CloseIcon size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="e.g. Rajesh Sharma"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Mobile Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="e.g. 9876543210"
                  keyboardType="phone-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Company / Electrical Firm</Text>
                <TextInput
                  style={styles.textInput}
                  value={companyInput}
                  onChangeText={setCompanyInput}
                  placeholder="e.g. Apex Power & Electricals"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>GSTIN (Tax Identification)</Text>
                <TextInput
                  style={styles.textInput}
                  value={gstinInput}
                  onChangeText={(val) => setGstinInput(val.toUpperCase())}
                  placeholder="e.g. 19AAACV1234F1Z5"
                  autoCapitalize="characters"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {!!profileMsg && (
                <Text style={styles.errorText}>{profileMsg}</Text>
              )}

              <TouchableOpacity
                style={styles.saveProfileBtn}
                onPress={handleSaveProfile}
                disabled={updatingProfile}
              >
                {updatingProfile ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveProfileBtnText}>SAVE CHANGES</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* STORE & SUPPORT HOTLINE MODAL */}
      <Modal
        visible={showSupportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Store & Support Details</Text>
              <TouchableOpacity onPress={() => setShowSupportModal(false)}>
                <CloseIcon size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ gap: 14 }}>
              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>STORE NAME</Text>
                <Text style={styles.supportValue}>{storeName}</Text>
                <Text style={styles.supportSub}>{tagline}</Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>CUSTOMER SUPPORT PHONE</Text>
                <Text style={styles.supportValue}>{supportPhone}</Text>
                <Text style={styles.supportSub}>Mon - Sat: 9:00 AM - 8:00 PM</Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>WHATSAPP HOTLINE</Text>
                <Text style={styles.supportValue}>{whatsappNumber}</Text>
                <Text style={styles.supportSub}>Direct contractor bulk inquiries</Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>OFFICIAL EMAIL</Text>
                <Text style={styles.supportValue}>{supportEmail}</Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>CENTRAL WAREHOUSE & DISPATCH</Text>
                <Text style={styles.supportValue}>
                  {officeAddress}, {city}, {state} - {pincode}
                </Text>
                <Text style={styles.supportSub}>Official GSTIN: {gstin}</Text>
              </View>

              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => setShowSupportModal(false)}
              >
                <Text style={styles.dismissBtnText}>CLOSE</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* WARRANTY & CERTIFICATES MODAL */}
      <Modal
        visible={showCertificatesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCertificatesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quality Standards & ISI Certs</Text>
              <TouchableOpacity onPress={() => setShowCertificatesModal(false)}>
                <CloseIcon size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.certItem}>
                <View style={styles.certIconWrap}>
                  <Text style={styles.certEmoji}>🛡️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certTitle}>IS:694 Heavy Copper Cables</Text>
                  <Text style={styles.certDesc}>
                    All wires sold by Voltline adhere to Bureau of Indian Standards (BIS) IS:694 for flame retardant low smoke (FR-LSH) specifications.
                  </Text>
                </View>
              </View>

              <View style={styles.certItem}>
                <View style={styles.certIconWrap}>
                  <Text style={styles.certEmoji}>⚡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certTitle}>IS/IEC 60898-1 Circuit Breakers</Text>
                  <Text style={styles.certDesc}>
                    Legrand and Schneider MCBs carry certified 10kA short circuit break ratings with thermal-magnetic trip curves.
                  </Text>
                </View>
              </View>

              <View style={styles.certItem}>
                <View style={styles.certIconWrap}>
                  <Text style={styles.certEmoji}>🔘</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certTitle}>IS:3854 Switches & Sockets</Text>
                  <Text style={styles.certDesc}>
                    Tested for 100,000 continuous switching operations with pure silver inlay contacts to prevent spark pitting.
                  </Text>
                </View>
              </View>

              <View style={styles.certItem}>
                <View style={styles.certIconWrap}>
                  <Text style={styles.certEmoji}>📋</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certTitle}>How to Claim Manufacturer Warranty</Text>
                  <Text style={styles.certDesc}>
                    Your Voltline Tax Invoice serves as valid proof of purchase for all brand service centers nationwide. Contact support hotline for direct onsite technician inspection.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => setShowCertificatesModal(false)}
              >
                <Text style={styles.dismissBtnText}>GOT IT</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* TERMS & CONDITIONS MODAL */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {termsAndConditions?.title || 'Terms & Conditions'}
                </Text>
                <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                  Official Platform & Contractor Terms
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <CloseIcon size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>100% GENUINE & ISI CERTIFIED</Text>
                <Text style={styles.supportSub}>
                  All cables, modular fittings, and switchgears are brand new, ISI/BIS compliant, and direct from authorized manufacturers.
                </Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>GST & INVOICING</Text>
                <Text style={styles.supportSub}>
                  Every order includes a full GST tax invoice (GSTIN: {gstin}). Input tax credit is available for registered contractor accounts.
                </Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>SITE DELIVERY & OFFLOADING</Text>
                <Text style={styles.supportSub}>
                  Material dispatches are delivered to specified job sites. Customers must ensure vehicle access and verify package seals upon arrival.
                </Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>INSTALLATION SERVICES</Text>
                <Text style={styles.supportSub}>
                  Technician services are performed by certified electricians. Customers must provide access to power isolation boards during installation.
                </Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>7-DAY RETURNS & EXCEPTIONS</Text>
                <Text style={styles.supportSub}>
                  Standard unopened items are returnable within 7 days. Custom cut-to-order cables and modified switchboards are non-returnable.
                </Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>CONTACT & JURISDICTION</Text>
                <Text style={styles.supportSub}>
                  Operating entity: {storeName}. Email: {supportEmail}. Helpline: {supportPhone}. Governed by the laws of India.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={styles.dismissBtnText}>I UNDERSTAND</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PRIVACY POLICY MODAL */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {privacyPolicy?.title || 'Privacy Policy'}
                </Text>
                <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                  Data Protection & Financial Security
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <CloseIcon size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>INFORMATION WE COLLECT</Text>
                <Text style={styles.supportSub}>
                  We collect your name, phone, delivery address, optional GPS site coordinates, and GSTIN strictly for order delivery and tax invoices.
                </Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>ZERO CARD STORAGE</Text>
                <Text style={styles.supportSub}>
                  Voltline never stores debit/credit cards or UPI PINs. Online payments are processed through PCI-DSS bank-grade encrypted payment gateways.
                </Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>NO THIRD-PARTY SALE</Text>
                <Text style={styles.supportSub}>
                  Your contact details are never sold or rented. Data is shared exclusively with logistics drivers and assigned technicians to fulfill your order.
                </Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>DATA ENCRYPTION</Text>
                <Text style={styles.supportSub}>
                  All communication between the app and server is protected by SSL/TLS 1.3 encryption. Auth tokens are stored securely in local device storage.
                </Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>YOUR RIGHTS & DELETION</Text>
                <Text style={styles.supportSub}>
                  You may update your profile or request account and data removal anytime by contacting our privacy officer at {supportEmail}.
                </Text>
              </View>

              <View style={styles.supportCard}>
                <Text style={styles.supportLabel}>OFFICIAL CONTACT</Text>
                <Text style={styles.supportSub}>
                  {storeName}, {officeAddress}, {city}, {state} - {pincode}. Support: {supportPhone}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => setShowPrivacyModal(false)}
              >
                <Text style={styles.dismissBtnText}>GOT IT</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  userPhone: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  userCompany: {
    fontSize: 11,
    color: '#2563eb',
    marginTop: 2,
    fontWeight: '600',
  },
  badgeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  editProfileBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  editProfileBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '700',
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  authSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 12,
  },
  logoutBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  loginBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  signupBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  signupBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  formGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  textInput: {
    height: 42,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0f172a',
  },
  saveProfileBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  saveProfileBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  supportCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  supportLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  supportValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  supportSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  dismissBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  dismissBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  certItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  certIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  certEmoji: {
    fontSize: 18,
  },
  certTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  certDesc: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 15,
  },
});
