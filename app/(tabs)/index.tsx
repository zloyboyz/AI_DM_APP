import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Send, Crown, Play, Pause, Chrome as Home } from 'lucide-react-native';
import { useAudioManager } from '../hooks/useAudioManager';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { DmResponse } from '@/types/dm';
import { useSessionId } from '../../lib/useSessionId';
import { postJSON } from '../../lib/api';
import { getLastMessageForSession } from '../../lib/supabase';
import Constants from 'expo-constants';

// Direct webhook URL - bypassing the API route
const WEBHOOK_URL = 'https://zloyboy.app.n8n.cloud/webhook/1f43cae2-44e2-4bc5-b5fe-e3ec5b44f4c8';

interface Message {
  id: string;
  type: 'narrator' | 'npc' | 'system' | 'user';
  content: string;
  timestamp: string;
  speaker?: string;
  audioUri?: string;
  audioUris?: string[];
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const router = useRouter();
  const { playClickSound } = useAudioManager();
  const { 
    isRecording, 
    recordingDuration, 
    startRecording, 
    stopRecording, 
    hasPermission, 
    requestPermission 
  } = useVoiceRecording();
  const { isPlaying, playAudio, stopAudio, currentlyPlayingId } = useAudioPlayback();
  const { preloadAudio } = useAudioPlayback();

  const { sessionId } = useSessionId();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedInitialMessage, setHasLoadedInitialMessage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Use a small delay to ensure content has rendered
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Load last message when sessionId changes
  useEffect(() => {
    const loadLastMessage = async () => {
      if (!sessionId) {
        setHasLoadedInitialMessage(true);
        return;
      }

      if (hasLoadedInitialMessage) {
        return;
      }

      try {
        const lastMessage = await getLastMessageForSession(sessionId);
        
        if (lastMessage) {
          // Handle the message content properly - it might be an object or string
          let messageContent = '';
          if (typeof lastMessage.message === 'string') {
            messageContent = lastMessage.message;
          } else if (typeof lastMessage.message === 'object' && lastMessage.message !== null) {
            // If it's an object, try to extract text content
            messageContent = lastMessage.message.text || 
                           lastMessage.message.content || 
                           JSON.stringify(lastMessage.message);
          } else {
            messageContent = String(lastMessage.message || '');
          }
          
          const initialMessage: Message = {
            id: `initial-${lastMessage.id}`,
            type: 'narrator',
            content: messageContent,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            speaker: 'AI Dungeon Master',
          };
          
          setMessages([initialMessage]);
        }
        
        setHasLoadedInitialMessage(true);
      } catch (error) {
        console.error('Error loading initial message:', error);
        setHasLoadedInitialMessage(true);
      }
    };

    loadLastMessage();
  }, [sessionId, hasLoadedInitialMessage]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    playClickSound();
    const now = new Date();
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);

