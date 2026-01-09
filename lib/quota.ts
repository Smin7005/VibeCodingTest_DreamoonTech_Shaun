import { supabaseAdmin, UploadQuota } from './supabase';

// Constants
const FREE_USER_MONTHLY_LIMIT = 5;

export interface QuotaStatus {
  remaining: number;
  used: number;
  limit: number;
  canUpload: boolean;
  resetDate: string;
}

// Get the first day of next month for quota reset
function getQuotaResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return nextMonth.toISOString();
}

// Get current year and month in UTC
function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1, // 1-indexed (January = 1)
  };
}

// Get or create quota record for current month
export async function getOrCreateQuotaRecord(userId: string): Promise<UploadQuota | null> {
  const { year, month } = getCurrentYearMonth();

  // Try to get existing quota record
  const { data: existingQuota, error: fetchError } = await supabaseAdmin
    .from('upload_quota')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (existingQuota && !fetchError) {
    return existingQuota as UploadQuota;
  }

  // Create new quota record for this month
  const { data: newQuota, error: insertError } = await supabaseAdmin
    .from('upload_quota')
    .insert({
      user_id: userId,
      year,
      month,
      upload_count: 0,
    })
    .select()
    .single();

  if (insertError) {
    // Handle race condition - record might have been created by another request
    if (insertError.code === '23505') { // Unique violation
      const { data: retryQuota } = await supabaseAdmin
        .from('upload_quota')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('month', month)
        .single();
      return retryQuota as UploadQuota | null;
    }
    console.error('❌ Error creating quota record:', insertError);
    return null;
  }

  return newQuota as UploadQuota;
}

// Check remaining quota for user
export async function checkUploadQuota(userId: string, userType: 'free' | 'member' | 'guest'): Promise<QuotaStatus> {
  // Members have unlimited uploads
  if (userType === 'member') {
    return {
      remaining: Infinity,
      used: 0,
      limit: Infinity,
      canUpload: true,
      resetDate: getQuotaResetDate(),
    };
  }

  // Guests cannot upload
  if (userType === 'guest') {
    return {
      remaining: 0,
      used: 0,
      limit: 0,
      canUpload: false,
      resetDate: getQuotaResetDate(),
    };
  }

  // Free users have 4 uploads/month limit
  const quota = await getOrCreateQuotaRecord(userId);

  if (!quota) {
    // If we can't get/create quota, be conservative and allow upload
    console.warn('⚠️ Could not retrieve quota, allowing upload by default');
    return {
      remaining: FREE_USER_MONTHLY_LIMIT,
      used: 0,
      limit: FREE_USER_MONTHLY_LIMIT,
      canUpload: true,
      resetDate: getQuotaResetDate(),
    };
  }

  const used = quota.upload_count;
  const remaining = Math.max(0, FREE_USER_MONTHLY_LIMIT - used);
  const canUpload = remaining > 0;

  return {
    remaining,
    used,
    limit: FREE_USER_MONTHLY_LIMIT,
    canUpload,
    resetDate: getQuotaResetDate(),
  };
}

// Increment quota after successful upload
export async function incrementUploadQuota(userId: string): Promise<{ success: boolean; newCount: number }> {
  const quota = await getOrCreateQuotaRecord(userId);

  if (!quota) {
    console.error('❌ Failed to get quota record for increment');
    return { success: false, newCount: 0 };
  }

  const newCount = quota.upload_count + 1;

  const { error } = await supabaseAdmin
    .from('upload_quota')
    .update({
      upload_count: newCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quota.id);

  if (error) {
    console.error('❌ Error incrementing quota:', error);
    return { success: false, newCount: quota.upload_count };
  }

  console.log(`✅ Quota incremented for user. New count: ${newCount}/${FREE_USER_MONTHLY_LIMIT}`);
  return { success: true, newCount };
}

// Get quota display info for UI
export async function getQuotaDisplayInfo(userId: string, userType: 'free' | 'member' | 'guest'): Promise<{
  displayText: string;
  progressPercent: number;
  colorClass: string;
}> {
  const quota = await checkUploadQuota(userId, userType);

  if (userType === 'member') {
    return {
      displayText: 'Unlimited uploads',
      progressPercent: 0,
      colorClass: 'green',
    };
  }

  if (userType === 'guest') {
    return {
      displayText: 'Sign up to upload resumes',
      progressPercent: 100,
      colorClass: 'gray',
    };
  }

  // Free user display
  const progressPercent = (quota.used / quota.limit) * 100;
  let colorClass = 'green';
  if (quota.remaining <= 0) {
    colorClass = 'red';
  } else if (quota.remaining <= 2) {
    colorClass = 'orange';
  }

  return {
    displayText: `${quota.remaining}/${quota.limit} uploads remaining this month`,
    progressPercent,
    colorClass,
  };
}
