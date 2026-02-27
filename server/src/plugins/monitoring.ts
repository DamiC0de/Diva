/**
 * EL-005 — Monitoring & Logging (Sentry + Pino)
 *
 * Sentry for error tracking, Pino for structured logs (built into Fastify).
 * Pipeline metrics logged at each stage.
 */

import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

// Pipeline metrics type
export interface PipelineMetrics {
  requestId: string;
  userId: string;
  sttMs?: number;
  llmTtftMs?: number;
  llmTotalMs?: number;
  llmTokensIn?: number;
  llmTokensOut?: number;
  llmCacheHit?: boolean;
  ttsMs?: number;
  totalMs: number;
  success: boolean;
  error?: string;
}

async function monitoringPlugin(app: FastifyInstance): Promise<void> {
  const sentryDsn = process.env['SENTRY_DSN'];

  if (sentryDsn) {
    // Dynamic import to avoid requiring Sentry in dev
    try {
      const Sentry = await import('@sentry/node');
      Sentry.init({
        dsn: sentryDsn,
        environment: app.config.NODE_ENV,
        tracesSampleRate: app.config.NODE_ENV === 'production' ? 0.2 : 1.0,
      });

      app.log.info('Sentry initialized');

      // Capture unhandled errors
      app.addHook('onError', (_request, _reply, error, done) => {
        Sentry.captureException(error);
        done();
      });
    } catch {
      app.log.warn('Sentry SDK not installed — skipping error tracking');
    }
  } else {
    app.log.info('SENTRY_DSN not set — error tracking disabled');
  }

  // Request logging with timing
  app.addHook('onResponse', (request, reply, done) => {
    app.log.info({
      event: 'request_completed',
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
      userId: request.userId ?? 'anonymous',
    });
    done();
  });

  // Pipeline metrics logger
  app.decorate('logPipelineMetrics', (metrics: PipelineMetrics) => {
    app.log.info({
      event: 'pipeline_complete',
      ...metrics,
    });
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    logPipelineMetrics: (metrics: PipelineMetrics) => void;
  }
}

export default fp(monitoringPlugin, { name: 'monitoring' });
