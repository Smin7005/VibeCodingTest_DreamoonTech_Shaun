import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

// Force dynamic rendering - this route uses auth headers
export const dynamic = 'force-dynamic';

interface WorkExperienceUpdate {
  id?: string;
  company_name: string;
  job_title: string;
  location?: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  isNew?: boolean;
}

// PATCH - Update or create work experiences
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const { updates } = await req.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates format' }, { status: 400 });
    }

    const results: { id?: string; success: boolean; error?: string }[] = [];

    // Process each work experience
    for (const update of updates as WorkExperienceUpdate[]) {
      if (update.isNew || !update.id) {
        // Create new work experience
        const { data: newExp, error } = await supabaseAdmin
          .from('work_experiences')
          .insert({
            user_id: userProfile.id,
            company_name: update.company_name,
            job_title: update.job_title,
            location: update.location || null,
            start_date: update.start_date,
            end_date: update.end_date,
            is_current: update.is_current,
          })
          .select('id')
          .single();

        results.push({
          id: newExp?.id,
          success: !error,
          error: error?.message,
        });
      } else {
        // Verify ownership
        const { data: exp } = await supabaseAdmin
          .from('work_experiences')
          .select('id')
          .eq('id', update.id)
          .eq('user_id', userProfile.id)
          .single();

        if (!exp) {
          results.push({ id: update.id, success: false, error: 'Not found' });
          continue;
        }

        // Update existing work experience
        const { error } = await supabaseAdmin
          .from('work_experiences')
          .update({
            company_name: update.company_name,
            job_title: update.job_title,
            location: update.location || null,
            start_date: update.start_date,
            end_date: update.end_date,
            is_current: update.is_current,
            updated_at: new Date().toISOString(),
          })
          .eq('id', update.id);

        results.push({ id: update.id, success: !error, error: error?.message });
      }
    }

    // Check if any updates failed
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Some updates failed',
        results,
      }, { status: 207 }); // Multi-status
    }

    return NextResponse.json({
      success: true,
      message: 'Work experiences saved successfully',
      results,
    });
  } catch (error) {
    console.error('Error saving work experiences:', error);
    return NextResponse.json(
      { error: 'Failed to save work experiences' },
      { status: 500 }
    );
  }
}
