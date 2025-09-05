import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useFrameworkReady } from '../lib/hooks/useFrameworkReady';
import { initStorage } from '../lib/storage'
import { useFrameworkReady } from '@/hooks/useFrameworkReady'

// Keep the splash screen up until the first layout. No top-level await.
if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  // Initialize audio/fonts/whatever your hook sets up.
  useFrameworkReady();
  
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    initStorage().then(() => setStorageReady(true));
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (Platform.OS !== 'web') {
      void SplashScreen.hideAsync();
    }
  }, []);

  // Don't render until storage is ready
  if (!storageReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}