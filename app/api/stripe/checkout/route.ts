import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrCreateStripeCustomer } from '@/lib/subscription';

// Force dynamic rendering - this route uses auth headers
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get plan type from request body
    const body = await req.json();
    const { planType } = body;

    if (!planType || !['monthly', 'yearly'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "monthly" or "yearly".' },
        { status: 400 }
      );
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, name')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (profileError || !userProfile) {
      console.error('User profile not found:', profileError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(
      userProfile.id,
      userProfile.email,
      userProfile.name
    );

    // Select price ID based on plan type
    const priceId = planType === 'yearly'
      ? STRIPE_PRICES.PREMIUM_YEARLY
      : STRIPE_PRICES.PREMIUM_MONTHLY;

    // Get the app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscription/cancelled`,
      metadata: {
        userId: userProfile.id,
        planType: planType === 'yearly' ? 'premium_yearly' : 'premium_monthly',
      },
      subscription_data: {
        metadata: {
          userId: userProfile.id,
        },
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address
      billing_address_collection: 'auto',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
