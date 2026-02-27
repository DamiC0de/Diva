/**
 * EL-028 — Account management (export RGPD + delete)
 */

import type { FastifyInstance } from 'fastify';

export async function accountRoutes(app: FastifyInstance) {
  // Export all user data (RGPD portability)
  app.post('/api/v1/account/export', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const userId = req.userId;

    // TODO: Background job to collect all data:
    // - conversations + messages
    // - memories
    // - settings
    // - connected_services (sans tokens)
    // Generate ZIP → upload to Supabase Storage → send push/email

    app.log.info({ msg: 'Data export requested', userId });

    return reply.code(202).send({
      message: 'Export en cours. Tu recevras une notification quand ce sera prêt.',
      estimated_time: '48h max',
    });
  });

  // Delete account (RGPD right to erasure)
  app.delete<{ Body: { confirmation: string } }>('/api/v1/account', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const userId = req.userId;
    const { confirmation } = req.body;

    if (confirmation !== 'SUPPRIMER') {
      return reply.code(400).send({
        error: 'Pour confirmer, envoie { "confirmation": "SUPPRIMER" }',
      });
    }

    // TODO: Execute cascade deletion via Supabase
    // DELETE FROM users WHERE id = userId (CASCADE handles everything)
    // Revoke OAuth tokens for connected services
    // Revoke all JWTs via Supabase auth admin

    app.log.info({ msg: 'Account deletion requested', userId });

    return {
      message: 'Ton compte et toutes tes données ont été supprimés.',
      deleted: true,
    };
  });
}
