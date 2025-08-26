import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SplashScreen } from 'expo-splash-screen';
import { Platform } from 'react-native';
import { useAudioManager } from '../lib/hooks/useAudioManager'
import { useFrameworkReady } from '../lib/hooks/useFrameworkReady'
import { useFrameworkReady } from '@/hooks/useFrameworkReady'

// Prevent the splash screen from auto-hiding before App component declaration
if (Platform.OS !== 'web') {
  SplashScreen?.preventAutoHideAsync?.();
}

export default function RootLayout() {
  useFrameworkReady();
  
  // Initialize audio at the root level so it persists across navigation
  useAudioManager();


  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
