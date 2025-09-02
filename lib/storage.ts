import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface AudioRef {
  path: string;
  public_url?: string;
}

// Storage utility functions
export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }
};

// Secure storage for sensitive data
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
};

// Audio cache for blob URLs
const audioCache = new Map<string, string>();

export async function getPlayableUrl(sessionId: string, audioRef: AudioRef): Promise<string> {
  // If we have a public URL, use it directly
  if (audioRef.public_url) {
    return audioRef.public_url;
  }

  // Check if we have a cached blob URL
  const cacheKey = `${sessionId}-${audioRef.path}`;
  const cachedUrl = audioCache.get(cacheKey);
  if (cachedUrl) {
    return cachedUrl;
  }

  // If no public URL and no cache, throw error
  throw new Error(`Audio file not available: ${audioRef.path}`);
}

export function clearAudioCache(): void {
  // Revoke all blob URLs to free memory
  audioCache.forEach(url => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
  audioCache.clear();
}