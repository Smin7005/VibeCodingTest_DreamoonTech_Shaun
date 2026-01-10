import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkUploadQuota, incrementUploadQuota } from '@/lib/quota';

// Server-side file validation
function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Only PDF files are accepted.' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size exceeds 10 MB limit.' };
  }
  if (file.size < 1024) {
    return { valid: false, error: 'File appears to be empty or corrupted.' };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 4. Get user profile to check user_type
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, user_type')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 5. Check quota for free users before upload
    if (userProfile.user_type === 'free') {
      const quotaStatus = await checkUploadQuota(userProfile.id, 'free');
      if (!quotaStatus.canUpload) {
        console.log(`❌ Upload quota exceeded for user ${userProfile.id}. Used: ${quotaStatus.used}/${quotaStatus.limit}`);
        return NextResponse.json(
          {
            error: 'Upload quota exceeded. Upgrade to Premium for unlimited uploads.',
            quota: {
              remaining: quotaStatus.remaining,
              used: quotaStatus.used,
              limit: quotaStatus.limit,
              resetDate: quotaStatus.resetDate,
            },
          },
          { status: 403 }
        );
      }
    }

    // 6. Mark all previous resumes as not current (new upload becomes current)
    // This applies to both free and member users to ensure only one resume is current
    await supabaseAdmin
      .from('resumes')
      .update({ is_current: false })
      .eq('user_id', userProfile.id);

    // 6. Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${userId}_${timestamp}_${sanitizedFilename}`;

    // 7. Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('resumes')
      .upload(uniqueFilename, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }

    // 8. Create record in resumes table
    const { data: resumeRecord, error: dbError } = await supabaseAdmin
      .from('resumes')
      .insert({
        user_id: userProfile.id,
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        is_current: true,
        version_label: userProfile.user_type === 'member' ? `Version ${timestamp}` : null,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Cleanup: Delete uploaded file if DB insert fails
      await supabaseAdmin.storage.from('resumes').remove([uniqueFilename]);
      return NextResponse.json({ error: 'Failed to save resume record' }, { status: 500 });
    }

    // 9. Increment quota for free users after successful upload
    if (userProfile.user_type === 'free') {
      const quotaResult = await incrementUploadQuota(userProfile.id);
      console.log(`✅ Quota incremented for user ${userProfile.id}. New count: ${quotaResult.newCount}`);
    }

    // 10. Return success with resume_id
    return NextResponse.json(
      {
        success: true,
        resume_id: resumeRecord.id,
        message: 'Resume uploaded successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during upload' },
      { status: 500 }
    );
  }
}
