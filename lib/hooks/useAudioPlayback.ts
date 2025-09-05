import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { getPlayableUrl, AudioRef } from '../audioCache';

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

  const cleanup = useCallback(async () => {
    console.log('Cleaning up audio playback');
    
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.warn('Error unloading sound:', error);
      }
      soundRef.current = null;
    }
    
    // Revoke any blob URLs we created (web only)
    if (Platform.OS === 'web') {
      blobUrls.current.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      blobUrls.current.clear();
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
      console.log('playSingleAudio called with:', audioSource, 'audioId:', audioId);
      
      // Resolve the actual URI to play
      let uriToPlay: string;
      if (typeof audioSource === 'string') {
        uriToPlay = audioSource;
      } else {
        // It's an AudioRef, get the playable URL
        try {
          uriToPlay = await getPlayableUrl(sessionId!, audioSource);
          console.log('Resolved AudioRef to URI:', uriToPlay);
        } catch (error) {
          console.warn('Audio file not available:', audioSource.path, error);
          // Skip this audio file and continue with next in sequence
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
      
      // Track blob URLs for cleanup (web only)
      if (Platform.OS === 'web' && uriToPlay.startsWith('blob:')) {
        blobUrls.current.add(uriToPlay);
      }
      
      // Only unload the current sound if we're switching to a different one
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (error) {
          console.warn('Error unloading previous sound:', error);
        }
        soundRef.current = null;
      }

      console.log('Creating sound from URI:', uriToPlay);
      
      // Create new sound instance
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: uriToPlay });
      soundRef.current = newSound;

      // Set up playback status update
      newSound.setOnPlaybackStatusUpdate((status) => {
        console.log('Playback status update:', status);
        if (status.isLoaded) {
          if (status.didJustFinish) {
            console.log('Audio finished playing');
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
        } else if (status.error) {
          console.error('Audio playback error:', status.error);
          setState(prev => ({
            ...prev,
            isPlaying: false,
            currentlyPlayingId: null,
            currentSequence: [],
            currentIndex: 0,
          }));
        }
      });

      console.log('Starting audio playback');
      await newSound.playAsync();
      
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
  }, []);

  const playAudio = useCallback(async (audioSources: string | AudioRef | (string | AudioRef)[], messageId: string, sessionId?: string) => {
    try {
      console.log('playAudio called for messageId:', messageId);
      
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
      console.log('Starting first audio source:', firstSource);
      await playSingleAudio(firstSource, firstAudioId, sessionId);
      
    } catch (error) {
      console.error('Error starting audio playback:', error);
      await cleanup();
    }
  }, [playSingleAudio, cleanup]);

  const stopAudio = useCallback(async () => {
    console.log('stopAudio called');
    await cleanup();
  }, [cleanup]);

  return {
    isPlaying: state.isPlaying,
    currentlyPlayingId: state.currentlyPlayingId,
    playAudio,
    stopAudio,
  };
}