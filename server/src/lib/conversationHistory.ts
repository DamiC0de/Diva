/**
 * Persistent conversation history storage in Supabase.
 * Stores user/assistant messages to survive server restarts.
 */
import { getSupabase } from './supabase.js';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const HISTORY_LIMIT = 50; // Keep last 50 messages per user

/**
 * Load recent conversation history for a user
 */
export async function loadHistory(userId: string): Promise<ConversationMessage[]> {
  try {
    const { data, error } = await getSupabase()
      .from('conversation_history')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(HISTORY_LIMIT);

    if (error) {
      console.warn('[ConversationHistory] Failed to load:', error.message);
      return [];
    }

    return (data || []).map(row => ({
      role: row.role as 'user' | 'assistant',
      content: row.content,
      timestamp: row.created_at,
    }));
  } catch (err) {
    console.warn('[ConversationHistory] Error loading history:', err);
    return [];
  }
}

/**
 * Save a message to conversation history
 */
export async function saveMessage(
  userId: string, 
  role: 'user' | 'assistant', 
  content: string
): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from('conversation_history')
      .insert({
        user_id: userId,
        role,
        content,
      });

    if (error) {
      console.warn('[ConversationHistory] Failed to save:', error.message);
    }
  } catch (err) {
    console.warn('[ConversationHistory] Error saving message:', err);
  }
}

/**
 * Save multiple messages (batch)
 */
export async function saveMessages(
  userId: string,
  messages: ConversationMessage[]
): Promise<void> {
  if (messages.length === 0) return;

  try {
    const rows = messages.map(m => ({
      user_id: userId,
      role: m.role,
      content: m.content,
    }));

    const { error } = await getSupabase()
      .from('conversation_history')
      .insert(rows);

    if (error) {
      console.warn('[ConversationHistory] Failed to save batch:', error.message);
    }
  } catch (err) {
    console.warn('[ConversationHistory] Error saving batch:', err);
  }
}

/**
 * Prune old messages keeping only the latest HISTORY_LIMIT
 */
export async function pruneHistory(userId: string): Promise<void> {
  try {
    // Get the ID of the Nth oldest message to keep
    const { data: oldest } = await getSupabase()
      .from('conversation_history')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(HISTORY_LIMIT, HISTORY_LIMIT);

    if (oldest && oldest.length > 0) {
      // Delete messages older than the cutoff
      const cutoffId = oldest[0].id;
      await getSupabase()
        .from('conversation_history')
        .delete()
        .eq('user_id', userId)
        .lt('id', cutoffId);
    }
  } catch (err) {
    console.warn('[ConversationHistory] Error pruning:', err);
  }
}
