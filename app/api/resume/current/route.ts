import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET current resume for the user
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get current resume (is_current = true)
    const { data: resume, error: resumeError } = await supabaseAdmin
      .from('resumes')
      .select('id, file_name, file_path, uploaded_at')
      .eq('user_id', userProfile.id)
      .eq('is_current', true)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({
        success: true,
        resume: null,
        message: 'No resume found'
      });
    }

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        fileName: resume.file_name,
        filePath: resume.file_path,
        uploadedAt: resume.uploaded_at,
      },
    });

  } catch (error) {
    console.error('❌ Error fetching current resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}