    const messageContent = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      const messageId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());

      const data = await postJSON<DmResponse>(WEBHOOK_URL, {
        messageId,
        message: messageContent,
        timestamp: now.toISOString(),
        isVoiceMessage: false,
      });

      // Check if we got a valid response
      if (!data || typeof data !== 'object' || !data.text) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: 'system',
            content: 'The AI Dungeon Master is thinking...',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      // Create a single message with both text and audio
      const audioArr = Array.isArray(data.audio) ? data.audio : [];
      const audioUris = audioArr.filter(clip => clip?.public_url).map(clip => clip.public_url);
      
      const dmMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'narrator',
        content: String(data.text) || 'AI Dungeon Master responds',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioUris: audioUris.length > 0 ? audioUris : undefined,
      };
      
      setMessages(prev => [...prev, dmMessage]);

    } catch (err) {
      console.error('Error sending message to webhook:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: 'Connection error. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecord = async () => {
    playClickSound();
    
    if (isRecording) {
      // Stop recording
      const audioData = await stopRecording();
      if (audioData) {
        // For now, just add a message indicating voice recording was captured
        const voiceMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: `🎤 Voice message recorded (${recordingDuration}s)`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          audioUri: audioData.uri,
        };
        setMessages(prev => [...prev, voiceMessage]);
        
        // Send voice message to webhook
        setIsLoading(true);
        try {
          const currentSessionId = sessionId;
          const messageId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
          const headers: Record<string, string> = { 'User-Agent': 'Expo-Mobile-App/1.0' };
          const form = new FormData();

          // include ids in form fields so the workflow can thread correctly
          if (currentSessionId) {
            form.append('sessionId', currentSessionId);
          }
          form.append('messageId', messageId);
          form.append('message', ''); // optional
          form.append('isVoiceMessage', 'true');

          if (Platform.OS === 'web') {
            const resp = await fetch(audioData.uri);
            const blob = await resp.blob();
            form.append('data', blob, `voice_message${audioData.extension || '.webm'}`);
          } else {
            form.append('data', {
              uri: audioData.uri,
              type: audioData.mimeType || 'audio/mpeg',
              name: `voice_message${audioData.extension || '.mp3'}`,
            } as any);
          }

          const response = await fetch(WEBHOOK_URL, { method: 'POST', headers, body: form });
          const text = await response.text();
          const ct = response.headers.get('content-type') || '';

          if (!response.ok) throw new Error(text || `HTTP ${response.status}`);

          if (ct.includes('application/json') && text.trim()) {
            const data: DmResponse = JSON.parse(text);

            // Create a single message with both text and audio
            const audioArr = Array.isArray(data.audio) ? data.audio : [];
            const audioUris = audioArr.filter(clip => clip?.public_url).map(clip => clip.public_url);
            
            const dmMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: 'narrator',
              content: data.text || 'AI Dungeon Master responds',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              audioUris: audioUris.length > 0 ? audioUris : undefined,
            };
            
            setMessages(prev => [...prev, dmMessage]);

            // Preload audio for instant playback
            if (audioUris.length > 0) {
              audioUris.forEach((audioUri, index) => {
                const audioId = audioUris.length > 1 ? `${dmMessage.id}-${index}` : dmMessage.id;
                preloadAudio(audioUri, audioId);
              });
            }

            // Preload audio for instant playback
            if (audioUris.length > 0) {
              audioUris.forEach((audioUri, index) => {
                const audioId = audioUris.length > 1 ? `${dmMessage.id}-${index}` : dmMessage.id;
                preloadAudio(audioUri, audioId);
              });
            }

          } else {
            setMessages(prev => [
              ...prev,
              {
                id: (Date.now() + 1).toString(),
                type: 'system',
                content: text || 'Voice message sent successfully.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        } catch (error) {
          console.error('Error sending voice message:', error);
          const errorMessage: Message = {
            id: (Date.now() + 2).toString(),
            type: 'system',
            content: 'Failed to send voice message. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      // Start recording
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          const errorMessage: Message = {
            id: Date.now().toString(),
            type: 'system',
            content: 'Microphone permission is required for voice recording.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
      }
      
      await startRecording();
    }
  };

  const handlePlayVoiceMessage = async (messageId: string, audioUri: string) => {
    playClickSound();
    
    if (currentlyPlayingId === messageId && isPlaying) {
      // Stop if currently playing this message
      await stopAudio();
    } else {
      // Play this message
      await playAudio(audioUri, messageId);
    }
  };

  const handlePlayMultipleAudio = async (messageId: string, audioUris: string[]) => {
    playClickSound();
    
    if (currentlyPlayingId === messageId && isPlaying) {
      // Stop if currently playing this message
      await stopAudio();
    } else {
      // Play all audio files in sequence
      await playAudio(audioUris, messageId);
    }
  };

  const handleGoHome = () => {
    playClickSound();
    router.push('../');
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
   console.log('Rendering message:', message);
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.dmMessage,
        ]}>
        {!isUser && (
          <View style={styles.messageHeader}>
            <Crown size={16} color="#8b5cf6" />
            <Text style={styles.speakerName}>
              {message.type === 'narrator' ? 'AI Dungeon Master' :
               message.type === 'system' ? 'System' :
               message.speaker || 'NPC'}
            </Text>
            <Text style={styles.messageTime}>{message.timestamp}</Text>
          </View>
        )}
        
        <Text style={[
          styles.messageText,
          isUser ? styles.userMessageText : styles.dmMessageText,
          message.type === 'system' && styles.systemMessageText,
        ]}>
          {message.content}
        </Text>
        
        {/* Audio playback buttons */}
        {message.audioUri && (
          <View style={styles.audioContainer}>
            <View style={styles.voiceMessageContainer}>
              <Pressable
                onPress={() => handlePlayVoiceMessage(message.id, message.audioUri!)}
                style={styles.playButton}>
                {currentlyPlayingId === message.id && isPlaying ? (
                  <Pause size={16} color="#4a5568" />
                ) : (
                  <Play size={16} color="#4a5568" />
                )}
              </Pressable>
              <Text style={styles.voiceMessageText}>
                {currentlyPlayingId === message.id && isPlaying ? 'Playing...' : 'Tap to play'}
              </Text>
            </View>
          </View>
        )}
        
        {message.audioUris && message.audioUris.length > 0 && (
          <View style={styles.audioContainer}>
            <View style={styles.voiceMessageContainer}>
              <Pressable
                onPress={() => handlePlayMultipleAudio(message.id, message.audioUris!)}
                style={styles.playButton}>
                {currentlyPlayingId === message.id && isPlaying ? (
                  <Pause size={16} color="#4a5568" />
                ) : (
                  <Play size={16} color="#4a5568" />
                )}
              </Pressable>
              <Text style={styles.voiceMessageText}>
                {currentlyPlayingId === message.id && isPlaying 
                  ? 'Playing...' 
                  : `Play all (${message.audioUris.length} clips)`}
              </Text>
            </View>
          </View>
        )}
        
        {isUser && (
          <Text style={styles.userMessageTime}>{message.timestamp}</Text>
        )}
        
        {/* Debug: Session ID */}
        <Text style={styles.debugSessionId}>Session: {String(sessionId || 'Not set')}</Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0f0727', '#1a0b2e']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleGoHome} style={styles.homeButton}>
          <Home size={20} color="#8b5cf6" />
        </Pressable>
        <Text style={styles.headerTitle}>AI Dungeon Master</Text>
        <Text style={styles.headerSubtitle}>Active Session</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}>
          {messages.map(renderMessage)}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Describe your action..."
              placeholderTextColor="#64748b"
              multiline
              maxLength={500}
            />
            <View style={styles.inputActions}>
              <Pressable
                onPress={handleVoiceRecord}
                style={[
                  styles.actionButton,
                  isRecording && styles.recordingButton,
                ]}>
                <View style={styles.micButtonContent}>
                  <Mic size={20} color={isRecording ? "#ef4444" : "#8b5cf6"} />
                  {isRecording && (
                    <Text style={styles.recordingDuration}>{recordingDuration}s</Text>
                  )}
                </View>
              </Pressable>
              <Pressable
                onPress={handleSendMessage}
                style={[
                  styles.actionButton,
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.disabledButton,
                ]}>
                <Send size={20} color={isLoading ? "#64748b" : "#ffffff"} />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomColor: 'rgba(139, 92, 246, 0.3)',
    borderBottomWidth: 1,
    position: 'relative',
  },
  homeButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8b5cf6',
    textAlign: 'center',
    marginTop: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 100,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 14,
  },
  dmMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 14,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  speakerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
    flex: 1,
  },
  messageTime: {
    fontSize: 10,
    color: '#64748b',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#ffffff',
  },
  dmMessageText: {
    color: '#e2e8f0',
  },
  systemMessageText: {
    color: '#fbbf24',
    fontStyle: 'italic',
  },
  userMessageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
    marginTop: 6,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a0b2e',
    borderTopColor: 'rgba(139, 92, 246, 0.3)',
    borderTopWidth: 1,
    padding: 16,
  },
  inputWrapper: {
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#e2e8f0',
    maxHeight: 100,
    minHeight: 20,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
  },
  recordingButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  sendButton: {
    backgroundColor: '#6366f1',
  },
  disabledButton: {
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  micButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
  },
  recordingDuration: {
    fontSize: 8,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 2,
  },
  audioContainer: {
    marginTop: 8,
    gap: 8,
  },
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceMessageText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  debugSessionId: {
    fontSize: 10,
    color: '#1e40af',
    fontFamily: 'monospace',
    marginTop: 4,
    opacity: 0.7,
  },
});