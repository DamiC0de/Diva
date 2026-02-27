/**
 * EL-016 — Notification Scheduler (wired to Supabase)
 * Checks for due reminders every minute and sends push notifications.
 */
import type { FastifyBaseLogger } from 'fastify';
import { getSupabase } from '../lib/supabase.js';
import { NotificationService } from './notifications.js';

export class NotificationScheduler {
  private logger: FastifyBaseLogger;
  private notificationService: NotificationService;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
    this.notificationService = new NotificationService(logger);
  }

  /** Start the scheduler (checks every 60s) */
  start(): void {
    this.logger.info('Notification scheduler started');
    this.intervalId = setInterval(() => this.checkDueReminders(), 60_000);
    // Also check immediately on start
    this.checkDueReminders();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.info('Notification scheduler stopped');
    }
  }

  private async checkDueReminders(): Promise<void> {
    try {
      const db = getSupabase();

      // Find due reminders
      const { data: reminders, error } = await db
        .from('memories')
        .select('id, user_id, content, remind_at')
        .eq('category', 'reminder')
        .eq('sent', false)
        .not('remind_at', 'is', null)
        .lte('remind_at', new Date().toISOString())
        .limit(50);

      if (error) {
        this.logger.error({ msg: 'Failed to query reminders', error });
        return;
      }

      if (!reminders?.length) return;

      this.logger.info({ msg: 'Due reminders found', count: reminders.length });

      for (const reminder of reminders) {
        // Get user's push token
        const { data: user } = await db
          .from('users')
          .select('push_token')
          .eq('id', reminder.user_id)
          .single();

        if (!user?.push_token) {
          this.logger.warn({ msg: 'No push token', userId: reminder.user_id });
          continue;
        }

        const sent = await this.notificationService.sendPush({
          to: user.push_token,
          title: 'Elio 🔔',
          body: reminder.content,
          data: { type: 'reminder', reminderId: reminder.id },
        });

        if (sent) {
          // Mark as sent
          await db
            .from('memories')
            .update({ sent: true })
            .eq('id', reminder.id);
        }
      }
    } catch (error) {
      this.logger.error({ msg: 'Scheduler error', error });
    }
  }
}
