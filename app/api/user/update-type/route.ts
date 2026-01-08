import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/user/update-type
 * Update user type (guest -> free -> member)
 *
 * Body:
 * {
 *   user_type: 'free' | 'member'
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { user_type } = body;

    // Validate user_type
    if (!user_type || !['free', 'member'].includes(user_type)) {
      return NextResponse.json(
        { error: 'Invalid user_type. Must be "free" or "member"' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, user_type')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Validate transition (guest -> free or free -> member)
    if (profile.user_type === 'guest' && user_type !== 'free') {
      return NextResponse.json(
        { error: 'Guest users can only transition to free' },
        { status: 400 }
      );
    }

    if (profile.user_type === 'free' && user_type !== 'member') {
      return NextResponse.json(
        { error: 'Free users can only transition to member' },
        { status: 400 }
      );
    }

    if (profile.user_type === 'member') {
      return NextResponse.json(
        { error: 'Member is the highest tier' },
        { status: 400 }
      );
    }

    // Update user type
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        user_type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating user type:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user type' },
        { status: 500 }
      );
    }

    // If transitioning from guest to free, add step 5 (dashboard-tour)
    if (profile.user_type === 'guest' && user_type === 'free') {
      const { error: tourStepError } = await supabaseAdmin
        .from('onboarding_progress')
        .insert({
          user_id: profile.id,
          step_number: 5,
          step_name: 'dashboard-tour',
          completed: false,
          completed_at: null,
        });

      if (tourStepError) {
        console.error('Warning: Failed to add dashboard tour step:', tourStepError);
        // Don't fail the whole request - user can still use the app
      } else {
        console.log('✅ Added step 5 (dashboard-tour) for new free user');
      }
    }

    console.log(`✅ User ${profile.id} transitioned from ${profile.user_type} to ${user_type}`);

    return NextResponse.json({
      success: true,
      user_type,
      message: `User type updated to ${user_type}`,
    });
  } catch (error) {
    console.error('Error in POST /api/user/update-type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
