import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initStorage } from '@/lib/storage';

// Keep the splash screen up until the first layout. No top-level await.
if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const ready = useFrameworkReady();
  
  useEffect(() => {
    // Initialize storage
    const init = async () => {
      try {
        await initStorage();
        console.log('Storage initialized successfully');
      } catch (error) {
        console.error('Storage initialization failed:', error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Hide splash screen after a short delay to ensure everything is loaded
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(console.error);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}