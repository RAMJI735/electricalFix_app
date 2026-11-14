import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VoltlineHeader from '../components/VoltlineHeader';
import { useAuth } from '../../context/AuthContext';
import AddressService from '../../services/addressService';
import { ArrowLeftIcon } from '../components/Icons';

export default function SignUpScreen({
  navigation,
  onNavigateToLogin: propOnNavigateToLogin,
  onSkipToHome: propOnSkipToHome,
}) {
  const onNavigateToLogin = propOnNavigateToLogin || (() => navigation?.navigate('Login'));
  const onSkipToHome = propOnSkipToHome || (() => navigation?.navigate('MainTabs'));

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('⚡');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email verification state
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Address fields
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [isDefaultAddress, setIsDefaultAddress] = useState(true);

  const { signup, sendOtp, verifyOtp } = useAuth();

  const AVATAR_OPTIONS = ['⚡', '👷', '🏢', '🔌', '🛠️', '💡'];

  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpCountdown]);

  const handleSendOtp = async () => {
    setLocalError('');
    setOtpSuccessMessage('');
    const trimmedEmail = email.trim();
    const pattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    if (!trimmedEmail || !pattern.test(trimmedEmail)) {
      setLocalError('Please enter a valid email address first');
      return;
    }

    setOtpSending(true);
    try {
      const res = await sendOtp(trimmedEmail);
      setOtpSent(true);
      setOtpCountdown(60);
      setOtpSuccessMessage(res?.message || 'OTP sent successfully to your email');
    } catch (err) {
      setLocalError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLocalError('');
    setOtpSuccessMessage('');
    if (!otp.trim()) {
      setLocalError('Please enter the OTP sent to your email');
      return;
    }

    setOtpVerifying(true);
    try {
      const res = await verifyOtp(email.trim(), otp.trim());
      setIsEmailVerified(true);
      setOtpSuccessMessage(res?.message || 'Email verified successfully! ✓');
    } catch (err) {
      setLocalError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSignUp = async () => {
    setLocalError('');
    if (!fullName.trim() || fullName.trim().length < 2) {
      setLocalError('Please enter your full name');
      return;
    }

    const pattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    if (!pattern.test(email.trim())) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (!isEmailVerified) {
      setLocalError('Please verify your email address to continue.');
      if (!otpSent) {
        handleSendOtp();
      }
      return;
    }

    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await signup({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
      });

      // If user filled in a service address, create it
      if (street.trim() && city.trim()) {
        try {
          const userId = result?.user?._id || result?.user?.id;
          await AddressService.createAddress({
            fullName: fullName.trim(),
            phone: phone.trim() || '9876543210',
            street: street.trim(),
            city: city.trim(),
            state: stateVal.trim() || 'West Bengal',
            postalCode: postalCode.trim() || '700091',
            country: country.trim() || 'India',
            addressType: 'site',
            isDefault: isDefaultAddress,
            userId,
          });
        } catch (addrErr) {
          console.warn('Optional address save notice:', addrErr.message);
        }
      }

      if (onSkipToHome) {
        onSkipToHome();
      }
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => {
                if (navigation?.canGoBack && navigation.canGoBack()) {
                  navigation.goBack();
                } else if (onSkipToHome) {
                  onSkipToHome();
                }
              }}
            >
              <ArrowLeftIcon size={18} color="#0f172a" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <VoltlineHeader />
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Register to book trusted electrician services and order genuine parts.
            </Text>
          </View>

          {/* Error Banner */}
          {!!localError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{localError}</Text>
            </View>
          )}

          {/* Success Banner */}
          {!!otpSuccessMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{otpSuccessMessage}</Text>
            </View>
          )}

          {/* Main Account Details Form */}
          <View style={styles.formCard}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (localError) setLocalError('');
                  }}
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Email Address</Text>
                {isEmailVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                  </View>
                ) : (
                  <Text style={styles.unverifiedBadgeText}>Verification required</Text>
                )}
              </View>
              <View style={[styles.inputContainer, styles.inputRowContainer]}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="name@example.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (isEmailVerified) setIsEmailVerified(false);
                    if (otpSent) setOtpSent(false);
                    if (otp) setOtp('');
                    if (localError) setLocalError('');
                    if (otpSuccessMessage) setOtpSuccessMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isEmailVerified}
                />
                {!isEmailVerified ? (
                  <TouchableOpacity
                    style={[
                      styles.sendOtpBtn,
                      (otpSending || otpCountdown > 0 || !email.trim()) && styles.sendOtpBtnDisabled,
                    ]}
                    onPress={handleSendOtp}
                    disabled={otpSending || otpCountdown > 0 || !email.trim()}
                    activeOpacity={0.7}
                  >
                    {otpSending ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : (
                      <Text
                        style={[
                          styles.sendOtpBtnText,
                          (otpSending || otpCountdown > 0 || !email.trim()) && styles.sendOtpBtnTextDisabled,
                        ]}
                      >
                        {otpSent ? (otpCountdown > 0 ? `${otpCountdown}s` : 'Resend') : 'Send OTP'}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setIsEmailVerified(false);
                      setOtpSent(false);
                      setOtp('');
                      setOtpSuccessMessage('');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.changeEmailText}>Change</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* OTP Input Section */}
            {otpSent && !isEmailVerified && (
              <View style={styles.otpCard}>
                <View style={styles.otpCardHeader}>
                  <Text style={styles.otpCardTitle}>Email Verification Code</Text>
                  <Text style={styles.otpCardSubtitle}>
                    Enter the code sent to {email}
                  </Text>
                </View>
                <View style={styles.otpInputRow}>
                  <View style={[styles.inputContainer, styles.otpInputContainer]}>
                    <TextInput
                      style={styles.otpInput}
                      placeholder="Enter OTP"
                      placeholderTextColor="#94a3b8"
                      value={otp}
                      onChangeText={(text) => {
                        setOtp(text);
                        if (localError) setLocalError('');
                      }}
                      keyboardType="number-pad"
                      maxLength={8}
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.verifyOtpBtn,
                      (otpVerifying || !otp.trim()) && styles.verifyOtpBtnDisabled,
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={otpVerifying || !otp.trim()}
                    activeOpacity={0.8}
                  >
                    {otpVerifying ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.verifyOtpBtnText}>Verify OTP</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {otpCountdown > 0 ? (
                  <Text style={styles.otpTimerText}>
                    Resend code in {otpCountdown}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={otpSending}
                    style={styles.otpResendLink}
                  >
                    <Text style={styles.otpResendLinkText}>{"Didn't receive OTP? Resend"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (localError) setLocalError('');
                  }}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number (Optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#94a3b8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Profile Avatar Selection */}
            <View style={styles.avatarSection}>
              <Text style={styles.label}>Choose Avatar</Text>
              <View style={styles.avatarRow}>
                {AVATAR_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.avatarPill,
                      avatar === item && styles.avatarPillActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setAvatar(item)}
                  >
                    <Text style={styles.avatarEmoji}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Service Address Accordion */}
          <View style={styles.accordionCard}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setIsAddressExpanded(!isAddressExpanded)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.accordionTitle}>Delivery / Site Address</Text>
                <Text style={styles.accordionSubtitle}>
                  {isAddressExpanded
                    ? 'Tap to collapse'
                    : 'Optional • Add your address now or later'}
                </Text>
              </View>
              <Text style={styles.accordionArrow}>
                {isAddressExpanded ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {isAddressExpanded && (
              <View style={styles.accordionBody}>
                {/* Street */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Street Address</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Flat, House no., Building, Apartment"
                      placeholderTextColor="#94a3b8"
                      value={street}
                      onChangeText={setStreet}
                    />
                  </View>
                </View>

                {/* City & State (Row) */}
                <View style={styles.twoColumnRow}>
                  <View style={[styles.fieldGroup, styles.flexHalf]}>
                    <Text style={styles.label}>City</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="City"
                        placeholderTextColor="#94a3b8"
                        value={city}
                        onChangeText={setCity}
                      />
                    </View>
                  </View>

                  <View style={[styles.fieldGroup, styles.flexHalf]}>
                    <Text style={styles.label}>State</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="State"
                        placeholderTextColor="#94a3b8"
                        value={stateVal}
                        onChangeText={setStateVal}
                      />
                    </View>
                  </View>
                </View>

                {/* Postal Code & Country (Row) */}
                <View style={styles.twoColumnRow}>
                  <View style={[styles.fieldGroup, styles.flexHalf]}>
                    <Text style={styles.label}>PIN Code</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 700091"
                        placeholderTextColor="#94a3b8"
                        value={postalCode}
                        onChangeText={setPostalCode}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  <View style={[styles.fieldGroup, styles.flexHalf]}>
                    <Text style={styles.label}>Country</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Country"
                        placeholderTextColor="#94a3b8"
                        value={country}
                        onChangeText={setCountry}
                      />
                    </View>
                  </View>
                </View>

                {/* Default Address Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setIsDefaultAddress(!isDefaultAddress)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isDefaultAddress && styles.checkboxActive,
                    ]}
                  >
                    {isDefaultAddress && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Save as default delivery address
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Terms & Privacy Agreement Notice */}
          <View style={styles.legalNoticeContainer}>
            <Text style={styles.legalNoticeText}>
              By tapping Create Account, you agree to our{' '}
              <Text
                style={styles.legalLink}
                onPress={() => navigation?.navigate?.('Terms')}
              >
                Terms & Conditions
              </Text>{' '}
              and{' '}
              <Text
                style={styles.legalLink}
                onPress={() => navigation?.navigate?.('PrivacyPolicy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            activeOpacity={0.85}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {onSkipToHome && (
            <TouchableOpacity
              style={styles.returnButton}
              activeOpacity={0.7}
              onPress={onSkipToHome}
            >
              <Text style={styles.returnButtonText}>Continue as guest</Text>
            </TouchableOpacity>
          )}

          {/* Switch to Login Link */}
          <View style={styles.switchAuthContainer}>
            <Text style={styles.switchAuthText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
              <Text style={styles.switchAuthLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    marginBottom: 20,
    marginTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  avatarSection: {
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    color: '#0f172a',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  avatarPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarPillActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  accordionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  accordionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  accordionArrow: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 8,
  },
  accordionBody: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexHalf: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#475569',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  returnButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  returnButtonText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  switchAuthContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  switchAuthText: {
    fontSize: 14,
    color: '#64748b',
  },
  switchAuthLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  successBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  verifiedBadgeText: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '700',
  },
  unverifiedBadgeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  inputRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  sendOtpBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginLeft: 8,
  },
  sendOtpBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  sendOtpBtnText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  sendOtpBtnTextDisabled: {
    color: '#94a3b8',
  },
  changeEmailText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  otpCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 16,
  },
  otpCardHeader: {
    marginBottom: 10,
  },
  otpCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  otpCardSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  otpInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  otpInputContainer: {
    flex: 1,
    height: 44,
  },
  otpInput: {
    fontSize: 14,
    color: '#0f172a',
    letterSpacing: 2,
    fontWeight: '600',
  },
  verifyOtpBtn: {
    backgroundColor: '#16a34a',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyOtpBtnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  verifyOtpBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  otpTimerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
  },
  otpResendLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  otpResendLinkText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  legalNoticeContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  legalNoticeText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: '#2563eb',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
