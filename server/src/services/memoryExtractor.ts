/**
 * EL-025 — Memory Extraction Service — wired to Supabase + embedding API
 */
// randomUUID removed - not used
import type { FastifyBaseLogger } from 'fastify';
import { LLMService } from './llm.js';
import { getSupabase } from '../lib/supabase.js';

/** Return conversationId as-is if it's a valid UUID, otherwise generate one */
function toUuidOrNull(id: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) ? id : null;
}

interface ExtractedFact {
  category: 'preference' | 'fact' | 'person' | 'event' | 'health' | 'routine' | 'location' | 'relationship' | 'opinion' | 'goal';
  content: string;
  relevanceScore: number;
  expiresInDays?: number | null; // null = permanent
}

interface ExtractedRelation {
  subject: string;   // e.g. "Sophie"
  relation: string;  // e.g. "est la copine de"
  object: string;    // e.g. "l'utilisateur"
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const EXTRACTION_PROMPT = `Analyse cette conversation et extrais UNIQUEMENT les faits vraiment importants à mémoriser sur l'utilisateur — des informations durables qui aideront Diva à mieux le connaître et le servir sur le long terme.

Pour chaque fait, donne :
- category: une parmi preference | fact | person | event | health | routine | location | relationship | opinion | goal
- content: le fait en une phrase concise et claire
- relevanceScore: entre 0.0 et 1.0 (importance pour comprendre l'utilisateur)
- expiresInDays: nombre de jours avant expiration (null = permanent). Ex: "a mal à la tête" → 2, "est diabétique" → null, "a un rdv demain" → 3, "aime le jazz" → null

Catégories :
- preference : goûts durables ("aime le jazz", "préfère le thé vert") — PAS les curiosités ponctuelles
- fact : faits personnels structurants ("travaille chez Airbus", "a 2 enfants", "est papa")
- person : personnes importantes dans sa vie ("Sophie est sa copine", "Marc est son collègue")
- event : événements significatifs passés ou futurs ("va se marier en juin", "a eu un entretien lundi")
- health : santé physique/mentale durable ("est diabétique", "prend du magnésium", "dort mal chroniquement")
- routine : habitudes régulières établies ("court le mardi matin", "commande des sushis le vendredi")
- location : lieux importants de sa vie ("habite à Lyon", "bureau à la Défense")
- relationship : liens entre personnes ("Sophie et Marc sont en couple", "son frère vit au Canada")
- opinion : convictions durables ("pense que l'IA va tout changer", "n'aime pas la politique")
- goal : objectifs de vie, projets personnels importants ("veut apprendre le piano", "prépare un marathon")

Règles strictes :
- relevanceScore MINIMUM 0.7 — en dessous, ne pas inclure
- NE PAS mémoriser : questions factuelles ponctuelles, recherches d'information passagères (météo, prix, horaires, recettes), sujets abordés par curiosité sans lien personnel
- NE PAS mémoriser : "s'est renseigné sur X" si X n'est pas directement lié à sa vie personnelle
- Seule exception : si la recherche révèle quelque chose de structurant (ex: "cherche un vélo" → peut révéler une pratique sportive)
- Quand le doute est présent : ne pas mémoriser

Réponds UNIQUEMENT en JSON array. Si rien ne mérite d'être retenu, réponds [].`;

export class MemoryExtractor {
  private logger: FastifyBaseLogger;
  private llm: LLMService;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
    this.llm = new LLMService(logger);
  }

