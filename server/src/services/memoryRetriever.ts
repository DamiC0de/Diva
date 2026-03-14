/**
 * EL-026 — RAG Memory Retriever — wired to Supabase pgvector
 */
import type { FastifyBaseLogger } from 'fastify';
import { getSupabase } from '../lib/supabase.js';
import { MemoryExtractor } from './memoryExtractor.js';

interface RetrievedMemory {
  id: string;
  category: string;
  content: string;
  score: number;      // Combined score (semantic + recency)
  created_at: string;
}

export class MemoryRetriever {
  private logger: FastifyBaseLogger;
  private extractor: MemoryExtractor;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
    this.extractor = new MemoryExtractor(logger);
  }

  /**
   * Retrieve relevant memories for a user query.
   * Scoring: 80% semantic similarity + 20% recency boost.
   */
  async retrieve(
    userId: string,
    query: string,
    limit = 5,
    minSimilarity = 0.3,
  ): Promise<RetrievedMemory[]> {
    try {
      const queryEmbedding = await this.extractor.generateEmbedding(query);
      const db = getSupabase();

      // Use pgvector cosine similarity via RPC
      const { data, error } = await db.rpc('match_memories', {
        query_embedding: queryEmbedding,
        match_threshold: minSimilarity,
        match_count: limit * 2, // Fetch more, then re-rank with recency
        p_user_id: userId,
      });

      if (error) {
        this.logger.error({ msg: 'Memory retrieval failed', error });
        return [];
      }

      if (!data?.length) return [];

      // Filter out expired memories
      const validData = data.filter((row: { expires_at?: string | null }) => {
        if (!row.expires_at) return true; // permanent
        return new Date(row.expires_at) > new Date();
      });

      if (!validData.length) return [];

      // Re-rank with recency boost (80% similarity + 20% recency)
      const now = Date.now();
      const ONE_DAY = 86400000;

      const scored: RetrievedMemory[] = validData.map((row: { id: string; category: string; content: string; similarity: number; created_at: string }) => {
        const ageMs = now - new Date(row.created_at).getTime();
        const ageDays = ageMs / ONE_DAY;
        // Recency boost: 1.0 for today, decays to 0 after ~30 days
        const recencyBoost = Math.max(0, 1 - ageDays / 30);
        const score = 0.8 * row.similarity + 0.2 * recencyBoost;

        return {
          id: row.id,
          category: row.category,
          content: row.content,
          score,
          created_at: row.created_at,
        };
      });

      // Sort by combined score and take top N
      scored.sort((a, b) => b.score - a.score);
      const results = scored.slice(0, limit);

      this.logger.info({
        msg: 'Memories retrieved',
        userId,
        query: query.slice(0, 50),
        count: results.length,
      });

      return results;
    } catch (error) {
      this.logger.error({ msg: 'Memory retrieval error', error });
      return [];
    }
  }

  /**
   * Retrieve time-sensitive memories (events, reminders) for proactive recall.
   * These are injected even without a matching query.
   */
  async retrieveProactive(userId: string): Promise<RetrievedMemory[]> {
    try {
      const db = getSupabase();
      
      // Get recent event/goal/routine memories that might be time-relevant
      const { data, error } = await db
        .from('memories')
        .select('id, category, content, relevance_score, created_at, expires_at')
        .eq('user_id', userId)
        .in('category', ['event', 'goal', 'routine', 'health'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !data?.length) return [];

      // Filter out expired
      const now = new Date();
      const valid = data.filter((m: any) => !m.expires_at || new Date(m.expires_at) > now);

      // Only keep recent ones (last 7 days) for proactive injection
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
      const recent = valid.filter((m: any) => new Date(m.created_at) > sevenDaysAgo);

      return recent.map((m: any) => ({
        id: m.id,
        category: m.category,
        content: m.content,
        score: m.relevance_score || 0.5,
        created_at: m.created_at,
      }));
    } catch (error) {
      this.logger.error({ msg: 'Proactive memory retrieval error', error });
      return [];
    }
  }

  /**
   * Retrieve relationship graph for a user.
   */
  async retrieveRelations(userId: string, limit = 20): Promise<string[]> {
    try {
      const db = getSupabase();
      const { data, error } = await db
        .from('memory_relations')
        .select('relation_label')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data?.length) return [];
      return data.map((r: { relation_label: string }) => r.relation_label);
    } catch {
      return [];
    }
  }

  /**
   * Format memories for injection into Claude system prompt.
   */
  formatForPrompt(memories: RetrievedMemory[]): string {
    if (!memories.length) return '';

    const lines = memories.map(m => `- [${m.category}] ${m.content}`);
    return `\n\nCe que tu sais sur l'utilisateur :\n${lines.join('\n')}`;
  }
}
