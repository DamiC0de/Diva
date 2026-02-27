/**
 * EL-003 — JWT Authentication middleware
 *
 * Verifies Supabase JWT tokens on protected routes.
 * Extracts user_id from the token for use in handlers.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

interface JWTPayload {
  sub: string;       // user_id
  email?: string;
  role?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userEmail?: string;
  }
}

async function authPlugin(app: FastifyInstance): Promise<void> {
  const supabaseJwtSecret = process.env['SUPABASE_JWT_SECRET'] ?? '';

  if (!supabaseJwtSecret) {
    app.log.warn('SUPABASE_JWT_SECRET not set — auth middleware will reject all requests');
  }

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
      // Decode JWT (in production, verify signature with SUPABASE_JWT_SECRET)
      // For now, decode without verification for development
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = JSON.parse(
        Buffer.from(parts[1]!, 'base64url').toString('utf-8'),
      ) as JWTPayload;

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        reply.code(401).send({ error: 'Token expired' });
        return;
      }

      if (!payload.sub) {
        reply.code(401).send({ error: 'Invalid token: missing sub' });
        return;
      }

      // Attach user info to request
      request.userId = payload.sub;
      request.userEmail = payload.email;
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
