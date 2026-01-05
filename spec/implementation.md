# Implementation Plan

## Overview

This document provides a detailed, stage-by-stage implementation plan for the Resume Management AI Platform. The project is divided into **6 distinct stages**, each building upon the previous one. This approach ensures incremental development, thorough testing at each stage, and manageable complexity.

### Why Staged Implementation?

- **Incremental Development**: Build and test features incrementally rather than all at once
- **Early Problem Detection**: Catch issues early when they're easier to fix
- **Manageable Complexity**: Each stage focuses on a specific aspect of the platform
- **Clear Progress Tracking**: Easy to measure progress and identify what's complete
- **Testing at Each Stage**: Ensure each component works before moving forward

### 6 Implementation Stages:

1. **User Registration** - Authentication system and user management
2. **Onboarding Flow** - Multi-step forms and initial user setup
3. **Resume Management** - AI-powered resume analysis with Claude API
4. **User Dashboard** - Comprehensive dashboard with all data displays
5. **User Purchase** - Stripe integration for subscriptions
6. **User Interface** - Design system and final polish

---

## Pre-Implementation Setup

Before starting Stage 1, complete the following setup steps:

### 1. Environment Setup

**Install Required Software:**
- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)

**Create Local Environment:**
```bash
# Navigate to project directory
cd C:\6Internship\VibeCodingTest

# Create Next.js 14 project with App Router, TypeScript, and Tailwind
npx create-next-app@latest . --typescript --tailwind --app

# Install core dependencies
npm install @clerk/nextjs @supabase/supabase-js @anthropic-ai/sdk stripe

# Install additional dependencies
npm install react-pdf-viewer pdf-lib date-fns recharts

# Install dev dependencies
npm install -D @types/node @types/react @types/react-dom
```

### 2. Environment Variables

Create `.env.local` file in project root:

```bash
# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase (Database & Storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Claude API (Anthropic)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Stripe (Payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Database Schema Setup

**Connect to Supabase and run the following SQL:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT,
  target_position TEXT,
  city TEXT,
  user_type TEXT NOT NULL DEFAULT 'guest', -- 'guest', 'free', 'member'
  profile_completion INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work experiences table
CREATE TABLE work_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding progress table
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resumes table
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  version_label TEXT,
  is_current BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resume analyses table
CREATE TABLE resume_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  basic_info JSONB,
  skills TEXT[],
  experiences JSONB,
  career_advice TEXT,
  improvement_suggestions TEXT,
  date_discrepancies JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upload quota tracking table
CREATE TABLE upload_quota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  upload_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan_type TEXT NOT NULL, -- 'free', 'premium_monthly', 'premium_yearly'
  status TEXT NOT NULL, -- 'active', 'cancelled', 'expired'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription history table (for analytics)
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'updated', 'cancelled', 'expired'
  old_status TEXT,
  new_status TEXT,
  old_plan TEXT,
  new_plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_clerk_id ON user_profiles(clerk_user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_work_experiences_user_id ON work_experiences(user_id);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resume_analyses_user_id ON resume_analyses(user_id);
CREATE INDEX idx_resume_analyses_resume_id ON resume_analyses(resume_id);
CREATE INDEX idx_upload_quota_user_id ON upload_quota(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_experiences_updated_at BEFORE UPDATE ON work_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_progress_updated_at BEFORE UPDATE ON onboarding_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_upload_quota_updated_at BEFORE UPDATE ON upload_quota FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Create Supabase Storage Bucket:**
- Navigate to Supabase Storage
- Create bucket named `resumes`
- Set as **private** (authenticated access only)
- Configure RLS policies for user-specific access

### 4. Project File Structure

```
resume-ai-platform/
├── app/
│   ├── api/
│   │   ├── resume/
│   │   │   ├── analyze/route.ts
│   │   │   └── upload/route.ts
│   │   └── stripe/
│   │       ├── checkout/route.ts
│   │       ├── webhook/route.ts
│   │       └── portal/route.ts
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── onboarding/
│   │   └── page.tsx
│   ├── pricing/
│   │   └── page.tsx
│   ├── sign-in/
│   │   └── [[...sign-in]]/page.tsx
│   ├── sign-up/
│   │   └── [[...sign-up]]/page.tsx
│   ├── subscription/
│   │   ├── success/page.tsx
│   │   └── cancelled/page.tsx
│   ├── terms/
│   │   └── page.tsx
│   ├── privacy/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard/
│   │   ├── WelcomeHeader.tsx
│   │   ├── ProfileCompletion.tsx
│   │   ├── OnboardingGuide.tsx
│   │   ├── ResumeInformation.tsx
│   │   ├── CareerAdvice.tsx
│   │   ├── UploadQuotaIndicator.tsx
│   │   ├── ResumeVersionSelector.tsx
│   │   ├── SubscriptionStatus.tsx
│   │   ├── Statistics.tsx
│   │   └── EditWorkExperience.tsx
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Pricing.tsx
│   │   └── Footer.tsx
│   ├── onboarding/
│   │   ├── Stepper.tsx
│   │   ├── BasicInfoForm.tsx
│   │   ├── WorkExperienceForm.tsx
│   │   ├── ResumeUpload.tsx
│   │   ├── AnalysisResults.tsx
│   │   └── DashboardTour.tsx
│   ├── resume/
│   │   ├── UploadQuotaIndicator.tsx
│   │   └── DiscrepancyWarning.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── select.tsx
│       └── ... (other UI components)
├── lib/
│   ├── claude.ts
│   ├── dashboard.ts
│   ├── onboarding.ts
│   ├── quota.ts
│   ├── resume-parser.ts
│   ├── stripe.ts
│   ├── subscription.ts
│   └── supabase.ts
├── styles/
│   ├── globals.css
│   └── theme.css
├── public/
│   └── (images, icons, etc.)
├── middleware.ts
├── .env.local
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

