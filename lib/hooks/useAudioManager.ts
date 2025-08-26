import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// ✅ STATIC require so Metro can bundle it
const CLICK_SFX = require('assets/audio/click-sound.mp3');
const BGM_MUSIC = require('assets/audio/fantasy background music.mp3');

interface AudioSettings {
  masterVolume: number;
  backgroundMusicEnabled: boolean;
  soundEffectsEnabled: boolean;
}

export function useAudioManager() {
  const clickRef = useRef<Audio.Sound | null>(null);
  const bgmRef = useRef<Audio.Sound | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    masterVolume: 75,
    backgroundMusicEnabled: false,
    soundEffectsEnabled: true,
  });

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Skip audio initialization on web platform
        if (Platform.OS === 'web') {
          return;
        }

        // Good defaults; safe on native; ignored on web
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
        });

        // Load click sound
        const { sound: clickSound } = await Audio.Sound.createAsync(
          CLICK_SFX,
          { shouldPlay: false, volume: audioSettings.masterVolume / 100 }
        );
        if (!mounted) {
          await clickSound.unloadAsync();
          return;
        }
        clickRef.current = clickSound;

        // Load background music
        const { sound: bgmSound } = await Audio.Sound.createAsync(
          BGM_MUSIC,
          { 
            shouldPlay: false, 
            isLooping: true, 
            volume: (audioSettings.masterVolume / 100) * 0.3 
          }
        );
        if (!mounted) {
          await bgmSound.unloadAsync();
          return;
        }
        bgmRef.current = bgmSound;

      } catch (e) {
        console.error('Error initializing audio:', e);
      }
    }

    init();
    return () => {
      mounted = false;
      // Cleanup
      try {
        if (clickRef.current) {
          clickRef.current.unloadAsync().catch(() => {});
          clickRef.current = null;
        }
        if (bgmRef.current) {
          bgmRef.current.unloadAsync().catch(() => {});
          bgmRef.current = null;
        }
      } catch {}
    };
  }, []);

  const playClickSound = useCallback(async () => {
    if (Platform.OS === 'web') return;
    if (!audioSettings.soundEffectsEnabled) return;
    
    try {
      const s = clickRef.current;
      if (!s) return;
      await s.replayAsync();
    } catch (e) {
      console.error('Click sound error:', e);
    }
  }, [audioSettings.soundEffectsEnabled]);

  const startInitialBackgroundMusic = useCallback(async () => {
    if (Platform.OS === 'web') return;
    if (!audioSettings.backgroundMusicEnabled) return;
    
    try {
      const s = bgmRef.current;
      if (!s) return;
      await s.playAsync();
    } catch (e) {
      console.error('BGM play error:', e);
    }
  }, [audioSettings.backgroundMusicEnabled]);

  const updateAudioSettings = useCallback(async (newSettings: Partial<AudioSettings>) => {
    const updatedSettings = { ...audioSettings, ...newSettings };
    setAudioSettings(updatedSettings);

    // Skip audio operations on web platform
    if (Platform.OS === 'web') return;

    // Update volumes
    if (newSettings.masterVolume !== undefined) {
      try {
        const clickSound = clickRef.current;
        const bgmSound = bgmRef.current;
        if (clickSound) await clickSound.setVolumeAsync(newSettings.masterVolume / 100);
        if (bgmSound) await bgmSound.setVolumeAsync((newSettings.masterVolume / 100) * 0.3);
      } catch (e) {
        console.error('Error updating volume:', e);
      }
    }

    // Handle background music toggle
    if (newSettings.backgroundMusicEnabled !== undefined) {
      try {
        const s = bgmRef.current;
        if (!s) return;
        
        if (newSettings.backgroundMusicEnabled) {
          await s.playAsync();
        } else {
          await s.pauseAsync();
        }
      } catch (e) {
        console.error('Error toggling background music:', e);
      }
    }
  }, [audioSettings]);

  return { 
    audioSettings, 
    updateAudioSettings, 
    playClickSound, 
    startInitialBackgroundMusic 
  };
}