/**
 * EL-028 — Account management (export RGPD + delete) — wired to Supabase
 */
import type { FastifyInstance } from 'fastify';
import { getSupabase } from '../lib/supabase.js';

export async function accountRoutes(app: FastifyInstance) {
  const db = getSupabase();

  // Export all user data (RGPD portability)
  app.post('/api/v1/account/export', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.userId;
    app.log.info({ msg: 'Data export requested', userId });

    // Collect all user data
    const [conversations, memories, settings, services] = await Promise.all([
      db.from('conversations').select('*, messages(*)').eq('user_id', userId),
      db.from('memories').select('id, category, content, created_at, updated_at').eq('user_id', userId),
      db.from('users').select('email, display_name, settings, created_at').eq('id', userId).single(),
      db.from('connected_services').select('service_type, status, created_at').eq('user_id', userId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: settings.data,
      conversations: conversations.data ?? [],
      memories: memories.data ?? [],
      connected_services: services.data ?? [],
    };

    // Return as JSON directly (ZIP generation can be added later)
    return reply
      .header('Content-Disposition', `attachment; filename="elio-export-${userId}.json"`)
      .header('Content-Type', 'application/json')
      .send(JSON.stringify(exportData, null, 2));
  });

  // Delete account (RGPD right to erasure)
  app.delete<{ Body: { confirmation: string } }>('/api/v1/account', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const userId = request.userId;
    const { confirmation } = request.body;

    if (confirmation !== 'SUPPRIMER') {
      return reply.code(400).send({
        error: 'Pour confirmer, envoie { "confirmation": "SUPPRIMER" }',
      });
    }

    // CASCADE delete: users table has ON DELETE CASCADE for all related tables
    const { error } = await db
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      app.log.error({ msg: 'Account deletion failed', error, userId });
      return reply.code(500).send({ error: 'Suppression échouée' });
    }

    // Also delete from auth.users via admin API
    const { error: authError } = await db.auth.admin.deleteUser(userId as string);
    if (authError) {
      app.log.warn({ msg: 'Auth user deletion failed (data already deleted)', authError, userId });
    }

    app.log.info({ msg: 'Account deleted', userId });
    return { message: 'Ton compte et toutes tes données ont été supprimés.', deleted: true };
  });
}
