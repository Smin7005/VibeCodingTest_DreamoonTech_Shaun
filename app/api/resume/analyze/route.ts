import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, WorkExperience } from '@/lib/supabase';
import { extractTextFromResume } from '@/lib/resume-parser';
import { analyzeResume, detectDateDiscrepancies } from '@/lib/claude';

// Force dynamic rendering - this route uses auth headers
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { resume_id } = body;

    if (!resume_id) {
      return NextResponse.json(
        { error: 'Missing resume_id in request body' },
        { status: 400 }
      );
    }

    console.log(`📊 Starting resume analysis for resume_id: ${resume_id}`);

    // 3. Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, user_type')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('❌ User profile not found:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 4. Get resume record and verify ownership
    const { data: resume, error: resumeError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', resume_id)
      .single();

    if (resumeError || !resume) {
      console.error('❌ Resume not found:', resumeError);
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Verify user owns this resume
    if (resume.user_id !== userProfile.id) {
      console.error('❌ User does not own this resume');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 5. Check if analysis already exists for this resume
    const { data: existingAnalysis } = await supabaseAdmin
      .from('resume_analyses')
      .select('*')
      .eq('resume_id', resume_id)
      .single();

    if (existingAnalysis) {
      console.log('✅ Returning existing analysis');
      return NextResponse.json({
        success: true,
        analysis: existingAnalysis,
        cached: true,
      });
    }

    // 6. Extract text from PDF
    const extractedResult = await extractTextFromResume(resume.file_path);

    if (!extractedResult.isValid) {
      console.error('❌ Failed to extract text from resume:', extractedResult.error);
      return NextResponse.json(
        { error: extractedResult.error || 'Failed to read resume content' },
        { status: 422 }
      );
    }

    // 7. Get user's manual work experiences for date comparison
    const { data: manualExperiences } = await supabaseAdmin
      .from('work_experiences')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('start_date', { ascending: false });

    // 8. Analyze resume with Claude API
    const userType = userProfile.user_type === 'member' ? 'member' : 'free';
    console.log(`🤖 Calling Claude API for ${userType} user...`);

    let analysisResult;
    try {
      analysisResult = await analyzeResume(extractedResult.text, userType);
    } catch (analysisError) {
      console.error('❌ Claude API error:', analysisError);
      const errorMessage = analysisError instanceof Error
        ? analysisError.message
        : 'AI analysis failed. Please try again.';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // 9. Detect date discrepancies if manual experiences exist
    let dateDiscrepancies = null;
    if (manualExperiences && manualExperiences.length > 0) {
      dateDiscrepancies = detectDateDiscrepancies(
        analysisResult.experiences,
        manualExperiences as WorkExperience[]
      );
      if (dateDiscrepancies.length === 0) {
        dateDiscrepancies = null;
      }
    }

    // 10. Store analysis in database
    // Ensure all JSON fields are properly formatted for Supabase JSONB storage
    const analysisData = {
      resume_id: resume_id,
      user_id: userProfile.id,
      basic_info: analysisResult.basicInfo || { name: null, email: null, phone: null, address: null },
      skills: Array.isArray(analysisResult.skills) ? analysisResult.skills : [],
      experiences: Array.isArray(analysisResult.experiences) ? analysisResult.experiences : [],
      career_advice: Array.isArray(analysisResult.careerAdvice)
        ? analysisResult.careerAdvice.join('\n\n')
        : (analysisResult.careerAdvice || ''),
      improvement_suggestions: [
        analysisResult.improvementSuggestions || '',
        analysisResult.grammarCorrections && analysisResult.grammarCorrections !== 'No significant issues found'
          ? `\n\nGrammar/Spelling Notes: ${analysisResult.grammarCorrections}`
          : '',
      ].filter(Boolean).join(''),
      date_discrepancies: dateDiscrepancies || null,
      analyzed_at: new Date().toISOString(),
    };

    console.log('📦 Analysis data to store:', JSON.stringify(analysisData, null, 2).substring(0, 500));

    const { data: savedAnalysis, error: saveError } = await supabaseAdmin
      .from('resume_analyses')
      .insert(analysisData)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Error saving analysis:', saveError);
      // Return analysis even if save fails
      return NextResponse.json({
        success: true,
        analysis: analysisData,
        warning: 'Analysis completed but could not be saved',
      });
    }

    console.log('✅ Resume analysis completed and saved');

    return NextResponse.json({
      success: true,
      analysis: savedAnalysis,
    });

  } catch (error) {
    console.error('❌ Unexpected error in resume analysis:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve existing analysis
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get('resume_id');

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Missing resume_id parameter' },
        { status: 400 }
      );
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

    // Get analysis
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('resume_analyses')
      .select('*')
      .eq('resume_id', resumeId)
      .eq('user_id', userProfile.id)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found', needsAnalysis: true },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error) {
    console.error('❌ Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
