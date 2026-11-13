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
import { ArrowLeftIcon } from '../components/Icons';

export default function ForgotPasswordScreen({
  navigation,
  onNavigateToLogin: propOnNavigateToLogin,
}) {
  const onNavigateToLogin = propOnNavigateToLogin || (() => navigation?.navigate('Login'));

  // Step 1: 'request_otp', Step 2: 'reset_form', Step 3: 'success'
  const [step, setStep] = useState('request_otp');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  const { sendResetPasswordOtp, resetPassword } = useAuth();

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleSendOtp = async (isResend = false) => {
    setLocalError('');
    setSuccessMessage('');

    const trimmedEmail = email.trim();
    const pattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    if (!trimmedEmail || !pattern.test(trimmedEmail)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (isResend) {
      setResending(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await sendResetPasswordOtp(trimmedEmail);
      setSuccessMessage(response?.message || 'Verification code sent to your email.');
      setCountdown(60);
      setStep('reset_form');
    } catch (err) {
      setLocalError(err.message || 'Failed to send reset code. Please verify your email.');
    } finally {
      setLoading(false);
      setResending(false);
    }
  };

  const handleResetPassword = async () => {
    setLocalError('');
    setSuccessMessage('');

    const trimmedEmail = email.trim();
    const trimmedOtp = otp.trim();

    if (!trimmedOtp || trimmedOtp.length < 5) {
      setLocalError('Please enter the valid OTP sent to your email');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setLocalError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match. Please check and re-enter.');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({
        email: trimmedEmail,
        otp: trimmedOtp,
        password: newPassword,
      });

      setSuccessMessage(response?.message || 'Password reset successfully.');
      setStep('success');
    } catch (err) {
      setLocalError(err.message || 'Failed to reset password. Please check your OTP.');
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
          {/* Header */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => {
                if (navigation?.canGoBack && navigation.canGoBack()) {
                  navigation.goBack();
                } else if (onNavigateToLogin) {
                  onNavigateToLogin();
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
            <Text style={styles.title}>
              {step === 'success'
                ? 'Password Reset!'
                : step === 'reset_form'
                ? 'Create New Password'
                : 'Forgot Password?'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'success'
                ? 'Your password has been updated securely. You can now log in.'
                : step === 'reset_form'
                ? `Enter the OTP sent to ${email} and choose your new password.`
                : 'Enter your registered email address and we will send you a verification code.'}
            </Text>
          </View>

          {/* Error Banner */}
          {!!localError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{localError}</Text>
            </View>
          )}

          {/* Success Banner */}
          {!!successMessage && step !== 'success' && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* STEP 1: Enter Email to Request OTP */}
          {step === 'request_otp' && (
            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (localError) setLocalError('');
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                activeOpacity={0.85}
                onPress={() => handleSendOtp(false)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send Reset Code</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 'reset_form' && (
            <View style={styles.card}>
              {/* Target Email badge */}
              <View style={styles.emailBadgeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emailBadgeLabel}>Sent code to</Text>
                  <Text style={styles.emailBadgeValue} numberOfLines={1}>{email}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setStep('request_otp');
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setLocalError('');
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.changeEmailLink}>Change</Text>
                </TouchableOpacity>
              </View>

              {/* OTP Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Verification Code (OTP)</Text>
                  {countdown > 0 ? (
                    <Text style={styles.countdownText}>Resend in {countdown}s</Text>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSendOtp(true)}
                      disabled={resending}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {resending ? (
                        <ActivityIndicator size="small" color="#2563eb" />
                      ) : (
                        <Text style={styles.resendCodeLink}>Resend OTP</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#94a3b8"
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text);
                      if (localError) setLocalError('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              {/* New Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#94a3b8"
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      if (localError) setLocalError('');
                    }}
                    secureTextEntry
                  />
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#94a3b8"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (localError) setLocalError('');
                    }}
                    secureTextEntry
                  />
                </View>
              </View>

              {/* Submit Reset Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                activeOpacity={0.85}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Success Screen */}
          {step === 'success' && (
            <View style={styles.successCard}>
              <View style={styles.successIconCircle}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successTitle}>All Set!</Text>
              <Text style={styles.successDescription}>
                Your password has been reset successfully. You can now use your new password to sign in.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, styles.successButton]}
                activeOpacity={0.85}
                onPress={onNavigateToLogin}
              >
                <Text style={styles.primaryButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Back to Login Link */}
          {step !== 'success' && (
            <View style={styles.switchAuthContainer}>
              <Text style={styles.switchAuthText}>Remember your password? </Text>
              <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
                <Text style={styles.switchAuthLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          )}
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
  card: {
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  countdownText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  resendCodeLink: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
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
  otpInput: {
    letterSpacing: 4,
    fontWeight: '700',
    fontSize: 16,
  },
  emailBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  emailBadgeLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  emailBadgeValue: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '700',
    marginTop: 2,
  },
  changeEmailLink: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
    marginLeft: 8,
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
    marginTop: 4,
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 20,
  },
  successButton: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
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
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#86efac',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 32,
    color: '#16a34a',
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
});

