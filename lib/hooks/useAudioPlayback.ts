import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { getPlayableUrl, AudioRef } from '../audioCache';
import { getStore } from '../storage';

interface AudioPlaybackState {
  isPlaying: boolean;
  currentlyPlayingId: string | null;
  currentSequence: string[];
  currentIndex: number;
}

export function useAudioPlayback() {
  const [state, setState] = useState<AudioPlaybackState>({
    isPlaying: false,
    currentlyPlayingId: null,
    currentSequence: [],
    currentIndex: 0,
  });

  const soundRef = useRef<Audio.Sound | null>(null);
  const blobUrls = useRef<Set<string>>(new Set());
  const tempFileUris = useRef<Set<string>>(new Set());

  const cleanup = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.warn('Error unloading sound:', error);
      }
      soundRef.current = null;
    }
    
    // Revoke any blob URLs we created
    blobUrls.current.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    blobUrls.current.clear();
    
    // Clean up temporary files on native
    if (Platform.OS !== 'web') {
      for (const uri of tempFileUris.current) {
        try {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch (error) {
          console.warn('Error deleting temp file:', uri, error);
        }
      }
      tempFileUris.current.clear();
    }
    
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentlyPlayingId: null,
      currentSequence: [],
      currentIndex: 0,
    }));
  }, []);

  const playSingleAudio = useCallback(async (audioSource: string | AudioRef, audioId: string, sessionId?: string) => {
    try {
      // Resolve the actual URI to play
      let uriToPlay: string;
      if (typeof audioSource === 'string') {
        // Handle cache:// URLs by retrieving from cache
        if (audioSource.startsWith('cache://')) {
          const cacheKey = audioSource.replace('cache://', '');
          const store = await getStore('audio');
          const cachedData = await store.getItem<{ ts: number; path: string; blob: Blob }>(cacheKey);
          if (cachedData && cachedData.blob) {
            if (Platform.OS === 'web') {
              // For web, create blob URL
              const blobUrl = URL.createObjectURL(cachedData.blob);
              blobUrls.current.add(blobUrl);
              uriToPlay = blobUrl;
            } else {
              // For React Native, write blob to temporary file
              const tempFileName = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
              const tempFileUri = `${FileSystem.cacheDirectory}${tempFileName}`;
              
              // Check if we already have this file cached
              const existingUri = Array.from(tempFileUris.current).find(uri => 
                uri.includes(cacheKey.replace(/[^a-zA-Z0-9]/g, '_'))
              );
              
              if (existingUri) {
                const fileInfo = await FileSystem.getInfoAsync(existingUri);
                if (fileInfo.exists) {
                  uriToPlay = existingUri;
                } else {
                  tempFileUris.current.delete(existingUri);
                  throw new Error('Cached file no longer exists');
                }
              } else {
                // Convert blob to base64 and write to file
                const base64data = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const result = reader.result as string;
                    const base64Data = result.split(',')[1];
                    resolve(base64Data);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(cachedData.blob);
                });
                
                await FileSystem.writeAsStringAsync(tempFileUri, base64data, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                
                tempFileUris.current.add(tempFileUri);
                uriToPlay = tempFileUri;
              }
            }
          } else {
            throw new Error('Cached audio not found');
          }
        } else {
          uriToPlay = audioSource;
        }
      } else {
        // It's an AudioRef, try to get the playable URL
        try {
          const resolvedUri = await getPlayableUrl(sessionId!, audioSource);
          // Handle cache:// URLs
          if (resolvedUri.startsWith('cache://')) {
            const cacheKey = resolvedUri.replace('cache://', '');
            const store = await getStore('audio');
            const cachedData = await store.getItem<{ ts: number; path: string; blob: Blob }>(cacheKey);
            if (cachedData && cachedData.blob) {
              if (Platform.OS === 'web') {
                // For web, create blob URL
                const blobUrl = URL.createObjectURL(cachedData.blob);
                blobUrls.current.add(blobUrl);
                uriToPlay = blobUrl;
              } else {
                // For React Native, write blob to temporary file
                const tempFileName = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
                const tempFileUri = `${FileSystem.cacheDirectory}${tempFileName}`;
                
                // Convert blob to base64 and write to file
                const base64data = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const result = reader.result as string;
                    const base64Data = result.split(',')[1];
                    resolve(base64Data);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(cachedData.blob);
                });
                
                await FileSystem.writeAsStringAsync(tempFileUri, base64data, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                
                tempFileUris.current.add(tempFileUri);
                uriToPlay = tempFileUri;
              }
            } else {
              throw new Error('Cached audio not found');
            }
          } else {
            uriToPlay = resolvedUri;
          }
        } catch (error) {
          console.warn('Audio file not available:', audioSource.path);
          // Skip this audio file and continue
          setState(prev => {
            if (prev.currentSequence.length > 0 && prev.currentIndex < prev.currentSequence.length - 1) {
              // Try next file in sequence
              const nextIndex = prev.currentIndex + 1;
              const nextAudioSource = prev.currentSequence[nextIndex];
              const nextAudioId = prev.currentSequence.length > 1 
                ? `${prev.currentlyPlayingId}-${nextIndex}` 
                : prev.currentlyPlayingId!;
              
              // Play next audio file
              playSingleAudio(nextAudioSource, nextAudioId, sessionId);
              
              return {
                ...prev,
                currentIndex: nextIndex,
              };
            } else {
              // No more files to play
              return {
                ...prev,
                isPlaying: false,
                currentlyPlayingId: null,
                currentSequence: [],
                currentIndex: 0,
              };
            }
          });
          return;
        }
      }
      
      // Only unload the current sound if we're switching to a different one
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (error) {
          console.warn('Error unloading previous sound:', error);
        }
        soundRef.current = null;
      }

      let sound: Audio.Sound;
      
      // Create new sound instance each time
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: uriToPlay });
      sound = newSound;

      soundRef.current = sound;

      // Set up playback status update
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            // Check if we're playing a sequence and have more files to play
            setState(prev => {
              if (prev.currentSequence.length > 0 && prev.currentIndex < prev.currentSequence.length - 1) {
                // Play next file in sequence
                const nextIndex = prev.currentIndex + 1;
                const nextAudioSource = prev.currentSequence[nextIndex];
                const nextAudioId = prev.currentSequence.length > 1 
                  ? `${prev.currentlyPlayingId}-${nextIndex}` 
                  : prev.currentlyPlayingId!;
                
                // Play next audio file
                playSingleAudio(nextAudioSource, nextAudioId, sessionId);
                
                return {
                  ...prev,
                  currentIndex: nextIndex,
                };
              } else {
                // Sequence finished or single file finished
                setState(prevState => ({
                  ...prevState,
                  isPlaying: false,
                  currentlyPlayingId: null,
                  currentSequence: [],
                  currentIndex: 0,
                }));
                return {
                  ...prev,
                  isPlaying: false,
                  currentlyPlayingId: null,
                  currentSequence: [],
                  currentIndex: 0,
                };
              }
            });
          } else {
            setState(prev => ({
              ...prev,
              isPlaying: status.isPlaying || false,
            }));
          }
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentlyPlayingId: null,
        currentSequence: [],
        currentIndex: 0,
      }));
    }
  }, [cleanup]);

  const playAudio = useCallback(async (audioSources: string | AudioRef | (string | AudioRef)[], messageId: string, sessionId?: string) => {
    try {
      // Stop any currently playing audio before starting new sequence
      await cleanup();
      
      const sources = Array.isArray(audioSources) ? audioSources : [audioSources];
      
      setState(prev => ({
        ...prev,
        currentlyPlayingId: messageId,
        currentSequence: sources,
        currentIndex: 0,
        isPlaying: true,
      }));

      // Start playing the first audio file
      const firstSource = sources[0];
      const firstAudioId = sources.length > 1 ? `${messageId}-0` : messageId;
      await playSingleAudio(firstSource, firstAudioId, sessionId);
    } catch (error) {
      console.error('Error starting audio playback:', error);
      await cleanup();
    }
  }, [playSingleAudio, cleanup]);

  const stopAudio = useCallback(async () => {
    await cleanup();
  }, [cleanup]);

  return {
    isPlaying: state.isPlaying,
    currentlyPlayingId: state.currentlyPlayingId,
    playAudio,
    stopAudio,
  };
}