  async extract(userId: string, messages: Message[], conversationId: string): Promise<ExtractedFact[]> {
    this.logger.info({
      msg: '[MEMORY-DEBUG] extract() called',
      userId,
      messageCount: messages.length,
      conversationId,
    });

    if (messages.length < 2) {
      this.logger.warn({ msg: '[MEMORY-DEBUG] Conversation too short, skipping', messageCount: messages.length });
      return [];
    }

    try {
      const conversationText = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Diva'}: ${m.content}`)
        .join('\n');

      this.logger.info({ msg: '[MEMORY-DEBUG] Calling LLM for extraction', conversationPreview: conversationText.slice(0, 300) });

      const result = await this.llm.chat({
        userId,
        message: `${EXTRACTION_PROMPT}\n\nConversation:\n${conversationText}`,
        history: [],
      });

      this.logger.info({ msg: '[MEMORY-DEBUG] LLM response received', responsePreview: result.text.slice(0, 500) });

      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        this.logger.warn({ msg: '[MEMORY-DEBUG] No JSON array found in LLM response', fullResponse: result.text });
        return [];
      }

      const facts = JSON.parse(jsonMatch[0]) as ExtractedFact[];

      this.logger.info({
        msg: '[MEMORY-DEBUG] Facts parsed',
        conversationId,
        count: facts.length,
        facts: facts.map(f => ({ category: f.category, content: f.content, score: f.relevanceScore })),
      });

      if (facts.length === 0) {
        this.logger.warn({ msg: '[MEMORY-DEBUG] LLM returned empty array — nothing to store' });
        return [];
      }

      // Filter out low-relevance facts (hard threshold: 0.7)
      const MIN_RELEVANCE = 0.7;
      const filteredFacts = facts.filter(f => f.relevanceScore >= MIN_RELEVANCE);
      if (filteredFacts.length < facts.length) {
        this.logger.info({
          msg: '[MEMORY-DEBUG] Low-relevance facts filtered out',
          before: facts.length,
          after: filteredFacts.length,
          dropped: facts.filter(f => f.relevanceScore < MIN_RELEVANCE).map(f => ({ content: f.content, score: f.relevanceScore })),
        });
      }

      if (filteredFacts.length === 0) {
        this.logger.warn({ msg: '[MEMORY-DEBUG] All facts below relevance threshold, skipping storage' });
        return [];
      }

      // Store each fact in Supabase
      const db = getSupabase();
      for (const fact of filteredFacts) {
        this.logger.info({ msg: '[MEMORY-DEBUG] Generating embedding', content: fact.content });
        const embedding = await this.generateEmbedding(fact.content);
        this.logger.info({ msg: '[MEMORY-DEBUG] Embedding generated', dims: embedding.length, isZero: embedding.every(v => v === 0) });

        // Check for duplicates (cosine similarity > 0.9)
        const { data: duplicates, error: rpcError } = await db.rpc('match_memories', {
          query_embedding: embedding,
          match_threshold: 0.9,
          match_count: 1,
          p_user_id: userId,
        });

        if (rpcError) {
          this.logger.error({ msg: '[MEMORY-DEBUG] match_memories RPC failed', error: rpcError });
        }

        if (duplicates?.length) {
          // Update existing memory instead of inserting
          const updateData: Record<string, unknown> = {
              content: fact.content,
              embedding: JSON.stringify(embedding),
              relevance_score: fact.relevanceScore,
          };
          const convUuid = toUuidOrNull(conversationId);
          if (convUuid) updateData.source_conversation_id = convUuid;

          const { error: updateErr } = await db
            .from('memories')
            .update(updateData)
            .eq('id', duplicates[0].id);

          if (updateErr) {
            this.logger.error({ msg: '[MEMORY-DEBUG] Update failed', error: updateErr, content: fact.content });
          } else {
            this.logger.info({ msg: '[MEMORY-DEBUG] Memory UPDATED (duplicate)', content: fact.content, existingId: duplicates[0].id });
          }
        } else {
          // Insert new memory
          const insertData: Record<string, unknown> = {
            user_id: userId,
            category: fact.category,
            content: fact.content,
            embedding: JSON.stringify(embedding),
            relevance_score: fact.relevanceScore,
          };
          // Set expiration if temporary
          if (fact.expiresInDays) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + fact.expiresInDays);
            insertData.expires_at = expiresAt.toISOString();
          }
          const insertConvUuid = toUuidOrNull(conversationId);
          if (insertConvUuid) insertData.source_conversation_id = insertConvUuid;

          const { error: insertErr } = await db.from('memories').insert(insertData);

          if (insertErr) {
            this.logger.error({ msg: '[MEMORY-DEBUG] Insert FAILED', error: insertErr, content: fact.content, userId });
          } else {
            this.logger.info({ msg: '[MEMORY-DEBUG] Memory INSERTED', content: fact.content, category: fact.category });
          }
        }
      }

      // Extract relationships (non-blocking, in background)
      this.extractRelations(userId, conversationText).catch(err => 
        this.logger.error({ msg: '[MEMORY] Relation extraction failed', error: String(err) })
      );

      return filteredFacts;
    } catch (error) {
      this.logger.error({ msg: '[MEMORY-DEBUG] extract() CRASHED', error: String(error), stack: (error as Error)?.stack });
      return [];
    }
  }

  private async extractRelations(userId: string, conversationText: string): Promise<void> {
    const RELATION_PROMPT = `Analyse cette conversation et extrais les RELATIONS entre entités mentionnées par l'utilisateur.

Pour chaque relation, donne :
- subject: l'entité source (nom de personne, lieu, etc.)
- relation: le type de lien (ex: "est la copine de", "travaille à", "habite à", "est le frère de")
- object: l'entité cible

Exemples :
- {"subject": "Sophie", "relation": "est la copine de", "object": "l'utilisateur"}
- {"subject": "l'utilisateur", "relation": "travaille à", "object": "Airbus"}
- {"subject": "Marc", "relation": "est le frère de", "object": "Sophie"}

Ne retiens que les relations clairement exprimées. Réponds UNIQUEMENT en JSON array. Si aucune relation, réponds [].`;

    try {
      const result = await this.llm.chat({
        userId,
        message: `${RELATION_PROMPT}\n\nConversation:\n${conversationText}`,
        history: [],
      });

      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return;

      const relations = JSON.parse(jsonMatch[0]) as ExtractedRelation[];
      if (!relations.length) return;

      const db = getSupabase();

      for (const rel of relations) {
        // Find or create source and target memories
        const sourceContent = `${rel.subject}`;
        const targetContent = `${rel.object}`;

        // Check if relation already exists
        const { data: existing } = await db
          .from('memory_relations')
          .select('id')
          .eq('user_id', userId)
          .eq('relation_type', rel.relation)
          .eq('relation_label', `${rel.subject} ${rel.relation} ${rel.object}`)
          .limit(1);

        if (existing?.length) continue; // Already exists

        // Find matching memories for subject and object
        const subjectEmbedding = await this.generateEmbedding(sourceContent);
        const { data: subjectMatches } = await db.rpc('match_memories', {
          query_embedding: subjectEmbedding,
          match_threshold: 0.7,
          match_count: 1,
          p_user_id: userId,
        });

        const objectEmbedding = await this.generateEmbedding(targetContent);
        const { data: objectMatches } = await db.rpc('match_memories', {
          query_embedding: objectEmbedding,
          match_threshold: 0.7,
          match_count: 1,
          p_user_id: userId,
        });

        // Insert relation
        await db.from('memory_relations').insert({
          user_id: userId,
          source_memory_id: subjectMatches?.[0]?.id || null,
          target_memory_id: objectMatches?.[0]?.id || null,
          relation_type: rel.relation,
          relation_label: `${rel.subject} ${rel.relation} ${rel.object}`,
        });

        this.logger.info({ 
          msg: '[MEMORY] Relation inserted',
          relation: `${rel.subject} → ${rel.relation} → ${rel.object}`,
        });
      }
    } catch (err) {
      this.logger.error({ msg: '[MEMORY] extractRelations error', error: String(err) });
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env['OPENAI_API_KEY'] || process.env['VOYAGE_API_KEY'];

    if (!apiKey) {
      this.logger.warn('No embedding API key configured, using zero vector');
      return new Array(1536).fill(0);
    }

    // Use OpenAI text-embedding-3-small (1536 dims, $0.02/1M tokens)
    if (process.env['OPENAI_API_KEY']) {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env['OPENAI_API_KEY']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: text, model: 'text-embedding-3-small' }),
      });

      if (!res.ok) throw new Error(`OpenAI embedding error: ${res.status}`);
      const data = await res.json() as { data: { embedding: number[] }[] };
      return data.data[0]!.embedding;
    }

    // Fallback: Voyage AI (voyage-3-lite)
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env['VOYAGE_API_KEY']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: [text], model: 'voyage-3-lite' }),
    });

    if (!res.ok) throw new Error(`Voyage AI embedding error: ${res.status}`);
    const data = await res.json() as { data: { embedding: number[] }[] };
    return data.data[0]!.embedding;
  }
}
