import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

// Force dynamic rendering - this route uses auth headers
export const dynamic = 'force-dynamic';

// PATCH - Update basic info
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, role, target_position, city } = await req.json();

    // Validate required fields
    if (!name || name.length < 2 || name.length > 50) {
      return NextResponse.json({ error: 'Name must be 2-50 characters' }, { status: 400 });
    }
    if (!role || role.length < 2 || role.length > 50) {
      return NextResponse.json({ error: 'Role must be 2-50 characters' }, { status: 400 });
    }
    if (!target_position || target_position.length < 2 || target_position.length > 100) {
      return NextResponse.json({ error: 'Target position must be 2-100 characters' }, { status: 400 });
    }
    if (!city || city.length < 2 || city.length > 50) {
      return NextResponse.json({ error: 'City must be 2-50 characters' }, { status: 400 });
    }

    // Update user profile
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        name,
        role,
        target_position,
        city,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating basic info:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Mark onboarding step as complete - check if exists then update or insert
    const { data: userProfileForOnboarding } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userProfileForOnboarding) {
      // Check if step exists
      const { data: existingStep } = await supabaseAdmin
        .from('onboarding_progress')
        .select('id')
        .eq('user_id', userProfileForOnboarding.id)
        .eq('step_name', 'basic-information')
        .maybeSingle();

      if (existingStep) {
        // Update existing step
        await supabaseAdmin
          .from('onboarding_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingStep.id);
      } else {
        // Create new step
        await supabaseAdmin
          .from('onboarding_progress')
          .insert({
            user_id: userProfileForOnboarding.id,
            step_number: 2,
            step_name: 'basic-information',
            completed: true,
            completed_at: new Date().toISOString(),
          });
      }
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating basic info:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
