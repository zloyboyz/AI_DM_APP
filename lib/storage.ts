import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import localforage from 'localforage';

export interface AudioRef {
  path: string;
  public_url?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  audioRefs?: AudioRef[];
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

// Chat storage functions
export async function loadChat(sessionId: string): Promise<ChatMessage[]> {
  try {
    const chatHistory = await localforage.getItem<ChatMessage[]>(`chat_${sessionId}`);
    return chatHistory || [];
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
}

export async function appendChat(sessionId: string, message: ChatMessage): Promise<void> {
  try {
    const chatHistory = await loadChat(sessionId);
    chatHistory.push(message);
    await localforage.setItem(`chat_${sessionId}`, chatHistory);
  } catch (error) {
    console.error('Error appending chat message:', error);
  }
}

export async function clearChat(sessionId: string): Promise<void> {
  try {
    await localforage.removeItem(`chat_${sessionId}`);
  } catch (error) {
    console.error('Error clearing chat:', error);
  }
}

export async function cacheAudioBlob(sessionId: string, audioRef: AudioRef, blob: Blob): Promise<string> {
  try {
    const cacheKey = `audio_${sessionId}_${audioRef.path}`;
    await localforage.setItem(cacheKey, blob);
    
    const blobUrl = URL.createObjectURL(blob);
    audioCache.set(`${sessionId}-${audioRef.path}`, blobUrl);
    
    return blobUrl;
  } catch (error) {
    console.error('Error caching audio blob:', error);
    throw error;
  }
}

export async function vacuumOldAudio(): Promise<void> {
  try {
    const keys = await localforage.keys();
    const audioKeys = keys.filter(key => key.startsWith('audio_'));
    
    // Remove audio cache entries older than 7 days
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const key of audioKeys) {
      try {
        const blob = await localforage.getItem<Blob>(key);
        if (blob && blob.lastModified && blob.lastModified < oneWeekAgo) {
          await localforage.removeItem(key);
        }
      } catch (error) {
        // If we can't read the blob, remove it anyway
        await localforage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error during audio vacuum:', error);
  }
}

export async function getPlayableUrl(sessionId: string, audioRef: AudioRef): Promise<string> {
  // First check if we have a cached blob URL
  const cacheKey = `${sessionId}-${audioRef.path}`;
  const cachedUrl = audioCache.get(cacheKey);
  if (cachedUrl) {
    return cachedUrl;
  }

  // Check localforage for cached audio blob
  try {
    const localCacheKey = `audio_${sessionId}_${audioRef.path}`;
    const cachedBlob = await localforage.getItem<Blob>(localCacheKey);
    if (cachedBlob) {
      const blobUrl = URL.createObjectURL(cachedBlob);
      audioCache.set(cacheKey, blobUrl);
      return blobUrl;
    }
  } catch (error) {
    console.warn('Error checking localforage cache:', error);
  }

  // If we have a public URL, use it directly
  if (audioRef.public_url) {
    try {
      // Fetch and cache the audio
      const response = await fetch(audioRef.public_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Cache the blob in localforage
      const localCacheKey = `audio_${sessionId}_${audioRef.path}`;
      await localforage.setItem(localCacheKey, blob);
      
      // Create and cache blob URL
      const blobUrl = URL.createObjectURL(blob);
      audioCache.set(cacheKey, blobUrl);
      
      return blobUrl;
    } catch (error) {
      console.error('Error fetching and caching audio:', error);
      // Fallback to direct URL if caching fails
      return audioRef.public_url;
    }
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