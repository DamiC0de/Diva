/**
 * EL-025/026/028 — Memories CRUD API (wired to Supabase)
 */
import type { FastifyInstance } from 'fastify';
import { getSupabase } from '../lib/supabase.js';

interface MemoryParams { id: string }
interface MemoryPatchBody { content: string }
interface MemoryQuery { category?: string; limit?: number; offset?: number }

export async function memoriesRoutes(app: FastifyInstance) {
  const db = getSupabase();

  // List memories (with optional category filter + pagination)
  app.get<{ Querystring: MemoryQuery }>('/api/v1/memories', {
    preHandler: [app.authenticate],
  }, async (request) => {
    const { category, limit = 50, offset = 0 } = request.query;
    let query = db
      .from('memories')
      .select('id, category, content, relevance_score, remind_at, sent, created_at, updated_at')
      .eq('user_id', request.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;
    if (error) {
      app.log.error({ msg: 'Failed to list memories', error });
      return { memories: [], count: 0 };
    }

    return { memories: data, count: count ?? data.length };
  });

  // Delete a memory
  app.delete<{ Params: MemoryParams }>('/api/v1/memories/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { error } = await db
      .from('memories')
      .delete()
      .eq('id', request.params.id)
      .eq('user_id', request.userId);

    if (error) {
      app.log.error({ msg: 'Failed to delete memory', error });
      return reply.code(500).send({ error: 'Suppression échouée' });
    }

    return { deleted: true };
  });

  // Update a memory
  app.patch<{ Params: MemoryParams; Body: MemoryPatchBody }>('/api/v1/memories/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { content } = request.body;

    if (!content?.trim()) {
      return reply.code(400).send({ error: 'Content required' });
    }

    // TODO: Recalculate embedding for updated content
    const { data, error } = await db
      .from('memories')
      .update({ content, embedding: null }) // null embedding → will be recalculated
      .eq('id', request.params.id)
      .eq('user_id', request.userId)
      .select()
      .single();

    if (error) {
      app.log.error({ msg: 'Failed to update memory', error });
      return reply.code(500).send({ error: 'Mise à jour échouée' });
    }

    return { memory: data };
  });
}
