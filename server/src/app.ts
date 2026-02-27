import Fastify from 'fastify';
import { registerEnv } from './config/env.js';
import { registerCors } from './plugins/cors.js';
import { registerRateLimit } from './plugins/rateLimit.js';
import { registerWebSocket } from './plugins/websocket.js';
import authPlugin from './plugins/auth.js';
import { healthRoutes } from './routes/health.js';
import { pingRoutes } from './routes/ping.js';
import { settingsRoutes } from './routes/settings.js';
import { userRoutes } from './routes/user.js';
import { wsRoutes } from './routes/ws.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
      transport:
        process.env['NODE_ENV'] !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // Config
  await registerEnv(app);

  // Plugins
  await registerCors(app);
  await registerRateLimit(app);
  await registerWebSocket(app);

  // Auth
  await app.register(authPlugin);

  // Routes
  await app.register(healthRoutes);
  await app.register(pingRoutes);
  await app.register(settingsRoutes);
  await app.register(userRoutes);
  await app.register(wsRoutes);

  return app;
}
