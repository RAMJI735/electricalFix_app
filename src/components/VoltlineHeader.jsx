import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../hooks';

export default function VoltlineHeader() {
  const { data: settings } = useSettings();
  const storeName = settings?.storeName || settings?.store?.name || 'Voltline';

  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>⚡</Text>
        </View>
        <View style={styles.brandTextContainer}>
          <Text style={styles.brandTitle}>{storeName}</Text>
          <Text style={styles.brandSubtitle}>Electrical Solutions</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 20,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
});
