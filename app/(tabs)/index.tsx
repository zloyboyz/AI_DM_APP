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
import { Mic, Send, Crown, Play, Pause, House } from 'lucide-react-native';
import { useAudioManager } from '../../lib/hooks/useAudioManager';
import { useVoiceRecording } from '../../lib/hooks/useVoiceRecording';
import { useAudioPlayback } from '../../lib/hooks/useAudioPlayback';
import { useSessionId } from '../../lib/useSessionId';
import { postJSON } from '../../lib/api';
import { getLastMessageForSession, getLastDmMessageForSession } from '../../lib/supabase';
import { 
  loadChat, 
  appendChat, 
  vacuumOldAudio, 
  cacheAudioBlob, 
  ChatMessage, 
  AudioRef 
} from '../../lib/storage';
import Constants from 'expo-constants';

interface DmResponse {
  text: string;
  audio?: AudioRef[];
}

// Direct webhook URL - bypassing the API route
const WEBHOOK_URL = 'https://zloyboy.app.n8n.cloud/webhook/1f43cae2-44e2-4bc5-b5fe-e3ec5b44f4c8';

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  const { sessionId } = useSessionId();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  // Load chat history when sessionId changes
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        // Clean up old audio on app start
        await vacuumOldAudio();
        
        if (sessionId) {
          const chatHistory = await loadChat(sessionId);
          
          // If no local chat history exists, check Supabase for previous messages
          if (chatHistory.length === 0) {
            // First check n8n_chat_histories table
            let lastSupabaseMessage = await getLastMessageForSession(sessionId);
            
            // If no message found, check dm_messages table
            if (!lastSupabaseMessage) {
              const lastDmMessage = await getLastDmMessageForSession(sessionId);
              if (lastDmMessage) {
                // Convert dm_messages format to chat history format
                lastSupabaseMessage = {
                  id: lastDmMessage.id,
                  session_id: lastDmMessage.session_id,
                  message: lastDmMessage.content,
                };
              }
            }
            
            if (lastSupabaseMessage) {
              // Convert Supabase message to ChatMessage format
              const supabaseMessage: ChatMessage = {
                id: lastSupabaseMessage.id.toString(),
                role: 'dm',
                text: lastSupabaseMessage.message,
                ts: Date.now(),
              };
              
              // Add a system message to indicate this is from previous session
              const systemMessage: ChatMessage = {
                id: (Date.now() - 1).toString(),
                role: 'dm',
                text: '--- Continuing from previous session ---',
                ts: Date.now() - 1,
              };
              
              setMessages([systemMessage, supabaseMessage]);
              
              // Save these messages to local storage for future reference
              await appendChat(sessionId, systemMessage);
              await appendChat(sessionId, supabaseMessage);
            } else {
              // No messages found in either local storage or Supabase
              const noMessagesIndicator: ChatMessage = {
                id: 'no-old-messages',
                role: 'dm',
                text: 'There are no old messages. Starting a fresh adventure!',
                ts: Date.now(),
              };
              
              setMessages([noMessagesIndicator]);
              
              // Save this indicator to local storage
              await appendChat(sessionId, noMessagesIndicator);
            }
          } else {
            setMessages(chatHistory);
          }
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        
        // Show error message in chat instead of empty state
        const errorMessage: ChatMessage = {
          id: 'load-error',
          role: 'dm',
          text: 'Error loading chat history. Starting fresh.',
          ts: Date.now(),
        };
        setMessages([errorMessage]);
      } finally {
        void 0;
      }
    };

    loadChatHistory();
  }, [sessionId]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    playClickSound();
    const now = new Date();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText.trim(),
      ts: now.getTime(),
    };
    setMessages(prev => [...prev, userMsg]);
    
    // Persist user message
    if (sessionId) {
      await appendChat(sessionId, userMsg);
    }

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
        const systemMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'dm',
          text: 'The AI Dungeon Master is thinking...',
          ts: Date.now(),
        };
        setMessages(prev => [...prev, systemMsg]);
        if (sessionId) {
          await appendChat(sessionId, systemMsg);
        }
        return;
      }

      // Create DM message
      const dmMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'dm',
        text: String(data.text) || 'AI Dungeon Master responds',
        audio: data.audio || [],
        ts: Date.now(),
      };
      
      setMessages(prev => [...prev, dmMessage]);
      
      // Persist DM message
      if (sessionId) {
        await appendChat(sessionId, dmMessage);
        
        // Cache audio files
        if (data.audio && data.audio.length > 0) {
          data.audio.forEach(audioRef => {
            cacheAudioBlob(sessionId, audioRef);
          });
        }
      }

    } catch (err) {
      console.error('Error sending message to webhook:', err);
      
      // Check if it's a webhook configuration error
      const errorText = err instanceof Error ? err.message : String(err);
      let errorMessage = 'Connection error. Please try again.';
      
      if (errorText.includes('404') && errorText.includes('webhook')) {
        errorMessage = 'The AI Dungeon Master is currently offline. The webhook service needs to be activated.';
      }
      
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'dm',
        text: errorMessage,
        ts: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
      if (sessionId) {
        await appendChat(sessionId, errorMsg);
      }
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
        const voiceMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: `🎤 Voice message recorded (${recordingDuration}s)`,
          ts: Date.now(),
        };
        setMessages(prev => [...prev, voiceMessage]);
        
        // Persist voice message
        if (sessionId) {
          await appendChat(sessionId, voiceMessage);
        }
        
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

            // Create DM message
            const dmMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'dm',
              text: data.text || 'AI Dungeon Master responds',
              audio: data.audio || [],
              ts: Date.now(),
            };
            
            setMessages(prev => [...prev, dmMessage]);

            // Persist DM message and cache audio
            if (sessionId) {
              await appendChat(sessionId, dmMessage);
              
              if (data.audio && data.audio.length > 0) {
                data.audio.forEach(audioRef => {
                  cacheAudioBlob(sessionId, audioRef);
                });
              }
            }

          } else {
            const successMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'dm',
              text: text || 'Voice message sent successfully.',
              ts: Date.now(),
            };
            setMessages(prev => [...prev, successMsg]);
            if (sessionId) {
              await appendChat(sessionId, successMsg);
            }
          }
        } catch (error) {
          console.error('Error sending voice message:', error);
          
          // Check if it's a webhook configuration error
          const errorText = error instanceof Error ? error.message : String(error);
          let errorText2 = 'Failed to send voice message. Please try again.';
          
          if (errorText.includes('404') && errorText.includes('webhook')) {
            errorText2 = 'The AI Dungeon Master is currently offline. The webhook service needs to be activated.';
          }
          
          const errorMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'dm',
            text: errorText2,
            ts: Date.now(),
          };
          setMessages(prev => [...prev, errorMessage]);
          if (sessionId) {
            await appendChat(sessionId, errorMessage);
          }
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      // Start recording
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'dm',
            text: 'Microphone permission is required for voice recording.',
            ts: Date.now(),
          };
          setMessages(prev => [...prev, errorMessage]);
          if (sessionId) {
            await appendChat(sessionId, errorMessage);
          }
          return;
        }
      }
      
      await startRecording();
    }
  };

  const handlePlayVoiceMessage = async (messageId: string, audioSource: string) => {
    playClickSound();
    
    if (currentlyPlayingId === messageId && isPlaying) {
      // Stop if currently playing this message
      await stopAudio();
    } else {
      // Play this message
      await playAudio(audioSource, messageId, sessionId || undefined);
    }
  };

  const handlePlayMultipleAudio = async (messageId: string, audioRefs: AudioRef[]) => {
    playClickSound();
    
    if (currentlyPlayingId === messageId && isPlaying) {
      // Stop if currently playing this message
      await stopAudio();
    } else {
      // Play all audio files in sequence  
      await playAudio(audioRefs, messageId, sessionId || undefined);
    }
  };

  const handleGoHome = () => {
    playClickSound();
    router.push('../');
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const timestamp = new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
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
              AI Dungeon Master
            </Text>
            <Text style={styles.messageTime}>{timestamp}</Text>
          </View>
        )}
        
        <Text style={[
          styles.messageText,
          isUser ? styles.userMessageText : styles.dmMessageText,
        ]}>
          {message.text}
        </Text>
        
        {/* Audio playback buttons */}
        {message.audio && message.audio.length > 0 && (
          <View style={styles.audioContainer}>
            <View style={styles.voiceMessageContainer}>
              <Pressable
                onPress={() => handlePlayMultipleAudio(message.id, message.audio!)}
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
                  : `Play all (${message.audio.length} clips)`}
              </Text>
            </View>
          </View>
        )}
        
        {isUser && (
          <Text style={styles.userMessageTime}>{timestamp}</Text>
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
          <House size={20} color="#8b5cf6" />
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