/**
 * EL-027 — Settings API (wired to Supabase)
 */
import type { FastifyInstance } from 'fastify';
import { getSupabase } from '../lib/supabase.js';

interface SettingsPatchBody {
  settings: Record<string, unknown>;
}

export async function settingsRoutes(app: FastifyInstance) {
  const db = getSupabase();

  // Get user settings
  app.get('/api/v1/settings', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    app.log.info({ msg: 'GET /api/v1/settings', userId: request.userId });
    const { data, error } = await db
      .from('users')
      .select('settings')
      .eq('id', request.userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No row yet — user should exist from auth, just return defaults
      app.log.warn({ msg: 'No user row found for settings', userId: request.userId });
      return { settings: {} };
    }

    if (error) {
      app.log.error({ msg: 'Failed to fetch settings', error });
      return reply.code(500).send({ error: 'Impossible de charger les paramètres' });
    }

    return { settings: data?.settings ?? {} };
  });

  // Update settings (JSONB merge)
  app.patch<{ Body: SettingsPatchBody }>('/api/v1/settings', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { settings: newSettings } = request.body;
    app.log.info({ msg: 'PATCH /api/v1/settings', userId: request.userId, settings: newSettings });

    if (!newSettings || typeof newSettings !== 'object') {
      return reply.code(400).send({ error: 'Settings object required' });
    }

    // Fetch current settings first for deep merge
    const { data: current } = await db
      .from('users')
      .select('settings')
      .eq('id', request.userId)
      .single();

    const merged = deepMerge(current?.settings ?? {}, newSettings);

    // Use UPDATE instead of UPSERT to avoid NOT NULL constraint on email
    const { data, error } = await db
      .from('users')
      .update({ settings: merged })
      .eq('id', request.userId)
      .select('settings')
      .single();

    if (error) {
      app.log.error({ msg: 'Failed to update settings', error });
      return reply.code(500).send({ error: 'Impossible de sauvegarder les paramètres' });
    }

    return { settings: data?.settings };
  });
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