# Stage 1: User Registration

## Objective

Set up the authentication system and user management foundation using Clerk and Supabase.

## Dependencies

- Pre-implementation setup complete
- Clerk account created
- Supabase database running

## Deliverables

### 1.1 Project Configuration

**Files to Create/Modify:**
- `app/layout.tsx` - Add ClerkProvider wrapper
- `middleware.ts` - Protect routes
- `lib/supabase.ts` - Supabase client setup

**Tasks:**
- Configure Clerk with environment variables
- Wrap app with ClerkProvider
- Set up route protection middleware
- Initialize Supabase client

### 1.2 Sign-Up Page

**Files to Create:**
- `app/sign-up/[[...sign-up]]/page.tsx`

**Features:**
- Email + password sign-up form
- Google OAuth sign-up button
- Email verification flow
- Password validation (8+ chars, uppercase, lowercase, number, special char)
- Error handling and display
- Redirect to onboarding after sign-up

### 1.3 Sign-In Page

**Files to Create:**
- `app/sign-in/[[...sign-in]]/page.tsx`

**Features:**
- Email + password sign-in form
- Google OAuth sign-in button
- "Forgot password" link
- Error handling
- Redirect to dashboard after sign-in

### 1.4 User Profile Creation

**Files to Create:**
- `app/api/user/create-profile/route.ts`

**Features:**
- Create user_profile record after Clerk sign-up
- Store Clerk user ID, email, name
- Set initial user_type to 'guest'
- Handle Clerk webhooks for user creation

### 1.5 Protected Routes

**Files to Modify:**
- `middleware.ts`

**Protected Routes:**
- `/dashboard/*`
- `/onboarding/*`
- `/subscription/*`

**Public Routes:**
- `/`
- `/sign-in`
- `/sign-up`
- `/pricing`
- `/terms`
- `/privacy`

## Testing Checklist

After completing Stage 1, verify:

- [ ] Sign-up with email + password works
- [ ] Email verification code sent and validated
- [ ] Password validation enforced (min 8 chars, complexity)
- [ ] Sign-up with Google OAuth works
- [ ] User profile created in Supabase after sign-up
- [ ] Sign-in with email + password works
- [ ] Sign-in with Google OAuth works
- [ ] Duplicate email prevention works
- [ ] Protected routes redirect to sign-in when not authenticated
- [ ] Authenticated users can access protected routes
- [ ] Session persists across page refreshes
- [ ] Sign-out works correctly

## Success Criteria

✅ All authentication flows functional
✅ User profiles created in database
✅ Protected routes enforced
✅ No errors in console
✅ All tests pass

---

# Stage 2: Onboarding Flow

## Objective

