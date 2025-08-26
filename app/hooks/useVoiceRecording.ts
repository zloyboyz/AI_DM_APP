import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

interface RecordedAudioData {
  uri: string;
  base64: string;
  mimeType: string;
  extension: string;
}

interface VoiceRecordingHook {
  isRecording: boolean;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<RecordedAudioData | null>;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useVoiceRecording(): VoiceRecordingHook {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const recording = useRef<Audio.Recording | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingFormat = useRef<{ mimeType: string; extension: string } | null>(null);

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        // For web, we need to request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        return true;
      } else {
        // For mobile platforms
        const { status } = await Audio.requestPermissionsAsync();
        const granted = status === 'granted';
        setHasPermission(granted);
        return granted;
      }
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      setHasPermission(false);
      return false;
    }
  };

  const startRecording = async (): Promise<void> => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Audio permission not granted');
        }
      }

      // Configure audio mode for recording (only on native platforms)
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.mp3',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.mp3',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        }
      );

      // Store the recording format based on platform
      if (Platform.OS === 'web') {
        recordingFormat.current = { mimeType: 'audio/webm', extension: '.webm' };
      } else {
        recordingFormat.current = { mimeType: 'audio/mpeg', extension: '.mp3' };
      }

      recording.current = newRecording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async (): Promise<RecordedAudioData | null> => {
    try {
      if (!recording.current) {
        return null;
      }

      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      
      if (!uri || !recordingFormat.current) {
        return null;
      }

      let base64: string;
      
      if (Platform.OS === 'web') {
        // For web platform, use fetch and FileReader to convert blob to base64
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          
          base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              // Remove the data URL prefix to get just the base64 data
              const base64Data = result.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error converting audio to base64 on web:', error);
          return null;
        }
      } else {
        // For native platforms, use FileSystem
        base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // Clear the recording reference
      recording.current = null;
      setIsRecording(false);
      setRecordingDuration(0);

      // Clear duration timer
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      console.log('Recording stopped, URI:', uri);
      return { 
        uri, 
        base64, 
        mimeType: recordingFormat.current.mimeType,
        extension: recordingFormat.current.extension,
      };
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
      setRecordingDuration(0);
      return null;
    }
  };

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    hasPermission,
    requestPermission,
  };
}