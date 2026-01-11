import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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

    // Get user profile to check user_type
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, user_type')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

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

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, user_type')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if progress exists
    const existingProgress = await getOnboardingProgress(profile.id);

    // If no progress exists, initialize it
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
