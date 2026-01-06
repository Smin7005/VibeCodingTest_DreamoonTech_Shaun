# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Resume Management AI Platform** - An AI-powered SaaS platform that helps users create, improve, and optimize resumes using Claude AI with subscription-based monetization.

**Current Status:** Pre-Implementation Phase (No code written yet)

**Tech Stack:**
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Backend: Next.js API Routes, Node.js 18+
- Authentication: Clerk (email/password + Google OAuth)
- Database: Supabase (PostgreSQL)
- File Storage: Supabase Storage
- AI: Claude API (Anthropic)
- Payments: Stripe (subscription model)
- Deployment: Vercel

## Development Commands

### Initial Setup (Not yet run)
```bash
# Create Next.js project with TypeScript and Tailwind
npx create-next-app@latest . --typescript --tailwind --app

# Install core dependencies
npm install @clerk/nextjs @supabase/supabase-js @anthropic-ai/sdk stripe

# Install additional dependencies
npm install react-pdf-viewer pdf-lib date-fns recharts

# Install dev dependencies
npm install -D @types/node @types/react @types/react-dom
```

### Standard Development Commands (After setup)
```bash
npm run dev          # Start development server at http://localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Setup
Create `.env.local` file with these variables (see `spec/implementation.md` for details):
- Clerk keys (authentication)
- Supabase keys (database + storage)
- Anthropic API key (Claude AI)
- Stripe keys (payments)
- App configuration

### Database Setup
Run the SQL schema from `spec/implementation.md` section 3 in Supabase SQL Editor to create:
- user_profiles, work_experiences, onboarding_progress tables
- resumes, resume_analyses, upload_quota tables
- subscriptions, subscription_history tables
- Indexes and triggers

## Architecture & Implementation Strategy

### 6-Stage Implementation Plan

The project follows a **strict staged implementation approach** detailed in `spec/implementation.md`. Each stage must be completed fully before moving to the next:

1. **Stage 1: User Registration** - Clerk authentication, sign-up/sign-in, route protection
2. **Stage 2: Onboarding Flow** - Multi-step forms, work experience collection, resume upload
3. **Stage 3: Resume Management** - Claude API integration, quota system, resume analysis
4. **Stage 4: User Dashboard** - Data display, career advice, subscription status
5. **Stage 5: User Purchase** - Stripe integration, subscription lifecycle, webhooks
6. **Stage 6: User Interface** - Design system (21st.dev), landing page, responsive design

**Critical:** Always reference `spec/implementation.md` for detailed implementation requirements, file structure, and testing checklists for each stage.

### User Type System

The platform operates on a three-tier user system:

- **Guest**: Unauthenticated, can only view landing/pricing pages
- **Free User**: Authenticated, 4 resume uploads/month, single resume storage, basic career advice
- **Member**: Premium subscription, unlimited uploads, multiple resume versions, detailed career roadmap

**Key Distinction:** Free users get single resume storage (new upload replaces old). Members get version management (all uploads stored with custom labels).

### Core Architecture Patterns

**Authentication Flow:**
- Clerk handles all auth (email/password + Google OAuth)
- Clerk webhooks create user_profile records in Supabase
- Middleware protects `/dashboard/*`, `/onboarding/*`, `/subscription/*` routes
- User type transitions: guest → free (after onboarding) → member (after purchase)

**Resume Analysis Pipeline:**
1. User uploads PDF → Supabase Storage (`resumes` bucket)
2. Create resume record in database
3. Call Claude API for analysis (grammar, info extraction, skills, experiences, date validation)
4. Store structured analysis results in `resume_analyses` table
5. Generate career advice (3-5 points for Free, 10+ for Members)
6. Update dashboard with analysis results

**Upload Quota System:**
- Track uploads per user per month in `upload_quota` table
- Free users: 4/month max, enforced before upload
- Members: unlimited
- Failed uploads don't count toward quota
- Quota resets on 1st of each month at 00:00 UTC

**Date Discrepancy Detection:**
- Compare manual work experience dates (from onboarding form) with extracted dates (from resume)
- Flag discrepancies > 1 month difference
- Display warnings in "Career Advice" section with "Edit Work Experience" option

**Subscription Management:**
- Two plans: Premium Monthly ($19.99/month), Premium Yearly ($199/year)
- Stripe webhooks handle: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Subscription status tracked in `subscriptions` table
- User type updated based on subscription status
- Stripe Customer Portal for plan management

### File Organization

```
app/
├── api/
│   ├── resume/
│   │   ├── analyze/route.ts    # Claude API integration
│   │   └── upload/route.ts      # Resume upload + quota check
│   ├── stripe/
│   │   ├── checkout/route.ts    # Create checkout session
│   │   ├── webhook/route.ts     # Handle Stripe webhooks
│   │   └── portal/route.ts      # Customer portal link
│   ├── onboarding/
│   │   └── progress/route.ts    # Track onboarding state
│   └── user/
│       └── create-profile/route.ts  # Clerk webhook handler
├── dashboard/                   # Protected dashboard pages
├── onboarding/                  # Multi-step onboarding flow
├── pricing/                     # Pricing page
├── sign-in/[[...sign-in]]/     # Clerk sign-in
├── sign-up/[[...sign-up]]/     # Clerk sign-up
├── subscription/               # Success/cancel pages
│   ├── success/
│   └── cancelled/
├── terms/                       # Terms of Service
├── privacy/                     # Privacy Policy
├── layout.tsx                   # Root layout with ClerkProvider
└── page.tsx                     # Landing page

components/
├── dashboard/                   # Dashboard UI components
│   ├── WelcomeHeader.tsx       # Name + profile completion pie chart
│   ├── ProfileCompletion.tsx   # Progress visualization
│   ├── OnboardingGuide.tsx     # Stepper with clickable steps
│   ├── ResumeInformation.tsx   # Skills tags, experiences list
│   ├── CareerAdvice.tsx        # AI-generated advice + discrepancy warnings
│   ├── UploadQuotaIndicator.tsx  # "X/4 uploads remaining" (Free only)
│   ├── ResumeVersionSelector.tsx # Version dropdown (Members only)
│   ├── SubscriptionStatus.tsx  # Plan details + manage button
│   └── EditWorkExperience.tsx  # Modal to correct date discrepancies
├── onboarding/
│   ├── Stepper.tsx             # Step indicator component
│   ├── BasicInfoForm.tsx       # Name, role, target position, city
│   ├── WorkExperienceForm.tsx  # Repeatable work experience fields
│   ├── ResumeUpload.tsx        # Drag-drop, preview, upload
│   ├── AnalysisResults.tsx     # Display parsed data
│   └── DashboardTour.tsx       # Introduction tour (Step 4)
├── landing/
│   ├── Hero.tsx                # Headline + CTA
│   ├── Features.tsx            # Feature highlights
│   ├── Pricing.tsx             # Plan comparison
│   └── Footer.tsx              # Links + copyright
└── ui/                          # Reusable UI library from 21st.dev

lib/
├── claude.ts                    # Anthropic SDK client + prompts
├── supabase.ts                  # Supabase client initialization
├── stripe.ts                    # Stripe client + helpers
├── quota.ts                     # Upload quota check/increment
├── onboarding.ts                # Onboarding state helpers
├── resume-parser.ts             # Resume parsing utilities
├── subscription.ts              # Subscription management
└── dashboard.ts                 # Dashboard data fetching

middleware.ts                    # Clerk route protection
```

### Critical Business Rules (see `spec/rules.md`)

**Resume Upload:**
- PDF only, max 10MB, min 1KB
- Free users: 4/month quota, single storage (new replaces old)
- Members: unlimited, version storage (all kept)
- Failed uploads don't count toward quota

**Work Experience Date Validation:**
- Compare manual entries vs resume-extracted dates
- Flag if difference > 1 month
- Display in "Career Advice" with edit option

**Profile Completion Calculation:**
- Basic info filled: 25%
- Resume uploaded: 25%
- Analysis completed: 25%
- Subscription active: 25% (Members only, max 75% for Free users)
- Display as pie chart with color coding (red 0-25%, orange 26-50%, yellow 51-75%, green 76-100%)

**Onboarding State:**
- Track completion of each step in `onboarding_progress` table
- Allow skipping completed steps (Free user flow)
- Persist state across sessions

**Subscription Lifecycle:**
- Cancel at period end: Access continues until period expires
- After expiration: user_type reverts to 'free', quota re-enforced
- Plan changes: handled via Stripe Customer Portal

## Key Integration Points

### Claude API Usage
**Purpose:** Resume analysis with grammar correction, info extraction, career advice

**Analysis Tasks:**
1. Grammar and spelling correction
2. Extract basic info (name, email, phone, address)
3. Extract skills as array of tags
4. Extract work experiences with dates
5. Validate dates against manual entries
6. Generate career advice (tiered by user type)

**Timeout:** 60 seconds max
**Error Handling:** Graceful degradation, retry logic

### Supabase Storage
**Bucket:** `resumes` (private, authenticated access only)
**File Naming:** `{userId}_{timestamp}_{originalFilename}.pdf`
**RLS Policies:** User-specific access only

### Stripe Webhooks
**Required Events:**
- `checkout.session.completed` → Create subscription, upgrade to member
- `customer.subscription.updated` → Update plan/status
- `customer.subscription.deleted` → Downgrade to free

**Security:** Always verify webhook signatures using `STRIPE_WEBHOOK_SECRET`

## Common Development Patterns

### Checking User Type
```typescript
// Always check user_type before granting features
const { user_type } = await getUserProfile(userId);

if (user_type === 'member') {
  // Unlimited uploads, detailed advice, version management
} else if (user_type === 'free') {
  // Check quota, basic advice, single storage
} else {
  // Redirect to sign-up
}
```

### Upload Quota Check
```typescript
// Before allowing upload (Free users only)
const quota = await checkUploadQuota(userId);
if (quota.remaining <= 0) {
  return { error: 'Upload quota exceeded. Upgrade to Premium.' };
}
```

### Resume Version Handling
```typescript
// Free users: Replace previous resume
if (user_type === 'free') {
  await deletePreviousResume(userId);
}

// Members: Create new version
if (user_type === 'member') {
  await createResumeVersion(userId, file, customLabel);
}
```

## Testing Approach

Each stage has a detailed testing checklist in `spec/implementation.md`. Complete all tests before proceeding to next stage.

**Manual Testing Required:**
- All authentication flows (email, OAuth)
- All onboarding steps (guest → free → member)
- Upload quota enforcement
- Resume version management
- Stripe payment flows (use test card: 4242 4242 4242 4242)
- Date discrepancy detection
- Responsive design (mobile, tablet, desktop)

**Test Data:**
- Test with 20+ real resumes for accuracy validation
- Grammar/spelling correction: >90% accuracy expected
- Basic info extraction: >90% accuracy expected
- Skills extraction: >85% accuracy expected
- Work experience extraction: >80% accuracy expected

## Important Constraints

- **No code exists yet:** This is a greenfield project. All implementation must follow the staged approach in `spec/implementation.md`.
- **Stage order is mandatory:** Do not skip stages or implement out of order. Each stage builds on previous stages.
- **Testing is non-negotiable:** Complete testing checklist after each stage before moving forward.
- **User type transitions are critical:** Guest → Free (after onboarding completion), Free → Member (after subscription purchase), Member → Free (after subscription cancellation/expiration).
- **Date validation is a core feature:** Always compare manual work experience dates with resume-extracted dates and flag discrepancies.
- **Quota enforcement is strict:** Free users MUST be blocked after 4 uploads/month. Failed uploads don't count.

## Documentation References

**ALWAYS consult these files before implementing:**

- `spec/implementation.md` - Complete implementation guide with file structure and testing checklists
- `spec/scope.md` - Detailed technical requirements and feature specifications
- `spec/rules.md` - Business rules, validation rules, and constraints
- `spec/flow.md` - User flows and state transitions
- `spec/product.md` - Product strategy and user personas
- `spec/success.md` - KPIs and success criteria

## Design System

**Template:** 21st.dev design system
**Styling:** Tailwind CSS with custom theme variables
**UI Components:** Custom components in `components/ui/`
**Responsive:** Mobile-first approach (breakpoints: <768px mobile, 768-1024px tablet, >1024px desktop)
**Accessibility:** WCAG AA compliance required

## Next Steps for Implementation

1. Run initial setup commands from `spec/implementation.md` Pre-Implementation Setup
2. Configure environment variables in `.env.local`
3. Run database schema setup in Supabase SQL Editor
4. Create Supabase Storage bucket named `resumes` (private)
5. Begin Stage 1: User Registration following `spec/implementation.md`
6. Complete testing checklist after each stage
7. Proceed sequentially through all 6 stages
