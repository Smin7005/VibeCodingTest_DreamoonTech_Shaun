import { createClient } from '@supabase/supabase-js';

// Supabase client for client-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase admin client for server-side operations (with service role key)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database types
export interface UserProfile {
  id: string;
  clerk_user_id: string;
  name: string;
  email: string;
  role?: string;
  target_position?: string;
  city?: string;
  user_type: 'guest' | 'free' | 'member';
  profile_completion: number;
  created_at: string;
  updated_at: string;
}

export interface WorkExperience {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingProgress {
  id: string;
  user_id: string;
  step_number: number;
  step_name: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  version_label?: string;
  is_current: boolean;
  uploaded_at: string;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  user_id: string;
  basic_info: any;
  skills: string[];
  experiences: any;
  career_advice: string;
  improvement_suggestions?: string;
  date_discrepancies?: any;
  analyzed_at: string;
}

export interface UploadQuota {
  id: string;
  user_id: string;
  year: number;
  month: number;
  upload_count: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  plan_type: 'free' | 'premium_monthly' | 'premium_yearly';
  status: 'active' | 'cancelled' | 'expired';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}
