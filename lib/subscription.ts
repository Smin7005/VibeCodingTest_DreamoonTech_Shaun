import { supabaseAdmin, Subscription } from './supabase';
import { stripe, PlanType } from './stripe';
import Stripe from 'stripe';

// Create or get Stripe customer for a user
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Check if user already has a Stripe customer ID
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingSub?.stripe_customer_id) {
    return existingSub.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  return customer.id;
}

// Create subscription record in database
export async function createSubscriptionRecord(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  planType: PlanType,
  status: 'active' | 'cancelled' | 'expired',
  periodStart: Date,
  periodEnd: Date
): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        plan_type: planType,
        status,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error creating subscription record:', error);
    return null;
  }

  return data;
}

// Update subscription status
export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: 'active' | 'cancelled' | 'expired',
  cancelAtPeriodEnd: boolean = false,
  periodEnd?: Date
): Promise<boolean> {
  const updateData: Record<string, unknown> = {
    status,
    cancel_at_period_end: cancelAtPeriodEnd,
  };

  if (periodEnd) {
    updateData.current_period_end = periodEnd.toISOString();
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', stripeSubscriptionId);

  if (error) {
    console.error('Error updating subscription status:', error);
    return false;
  }

  return true;
}

// Update user type based on subscription
export async function updateUserType(
  userId: string,
  userType: 'free' | 'member'
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ user_type: userType })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user type:', error);
    return false;
  }

  return true;
}

// Get user ID from Stripe customer ID
export async function getUserIdFromStripeCustomer(
  stripeCustomerId: string
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  return data?.user_id || null;
}

// Get subscription by user ID
export async function getSubscriptionByUserId(
  userId: string
): Promise<Subscription | null> {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return data;
}

// Record subscription history event
export async function recordSubscriptionHistory(
  userId: string,
  subscriptionId: string,
  eventType: 'created' | 'updated' | 'cancelled' | 'expired',
  oldStatus?: string,
  newStatus?: string,
  oldPlan?: string,
  newPlan?: string
): Promise<void> {
  await supabaseAdmin.from('subscription_history').insert({
    user_id: userId,
    subscription_id: subscriptionId,
    event_type: eventType,
    old_status: oldStatus || null,
    new_status: newStatus || null,
    old_plan: oldPlan || null,
    new_plan: newPlan || null,
  });
}

// Handle subscription from Stripe subscription object
export async function handleStripeSubscription(
  stripeSubscription: Stripe.Subscription,
  userId: string
): Promise<void> {
  const customerId = stripeSubscription.customer as string;
  const subscriptionId = stripeSubscription.id;
  const status = stripeSubscription.status === 'active' ? 'active' :
                 stripeSubscription.status === 'canceled' ? 'cancelled' : 'expired';

  // Get plan type from price ID
  const priceId = stripeSubscription.items.data[0]?.price.id;
  let planType: PlanType = 'premium_monthly';

  if (priceId === process.env.STRIPE_PRICE_YEARLY) {
    planType = 'premium_yearly';
  }

  // Convert to plain object to access period dates
  const subObj = JSON.parse(JSON.stringify(stripeSubscription));
  const periodStartTimestamp = subObj.current_period_start || Math.floor(Date.now() / 1000);
  const periodEndTimestamp = subObj.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  const periodStart = new Date(periodStartTimestamp * 1000);
  const periodEnd = new Date(periodEndTimestamp * 1000);

  // Create or update subscription record
  await createSubscriptionRecord(
    userId,
    customerId,
    subscriptionId,
    planType,
    status as 'active' | 'cancelled' | 'expired',
    periodStart,
    periodEnd
  );

  // Update user type if subscription is active
  if (status === 'active') {
    await updateUserType(userId, 'member');
  }
}

// Check if subscription is still valid (not expired)
export function isSubscriptionValid(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (subscription.status === 'expired') return false;

  // If cancelled but still within period
  if (subscription.status === 'cancelled' && subscription.current_period_end) {
    const periodEnd = new Date(subscription.current_period_end);
    return periodEnd > new Date();
  }

  return subscription.status === 'active';
}
