import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkUploadQuota } from '@/lib/quota';
import { calculateProfileCompletion } from '@/lib/dashboard';

// Force dynamic rendering - this route uses auth headers
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Dashboard API - Clerk User ID:', clerkUserId);

    // Get user profile directly from database
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (profileError || !userProfile) {
      console.error('User profile not found:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    console.log('Dashboard API - User Profile ID:', userProfile.id);

    // Fetch all dashboard data in parallel
    const [resumeResult, workExpResult, subscriptionResult, onboardingResult] = await Promise.all([
      // Get current resume (most recent if multiple exist with is_current=true)
      supabaseAdmin
        .from('resumes')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('is_current', true)
        .order('uploaded_at', { ascending: false })
        .limit(1),
      // Get work experiences
      supabaseAdmin
        .from('work_experiences')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('start_date', { ascending: false }),
      // Get subscription
      supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userProfile.id)
        .maybeSingle(),
      // Get onboarding progress
      supabaseAdmin
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('step_number', { ascending: true }),
    ]);

    // Get first resume from array result (we changed from maybeSingle to limit(1))
    const currentResume = resumeResult.data?.[0] || null;
    const workExperiences = workExpResult.data || [];
    const subscription = subscriptionResult.data;
    const onboardingSteps = onboardingResult.data || [];

    console.log('Dashboard API - Current Resume:', currentResume?.id);
    console.log('Dashboard API - Work Experiences:', workExperiences.length);

    // Get all resumes for version selector
    const { data: allResumes } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('uploaded_at', { ascending: false });

    // Get analysis for current resume
    let currentAnalysis = null;
    if (currentResume) {
      const { data: analysisData, error: analysisError } = await supabaseAdmin
        .from('resume_analyses')
        .select('*')
        .eq('resume_id', currentResume.id)
        .maybeSingle();

      if (analysisError) {
        console.error('Dashboard API - Analysis fetch error:', analysisError);
      }

      currentAnalysis = analysisData;
      console.log('Dashboard API - Analysis found:', !!currentAnalysis);
      if (currentAnalysis) {
        console.log('Dashboard API - Analysis has career_advice:', !!currentAnalysis.career_advice);
        console.log('Dashboard API - Analysis has skills:', Array.isArray(currentAnalysis.skills) ? currentAnalysis.skills.length : 'not array');
        console.log('Dashboard API - Analysis has basic_info:', !!currentAnalysis.basic_info);
      }
    }

    // Calculate profile completion
    const hasActiveSubscription = subscription?.status === 'active';
    const profileCompletion = calculateProfileCompletion(
      userProfile,
      !!currentResume,
      !!currentAnalysis,
      hasActiveSubscription
    );

    // Get quota info for free users
    let quota = null;
    if (userProfile.user_type === 'free') {
      quota = await checkUploadQuota(userProfile.id, 'free');
    }

    return NextResponse.json({
      success: true,
      data: {
        userProfile,
        currentResume,
        currentAnalysis,
        workExperiences,
        subscription,
        allResumes: allResumes || [],
        profileCompletion,
        onboardingSteps,
        quota,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
