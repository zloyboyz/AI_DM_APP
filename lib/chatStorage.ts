// lib/chatStorage.ts
import { getStore } from './storage';

export interface ChatMessage {
  id: string;
  role: 'user' | 'dm';
  text: string;
  audio?: AudioRef[];
  ts: number;
}

export interface AudioRef {
  path: string;
  public_url?: string;
}

const CHAT = 'chat';

export async function loadChat(sessionId: string): Promise<ChatMessage[]> {
  try {
    const store = await getStore(CHAT);
    const chatHistory = await store.getItem<ChatMessage[]>(`session:${sessionId}`);
    return chatHistory || [];
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
}

export async function appendChat(sessionId: string, message: ChatMessage): Promise<void> {
  try {
    const store = await getStore(CHAT);
    const key = `session:${sessionId}`;
    const chatHistory = await store.getItem<ChatMessage[]>(key) || [];
    chatHistory.push(message);
    await store.setItem(key, chatHistory);
  } catch (error) {
    console.error('Error appending chat message:', error);
  }
}

export async function clearChat(sessionId: string): Promise<void> {
  try {
    const store = await getStore(CHAT);
    await store.removeItem(`session:${sessionId}`);
  } catch (error) {
    console.error('Error clearing chat:', error);
  }
}