Build multi-step onboarding flows for guest users (4 steps) and free users (5 steps) with form validation and resume upload.

## Dependencies

- ✅ Stage 1 (User Registration) complete
- Supabase Storage bucket `resumes` created

## Deliverables

### 2.1 Stepper Component

**Files to Create:**
- `components/onboarding/Stepper.tsx`

**Features:**
- Display current step number
- Show completed, current, and upcoming steps
- Visual progress indicator
- Clickable steps (for free users with skippable steps)

### 2.2 Basic Information Form

**Files to Create:**
- `components/onboarding/BasicInfoForm.tsx`
- `components/onboarding/WorkExperienceForm.tsx`

**Fields:**
- Name (required, 2-50 chars)
- Role (required, 2-50 chars)
- Target Position (required, 2-100 chars)
- City (required, 2-50 chars)
- Work Experiences (at least 1 required):
  - Company name (required, 2-100 chars)
  - Job title (required, 2-100 chars)
  - Start date (month + year picker)
  - End date (month + year picker) OR "Present" checkbox
  - Duration (auto-calculated, display-only)
  - Description (optional, max 500 chars)
  - "Add Another Experience" button

**Validation:**
- All required fields must be filled
- Character limits enforced
- Start date must be before end date
- At least 1 work experience required

### 2.3 Resume Upload Component

**Files to Create:**
- `components/onboarding/ResumeUpload.tsx`
- `app/api/resume/upload/route.ts`

**Features:**
- Drag-and-drop or click to upload
- PDF validation (format and size)
- File size limit: 10MB
- Preview first page of PDF
- Progress indicator during upload
- Upload to Supabase Storage
- Error handling (invalid format, too large, etc.)

### 2.4 Guest Onboarding Flow

**Files to Create:**
- `app/onboarding/page.tsx`

**4 Steps:**
1. **Sign-up** (handled in Stage 1, redirect to step 2)
2. **Basic Information** - Form with work experiences
3. **Upload Resume** - Upload and preview
4. **Analysis Results** - Display parsed data (placeholder for Stage 3)

**After Completion:**
- Update user_type to 'free'
- Redirect to Dashboard

### 2.5 Free User Onboarding Flow

**Features:**
- Check completion status of steps 1-3
- Skip to first incomplete step
- **Step 4:** Dashboard Introduction Tour
- **Step 5:** Purchase Navigation (can be cancelled)

**Files to Create:**
- `components/onboarding/DashboardTour.tsx`

### 2.6 Onboarding State Management

**Files to Create:**
- `lib/onboarding.ts`
- `app/api/onboarding/progress/route.ts`

**Features:**
- Track completion of each step
- Save progress to onboarding_progress table
- Allow skipping completed steps
- Persist state across sessions

## Testing Checklist

After completing Stage 2, verify:

- [ ] Stepper shows correct current step
- [ ] Basic info form validates all fields
- [ ] Work experience form allows multiple entries
- [ ] Start date, end date, and "Present" checkbox work correctly
- [ ] Duration auto-calculates (e.g., "2 years 3 months")
- [ ] Resume upload accepts PDF only
- [ ] Resume upload rejects files > 10MB
- [ ] Preview displays first page of PDF correctly
- [ ] Upload progress indicator shows
- [ ] File uploads to Supabase Storage successfully
- [ ] Onboarding progress saves to database
- [ ] User type updates to 'free' after completion
- [ ] Free user onboarding skips completed steps
- [ ] Dashboard tour displays correctly
- [ ] Purchase navigation can be cancelled
- [ ] State persists across page refreshes

## Success Criteria

✅ All onboarding steps functional
✅ Form validation working
✅ Resume upload to Supabase successful
✅ User type transition (guest → free) working
✅ Onboarding state persists
✅ No errors in console

---

# Stage 3: Resume Management

## Objective

Integrate Claude API for AI-powered resume analysis, implement upload quota system, and manage resume storage for Free users and Members.

## Dependencies

- ✅ Stage 2 (Onboarding Flow) complete
- Anthropic API key obtained

## Deliverables

### 3.1 Claude API Integration

**Files to Create:**
- `lib/claude.ts` - Claude API client
- `lib/resume-parser.ts` - Resume parsing helpers

**Features:**
- Initialize Anthropic SDK
- Create prompts for resume analysis
- Handle API responses
- Error handling and retries
- Timeout handling (60 second limit)

