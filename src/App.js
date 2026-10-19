import React, { useState } from 'react';
import RootLayout from './layout';
import AuthLayout from './(auth)/layout';
import SignUpScreen from './(auth)/SignUpScreen';
import LoginScreen from './(auth)/LoginScreen';
import TabsLayout from './(tabs)/layout';

export default function App() {
  // Default to tabs so the store and navigation can be experienced immediately
  const [currentScreen, setCurrentScreen] = useState('tabs');

  return (
    <RootLayout>
      {currentScreen === 'tabs' ? (
        <TabsLayout
          initialTab="home"
          onNavigateToAuth={(authScreen) => setCurrentScreen(authScreen)}
        />
      ) : (
        <AuthLayout>
          {currentScreen === 'signup' ? (
            <SignUpScreen
              onNavigateToLogin={() => setCurrentScreen('login')}
              onSkipToHome={() => setCurrentScreen('tabs')}
            />
          ) : (
            <LoginScreen
              onNavigateToSignUp={() => setCurrentScreen('signup')}
              onSkipToHome={() => setCurrentScreen('tabs')}
            />
          )}
        </AuthLayout>
      )}
    </RootLayout>
  );
}
