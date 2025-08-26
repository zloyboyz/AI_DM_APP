import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback } from 'react';
import { Platform, View } from 'react-native'
import { useFrameworkReady } from '../hooks/useFrameworkReady'
import { useFrameworkReady } from '@/hooks/useFrameworkReady'

// Keep the splash screen up until the first layout.
// IMPORTANT: no top-level `await` — use `void` to ignore the promise.
if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  useFrameworkReady();
  // Called after the first layout; safe place to hide splash.
  const onLayoutRootView = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // no-op
      }
    }
  }, []);

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {/* Hide headers globally; tweak as you like */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}