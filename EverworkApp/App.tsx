import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useStore } from './src/store/useStore';

// Initialize app
function AppContent() {
  const { setUser } = useStore();

  useEffect(() => {
    // Check for existing user session here
    // For now, set a demo user
    setUser({
      uid: 'demo-user-1',
      email: 'demo@everwork.app',
      displayName: 'Demo User',
      photoURL: null,
    });
  }, []);

  return <AppNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppContent />
    </SafeAreaProvider>
  );
}
