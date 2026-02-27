/**
 * Redis client singleton for job queues (STT/TTS workers) and rate limiting.
 */
import IORedis from 'ioredis';

type RedisInstance = IORedis.default;
const RedisConstructor = IORedis.default ?? IORedis;

let _client: RedisInstance | null = null;

export function getRedis(): RedisInstance {
  if (_client) return _client;

  const url = process.env['REDIS_URL'] || 'redis://localhost:6379';

  _client = new (RedisConstructor as new (...args: unknown[]) => RedisInstance)(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 10) return null;
      return Math.min(times * 200, 5000);
    },
    lazyConnect: true,
  });

  _client.on('error', (err: Error) => {
    console.error('[Redis] Connection error:', err.message);
  });

  _client.on('connect', () => {
    console.log('[Redis] Connected');
  });

  return _client;
}

/** Graceful disconnect */
export async function closeRedis(): Promise<void> {
  if (_client) {
    await _client.quit();
    _client = null;
  }
}

/**
 * Daily rate limiter using Redis.
 * Key: elio:usage:{userId}:{YYYY-MM-DD}
 * Expires at end of day.
 */
export async function incrementDailyUsage(userId: string): Promise<{ used: number }> {
  const redis = getRedis();
  const today = new Date().toISOString().split('T')[0];
  const key = `elio:usage:${userId}:${today}`;

  const used = await redis.incr(key);

  // Set TTL if this is the first increment today
  if (used === 1) {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const ttl = Math.ceil((endOfDay.getTime() - now.getTime()) / 1000);
    await redis.expire(key, ttl);
  }

  return { used };
}

export async function getDailyUsage(userId: string): Promise<number> {
  const redis = getRedis();
  const today = new Date().toISOString().split('T')[0];
  const key = `elio:usage:${userId}:${today}`;
  const val = await redis.get(key);
  return val ? parseInt(val, 10) : 0;
}

/**
 * STT/TTS job queue helpers.
 * Workers poll via BRPOP, results stored with TTL.
 */
export interface JobPayload {
  jobId: string;
  userId: string;
  data: string;  // base64 audio or text
  timestamp: number;
}

export async function enqueueJob(queue: string, payload: JobPayload): Promise<void> {
  const redis = getRedis();
  await redis.lpush(queue, JSON.stringify(payload));
}

export async function getJobResult(jobId: string, timeoutMs = 10000): Promise<string | null> {
  const redis = getRedis();
  const key = `elio:result:${jobId}`;

  // Poll for result (workers set this key when done)
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await redis.get(key);
    if (result) {
      await redis.del(key);
      return result;
    }
    await new Promise(r => setTimeout(r, 100));
  }

  return null;
}

export async function setJobResult(jobId: string, result: string, ttlSeconds = 60): Promise<void> {
  const redis = getRedis();
  const key = `elio:result:${jobId}`;
  await redis.set(key, result, 'EX', ttlSeconds);
}
