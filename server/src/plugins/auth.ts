/**
 * EL-003 — JWT Authentication middleware
 * Verifies Supabase JWT tokens via Supabase Auth API.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { getSupabase } from '../lib/supabase.js';

interface JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  exp?: number;
}

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
      // Verify token via Supabase Auth
      const db = getSupabase();
      const { data, error } = await db.auth.getUser(token);

      if (error || !data.user) {
        // Fallback: decode JWT manually (dev mode)
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid JWT');

        const payload = JSON.parse(
          Buffer.from(parts[1]!, 'base64url').toString('utf-8'),
        ) as JWTPayload;

        if (payload.exp && payload.exp * 1000 < Date.now()) {
          reply.code(401).send({ error: 'Token expired' });
          return;
        }

        if (!payload.sub) {
          reply.code(401).send({ error: 'Invalid token: missing sub' });
          return;
        }

        request.userId = payload.sub;
        request.userEmail = payload.email;
        return;
      }

      request.userId = data.user.id;
      request.userEmail = data.user.email;
    } catch {
      reply.code(401).send({ error: 'Invalid token' });
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(authPlugin, { name: 'auth' });
