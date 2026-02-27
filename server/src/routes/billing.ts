/**
 * EL-004 — Billing & Subscription (RevenueCat webhooks)
 */

import type { FastifyInstance } from 'fastify';

interface RevenueCatWebhookBody {
  event: {
    type: string; // INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION
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
  // RevenueCat webhook
  app.post<{ Body: RevenueCatWebhookBody }>(
    '/api/v1/webhooks/revenuecat',
    async (request, reply) => {
      // TODO: verify webhook signature
      const { event } = request.body;

      app.log.info({
        msg: 'RevenueCat webhook',
        type: event.type,
        userId: event.app_user_id,
        product: event.product_id,
      });

      const tier = PRODUCT_TO_TIER[event.product_id] ?? 'free';

      switch (event.type) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
          // TODO: UPDATE users SET subscription_tier = $tier WHERE id = $userId
          app.log.info({ msg: 'Subscription activated', userId: event.app_user_id, tier });
          break;

        case 'CANCELLATION':
        case 'EXPIRATION':
          // Downgrade to free
          // TODO: UPDATE users SET subscription_tier = 'free' WHERE id = $userId
          app.log.info({ msg: 'Subscription expired', userId: event.app_user_id });
          break;

        default:
          app.log.info({ msg: 'Unhandled webhook event', type: event.type });
      }

      return reply.code(200).send({ received: true });
    },
  );

  // Check rate limit for free tier
  app.get(
    '/api/v1/billing/usage',
    { preHandler: [app.authenticate] },
    async (request, _reply) => {
      // TODO: fetch from Redis counter + Supabase tier
      return {
        tier: 'free',
        dailyLimit: 10,
        used: 0,
        remaining: 10,
        resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      };
    },
  );
}
