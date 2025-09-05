// lib/audioCache.ts
import { getStore } from './storage';

export interface AudioRef {
  path: string;
  public_url?: string;
}

const AUDIO = 'audio';
const META = 'audio_meta';

export async function cacheAudioBlob(sessionId: string, audioRef: AudioRef, blob: Blob): Promise<string> {
  try {
    const store = await getStore(AUDIO);
    const cacheKey = `${sessionId}_${audioRef.path}`;
    await store.setItem(cacheKey, {
      ts: Date.now(),
      path: audioRef.path,
      blob: blob
    });
    
    // On React Native, we can't create blob URLs, so return the cache key
    // The playback hook will handle retrieving the blob from cache
    return `cache://${cacheKey}`;
  } catch (error) {
    console.error('Error caching audio blob:', error);
    throw error;
  }
}

export async function getPlayableUrl(sessionId: string, audioRef: AudioRef): Promise<string> {
  // Check cache for audio blob
  try {
    const store = await getStore(AUDIO);
    const cacheKey = `${sessionId}_${audioRef.path}`;
    const cachedData = await store.getItem<{ ts: number; path: string; blob: Blob }>(cacheKey);
    if (cachedData && cachedData.blob) {
      // On React Native, we need to handle blob differently
      // Return a cache reference that the audio playback hook can handle
      return `cache://${cacheKey}`;
    }
  } catch (error) {
    console.warn('Error checking audio cache:', error);
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
      
      // Cache the blob
      const store = await getStore(AUDIO);
      const cacheKey = `${sessionId}_${audioRef.path}`;
      await store.setItem(cacheKey, {
        ts: Date.now(),
        path: audioRef.path,
        blob: blob
      });
      
      // Return the public URL directly for React Native
      return audioRef.public_url;
    } catch (error) {
      console.error('Error fetching and caching audio:', error);
      throw error;
    }
  }

  // If no public URL and no cache, throw error
  throw new Error(`Audio file not available: ${audioRef.path}`);
}

export async function vacuumOldAudio(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const store = await getStore(AUDIO);
    const cutoffTime = Date.now() - olderThanMs;
    
    await store.iterate<{ ts: number; path: string; blob: Blob }>((value, key) => {
      if (value?.ts && value.ts < cutoffTime) {
        store.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error during audio vacuum:', error);
  }
}

export async function clearAllAudioCache(): Promise<void> {
  try {
    const audioStore = await getStore(AUDIO);
    const metaStore = await getStore(META);
    await audioStore.clear();
    await metaStore.clear();
  } catch (error) {
    console.error('Error clearing audio cache:', error);
    throw error;
  }
}

export function clearAudioCache(): void {
  // Note: Individual blob URLs are now managed by the audio playback hook
  // This function is kept for backward compatibility but no longer needed
}