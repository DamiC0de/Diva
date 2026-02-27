import { buildApp } from './app.js';
import { NotificationScheduler } from './services/notificationScheduler.js';

async function start() {
  const app = await buildApp();

  try {
    const address = await app.listen({
      port: app.config.PORT,
      host: app.config.HOST,
    });
    app.log.info(`🚀 Elio API Gateway running at ${address}`);

    // Start notification scheduler (checks reminders every minute)
    const scheduler = new NotificationScheduler(app.log);
    scheduler.start();

    // Graceful shutdown
    const shutdown = async () => {
      scheduler.stop();
      await app.close();
      process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
