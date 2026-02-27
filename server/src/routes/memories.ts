/**
 * EL-025/026 — Memories CRUD API
 */

import type { FastifyInstance } from 'fastify';

export async function memoriesRoutes(app: FastifyInstance): Promise<void> {
  // List user memories
  app.get(
    '/api/v1/memories',
    { preHandler: [app.authenticate] },
    async (request, _reply) => {
      const category = (request.query as Record<string, string>).category;
      // TODO: SELECT FROM memories WHERE user_id = request.userId
      // AND (category = $category OR $category IS NULL)
      // ORDER BY created_at DESC LIMIT 50
      app.log.info({ msg: 'List memories', userId: request.userId, category });
      return { memories: [], total: 0 };
    },
  );

  // Delete a memory
  app.delete(
    '/api/v1/memories/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      // TODO: DELETE FROM memories WHERE id = $id AND user_id = request.userId
      app.log.info({ msg: 'Delete memory', userId: request.userId, memoryId: id });
      return reply.code(204).send();
    },
  );

  // Update a memory
  app.patch(
    '/api/v1/memories/:id',
    { preHandler: [app.authenticate] },
    async (request, _reply) => {
      const { id } = request.params as { id: string };
      const { content } = request.body as { content: string };
      // TODO: UPDATE memories SET content = $content WHERE id = $id AND user_id = request.userId
      // Then re-generate embedding
      app.log.info({ msg: 'Update memory', userId: request.userId, memoryId: id, content });
      return { success: true };
    },
  );
}
