import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RootLayout from './layout';
import TabsLayout from './(tabs)/layout';
import ServiceDetailPage from './screens/serviceDetailPage';
import OrderDetailPage from './screens/OrderDetailPage';
import OrdersScreen from './screens/OrdersScreen';
import AddressScreen from './screens/AddressScreen';
import LoginScreen from './(auth)/LoginScreen';
import SignUpScreen from './(auth)/SignUpScreen';
import ForgotPasswordScreen from './(auth)/ForgotPasswordScreen';
import LegalScreen from './screens/LegalScreen';
import ErrorBoundary from './components/ErrorBoundary';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: '',
          Shop: 'shop',
          Cart: 'cart',
          Profile: 'profile',
        },
      },
      ServiceDetail: 'service/:serviceId',
      OrderDetail: 'order/:orderId',
      Orders: 'orders',
      Addresses: 'addresses',
      Login: 'login',
      SignUp: 'signup',
      ForgotPassword: 'forgot-password',
      Legal: 'legal',
      Terms: 'terms',
      PrivacyPolicy: 'privacy-policy',
    },
  },
};

export default function App() {
  useEffect(() => {
    // Prevent unhandled errors from abruptly terminating the mobile Activity
    if (global.ErrorUtils) {
      const originalHandler = global.ErrorUtils.getGlobalHandler();
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error('[Global App Error Handler]', error, 'isFatal:', isFatal);
        if (!__DEV__ && originalHandler) {
          try {
            originalHandler(error, false);
          } catch (_e) {}
        }
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <RootLayout>
        <NavigationContainer linking={linking}>
          <Stack.Navigator
            initialRouteName="MainTabs"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="MainTabs" component={TabsLayout} />
            <Stack.Screen name="ServiceDetail" component={ServiceDetailPage} />
            <Stack.Screen name="OrderDetail" component={OrderDetailPage} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="Addresses" component={AddressScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Legal" component={LegalScreen} />
            <Stack.Screen name="Terms" component={LegalScreen} initialParams={{ type: 'terms' }} />
            <Stack.Screen name="PrivacyPolicy" component={LegalScreen} initialParams={{ type: 'privacy' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </RootLayout>
    </ErrorBoundary>
  );
}
