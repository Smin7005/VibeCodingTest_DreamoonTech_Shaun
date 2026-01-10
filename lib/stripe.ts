import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe price IDs - set these in your Stripe Dashboard
// These should be configured as environment variables in production
export const STRIPE_PRICES = {
  PREMIUM_MONTHLY: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder',
  PREMIUM_YEARLY: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_placeholder',
} as const;

// Plan metadata
export const PLAN_DETAILS = {
  premium_monthly: {
    name: 'Premium Monthly',
    price: 19.99,
    interval: 'month' as const,
    priceId: STRIPE_PRICES.PREMIUM_MONTHLY,
  },
  premium_yearly: {
    name: 'Premium Yearly',
    price: 199,
    interval: 'year' as const,
    priceId: STRIPE_PRICES.PREMIUM_YEARLY,
  },
} as const;

export type PlanType = keyof typeof PLAN_DETAILS;

// Helper to get plan type from Stripe price ID
export function getPlanTypeFromPriceId(priceId: string): PlanType | null {
  if (priceId === STRIPE_PRICES.PREMIUM_MONTHLY) return 'premium_monthly';
  if (priceId === STRIPE_PRICES.PREMIUM_YEARLY) return 'premium_yearly';
  return null;
}

// Verify webhook signature
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
