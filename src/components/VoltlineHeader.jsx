import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function VoltlineHeader({ mode = 'signup' }) {
  const isLogin = mode === 'login';

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>E+</Text>
          </View>
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandTitle}>VOLTLINE</Text>
            <Text style={styles.brandSubtitle}>ELECTRONIC SERVICES</Text>
          </View>
        </View>

        {isLogin ? (
          <View style={styles.systemStatus}>
            <View style={styles.onlineDot} />
            <Text style={styles.systemStatusText}>SYSTEM ONLINE</Text>
          </View>
        ) : (
          <View style={styles.secureBadge}>
            <Text style={styles.secureBadgeText}>SECURE • 256</Text>
          </View>
        )}
      </View>

      {/* Progress / Step indicator */}
      <View style={styles.progressTrack}>
        {isLogin ? (
          <>
            <View style={styles.progressPointActive} />
            <View style={styles.progressPointEnd} />
          </>
        ) : (
          <View style={styles.progressBarActive} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1d64f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.3,
  },
  secureBadge: {
    backgroundColor: '#eff6ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  secureBadgeText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: '700',
  },
  systemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  systemStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f766e',
  },
  progressTrack: {
    height: 2,
    backgroundColor: '#e2e8f0',
    borderRadius: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarActive: {
    width: '35%',
    height: 3,
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  progressPointActive: {
    position: 'absolute',
    left: '25%',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  progressPointEnd: {
    position: 'absolute',
    right: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
});
