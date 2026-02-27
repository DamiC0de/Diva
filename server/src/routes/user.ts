import type { FastifyInstance } from 'fastify';
import { getSupabase } from '../lib/supabase.js';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  const db = getSupabase();

  // Get current user profile
  app.get('/api/v1/me', {
    preHandler: [app.authenticate],
  }, async (request) => {
    const { data } = await db
      .from('users')
      .select('id, email, display_name, subscription_tier, settings, created_at')
      .eq('id', request.userId)
      .single();

    if (!data) {
      // Auto-create user profile on first access (matches auth.users)
      const { data: newUser, error } = await db
        .from('users')
        .insert({
          id: request.userId,
          email: request.userEmail ?? '',
        })
        .select()
        .single();

      if (error) {
        app.log.error({ msg: 'Failed to create user profile', error });
        return { userId: request.userId, email: request.userEmail };
      }

      return { user: newUser };
    }

    return { user: data };
  });

  // Update push token
  app.post<{ Body: { push_token: string } }>('/api/v1/me/push-token', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { push_token } = request.body;
    if (!push_token) return reply.code(400).send({ error: 'push_token required' });

    const { error } = await db
      .from('users')
      .update({ push_token })
      .eq('id', request.userId);

    if (error) {
      app.log.error({ msg: 'Failed to update push token', error });
      return reply.code(500).send({ error: 'Failed to update push token' });
    }

    return { updated: true };
  });
}
