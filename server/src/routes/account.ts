/**
 * EL-028 — Account management (RGPD export + deletion)
 */

import type { FastifyInstance } from 'fastify';

export async function accountRoutes(app: FastifyInstance): Promise<void> {
  // Export all user data (RGPD)
  app.post(
    '/api/v1/account/export',
    { preHandler: [app.authenticate] },
    async (request, _reply) => {
      const userId = request.userId;

      // TODO: Background job to:
      // 1. SELECT * FROM conversations WHERE user_id = $userId
      // 2. SELECT * FROM messages WHERE conversation_id IN (user conversations)
      // 3. SELECT * FROM memories WHERE user_id = $userId
      // 4. SELECT * FROM connected_services WHERE user_id = $userId (sans tokens)
      // 5. SELECT settings FROM users WHERE id = $userId
      // 6. ZIP tout → upload Supabase Storage → email link

      app.log.info({ msg: 'Data export requested', userId });

      return {
        status: 'processing',
        message: 'Ton export sera prêt sous 48h. Tu recevras un email avec le lien.',
      };
    },
  );

  // Delete account (hard delete)
  app.delete(
    '/api/v1/account',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { confirmation } = request.body as { confirmation?: string };
      const userId = request.userId;

      if (confirmation !== 'SUPPRIMER') {
        return reply.code(400).send({
          error: 'Pour confirmer, envoie { "confirmation": "SUPPRIMER" }',
        });
      }

      // TODO: CASCADE delete via Supabase
      // DELETE FROM users WHERE id = $userId
      // (CASCADE handles conversations, messages, memories, connected_services, care_contacts)
      //
      // Also: revoke OAuth tokens for connected services

      app.log.info({ msg: 'Account deleted', userId });

      return { status: 'deleted', message: 'Ton compte et toutes tes données ont été supprimés.' };
    },
  );
}
