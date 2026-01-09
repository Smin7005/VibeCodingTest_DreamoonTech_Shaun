import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { setCurrentResume, deleteResumeVersion, updateResumeLabel } from '@/lib/dashboard';

// PATCH - Update resume (set current, rename)
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, user_type')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only members can manage multiple versions
    if (userProfile.user_type !== 'member') {
      return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
    }

    const { action, resumeId, label } = await req.json();

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });
    }

    switch (action) {
      case 'setCurrent': {
        const result = await setCurrentResume(resumeId, userProfile.id);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, message: 'Current resume updated' });
      }

      case 'rename': {
        if (!label || typeof label !== 'string') {
          return NextResponse.json({ error: 'Label required' }, { status: 400 });
        }
        const result = await updateResumeLabel(resumeId, userProfile.id, label.trim());
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, message: 'Resume label updated' });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { error: 'Failed to update resume' },
      { status: 500 }
    );
  }
}

// DELETE - Delete resume version
export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, user_type')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only members can delete versions
    if (userProfile.user_type !== 'member') {
      return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get('resumeId');

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });
    }

    // Check if this is the only resume
    const { count } = await supabaseAdmin
      .from('resumes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userProfile.id);

    if (count && count <= 1) {
      return NextResponse.json({ error: 'Cannot delete your only resume' }, { status: 400 });
    }

    const result = await deleteResumeVersion(resumeId, userProfile.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Resume deleted' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
