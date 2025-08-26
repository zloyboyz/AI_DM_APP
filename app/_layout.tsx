import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAudioManager } from '../lib/hooks/useAudioManager'
import { useFrameworkReady } from '../lib/hooks/useFrameworkReady'
import { useFrameworkReady } from '@/hooks/useFrameworkReady'

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
