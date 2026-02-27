/**
 * EL-022 — Keyboard Extension API routes
 * Lightweight endpoints for the iOS keyboard extension.
 */

import type { FastifyInstance } from 'fastify';
import { getRedactionPrompt, type RedactionAction } from '../services/actions/redaction.js';
import { getTranslationPrompt } from '../services/actions/translation.js';

interface SuggestBody { context: string }
interface DictateBody { audio: string }
interface RedactBody { action: RedactionAction; text: string }
interface TranslateBody { text: string; target_language: string }

export async function keyboardRoutes(app: FastifyInstance) {
  // Contextual suggestion
  app.post<{ Body: SuggestBody }>('/api/v1/keyboard/suggest', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { context } = req.body;
    if (!context?.trim()) return reply.code(400).send({ error: 'Context required' });
    // TODO: Call Claude with lightweight completion prompt
    const suggestion = `[Suggestion pour: "${context.slice(-50)}"]`;
    return { suggestion, confidence: 0.8 };
  });

  // Voice dictation
  app.post<{ Body: DictateBody }>('/api/v1/keyboard/dictate', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { audio } = req.body;
    if (!audio) return reply.code(400).send({ error: 'Audio data required' });
    // TODO: Send to STT worker via Redis queue
    return { text: '[Transcription en cours...]' };
  });

  // EL-023 — Redaction (reformulate, correct, shorten, formalize, complete)
  app.post<{ Body: RedactBody }>('/api/v1/keyboard/redact', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { action, text } = req.body;
    if (!text?.trim()) return reply.code(400).send({ error: 'Text required' });
    void getRedactionPrompt(action, text);
    // TODO: Call Claude Haiku with _prompt, return result
    return { original: text, action, result: `[${action}: ${text.slice(0, 30)}...]` };
  });

  // EL-024 — Translation
  app.post<{ Body: TranslateBody }>('/api/v1/keyboard/translate', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { text, target_language } = req.body;
    if (!text?.trim()) return reply.code(400).send({ error: 'Text required' });
    void getTranslationPrompt(text, target_language);
    // TODO: Call Claude Haiku with prompt, return result
    return { original: text, target_language, translation: `[Traduction ${target_language}: ${text.slice(0, 30)}...]` };
  });
}
