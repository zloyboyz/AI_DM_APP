// lib/audioCache.ts
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { getStore } from './storage';

export interface AudioRef {
  path: string;
  public_url?: string;
}

const AUDIO = 'audio';
const META = 'audio_meta';

export async function cacheAudio(sessionId: string, audioRef: AudioRef, blob?: Blob): Promise<string> {
  try {
    const cacheKey = `${sessionId}_${audioRef.path}`;
    
    if (Platform.OS === 'web') {
      // Web platform: store blob in IndexedDB
      if (blob) {
        const store = await getStore(AUDIO);
        await store.setItem(cacheKey, {
          ts: Date.now(),
          path: audioRef.path,
          blob: blob
        });
        return `cache://${cacheKey}`;
      }
    } else {
      // Native platform: download and store as file
      if (audioRef.public_url) {
        const response = await fetch(audioRef.public_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status}`);
        }
        
        // Create a unique filename
        const fileName = `audio_${cacheKey.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        // Download directly to file
        const downloadResult = await FileSystem.downloadAsync(audioRef.public_url, fileUri);
        
        if (downloadResult.status === 200) {
          // Store file URI in AsyncStorage
          const store = await getStore(AUDIO);
          await store.setItem(cacheKey, {
            ts: Date.now(),
            path: audioRef.path,
            fileUri: downloadResult.uri
          });
          
          return downloadResult.uri;
        } else {
          throw new Error(`Download failed with status: ${downloadResult.status}`);
        }
      }
    }
    
    throw new Error('No audio source available for caching');
  } catch (error) {
    console.error('Error caching audio:', error);
    throw error;
  }
}

export async function getPlayableUrl(sessionId: string, audioRef: AudioRef): Promise<string> {
  const cacheKey = `${sessionId}_${audioRef.path}`;
  
  try {
    const store = await getStore(AUDIO);
    const cachedData = await store.getItem<any>(cacheKey);
    
    if (cachedData) {
      if (Platform.OS === 'web' && cachedData.blob) {
        // Web: create blob URL
        const blobUrl = URL.createObjectURL(cachedData.blob);
        return blobUrl;
      } else if (Platform.OS !== 'web' && cachedData.fileUri) {
        // Native: check if file still exists
        const fileInfo = await FileSystem.getInfoAsync(cachedData.fileUri);
        if (fileInfo.exists) {
          return cachedData.fileUri;
        } else {
          // File was deleted, remove from cache
          await store.removeItem(cacheKey);
        }
      }
    }
  } catch (error) {
    console.warn('Error checking audio cache:', error);
  }

  // If not cached or cache invalid, try to cache now
  if (audioRef.public_url) {
    try {
      return await cacheAudio(sessionId, audioRef);
    } catch (error) {
      console.error('Error caching audio on demand:', error);
      // Fall back to direct URL if available
      return audioRef.public_url;
    }
  }

  throw new Error(`Audio file not available: ${audioRef.path}`);
}

export async function vacuumOldAudio(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const store = await getStore(AUDIO);
    const cutoffTime = Date.now() - olderThanMs;
    
    await store.iterate<any>((value, key) => {
      if (value?.ts && value.ts < cutoffTime) {
        // Delete file on native platforms
        if (Platform.OS !== 'web' && value.fileUri) {
          FileSystem.deleteAsync(value.fileUri, { idempotent: true }).catch(err => 
            console.warn('Error deleting old audio file:', err)
          );
        }
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
    
    // Delete all cached files on native platforms
    if (Platform.OS !== 'web') {
      await audioStore.iterate<any>((value, key) => {
        if (value?.fileUri) {
          FileSystem.deleteAsync(value.fileUri, { idempotent: true }).catch(err => 
            console.warn('Error deleting cached audio file:', err)
          );
        }
      });
    }
    
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

// Backward compatibility
export const cacheAudioBlob = cacheAudio;