import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GluestackUIProvider } from './components/ui/gluestack-ui-provider';
import '../global.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

export default function RootLayout({ children, mode = 'light', style }) {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <GluestackUIProvider mode={mode}>
            <View style={[styles.rootContainer, style]}>
              {children}
            </View>
          </GluestackUIProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
