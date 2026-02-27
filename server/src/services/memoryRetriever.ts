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

      // Re-rank with recency boost (80% similarity + 20% recency)
      const now = Date.now();
      const ONE_DAY = 86400000;

      const scored: RetrievedMemory[] = data.map((row: { id: string; category: string; content: string; similarity: number; created_at: string }) => {
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
   * Format memories for injection into Claude system prompt.
   */
  formatForPrompt(memories: RetrievedMemory[]): string {
    if (!memories.length) return '';

    const lines = memories.map(m => `- [${m.category}] ${m.content}`);
    return `\n\nCe que tu sais sur l'utilisateur :\n${lines.join('\n')}`;
  }
}
