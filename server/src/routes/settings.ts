/**
 * EL-027 — User Settings / Personality configuration
 */

import type { FastifyInstance } from 'fastify';

interface UpdateSettingsBody {
  personality?: {
    tone?: 'friendly' | 'professional' | 'casual';
    verbosity?: 'concise' | 'normal' | 'detailed';
    formality?: 'tu' | 'vous';
    humor?: boolean;
  };
  voice?: {
    wake_word_mode?: 'always_on' | 'smart' | 'manual';
  };
  name?: string;
  timezone?: string;
}

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  // Get user settings
  app.get(
    '/api/v1/settings',
    { preHandler: [app.authenticate] },
    async (request, _reply) => {
      // TODO: fetch from Supabase users.settings WHERE id = request.userId
      return {
        personality: {
          tone: 'friendly',
          verbosity: 'normal',
          formality: 'tu',
          humor: true,
        },
        voice: {
          wake_word_mode: 'manual',
        },
        name: '',
        timezone: 'Europe/Paris',
      };
    },
  );

  // Update user settings (partial merge)
  app.patch<{ Body: UpdateSettingsBody }>(
    '/api/v1/settings',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const updates = request.body;

      // Validate
      if (updates.personality?.tone &&
        !['friendly', 'professional', 'casual'].includes(updates.personality.tone)) {
        return reply.code(400).send({ error: 'Invalid tone' });
      }

      if (updates.personality?.verbosity &&
        !['concise', 'normal', 'detailed'].includes(updates.personality.verbosity)) {
        return reply.code(400).send({ error: 'Invalid verbosity' });
      }

      // TODO: JSONB merge update in Supabase
      // UPDATE users SET settings = settings || $1 WHERE id = request.userId
      app.log.info({
        msg: 'Settings updated',
        userId: request.userId,
        updates,
      });

      return { success: true, settings: updates };
    },
  );
}
