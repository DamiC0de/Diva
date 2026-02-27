/**
 * EL-004 — Billing & Subscription (RevenueCat webhooks) — wired to Supabase
 */
import type { FastifyInstance } from 'fastify';
import { getSupabase } from '../lib/supabase.js';

interface RevenueCatWebhookBody {
  event: {
    type: string;
    app_user_id: string;
    product_id: string;
    purchased_at_ms: number;
    expiration_at_ms: number;
  };
}

const PRODUCT_TO_TIER: Record<string, string> = {
  'elio_pro_monthly': 'pro',
  'elio_pro_annual': 'annual',
  'elio_care_monthly': 'care',
};

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  const db = getSupabase();

  // RevenueCat webhook
  app.post<{ Body: RevenueCatWebhookBody }>(
    '/api/v1/webhooks/revenuecat',
    async (request, reply) => {
      // TODO: verify webhook signature (RevenueCat-Webhook-Signature header)
      const { event } = request.body;

      app.log.info({
        msg: 'RevenueCat webhook',
        type: event.type,
        userId: event.app_user_id,
        product: event.product_id,
      });

      const userId = event.app_user_id;

      switch (event.type) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL': {
          const tier = PRODUCT_TO_TIER[event.product_id] ?? 'pro';
          const { error } = await db
            .from('users')
            .update({ subscription_tier: tier })
            .eq('id', userId);
          if (error) app.log.error({ msg: 'Failed to update tier', error, userId });
          else app.log.info({ msg: 'Subscription activated', userId, tier });
          break;
        }

        case 'CANCELLATION':
        case 'EXPIRATION': {
          const { error } = await db
            .from('users')
            .update({ subscription_tier: 'free' })
            .eq('id', userId);
          if (error) app.log.error({ msg: 'Failed to downgrade', error, userId });
          else app.log.info({ msg: 'Subscription expired', userId });
          break;
        }

        default:
          app.log.info({ msg: 'Unhandled webhook event', type: event.type });
      }

      return reply.code(200).send({ received: true });
    },
  );

  // Usage / rate limit check
  app.get('/api/v1/billing/usage', {
    preHandler: [app.authenticate],
  }, async (request) => {
    const { data } = await db
      .from('users')
      .select('subscription_tier')
      .eq('id', request.userId)
      .single();

    const tier = data?.subscription_tier ?? 'free';
    const limits: Record<string, number> = { free: 10, pro: 500, annual: 500, care: 500 };
    const dailyLimit = limits[tier] ?? 10;

    // TODO: Track daily usage in Redis (INCR elio:usage:{userId}:{date}, EXPIRE 86400)
    const used = 0;

    return {
      tier,
      dailyLimit,
      used,
      remaining: dailyLimit - used,
      resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
    };
  });
}
