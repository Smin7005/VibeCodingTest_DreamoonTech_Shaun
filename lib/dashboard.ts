import { supabaseAdmin, UserProfile, Resume, ResumeAnalysis, WorkExperience, Subscription } from './supabase';

// Dashboard data types
export interface DashboardData {
  userProfile: UserProfile;
  currentResume: Resume | null;
  currentAnalysis: ResumeAnalysis | null;
  workExperiences: WorkExperience[];
  subscription: Subscription | null;
  allResumes: Resume[];
  profileCompletion: ProfileCompletionData;
  quota: QuotaData | null;
}

export interface ProfileCompletionData {
  percentage: number;
  sections: {
    basicInfo: boolean;
    resumeUploaded: boolean;
    analysisComplete: boolean;
    subscriptionActive: boolean;
  };
}

export interface QuotaData {
  used: number;
  limit: number;
  remaining: number;
  resetDate: string;
}

// Fetch user profile by Clerk ID
export async function getUserProfileByClerkId(clerkUserId: string): Promise<UserProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !data) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as UserProfile;
}

// Fetch current resume for user
export async function getCurrentResume(userId: string): Promise<Resume | null> {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_current', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Resume;
}

// Fetch all resumes for a user (for members with multiple versions)
export async function getAllResumes(userId: string): Promise<Resume[]> {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as Resume[];
}

// Fetch analysis for a specific resume
export async function getResumeAnalysis(resumeId: string): Promise<ResumeAnalysis | null> {
  const { data, error } = await supabaseAdmin
    .from('resume_analyses')
    .select('*')
    .eq('resume_id', resumeId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ResumeAnalysis;
}

// Fetch work experiences for user
export async function getWorkExperiences(userId: string): Promise<WorkExperience[]> {
  const { data, error } = await supabaseAdmin
    .from('work_experiences')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as WorkExperience[];
}

// Fetch subscription for user
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Subscription;
}

// Calculate profile completion percentage
export function calculateProfileCompletion(
  userProfile: UserProfile | null,
  hasResume: boolean,
  hasAnalysis: boolean,
  hasActiveSubscription: boolean
): ProfileCompletionData {
  // Handle null userProfile
  if (!userProfile) {
    return {
      percentage: 0,
      sections: {
        basicInfo: false,
        resumeUploaded: hasResume,
        analysisComplete: hasAnalysis,
        subscriptionActive: hasActiveSubscription,
      },
    };
  }

  const sections = {
    basicInfo: !!(userProfile.name && userProfile.role && userProfile.target_position && userProfile.city),
    resumeUploaded: hasResume,
    analysisComplete: hasAnalysis,
    subscriptionActive: hasActiveSubscription,
  };

  // Each section is worth 25%
  let percentage = 0;
  if (sections.basicInfo) percentage += 25;
  if (sections.resumeUploaded) percentage += 25;
  if (sections.analysisComplete) percentage += 25;
  if (sections.subscriptionActive) percentage += 25;

  return { percentage, sections };
}

// Get color class based on completion percentage
export function getCompletionColorClass(percentage: number): string {
  if (percentage <= 25) return 'text-red-500';
  if (percentage <= 50) return 'text-orange-500';
  if (percentage <= 75) return 'text-yellow-500';
  return 'text-green-500';
}

// Get background color for progress bar
export function getCompletionBgClass(percentage: number): string {
  if (percentage <= 25) return 'bg-red-500';
  if (percentage <= 50) return 'bg-orange-500';
  if (percentage <= 75) return 'bg-yellow-500';
  return 'bg-green-500';
}

// Format date for display
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Present';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Calculate duration between two dates
export function calculateDuration(startDate: string, endDate: string | null): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0 && remainingMonths === 0) return 'Less than a month';
  if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years}y ${remainingMonths}m`;
}

// Get greeting based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Get quota reset date (1st of next month)
export function getQuotaResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Update work experience
export async function updateWorkExperience(
  experienceId: string,
  updates: Partial<WorkExperience>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('work_experiences')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', experienceId);

  if (error) {
    console.error('Error updating work experience:', error);
    return { success: false, error: 'Failed to update work experience' };
  }

  return { success: true };
}

// Delete resume version (members only)
export async function deleteResumeVersion(
  resumeId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Verify ownership
  const { data: resume, error: fetchError } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !resume) {
    return { success: false, error: 'Resume not found' };
  }

  // Delete analysis first
  await supabaseAdmin
    .from('resume_analyses')
    .delete()
    .eq('resume_id', resumeId);

  // Delete resume record
  const { error: deleteError } = await supabaseAdmin
    .from('resumes')
    .delete()
    .eq('id', resumeId);

  if (deleteError) {
    return { success: false, error: 'Failed to delete resume' };
  }

  return { success: true };
}

// Update resume version label (members only)
export async function updateResumeLabel(
  resumeId: string,
  userId: string,
  label: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('resumes')
    .update({ version_label: label })
    .eq('id', resumeId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: 'Failed to update label' };
  }

  return { success: true };
}

// Set current resume version
export async function setCurrentResume(
  resumeId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // First, set all resumes for this user to not current
  await supabaseAdmin
    .from('resumes')
    .update({ is_current: false })
    .eq('user_id', userId);

  // Then set the selected resume as current
  const { error } = await supabaseAdmin
    .from('resumes')
    .update({ is_current: true })
    .eq('id', resumeId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: 'Failed to set current resume' };
  }

  return { success: true };
}
