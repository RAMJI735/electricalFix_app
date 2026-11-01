import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from './lib/queryClient';
import { GluestackUIProvider } from './components/ui/gluestack-ui-provider';
import '../global.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

export default function RootLayout({ children, mode = 'light', style }) {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days persistent storage
          buster: 'v2.0.0',
        }}
      >
        <AuthProvider>
          <CartProvider>
            <GluestackUIProvider mode={mode}>
              <View style={[styles.rootContainer, style]}>
                {children}
              </View>
            </GluestackUIProvider>
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
