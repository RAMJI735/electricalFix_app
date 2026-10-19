import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import VoltlineHeader from '../components/VoltlineHeader';
import { useAuth } from '../../context/AuthContext';

export default function SignUpScreen({ onNavigateToLogin, onSkipToHome }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();

  const handleSignUp = async () => {
    setLocalError('');
    if (!fullName.trim()) {
      setLocalError('Please enter your full name (at least 2 characters)');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter your email address');
      return;
    }
    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
      });
      if (onSkipToHome) {
        onSkipToHome();
      }
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const [isAddressExpanded, setIsAddressExpanded] = useState(true);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);

  return (
    <View style={styles.container}>
      <VoltlineHeader mode="signup" />

      {/* Screen Title Section */}
      <View style={styles.headerSection}>
        <Text style={styles.eyebrow}>NEW SERVICE ACCOUNT</Text>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Register for repairs, installation tracking, and verified support.
        </Text>
      </View>

      {/* Error Banner */}
      {!!localError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{localError}</Text>
        </View>
      )}

      {/* Main Account Details Form */}
      <View style={styles.formCard}>
        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="2-50 characters"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
          <Text style={styles.helperText}>
            Required • Leading and trailing spaces are removed
          </Text>
        </View>

        {/* Email Address */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email address</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="you@company.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.helperText}>
            Required • Valid email • Stored in lowercase
          </Text>
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          <Text style={styles.helperText}>Required • Minimum 6 characters</Text>
        </View>

        {/* Phone */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.optionalBadge}>OPTIONAL</Text>
          </View>
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

        {/* Profile Avatar */}
        <View style={styles.fieldGroupLast}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Profile avatar</Text>
            <Text style={styles.optionalBadge}>OPTIONAL</Text>
          </View>
          <TouchableOpacity style={styles.avatarButton} activeOpacity={0.7}>
            <Text style={styles.uploadIcon}>☁️</Text>
            <Text style={styles.avatarButtonText}>Choose image</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Service Address Accordion */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => setIsAddressExpanded(!isAddressExpanded)}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.accordionTitle}>Service address</Text>
            <Text style={styles.accordionSubtitle}>
              {isAddressExpanded ? 'OPTIONAL • expanded' : 'OPTIONAL • collapsed'}
            </Text>
          </View>
          <Text style={styles.accordionChevron}>
            {isAddressExpanded ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {isAddressExpanded && (
          <View style={styles.accordionContent}>
            {/* Street */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Street</Text>
                <Text style={styles.optionalBadge}>OPTIONAL</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Building and street"
                  placeholderTextColor="#94a3b8"
                  value={street}
                  onChangeText={setStreet}
                />
              </View>
            </View>

            {/* City & State (Row) */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldGroup, styles.flexHalf]}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>City</Text>
                  <Text style={styles.optionalBadgeSmall}>OPTIONAL</Text>
                </View>
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
                <View style={styles.labelRow}>
                  <Text style={styles.label}>State</Text>
                  <Text style={styles.optionalBadgeSmall}>OPTIONAL</Text>
                </View>
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
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Postal code</Text>
                  <Text style={styles.optionalBadgeSmall}>OPTIONAL</Text>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="000000"
                    placeholderTextColor="#94a3b8"
                    value={postalCode}
                    onChangeText={setPostalCode}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={[styles.fieldGroup, styles.flexHalf]}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Country</Text>
                </View>
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
                Use as my default service address
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
          <Text style={styles.primaryButtonText}>CREATE SECURE ACCOUNT  →</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={{ alignItems: 'center', marginTop: 12 }}
        onPress={onSkipToHome}
      >
        <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: '600' }}>
          Continue as Guest to Store →
        </Text>
      </TouchableOpacity>

      {/* Switch to Login Link */}
      <View style={styles.switchAuthContainer}>
        <Text style={styles.switchAuthText}>Already registered? </Text>
        <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
          <Text style={styles.switchAuthLink}>Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 24,
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
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eef2f6',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldGroupLast: {
    marginBottom: 4,
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
    color: '#1e293b',
  },
  optionalBadge: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  optionalBadgeSmall: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
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
  helperText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  avatarButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadIcon: {
    fontSize: 14,
  },
  avatarButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  accordionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eef2f6',
    marginBottom: 20,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  accordionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  accordionChevron: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 14,
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
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxActive: {
    backgroundColor: '#1d64f2',
    borderColor: '#1d64f2',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#475569',
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
  primaryButton: {
    backgroundColor: '#1d64f2',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
  switchAuthContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  switchAuthText: {
    fontSize: 13,
    color: '#64748b',
  },
  switchAuthLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d64f2',
  },
});
