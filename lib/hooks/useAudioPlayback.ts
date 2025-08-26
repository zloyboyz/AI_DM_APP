import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

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
  const audioCache = useRef<Map<string, Audio.Sound>>(new Map());

  const cleanup = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.warn('Error unloading sound:', error);
      }
      soundRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentlyPlayingId: null,
      currentSequence: [],
      currentIndex: 0,
    }));
  }, []);

  const preloadAudio = useCallback(async (uri: string, id: string) => {
    if (Platform.OS === 'web') return; // Skip preloading on web
    
    try {
      if (!audioCache.current.has(id)) {
        const { sound } = await Audio.Sound.createAsync({ uri });
        audioCache.current.set(id, sound);
      }
    } catch (error) {
      console.warn('Error preloading audio:', error);
    }
  }, []);

  const playSingleAudio = useCallback(async (uri: string, audioId: string) => {
    try {
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
      
      if (Platform.OS === 'web') {
        // On web, create new sound instance each time
        const { sound: newSound } = await Audio.Sound.createAsync({ uri });
        sound = newSound;
      } else {
        // On native, try to use preloaded audio first
        const cachedSound = audioCache.current.get(audioId);
        if (cachedSound) {
          sound = cachedSound;
          await sound.setPositionAsync(0); // Reset to beginning
        } else {
          const { sound: newSound } = await Audio.Sound.createAsync({ uri });
          sound = newSound;
          audioCache.current.set(audioId, sound);
        }
      }

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
                const nextUri = prev.currentSequence[nextIndex];
                const nextAudioId = prev.currentSequence.length > 1 
                  ? `${prev.currentlyPlayingId}-${nextIndex}` 
                  : prev.currentlyPlayingId!;
                
                // Play next audio file
                playSingleAudio(nextUri, nextAudioId);
                
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

  const playAudio = useCallback(async (audioUris: string | string[], messageId: string) => {
    try {
      // Stop any currently playing audio before starting new sequence
      await cleanup();
      
      const uris = Array.isArray(audioUris) ? audioUris : [audioUris];
      
      setState(prev => ({
        ...prev,
        currentlyPlayingId: messageId,
        currentSequence: uris,
        currentIndex: 0,
        isPlaying: true,
      }));

      // Start playing the first audio file
      const firstUri = uris[0];
      const firstAudioId = uris.length > 1 ? `${messageId}-0` : messageId;
      await playSingleAudio(firstUri, firstAudioId);
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
    preloadAudio,
  };
}