### 3.2 Resume Analysis API

**Files to Create:**
- `app/api/resume/analyze/route.ts`

**Analysis Tasks:**
1. **Grammar and Spelling Correction**
   - Fix all grammar errors
   - Fix all spelling errors
   - Return corrected version

2. **Basic Information Extraction**
   - Name
   - Email address
   - Phone number
   - Home address

3. **Skills Extraction**
   - Extract all mentioned skills
   - Generate individual skill tags
   - Remove duplicates
   - Return as array

4. **Work Experience Extraction**
   - Extract all work/internship experiences
   - For each: company, title, start date, end date, description, location
   - Return as structured array

5. **Date Validation**
   - Compare manual work experience dates with extracted dates
   - Identify discrepancies (>1 month difference)
   - Flag discrepancies with specific messages

6. **Career Advice Generation**
   - **Free Users**: 3-5 basic bullet points
   - **Members**: 10+ detailed recommendations
   - Include: skill gaps, formatting suggestions, content optimization

### 3.3 Upload Quota System

**Files to Create:**
- `lib/quota.ts`
- `app/api/quota/check/route.ts`
- `app/api/quota/increment/route.ts`

**Features:**
- Track uploads per user per month
- Enforce 4 uploads/month for Free users
- No limit for Members
- Quota resets on 1st of each month
- Failed uploads don't count toward quota
- Display quota to users

### 3.4 Resume Storage System

**Files to Modify:**
- `app/api/resume/upload/route.ts`

