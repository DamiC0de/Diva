/**
 * EL-026 — Memory Retriever (RAG via pgvector)
 *
 * Retrieves relevant memories before each Claude call
 * using semantic similarity search.
 */

import type { FastifyBaseLogger } from 'fastify';

interface Memory {
  id: string;
  category: string;
  content: string;
  relevanceScore: number;
  createdAt: string;
  similarity?: number;
}

interface RetrieveOptions {
  userId: string;
  query: string;
  limit?: number;
  minSimilarity?: number;
}

export class MemoryRetriever {
  private logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  /**
   * Retrieve relevant memories for a user query.
   *
   * Uses pgvector cosine distance with recency boost.
   */
  async retrieve(options: RetrieveOptions): Promise<Memory[]> {
    const { userId, query, limit = 10, minSimilarity = 0.5 } = options;

    try {
      // 1. Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // 2. Search pgvector
      // TODO: Execute against Supabase
      //
      // SELECT
      //   id, category, content, relevance_score, created_at,
      //   1 - (embedding <=> $queryEmbedding) as similarity
      // FROM memories
      // WHERE user_id = $userId
      //   AND 1 - (embedding <=> $queryEmbedding) > $minSimilarity
      // ORDER BY
      //   (1 - (embedding <=> $queryEmbedding)) * 0.8 +
      //   (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 / 30)) * 0.2
      //   DESC
      // LIMIT $limit

      this.logger.debug({
        msg: 'Memory search',
        userId,
        query: query.slice(0, 50),
        limit,
      });

      // Placeholder: return empty until Supabase is connected
      return [];
    } catch (error) {
      this.logger.error({ msg: 'Memory retrieval failed', error });
      return [];
    }
  }

  /**
   * Format memories for injection into Claude's system prompt.
   */
  formatForPrompt(memories: Memory[], userName: string): string[] {
    if (memories.length === 0) return [];

    // Group by category
    const grouped: Record<string, string[]> = {};
    for (const mem of memories) {
      const cat = mem.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat]!.push(mem.content);
    }

    const lines: string[] = [];

    if (grouped['preference']?.length) {
      lines.push(`Préférences de ${userName} : ${grouped['preference'].join(', ')}`);
    }
    if (grouped['person']?.length) {
      lines.push(`Personnes : ${grouped['person'].join('. ')}`);
    }
    if (grouped['fact']?.length) {
      lines.push(`Faits : ${grouped['fact'].join('. ')}`);
    }
    if (grouped['event']?.length) {
      lines.push(`Événements : ${grouped['event'].join('. ')}`);
    }

    return lines;
  }

  private async generateEmbedding(_text: string): Promise<number[]> {
    // TODO: same embedding API as MemoryExtractor
    return new Array(1536).fill(0);
  }
}
