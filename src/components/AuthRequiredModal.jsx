import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';

export default function AuthRequiredModal({
  visible,
  onClose,
  navigation,
  onLogin,
  onSignUp,
}) {
  const handleLogin = () => {
    onClose?.();
    if (onLogin) {
      onLogin();
    } else if (navigation?.navigate) {
      navigation.navigate('Login');
    }
  };

  const handleSignUp = () => {
    onClose?.();
    if (onSignUp) {
      onSignUp();
    } else if (navigation?.navigate) {
      navigation.navigate('SignUp');
    }
  };

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.authModalCard}>
          <View style={styles.modalBadge}>
            <Text style={styles.modalBadgeIcon}>🔒</Text>
          </View>

          <Text style={styles.modalTitle}>Login Required</Text>

          <Text style={styles.modalSubtitle}>
            You can explore all electrical products and services freely. Please
            log in or create an account to add items to your cart and place orders.
          </Text>

          <TouchableOpacity
            style={styles.modalLoginButton}
            activeOpacity={0.8}
            onPress={handleLogin}
          >
            <Text style={styles.modalLoginButtonText}>
              LOG IN TO CONSOLE →
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalSignupButton}
            activeOpacity={0.8}
            onPress={handleSignUp}
          >
            <Text style={styles.modalSignupButtonText}>
              Create New Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalDismissButton}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <Text style={styles.modalDismissButtonText}>
              Continue Browsing (View Only)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  authModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 12,
  },
  modalBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalBadgeIcon: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },
  modalLoginButton: {
    width: '100%',
    height: 46,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalLoginButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalSignupButton: {
    width: '100%',
    height: 42,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalSignupButtonText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  modalDismissButton: {
    padding: 8,
  },
  modalDismissButtonText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
});