**Free User Storage:**
- Store single resume only
- New upload replaces previous
- Delete old file from Supabase Storage
- Archive old analysis data (don't delete)

**Member Storage:**
- Store multiple resume versions
- Each upload creates new version
- Allow custom labeling of versions
- Never auto-delete (user can manually delete)

### 3.5 Analysis Results Storage

**Database Operations:**
- Store analysis results in `resume_analyses` table
- Link to resume ID and user ID
- Store as structured data (JSONB for complex fields)
- Cache results for 30 days

## Testing Checklist

After completing Stage 3, verify:

- [ ] Claude API successfully called
- [ ] Grammar and spelling corrections work
- [ ] Basic info extracted with >90% accuracy (test with 20 resumes)
- [ ] Skills extracted with >85% accuracy
- [ ] Work experiences with dates extracted with >80% accuracy
- [ ] Date discrepancies detected correctly
- [ ] Career advice generated (different for Free vs Member)
- [ ] Upload quota tracked correctly
- [ ] Free users blocked after 4 uploads
- [ ] Members have unlimited uploads
- [ ] Free user: new upload replaces previous
- [ ] Member: new upload creates new version
- [ ] Analysis results stored in database
- [ ] Analysis completes within 60 seconds
- [ ] Timeout errors handled gracefully
- [ ] Quota resets on 1st of month (test manually)

## Success Criteria

✅ Claude API integration working
✅ Resume analysis functional with acceptable accuracy
✅ Upload quota enforced correctly
✅ Resume storage working (single vs multiple)
✅ Date validation detecting discrepancies
✅ Career advice generated appropriately
✅ No errors in console

---

# Stage 4: User Dashboard

## Objective

Build comprehensive dashboard displaying all user data, resume information, career advice, and subscription status with full interactivity.

## Dependencies

- ✅ Stage 3 (Resume Management) complete

## Deliverables

### 4.1 Dashboard Layout

**Files to Create:**
- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`

**Features:**
- Protected route (requires authentication)
- Responsive layout
- Navigation sidebar/header
- Main content area

### 4.2 Welcome Header

**Files to Create:**
- `components/dashboard/WelcomeHeader.tsx`

**Features:**
- Display user's name
- Greeting based on time of day
- Profile completion percentage (pie chart)

### 4.3 Profile Completion Chart

**Files to Create:**
- `components/dashboard/ProfileCompletion.tsx`

**Calculation:**
- Basic info filled: 25%
- Resume uploaded: 25%
- Analysis completed: 25%
- Subscription active: 25% (Members only)
- **Total: 100%** (75% max for Free users)

**Display:**
- Pie chart or circular progress
- Color-coded (red 0-25%, orange 26-50%, yellow 51-75%, green 76-100%)

### 4.4 Onboarding Guide

**Files to Create:**
- `components/dashboard/OnboardingGuide.tsx`

**Features:**
- Show all onboarding steps
- Highlight completed, current, and incomplete steps
- Clickable to jump to specific steps
- Collapsible section

### 4.5 Resume Information Display

**Files to Create:**
- `components/dashboard/ResumeInformation.tsx`

**Display:**
- Basic info (name, email, phone) in header
- Skills as tags (pill-shaped badges)
- Work experiences as ordered list with dates
- Use React Card component
- "Edit" button for work experiences

### 4.6 Career Advice Section

**Files to Create:**
- `components/dashboard/CareerAdvice.tsx`

**Display:**
- Improvement suggestions
- Formatting recommendations
- Keyword suggestions
- Date discrepancy warnings (if any)
- Free users: 3-5 bullet points
- Members: 10+ detailed points
- "Edit Work Experience" button for date corrections

### 4.7 Upload Quota Indicator (Free Users Only)

**Files to Create:**
- `components/dashboard/UploadQuotaIndicator.tsx`

**Display:**
- "X/4 uploads remaining this month"
- Progress bar with color coding
- Quota reset date
- If exhausted: "Upgrade to Premium" CTA

### 4.8 Resume Version Selector (Members Only)

**Files to Create:**
- `components/dashboard/ResumeVersionSelector.tsx`

**Features:**
- Dropdown or tabs showing all versions
- Custom labels for each version
- Switch between versions (updates all dashboard data)
- "Upload New Version" button
- Delete version option ("..." menu)

### 4.9 Subscription Status

**Files to Create:**
- `components/dashboard/SubscriptionStatus.tsx`

**Free User Display:**
- "Free Plan"
- Features list (4 uploads/month, basic advice, single storage)
- "Upgrade to Premium" button

**Member Display:**
- Plan level (Premium Monthly/Yearly)
- Billing cycle and next deduction date
- Features list (unlimited uploads, detailed roadmap, multiple versions)
- "Manage Subscription" button

### 4.10 Statistics Block

**Files to Create:**
- `components/dashboard/Statistics.tsx`

**Display:**
- Skills count (large number + label)
- Experience count (large number + label)
- For Members: updates when switching versions

### 4.11 Edit Work Experience Modal

**Files to Create:**
- `components/dashboard/EditWorkExperience.tsx`

**Features:**
- Modal/dialog to edit work experiences
- Pre-filled with current data
- Save changes to database
- Remove date discrepancy warning after correction

### 4.12 Re-upload/Upload New Version Buttons

**Features:**
- Free users: "Upload New Resume" (if quota available)
- Members: "Upload New Version" (always enabled)
- Trigger upload flow
- Update dashboard after analysis

## Testing Checklist

After completing Stage 4, verify:

- [ ] Dashboard accessible only when authenticated
- [ ] Welcome header displays correct user name
- [ ] Profile completion percentage calculates correctly
- [ ] Pie chart renders with correct color coding
- [ ] Onboarding guide shows correct step statuses
- [ ] Step tags clickable and functional
- [ ] Resume information displays all extracted data
- [ ] Skills displayed as tags
- [ ] Experiences displayed as list with dates
- [ ] Career advice shows appropriate level (Free vs Member)
- [ ] Date discrepancy warnings displayed when present
- [ ] Edit button opens work experience modal
- [ ] Work experience edits save successfully
- [ ] Upload quota indicator shows correct count (Free users)
- [ ] Quota progress bar color-coded correctly
- [ ] Resume version selector shows all versions (Members)
- [ ] Switching versions updates all dashboard data
- [ ] Custom labels can be added to versions
- [ ] Versions can be deleted
- [ ] Subscription status shows correct plan
- [ ] Features list displayed correctly
- [ ] Statistics show correct counts
- [ ] Statistics update when switching versions (Members)
- [ ] Upload buttons work and respect quota

## Success Criteria

✅ All dashboard components displaying correctly
✅ Data fetching and display functional
✅ Interactive features working (edit, switch versions, etc.)
✅ Subscription status accurate
✅ Responsive design on mobile/tablet/desktop
✅ No errors in console

---

# Stage 5: User Purchase

## Objective

Integrate Stripe for subscription payments, manage user types, handle webhooks, and implement subscription lifecycle.

## Dependencies

- ✅ Stage 4 (User Dashboard) complete
- Stripe account created (test mode)

## Deliverables

### 5.1 Stripe Setup

**Files to Create:**
- `lib/stripe.ts` - Stripe client initialization
- `lib/subscription.ts` - Subscription management helpers

**Configuration:**
- Initialize Stripe with secret key
- Configure webhook endpoint
- Set up products and prices in Stripe Dashboard:
  - Premium Monthly: $19.99/month
  - Premium Yearly: $199/year

### 5.2 Pricing Page

**Files to Create:**
- `app/pricing/page.tsx`

**Display:**
- Three plan cards: Free, Premium Monthly, Premium Yearly
- Feature comparison
- Clear pricing display
- "Upgrade" buttons for paid plans
- Highlight yearly savings (17%)

### 5.3 Stripe Checkout Integration

**Files to Create:**
- `app/api/stripe/checkout/route.ts`

**Features:**
- Create Stripe Checkout session
- Pass plan type (monthly/yearly)
- Include user email and metadata
- Set success and cancel URLs
- Redirect to Stripe-hosted checkout

### 5.4 Stripe Webhook Handler

**Files to Create:**
- `app/api/stripe/webhook/route.ts`

**Handle Events:**
1. **checkout.session.completed**
   - Create subscription record
   - Update user_type to 'member'
   - Send confirmation email (optional)

2. **customer.subscription.updated**
   - Update subscription status
   - Handle plan changes (monthly ↔ yearly)

3. **customer.subscription.deleted**
   - Update status to 'expired'
   - Revert user_type to 'free'
   - Archive subscription data

**Webhook Security:**
- Verify webhook signature
- Use Stripe webhook secret
- Log all webhook events

### 5.5 Subscription Success/Cancel Pages

**Files to Create:**
- `app/subscription/success/page.tsx`
- `app/subscription/cancelled/page.tsx`

**Success Page:**
- "Welcome to Premium!" message
- Subscription details
- "Go to Dashboard" button

**Cancelled Page:**
- "Payment Cancelled" message
- "Try Again" button
- Link back to pricing

### 5.6 Stripe Customer Portal

**Files to Create:**
- `app/api/stripe/portal/route.ts`

**Features:**
- Create Stripe Portal session
- Redirect to Stripe-hosted portal
- Allow users to:
  - Switch plans (monthly ↔ yearly)
  - Cancel subscription
  - Update payment method
  - View billing history

### 5.7 Feature Gating

**Files to Modify:**
- `app/api/resume/upload/route.ts` (check quota)
- `components/dashboard/UploadQuotaIndicator.tsx`
- `components/dashboard/CareerAdvice.tsx`

**Enforcement:**
- Check user_type before granting access
- Free users: Limited features
- Members: All features unlocked

### 5.8 Subscription State Management

**Database Operations:**
- Create subscription record on purchase
- Update status on changes
- Track subscription history
- Handle cancellation (access until period end)

## Testing Checklist

After completing Stage 5, verify:

- [ ] Pricing page displays all plans correctly
- [ ] "Upgrade" button redirects to Stripe Checkout
- [ ] Checkout session created successfully
- [ ] Test payments process (use card 4242 4242 4242 4242)
- [ ] Webhook receives checkout completion event
- [ ] Subscription record created in database
- [ ] User type updated to "member"
- [ ] Success page displays after payment
- [ ] Subscription status shows on Dashboard immediately
- [ ] Stripe Customer Portal opens correctly
- [ ] Can switch from monthly to yearly plan
- [ ] Can switch from yearly to monthly plan
- [ ] Cancellation works (status becomes "cancelled")
- [ ] Access continues until period end
- [ ] After period ends, user reverts to "free"
- [ ] Upload quota re-enforced for reverted users
- [ ] Premium features accessible to members only
- [ ] Free users see upgrade prompts
- [ ] Webhook signature verification works
- [ ] Failed payments handled gracefully

## Success Criteria

✅ Stripe integration working in test mode
✅ Payments processing successfully
✅ Webhooks handled correctly
✅ User types updated appropriately
✅ Subscription lifecycle managed
✅ Feature gating enforced
✅ No errors in console

---

# Stage 6: User Interface

## Objective

Apply consistent design system, build landing page, implement responsive design, add loading states, and polish entire user experience.

## Dependencies

- ✅ Stages 1-5 complete
- Design system selected (21st.dev template)

## Deliverables

### 6.1 Design System Integration

**Files to Create:**
- `styles/theme.css` - Theme variables
- `components/ui/*` - UI component library

**Design System:**
- Select template from 21st.dev
- Extract color palette, typography, spacing
- Create CSS variables in theme.css
- Build reusable UI components (button, card, input, select, etc.)

### 6.2 Global Styling

**Files to Modify:**
- `styles/globals.css`

**Apply Consistent:**
- Typography (fonts, sizes, line heights)
- Colors (primary, secondary, accent, neutral)
- Spacing (margins, padding based on 4px/8px grid)
- Border radius, shadows, transitions

### 6.3 Landing Page

**Files to Modify:**
- `app/page.tsx`

**Files to Create:**
- `components/landing/Hero.tsx`
- `components/landing/Features.tsx`
- `components/landing/Pricing.tsx`
- `components/landing/Footer.tsx`

**Sections:**
1. **Hero Section**
   - Catchy headline
   - Subheadline explaining value proposition
   - "Get Started" CTA button
   - Hero image/illustration

2. **Features Section**
   - Highlight key features (AI analysis, quota system, career advice)
   - Use icons and short descriptions

3. **Pricing Section**
   - Link to full pricing page
   - Quick overview of plans

4. **Footer**
   - Links (Terms, Privacy, Pricing)
   - Social media (optional)
   - Copyright notice

### 6.4 Loading States

**Files to Create:**
- `components/ui/spinner.tsx`
- `components/ui/skeleton.tsx`

**Add to:**
- Resume upload (progress bar)
- Analysis in progress (spinner + "Analyzing...")
- Dashboard data loading (skeleton loaders)
- API calls (button disabled state)

### 6.5 Error Message Styling

**Files to Create:**
- `components/ui/alert.tsx`

**Features:**
- Clear iconography (❌ for errors, ⚠️ for warnings)
- User-friendly messages (no technical jargon)
- Actionable next steps
- Consistent styling across all errors

### 6.6 Success Message Styling

**Files to Create:**
- `components/ui/toast.tsx`

**Features:**
- Confirmation icons (✅)
- Brief success messages
- Auto-dismiss after 3-5 seconds
- Examples: "Resume uploaded!", "Profile updated!", "Subscription activated!"

### 6.7 Responsive Design

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Test on:**
- iPhone (iOS)
- Android devices
- iPad
- Desktop browsers

**Ensure:**
- Navigation works on mobile (hamburger menu)
- Forms usable on mobile
- Tables/cards stack appropriately
- Touch targets sized correctly (min 44x44px)

### 6.8 Accessibility Improvements

**Tasks:**
- Add ARIA labels to interactive elements
- Ensure keyboard navigation works throughout
- Add focus indicators (visible outline on tab)
- Check color contrast (WCAG AA compliance)
- Add alt text to all images
- Use semantic HTML (header, nav, main, footer, etc.)

### 6.9 Performance Optimization

**Tasks:**
- Optimize images (use next/image component)
- Implement code splitting (dynamic imports)
- Lazy load components below the fold
- Minimize bundle size
- Enable caching where appropriate

**Run Lighthouse Audit:**
- Performance score > 90
- Accessibility score > 90
- Best Practices score > 90
- SEO score > 90

### 6.10 SEO Optimization

**Files to Modify:**
- All page files

**Add:**
- Title tags (unique per page)
- Meta descriptions
- Open Graph tags (og:title, og:description, og:image)
- Twitter Card tags
- Canonical URLs

**Files to Create:**
- `app/sitemap.xml/route.ts` - Generate sitemap
- `app/robots.txt/route.ts` - Robots.txt file

### 6.11 Legal Pages

**Files to Create:**
- `app/terms/page.tsx` - Terms of Service
- `app/privacy/page.tsx` - Privacy Policy

**Content:**
- Draft basic terms and privacy policy
- Include sections on data collection, usage, storage
- List user rights
- Add contact information
- Use clear, readable formatting

## Testing Checklist

After completing Stage 6, verify:

- [ ] All components use design system styles
- [ ] Colors consistent across all pages
- [ ] Typography consistent across all pages
- [ ] Spacing follows design system grid
- [ ] Landing page loads within 1.5 seconds
- [ ] Hero, features, pricing, footer sections functional
- [ ] Loading states display during async operations
- [ ] Spinners appear appropriately
- [ ] Skeleton loaders show while data loads
- [ ] Error messages clear and user-friendly
- [ ] Success messages/toasts appear and auto-dismiss
- [ ] Mobile layout works on iOS and Android
- [ ] Tablet layout responsive and functional
- [ ] Desktop layout optimal for large screens
- [ ] Navigation works on mobile (hamburger menu)
- [ ] Touch interactions work on mobile
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA standards
- [ ] All images have alt text
- [ ] Images optimized and load quickly
- [ ] Lighthouse Performance score > 90
- [ ] Lighthouse Accessibility score > 90
- [ ] Lighthouse SEO score > 90
- [ ] Meta tags present on all pages
- [ ] Sitemap accessible at /sitemap.xml
- [ ] Terms of Service page accessible
- [ ] Privacy Policy page accessible

## Success Criteria

✅ Consistent design system applied
✅ Landing page complete and optimized
✅ Responsive on all devices
✅ Loading and success states polished
✅ Accessibility standards met
✅ Performance optimized (Lighthouse > 90)
✅ SEO optimized
✅ Legal pages published
✅ No errors in console

---

## Post-Implementation Tasks

After completing all 6 stages:

### 1. Final Testing

- [ ] Complete end-to-end user flow (guest → free → member)
- [ ] Test all features comprehensively
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Cross-device testing (mobile, tablet, desktop)
- [ ] Performance testing with Lighthouse
- [ ] Security audit (check for vulnerabilities)

### 2. Deployment to Vercel

**Steps:**
1. Create Vercel project
2. Connect GitHub repository
3. Configure environment variables (production values)
4. Set up custom domain (optional)
5. Deploy to production
6. Verify deployment successful

**Environment Variables for Production:**
- All same variables from `.env.local`
- Update URLs to production values
- Use production Stripe keys
- Update `NEXT_PUBLIC_APP_URL` to production domain

### 3. Stripe Live Mode Setup

- Switch from test mode to live mode
- Update products and prices
- Configure webhooks for live mode
- Test with real payment methods
- Set up payment confirmation emails

### 4. Monitoring and Analytics

- Set up error logging (Sentry, LogRocket)
- Configure analytics (Google Analytics, Vercel Analytics)
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor Stripe webhooks
- Track KPIs from success.md

### 5. Documentation

- Create user guide/FAQ
- Document API endpoints
- Write developer README
- Create deployment guide
- Document environment setup

### 6. Launch Checklist

- [ ] All features tested and working
- [ ] Production environment configured
- [ ] Stripe live mode active
- [ ] Monitoring enabled
- [ ] Analytics tracking
- [ ] Terms and Privacy published
- [ ] Support email set up
- [ ] Backup strategy established
- [ ] Deployment successful
- [ ] Domain configured (if applicable)

---

## Success Metrics

Track these metrics post-launch (refer to success.md):

### Month 1 Targets
- 100+ signups
- 50+ resume uploads
- 5+ Premium subscribers
- $100+ MRR

### Month 3 Targets
- 500+ signups
- 300+ resume uploads
- 25+ Premium subscribers
- $500+ MRR

### Month 6 Targets
- 1,500+ signups
- 1,000+ resume uploads
- 75+ Premium subscribers
- $1,500+ MRR
- >60% 6-month retention

---

## Notes and Reminders

- **Work sequentially**: Complete each stage fully before moving to the next
- **Test thoroughly**: Use the testing checklists after each stage
- **Commit often**: Commit code after completing each major feature
- **Document deviations**: Note any changes from this plan
- **Refer to spec docs**: Keep flow.md, rules.md, success.md handy
- **Ask for clarification**: Don't make large assumptions
- **Iterate based on feedback**: Be prepared to adjust based on testing

---

## Reference Documents

- **README.md** - Project overview and tech stack
- **spec/product.md** - Product strategy and user personas
- **spec/scope.md** - Detailed technical requirements
- **spec/flow.md** - User flows and state transitions
- **spec/rules.md** - Business rules and constraints
- **spec/success.md** - KPIs and success criteria

---

**Document Version:** 1.0
**Last Updated:** January 5, 2026
**Author:** Claude (AI Assistant)
