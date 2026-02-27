/**
 * EL-025 — Memory Extraction Service
 *
 * After conversations, extracts memorable facts and stores them
 * with embeddings for semantic search.
 */

import type { FastifyBaseLogger } from 'fastify';
import { LLMService } from './llm.js';

interface ExtractedFact {
  category: 'preference' | 'fact' | 'person' | 'event' | 'reminder';
  content: string;
  relevanceScore: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const EXTRACTION_PROMPT = `Analyse cette conversation et extrais les faits importants à mémoriser sur l'utilisateur.

Pour chaque fait, donne :
- category: preference | fact | person | event
- content: le fait en une phrase concise
- relevanceScore: entre 0.0 et 1.0 (importance)

Ne retiens QUE les informations personnelles durables (pas les questions ponctuelles).
Exemples de ce qu'il faut retenir :
- Préférences ("aime le jazz", "préfère le thé")
- Faits ("habite à Lyon", "travaille chez Airbus")
- Personnes ("Sophie est sa femme", "Marc est son collègue")
- Événements ("va se marier en juin")

Réponds UNIQUEMENT en JSON array. Si rien à retenir, réponds [].`;

export class MemoryExtractor {
  private logger: FastifyBaseLogger;
  private llm: LLMService;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
    this.llm = new LLMService(logger);
  }

  /**
   * Extract facts from a conversation (async, non-blocking).
   */
  async extract(
    userId: string,
    messages: Message[],
    conversationId: string,
  ): Promise<ExtractedFact[]> {
    if (messages.length < 3) {
      this.logger.debug('Conversation too short for extraction, skipping');
      return [];
    }

    try {
      const conversationText = messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Elio'}: ${m.content}`)
        .join('\n');

      const result = await this.llm.chat({
        userId,
        message: `${EXTRACTION_PROMPT}\n\nConversation:\n${conversationText}`,
        history: [],
      });

      // Parse JSON response
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        this.logger.debug('No facts extracted');
        return [];
      }

      const facts = JSON.parse(jsonMatch[0]) as ExtractedFact[];

      this.logger.info({
        msg: 'Facts extracted',
        conversationId,
        count: facts.length,
        facts: facts.map((f) => f.content),
      });

      // TODO: For each fact:
      // 1. Generate embedding via API (voyage-3-lite or text-embedding-3-small)
      // 2. Check for duplicates (cosine similarity > 0.9 → update instead of insert)
      // 3. INSERT INTO memories (user_id, category, content, embedding, source_conversation_id, relevance_score)

      return facts;
    } catch (error) {
      this.logger.error({ msg: 'Memory extraction failed', error });
      return [];
    }
  }

  /**
   * Generate embedding for a text (placeholder).
   */
  async generateEmbedding(_text: string): Promise<number[]> {
    // TODO: Call embedding API
    // Option A: Voyage AI (voyage-3-lite) — $0.02/1M tokens
    // Option B: OpenAI text-embedding-3-small — $0.02/1M tokens
    //
    // const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${VOYAGE_API_KEY}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ input: [text], model: 'voyage-3-lite' }),
    // });

    return new Array(1536).fill(0);
  }
}
