import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { CheckCircleIcon, BoltIcon } from '../components/Icons';
import { useAuth } from '../../context/AuthContext';
import OrderService from '../../services/orderService';
import AddressService from '../../services/addressService';

export default function ProfileScreen({ onNavigateToAuth, onNavigateToOrders, onNavigateToAddresses }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState('0');
  const [siteCount, setSiteCount] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const [orders, addresses] = await Promise.all([
        OrderService.getOrders().catch(() => []),
        AddressService.getAddresses().catch(() => []),
      ]);

      if (Array.isArray(orders)) {
        setOrderCount(orders.length);
        const sum = orders.reduce((acc, o) => acc + (o.summary?.grandTotal || 0), 0);
        if (sum >= 1000) {
          setTotalSpent((sum / 1000).toFixed(1) + 'k');
        } else {
          setTotalSpent(sum.toString());
        }
      }

      if (Array.isArray(addresses)) {
        setSiteCount(addresses.length);
      }
    } catch (err) {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const displayName = user?.name || 'Electrical Contractor';
  const displayEmail = user?.email || 'contractor@voltline.in';
  const displayPhone = user?.phone || '+91 98765 43210';
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
        <Text style={styles.eyebrow}>CLIENT DASHBOARD</Text>
        <Text style={styles.title}>Account & Services</Text>
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
          <View style={styles.tierBadge}>
            <BoltIcon size={12} color="#f59e0b" />
            <Text style={styles.tierText}>
              {user?.role === 'admin'
                ? 'SYSTEM ADMINISTRATOR'
                : 'TIER 1 CERTIFIED BUYER'}
            </Text>
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
        <Text style={styles.sectionTitle}>Account & Orders</Text>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => onNavigateToOrders && onNavigateToOrders()}
        >
          <Text style={styles.menuIcon}>📦</Text>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>Order History & GST Invoices</Text>
            <Text style={styles.menuSub}>Track active dispatches & download tax invoices</Text>
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
            <Text style={styles.menuSub}>Project sites, warehouses, office addresses</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>⚡</Text>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>Warranty & Product Certificates</Text>
            <Text style={styles.menuSub}>Verify Havells, Polycab & Schneider ISI certificates</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
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
    borderRadius: 14,
    padding: 16,
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
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 4,
    marginTop: 4,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '600',
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  authTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  authSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  loginBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  signupBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  signupBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  logoutBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
});
