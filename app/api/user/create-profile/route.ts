import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

// Clerk webhook handler for user creation
export async function POST(req: NextRequest) {
  // Get Clerk webhook secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Get the raw body for verification
  console.log('📥 Webhook received from Clerk');
  const body = await req.text();
  const payload = JSON.parse(body);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any;
    console.log('✅ Webhook signature verified successfully');
  } catch (err) {
    console.error('❌ Error verifying webhook signature:', err);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 400 }
    );
  }

  // Handle the webhook event
  const eventType = evt.type;
  console.log(`📨 Event type: ${eventType}`);

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim() || 'User';

    console.log(`👤 Creating profile for user: ${email} (Clerk ID: ${id})`);

    try {
      // Create user profile in Supabase
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          clerk_user_id: id,
          email: email,
          name: name,
          user_type: 'guest',
          profile_completion: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error creating user profile:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return NextResponse.json(
          { error: 'Failed to create user profile', details: error.message },
          { status: 500 }
        );
      }

      console.log('✅ User profile created successfully!');
      console.log('Profile data:', {
        id: data.id,
        clerk_user_id: data.clerk_user_id,
        email: data.email,
        name: data.name,
        user_type: data.user_type,
      });
      return NextResponse.json({ success: true, data });
    } catch (err) {
      console.error('❌ Exception in user creation:', err);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  // Return success for other event types
  console.log(`ℹ️ Ignoring event type: ${eventType}`);
  return NextResponse.json({ success: true });
}
