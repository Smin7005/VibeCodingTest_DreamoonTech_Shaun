import { NextRequest, NextResponse } from 'next/server';
import { stripe, constructWebhookEvent, getPlanTypeFromPriceId } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import {
  createSubscriptionRecord,
  updateSubscriptionStatus,
  updateUserType,
  getUserIdFromStripeCustomer,
  recordSubscriptionHistory,
} from '@/lib/subscription';
import Stripe from 'stripe';

// Disable body parsing - we need raw body for webhook signature verification
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature and construct event
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log('Received Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handle checkout.session.completed
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed');
  console.log('Session metadata:', JSON.stringify(session.metadata));
  console.log('Session customer:', session.customer);
  console.log('Session subscription:', session.subscription);

  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !subscriptionId) {
    console.error('Missing userId or subscriptionId in session metadata');
    console.error('userId:', userId, 'subscriptionId:', subscriptionId);
    return;
  }

  // Retrieve the subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Get plan type from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const planType = getPlanTypeFromPriceId(priceId) || 'premium_monthly';

  const periodStart = new Date(subscription.current_period_start * 1000);
  const periodEnd = new Date(subscription.current_period_end * 1000);

  console.log('Creating subscription record with:', {
    userId,
    customerId,
    subscriptionId,
    planType,
    periodStart,
    periodEnd,
  });

  // Create subscription record in database
  const subscriptionRecord = await createSubscriptionRecord(
    userId,
    customerId,
    subscriptionId,
    planType,
    'active',
    periodStart,
    periodEnd
  );

  console.log('Subscription record result:', subscriptionRecord);

  if (subscriptionRecord) {
    // Update user type to member
    await updateUserType(userId, 'member');

    // Record subscription history
    await recordSubscriptionHistory(
      userId,
      subscriptionRecord.id,
      'created',
      undefined,
      'active',
      undefined,
      planType
    );

    console.log(`Subscription created for user ${userId}, plan: ${planType}`);
  }
}

// Handle customer.subscription.updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.updated');

  const subscriptionId = subscription.id;
  const customerId = subscription.customer as string;

  // Get user ID from customer ID
  const userId = await getUserIdFromStripeCustomer(customerId);
  if (!userId) {
    console.error('Could not find user for customer:', customerId);
    return;
  }

  // Get current subscription from database
  const { data: currentSub } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  // Determine new status
  let status: 'active' | 'cancelled' | 'expired' = 'active';
  if (subscription.status === 'canceled') {
    status = 'cancelled';
  } else if (subscription.status !== 'active') {
    status = 'expired';
  }

  // Check if subscription is set to cancel at period end
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  // Get new plan type
  const priceId = subscription.items.data[0]?.price.id;
  const newPlanType = getPlanTypeFromPriceId(priceId) || 'premium_monthly';

  const periodEnd = new Date(subscription.current_period_end * 1000);

  // Update subscription status
  await updateSubscriptionStatus(
    subscriptionId,
    cancelAtPeriodEnd ? 'cancelled' : status,
    cancelAtPeriodEnd,
    periodEnd
  );

  // Update plan type if changed
  if (currentSub && currentSub.plan_type !== newPlanType) {
    await supabaseAdmin
      .from('subscriptions')
      .update({ plan_type: newPlanType })
      .eq('stripe_subscription_id', subscriptionId);

    // Record plan change in history
    await recordSubscriptionHistory(
      userId,
      currentSub.id,
      'updated',
      currentSub.plan_type,
      newPlanType,
      currentSub.plan_type,
      newPlanType
    );
  }

  // If subscription is truly active (not cancelling), ensure user is a member
  if (status === 'active' && !cancelAtPeriodEnd) {
    await updateUserType(userId, 'member');
  }

  console.log(`Subscription updated for user ${userId}, status: ${status}, cancelAtPeriodEnd: ${cancelAtPeriodEnd}`);
}

// Handle customer.subscription.deleted
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.deleted');

  const subscriptionId = subscription.id;
  const customerId = subscription.customer as string;

  // Get user ID from customer ID
  const userId = await getUserIdFromStripeCustomer(customerId);
  if (!userId) {
    console.error('Could not find user for customer:', customerId);
    return;
  }

  // Get subscription record
  const { data: subscriptionRecord } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  // Update subscription status to expired
  await updateSubscriptionStatus(subscriptionId, 'expired', false);

  // Revert user type to free
  await updateUserType(userId, 'free');

  // Record in history
  if (subscriptionRecord) {
    await recordSubscriptionHistory(
      userId,
      subscriptionRecord.id,
      'expired',
      'active',
      'expired'
    );
  }

  console.log(`Subscription deleted for user ${userId}, reverted to free`);
}

// Handle invoice.payment_failed
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_failed');

  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  // Get user ID from customer ID
  const userId = await getUserIdFromStripeCustomer(customerId);
  if (!userId) {
    console.error('Could not find user for customer:', customerId);
    return;
  }

  // Log the payment failure (could send email notification here)
  console.error(`Payment failed for user ${userId}, subscription ${subscriptionId}`);

  // Note: Stripe will automatically retry failed payments
  // After all retries fail, it will trigger customer.subscription.deleted
}
