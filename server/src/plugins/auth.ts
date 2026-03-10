/**
 * EL-003 — JWT Authentication middleware
 * Verifies Supabase JWT tokens via Supabase Auth API.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { getSupabase } from '../lib/supabase.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userEmail?: string;
  }
}

async function authPlugin(app: FastifyInstance): Promise<void> {
  app.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.slice(7);

    try {
      // Verify token via Supabase Auth - NO FALLBACK
      const db = getSupabase();
      const { data, error } = await db.auth.getUser(token);

      if (error || !data.user) {
        reply.code(401).send({ error: 'Invalid or expired token' });
        return;
      }

      request.userId = data.user.id;
      request.userEmail = data.user.email;
    } catch {
      reply.code(401).send({ error: 'Token verification failed' });
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(authPlugin, { name: 'auth' });
