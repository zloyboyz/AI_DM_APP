import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initStorage } from '@/lib/storage';

// Keep the splash screen up until the first layout. No top-level await.
if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  // Initialize audio/fonts/whatever your hook sets up.
  const ready = useFrameworkReady();
  
  useEffect(() => {
    initStorage();
  }, []);

  useEffect(() => {
    if (ready && Platform.OS !== 'web') {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}