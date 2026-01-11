import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import {
  getOnboardingProgress,
  completeStep,
  getCurrentStep,
} from '@/lib/onboarding';

// Force dynamic rendering - this route uses auth headers
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Helper function to get or create user profile
 * Handles race condition where user lands on onboarding before webhook creates profile
 */
async function getOrCreateUserProfile(clerkUserId: string) {
  // First try to get existing profile
  const { data: existingProfile, error: fetchError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, user_type')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (existingProfile) {
    return existingProfile;
  }

  // Profile doesn't exist - create it (webhook hasn't fired yet)
  console.log('Profile not found, creating for clerk user:', clerkUserId);

  // Get user details from Clerk
  const user = await currentUser();
  if (!user) {
    throw new Error('Could not get current user from Clerk');
  }

  const email = user.emailAddresses[0]?.emailAddress || '';
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';

  // Create user profile
  const { data: newProfile, error: createError } = await supabaseAdmin
    .from('user_profiles')
    .insert({
      clerk_user_id: clerkUserId,
      email: email,
      name: name,
      user_type: 'guest',
      profile_completion: 0,
    })
    .select('id, user_type')
    .single();

  if (createError) {
    // Check if it was created by webhook in the meantime (race condition)
    if (createError.code === '23505') { // unique_violation
      const { data: retryProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('id, user_type')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (retryProfile) {
        return retryProfile;
      }
    }
    console.error('Error creating user profile:', createError);
    throw new Error('Failed to create user profile');
  }

  console.log('Created user profile:', newProfile.id);

  // Initialize onboarding progress
  const guestSteps = [
    { step_number: 1, step_name: 'sign-up', completed: true },
    { step_number: 2, step_name: 'basic-information', completed: false },
    { step_number: 3, step_name: 'resume-upload', completed: false },
    { step_number: 4, step_name: 'analysis-results', completed: false },
  ];

  await supabaseAdmin
    .from('onboarding_progress')
    .insert(
      guestSteps.map(step => ({
        user_id: newProfile.id,
        step_number: step.step_number,
        step_name: step.step_name,
        completed: step.completed,
        completed_at: step.completed ? new Date().toISOString() : null,
      }))
    );

  console.log('Initialized onboarding progress for user:', newProfile.id);

  return newProfile;
}

/**
 * GET /api/onboarding/progress
 * Fetch user's onboarding progress
 *
 * Response:
 * {
 *   steps: OnboardingProgress[],
 *   current_step: number,
 *   user_type: 'guest' | 'free' | 'member'
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create user profile (handles race condition with webhook)
    const profile = await getOrCreateUserProfile(userId);

    // Get onboarding progress
    const steps = await getOnboardingProgress(profile.id);

    // Calculate current step
    const currentStep = await getCurrentStep(profile.id);

    return NextResponse.json({
      steps,
      current_step: currentStep,
      user_type: profile.user_type,
    });
  } catch (error) {
    console.error('Error in GET /api/onboarding/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding/progress
 * Update step completion status
 *
 * Body:
 * {
 *   step_number: number,
 *   step_name: string,
 *   completed: boolean
 * }
 *
 * Response:
 * {
 *   success: true,
 *   current_step: number
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { step_number, step_name, completed } = body;

    // Validate input
    if (typeof step_number !== 'number' || !step_name) {
      return NextResponse.json(
        { error: 'Invalid request body. Required: step_number, step_name' },
        { status: 400 }
      );
    }

    // Get or create user profile (handles race condition with webhook)
    const profile = await getOrCreateUserProfile(userId);

    // Check if progress exists (getOrCreateUserProfile already creates it for new users)
    const existingProgress = await getOnboardingProgress(profile.id);

    // If no progress exists (shouldn't happen, but just in case), initialize it
    if (!existingProgress || existingProgress.length === 0) {
      console.log('Initializing onboarding progress for user:', profile.id);
      const guestSteps = [
        { step_number: 1, step_name: 'sign-up', completed: true },
        { step_number: 2, step_name: 'basic-information', completed: false },
        { step_number: 3, step_name: 'resume-upload', completed: false },
        { step_number: 4, step_name: 'analysis-results', completed: false },
      ];

      await supabaseAdmin
        .from('onboarding_progress')
        .insert(
          guestSteps.map(step => ({
            user_id: profile.id,
            step_number: step.step_number,
            step_name: step.step_name,
            completed: step.completed,
            completed_at: step.completed ? new Date().toISOString() : null,
          }))
        );
    }

    // Update step completion
    if (completed !== undefined) {
      if (completed) {
        await completeStep(profile.id, step_number, step_name);
      }
    }

    // Get updated current step
    const currentStep = await getCurrentStep(profile.id);

    return NextResponse.json({
      success: true,
      current_step: currentStep,
    });
  } catch (error) {
    console.error('Error in POST /api/onboarding/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
