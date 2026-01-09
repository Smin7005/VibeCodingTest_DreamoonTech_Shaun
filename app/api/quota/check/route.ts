import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkUploadQuota } from '@/lib/quota';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check user type
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, user_type')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check quota based on user type
    const quotaStatus = await checkUploadQuota(
      userProfile.id,
      userProfile.user_type as 'free' | 'member' | 'guest'
    );

    return NextResponse.json({
      success: true,
      ...quotaStatus,
      userType: userProfile.user_type,
    });

  } catch (error) {
    console.error('❌ Error checking quota:', error);
    return NextResponse.json(
      { error: 'Failed to check upload quota' },
      { status: 500 }
    );
  }
}
