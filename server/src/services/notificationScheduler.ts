/**
 * EL-016 — Notification Scheduler
 *
 * Checks for due reminders every minute and sends push notifications via APNs.
 */

import type { FastifyBaseLogger } from 'fastify';

interface Reminder {
  id: string;
  userId: string;
  content: string;
  remindAt: Date;
  pushToken: string;
}

export class NotificationScheduler {
  private logger: FastifyBaseLogger;
  private intervalHandle?: ReturnType<typeof setInterval>;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  /**
   * Start the scheduler (checks every 60 seconds).
   */
  start(): void {
    this.logger.info('Notification scheduler started');

    this.intervalHandle = setInterval(async () => {
      await this.checkDueReminders();
    }, 60_000);

    // Check immediately on start
    this.checkDueReminders();
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.logger.info('Notification scheduler stopped');
    }
  }

  private async checkDueReminders(): Promise<void> {
    try {
      // TODO: Query Supabase
      // SELECT m.id, m.user_id, m.content, m.remind_at, u.push_token
      // FROM memories m
      // JOIN users u ON u.id = m.user_id
      // WHERE m.category = 'reminder'
      //   AND m.remind_at <= NOW()
      //   AND m.sent = FALSE
      //   AND u.push_token IS NOT NULL

      const dueReminders: Reminder[] = []; // placeholder

      for (const reminder of dueReminders) {
        await this.sendPushNotification(reminder);

        // Mark as sent
        // UPDATE memories SET sent = TRUE WHERE id = $id
      }

      if (dueReminders.length > 0) {
        this.logger.info({ msg: 'Reminders sent', count: dueReminders.length });
      }
    } catch (error) {
      this.logger.error({ msg: 'Scheduler error', error });
    }
  }

  private async sendPushNotification(reminder: Reminder): Promise<void> {
    // TODO: Send via expo-server-sdk or APNs directly
    //
    // Using Expo push notifications:
    // const expo = new Expo();
    // await expo.sendPushNotificationsAsync([{
    //   to: reminder.pushToken,
    //   title: 'Elio 🔔',
    //   body: reminder.content,
    //   data: { type: 'reminder', reminderId: reminder.id },
    //   sound: 'default',
    // }]);

    this.logger.info({
      msg: 'Push notification sent',
      userId: reminder.userId,
      content: reminder.content.slice(0, 50),
    });
  }
}
