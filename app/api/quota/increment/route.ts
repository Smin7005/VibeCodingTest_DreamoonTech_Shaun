import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { incrementUploadQuota } from '@/lib/quota';

// Force dynamic rendering - this route uses auth headers
export const dynamic = 'force-dynamic';

// This endpoint is called internally after successful resume upload
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, user_type')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Members don't need quota tracking
    if (userProfile.user_type === 'member') {
      return NextResponse.json({
        success: true,
        message: 'Members have unlimited uploads',
        newCount: 0,
      });
    }

    // Guests can't upload
    if (userProfile.user_type === 'guest') {
      return NextResponse.json(
        { error: 'Guests cannot upload resumes' },
        { status: 403 }
      );
    }

    // Increment quota for free users
    const result = await incrementUploadQuota(userProfile.id);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to update quota' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newCount: result.newCount,
    });

  } catch (error) {
    console.error('❌ Error incrementing quota:', error);
    return NextResponse.json(
      { error: 'Failed to update upload quota' },
      { status: 500 }
    );
  }
}
