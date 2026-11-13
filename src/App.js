import React from 'react';
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
    },
  },
};

export default function App() {
  return (
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
        </Stack.Navigator>
      </NavigationContainer>
    </RootLayout>
  );
}
