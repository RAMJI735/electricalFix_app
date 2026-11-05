import React, { useState } from 'react';
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

export default function LoginScreen({
  navigation,
  onNavigateToSignUp: propOnNavigateToSignUp,
  onSkipToHome: propOnSkipToHome,
}) {
  const onNavigateToSignUp = propOnNavigateToSignUp || (() => navigation?.navigate('SignUp'));
  const onSkipToHome = propOnSkipToHome || (() => navigation?.navigate('MainTabs'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    setLocalError('');
    if (!email.trim()) {
      setLocalError('Please enter your email address');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      if (onSkipToHome) {
        onSkipToHome();
      }
    } catch (err) {
      setLocalError(err.message || 'Login failed. Please check your credentials.');
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
          {/* Top Back Nav & Brand Header */}
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
              <VoltlineHeader mode="login" />
            </View>
          </View>

          {/* Screen Title Section */}
          <View style={styles.headerSection}>
            <Text style={styles.eyebrow}>AUTHORIZED ACCESS</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to manage service requests, orders, and device support.
            </Text>
          </View>

          {/* Error Banner */}
          {!!localError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{localError}</Text>
            </View>
          )}

          {/* Main Login Card */}
          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email address</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="you@company.com"
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

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
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

            <TouchableOpacity style={styles.forgotPasswordContainer} activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>LOG IN TO CONSOLE  →</Text>
              )}
            </TouchableOpacity>

            {onSkipToHome && (
              <TouchableOpacity
                style={styles.returnButton}
                activeOpacity={0.7}
                onPress={onSkipToHome}
              >
                <Text style={styles.returnButtonText}>
                  ← Return to Catalog (View Only)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Switch to Sign Up Card */}
          <View style={styles.bottomCard}>
            <Text style={styles.bottomCardMuted}>New to Voltline? </Text>
            <TouchableOpacity onPress={onNavigateToSignUp} activeOpacity={0.7}>
              <Text style={styles.bottomCardLink}>Create a secure account</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Assurance */}
          <View style={styles.footer}>
            <Text style={styles.footerIcon}>🛡️</Text>
            <Text style={styles.footerText}>
              Encrypted session • Trusted electrical commerce network
            </Text>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerSection: {
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eef2f6',
    marginBottom: 18,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    color: '#0f172a',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#1d64f2',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  returnButton: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  returnButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  bottomCard: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#eef2f6',
    marginBottom: 20,
  },
  bottomCardMuted: {
    fontSize: 13,
    color: '#64748b',
  },
  bottomCardLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d64f2',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 24,
  },
  footerIcon: {
    fontSize: 14,
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
