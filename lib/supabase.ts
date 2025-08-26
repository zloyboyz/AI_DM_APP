import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uiyeqoarhpjrflllncjh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpeWVxb2FyaHBqcmZsbGxuY2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjI0MjAsImV4cCI6MjA3MDYzODQyMH0.zV0lPMIH-aSPImZBkumsWW_EbrIfKHJloicQfzhFqkM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type for the chat history table
export interface ChatHistoryRecord {
  id: number;
  session_id: string;
  message: string;
}

// Function to fetch the last message for a session
export async function getLastMessageForSession(sessionId: string): Promise<ChatHistoryRecord | null> {
  try {
    const { data, error } = await supabase
      .from('n8n_chat_histories')
      .select('id, session_id, message')
      .eq('session_id', sessionId)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - this is expected for new sessions
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching last message:', error);
    return null;
  }
}