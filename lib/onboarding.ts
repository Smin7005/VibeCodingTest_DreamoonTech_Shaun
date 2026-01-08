import { createClient } from '@supabase/supabase-js';
import { OnboardingProgress } from './supabase';

// Initialize Supabase client (admin for server-side operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Initialize onboarding progress for a new user
 * Creates progress records for all steps based on user type
 */
export async function initializeOnboardingProgress(
  userId: string,
  userType: 'guest' | 'free'
): Promise<void> {
  const steps = userType === 'guest'
    ? [
        { step_number: 1, step_name: 'sign_up' },
        { step_number: 2, step_name: 'basic_info' },
        { step_number: 3, step_name: 'upload_resume' },
        { step_number: 4, step_name: 'view_analysis' },
      ]
    : [
        { step_number: 1, step_name: 'sign_up' },
        { step_number: 2, step_name: 'basic_info' },
        { step_number: 3, step_name: 'upload_resume' },
        { step_number: 4, step_name: 'dashboard_tour' },
        { step_number: 5, step_name: 'purchase_navigation' },
      ];

  const progressRecords = steps.map(step => ({
    user_id: userId,
    step_number: step.step_number,
    step_name: step.step_name,
    completed: false,
  }));

  const { error } = await supabaseAdmin
    .from('onboarding_progress')
    .insert(progressRecords);

  if (error) {
    console.error('Error initializing onboarding progress:', error);
    throw new Error('Failed to initialize onboarding progress');
  }
}

/**
 * Get current onboarding progress for a user
 * Returns array of progress records sorted by step number
 */
export async function getOnboardingProgress(
  userId: string
): Promise<OnboardingProgress[]> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_progress')
    .select('*')
    .eq('user_id', userId)
    .order('step_number', { ascending: true });

  if (error) {
    console.error('Error fetching onboarding progress:', error);
    throw new Error('Failed to fetch onboarding progress');
  }

  return data || [];
}

/**
 * Mark a specific step as complete
 * Updates the completed status and sets completed_at timestamp
 */
export async function completeStep(
  userId: string,
  stepNumber: number,
  stepName: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('onboarding_progress')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('step_number', stepNumber);

  if (error) {
    console.error('Error completing step:', error);
    throw new Error(`Failed to complete step ${stepNumber}`);
  }
}

/**
 * Get the current step number (first incomplete step)
 * Returns the step number of the first incomplete step, or total steps + 1 if all complete
 */
export async function getCurrentStep(userId: string): Promise<number> {
  const progress = await getOnboardingProgress(userId);

  // Find first incomplete step
  const firstIncompleteStep = progress.find(step => !step.completed);

  if (firstIncompleteStep) {
    return firstIncompleteStep.step_number;
  }

  // All steps complete
  return progress.length + 1;
}

/**
 * Check if user has completed all onboarding steps
 */
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const progress = await getOnboardingProgress(userId);

  // All steps must be completed
  return progress.every(step => step.completed);
}

/**
 * Reset onboarding progress for a user (useful for testing)
 * WARNING: This deletes all progress records
 */
export async function resetOnboardingProgress(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('onboarding_progress')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error resetting onboarding progress:', error);
    throw new Error('Failed to reset onboarding progress');
  }
}

/**
 * Check if onboarding progress exists for a user
 * Returns true if any progress records exist
 */
export async function hasOnboardingProgress(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_progress')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (error) {
    console.error('Error checking onboarding progress:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}
