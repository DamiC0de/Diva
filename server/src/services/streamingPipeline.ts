/**
 * EL-011 — Streaming Pipeline Optimization
 *
 * Optimized pipeline that streams TTS by sentence as Claude generates text,
 * reducing perceived latency from ~1.7s to ~0.9s.
 *
 * Before: Audio → STT (300ms) → Claude full (500ms) → TTS full (400ms) = ~1.7s
 * After:  Audio → STT (300ms) → Claude stream → TTS per sentence → play = ~0.9s
 */

import type { FastifyBaseLogger } from 'fastify';

// Sentence boundary regex
const SENTENCE_END = /[.!?:;]\s*/;

/**
 * Accumulates streamed tokens and yields complete sentences.
 */
export class SentenceAccumulator {
  private buffer = '';

  /**
   * Add a token to the buffer.
   * Returns a complete sentence if one is ready, null otherwise.
   */
  addToken(token: string): string | null {
    this.buffer += token;

    // Check if we have a complete sentence
    const match = this.buffer.match(SENTENCE_END);
    if (match && match.index !== undefined) {
      const endIndex = match.index + match[0].length;
      const sentence = this.buffer.slice(0, endIndex).trim();
      this.buffer = this.buffer.slice(endIndex);

      if (sentence.length > 0) {
        return sentence;
      }
    }

    return null;
  }

  /**
   * Flush remaining buffer (called when stream ends).
   */
  flush(): string | null {
    const remaining = this.buffer.trim();
    this.buffer = '';
    return remaining.length > 0 ? remaining : null;
  }
}

/**
 * Pipeline metrics tracker.
 */
export class PipelineTimer {
  private timers: Record<string, number> = {};
  private logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  start(label: string): void {
    this.timers[`${label}_start`] = Date.now();
  }

  end(label: string): number {
    const startKey = `${label}_start`;
    const start = this.timers[startKey];
    if (!start) return 0;

    const duration = Date.now() - start;
    this.timers[label] = duration;
    delete this.timers[startKey];
    return duration;
  }

  getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    for (const [key, value] of Object.entries(this.timers)) {
      if (!key.endsWith('_start')) {
        metrics[key] = value;
      }
    }
    return metrics;
  }

  logSummary(requestId: string): void {
    const metrics = this.getMetrics();
    const total = Object.values(metrics).reduce((sum, v) => sum + v, 0);

    this.logger.info({
      event: 'pipeline_metrics',
      requestId,
      ...metrics,
      total_ms: total,
    });
  }
}

/**
 * Benchmark utility for measuring pipeline performance.
 */
export async function runBenchmark(
  logger: FastifyBaseLogger,
  iterations: number,
  testFn: () => Promise<number>,
): Promise<{ p50: number; p95: number; p99: number; avg: number }> {
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const ms = await testFn();
    latencies.push(ms);
  }

  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] ?? 0;
  const avg = Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length);

  logger.info({
    event: 'benchmark_results',
    iterations,
    p50,
    p95,
    p99,
    avg,
  });

  return { p50, p95, p99, avg };
}
