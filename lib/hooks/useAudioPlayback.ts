import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { getPlayableUrl, AudioRef } from '../storage';

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
      let uri: string;
      if (typeof audioSource === 'string') {
        uri = audioSource;
      } else {
        // It's an AudioRef, get the playable URL (cached or remote)
        uri = await getPlayableUrl(sessionId!, audioSource);
        if (uri.startsWith('blob:')) {
          blobUrls.current.add(uri);
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
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
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