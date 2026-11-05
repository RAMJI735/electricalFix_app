import React, { useEffect } from 'react';
import { StyleSheet, View, Appearance, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from './lib/queryClient';
import '../global.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

export default function RootLayout({ children, mode = 'light', style }) {
  useEffect(() => {
    // Set color scheme only when the API is available
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(mode);
    }
  }, [mode]);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: 1000 * 60 * 60 * 24 * 7,
          buster: 'v2.0.0',
        }}
      >
        <AuthProvider>
          <CartProvider>
            <View style={[styles.rootContainer, style]}>
              {children}
            </View>
          </CartProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});