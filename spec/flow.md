# Flow

## 1. User State Transitions

### 1.1 User Type Progression

```
Guest → Free User → Member
  ↓         ↓          ↓
No Access  Limited   Full Access
```

### 1.2 State Transition Rules

- **Guest → Free User**: Complete sign-up + fill basic information + upload resume
- **Free User → Member**: Purchase Premium subscription via Stripe
- **Member → Free User**: Subscription expired or cancelled (after billing period ends)

### 1.3 Member Subscription States

- **Active**: Current paid subscription with full feature access
- **Cancelled**: User cancelled but still within paid billing period (full access until expiry)
- **Expired**: Subscription ended, user reverts to Free User status

## 2. Guest User Flow

**Entry Point:** Landing page

**User Journey:**

### Step 1: Landing Page
- User views landing page showcasing platform features and benefits
- Options available:
  - "Get Started" button (primary CTA)
  - "Sign Up" button
  - "Sign In" link (for returning users)

### Step 2: Sign-Up Process
- User clicks "Get Started" or "Sign Up"
- Redirected to sign-up page with two options:
  - **Email + Password**:
    - Enter email address
    - Create password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
    - Confirm password
    - Receive verification code via email
    - Enter verification code (10-minute window)
  - **Google OAuth**:
    - Click "Continue with Google"
    - Select Google account
    - Auto-verify email (no verification code needed)

### Step 3: Fill Basic Information Form
- User completes profile information:
  - **Name** (required, 2-50 characters)
  - **Role** (required, 2-50 characters)
  - **Target Position** (required, 2-100 characters)
  - **City** (required, 2-50 characters)
  - **Work Experiences** (at least 1 required):
    - Company name (required)
    - Job title (required)
    - Start date (month + year picker)
    - End date (month + year picker) OR "Present" checkbox
    - Total duration (auto-calculated, e.g., "2 years 3 months")
    - Description (optional, max 500 characters)
    - "Add Another Experience" button for multiple entries

### Step 4: Upload Resume
- User uploads PDF resume (max 10MB)
- Preview window displays first page
- Options:
  - "Confirm Upload" button
  - "Re-upload" button (if wrong file selected)

### Step 5: Resume Analysis
- Platform sends PDF to Claude API
- Claude API performs:
  - Grammar and spelling corrections
  - Extracts basic information (name, email, phone, address)
  - Extracts skills and expertises as individual tags
  - Extracts work/internship experiences with dates
  - Compares extracted work experience dates with user's manual entries
  - Generates improvement suggestions if discrepancies found

### Step 6: View Analysis Results
- Display analysis results on screen:
  - Basic information
  - Skills (displayed as tags)
  - Work experiences (displayed as list with dates)
  - Improvement suggestions (if any date discrepancies detected)

### Step 7: User Type Update
- System updates user type from "Guest" to "Free User"
- Redirect to Dashboard

**Exit State:** Free User on Dashboard with onboarding flow initiated

## 3. Free User Flow

**Entry Point:** First login to Dashboard (or immediately after guest onboarding)

### 3.1 Dashboard First-Time Onboarding (5 Steps)

#### Step 1: Fill Basic Info (Skippable if Completed)
- If already completed during sign-up: Auto-skip
- If not completed: Display basic information form
- User can click "Skip" to proceed

#### Step 2: Upload Resume (Skippable if Completed)
- If already uploaded: Auto-skip
- If not uploaded: Display resume upload interface
- User can click "Skip" to proceed

#### Step 3: View Analysis Results (Skippable if Completed)
- If analysis already done: Auto-skip
- If not analyzed: Display analysis results
- User can click "Skip" to proceed

#### Step 4: Dashboard Introduction Tour
- Platform displays interactive tour highlighting:
  - Welcome header
  - Onboarding guide
  - Resume information section
  - Subscription status
  - Statistics block
  - Upload quota indicator
- User clicks "Next" to progress through tour
- User can click "Skip Tour" anytime

#### Step 5: Purchase Navigation
- Platform displays upgrade prompt:
  - Benefits of Premium membership
  - Pricing options (monthly/yearly)
  - "Upgrade Now" button
  - "Maybe Later" button (allows cancel anytime)

### 3.2 Dashboard Navigation

**Available Sections:**

- **Welcome Header**: Displays user's name and profile completion percentage (pie chart)
- **Onboarding Guide**: Shows current step progress with clickable step tags
- **Resume Information**: Displays analysis results (name, email, skills, experiences)
- **Career Advice**: Basic improvement suggestions based on resume analysis
- **Subscription Status**: Shows "Free Plan" with "Upgrade" button
- **Statistics Block**: Displays count of skills and experiences
- **Upload Quota Indicator**: Shows "X/4 uploads remaining this month"

**Actions Available:**

- View resume information
- Check subscription status
- View basic career advice
- Upload new resume (if quota available - max 4 per month)
- Access limited features
- Click "Upgrade to Premium" button

**Restrictions:**

- Cannot store multiple resume versions (latest upload replaces previous)
- Limited to 4 uploads per month (quota resets on 1st of each month)
- Basic career advice only (detailed roadmap requires Premium)
- Cannot generate cover letters (Premium feature)

## 4. Member User Flow

**Entry Point:** After successful Premium purchase

### 4.1 Available Actions

- **Full Dashboard Access**:
  - Welcome header with name and 100% profile completion
  - Resume information for all stored versions
  - Detailed career roadmap and improvement suggestions
  - Subscription status showing current plan details
  - Statistics across all resume versions

- **Upload/Re-analyze Resumes**:
  - Unlimited resume uploads (no monthly quota)
  - Create new resume versions with custom labels
  - Switch between stored resume versions via dropdown/tabs
  - Re-analyze any resume version unlimited times

- **Manage Subscription**:
  - View current plan (Premium Monthly or Premium Yearly)
  - View billing cycle and next deduction date
  - Click "Manage Subscription" to access Stripe Portal
  - Switch plans (monthly ↔ yearly)
  - Update payment method
  - Cancel subscription (access continues until period end)

- **Premium Features** (Future):
  - Generate cover letters (not in MVP)
  - Advanced career insights

## 5. Resume Analysis Flow

**Trigger:** User uploads resume (Free User or Member)

### Step 1: File Validation
- Check file format (must be PDF)
- Check file size (must be ≤10MB)
- If validation fails:
  - Display error message
  - Do NOT increment upload quota
  - Allow re-upload

### Step 2: Display Preview Window
- Show first page of PDF
- Options:
  - "Confirm Upload" button
  - "Cancel" or "Choose Different File" button

### Step 3: User Confirms Upload
- User clicks "Confirm Upload"
- Display loading state with progress indicator

### Step 4: Send to Claude API
- Platform sends PDF to Claude API for processing
- Timeout: 60 seconds (display error if exceeded)

### Step 5: Claude API Analysis
Claude API performs the following:

1. **Grammar Correction**: Fix all grammar errors in resume
2. **Spelling Correction**: Fix all spelling errors in resume
3. **Extract Basic Information**:
   - Name
   - Email address
   - Phone number
   - Home address
4. **Extract Skills & Expertises**:
   - Identify all skills mentioned
   - Generate individual skill tags
5. **Extract Work/Internship Experiences**:
   - Company names
   - Job titles
   - Start and end dates
   - Descriptions
6. **Compare Work Experience Dates**:
   - Match extracted dates with user's manual entries
   - Identify discrepancies
7. **Generate Improvement Suggestions**:
   - If dates don't match: Flag discrepancy with specific message
   - Resume formatting suggestions
   - Content improvement recommendations
   - Keyword optimization suggestions

### Step 6: Store Results in Supabase
- Store corrected PDF in Supabase Storage
- Store extracted data in Supabase Database:
  - Basic information
  - Skills array
  - Experiences array with dates
  - Improvement suggestions
  - Analysis timestamp

### Step 7: Store PDF
- Save original PDF to Supabase Storage
- **Free User**: Replace previous PDF (single storage)
- **Member**: Create new version (multiple storage with labeling)

### Step 8: Display Results on Dashboard
- Show analysis results:
  - Basic information (header)
  - Skills (tags)
  - Experiences (ordered list with dates)
  - Career advice and improvement suggestions
- If discrepancies found, display:
  - "⚠️ Date Discrepancy Detected"
  - "Your resume shows you worked at [Company] from [Resume Date], but your profile says [Manual Entry Date]. Please verify and update."
  - "Edit" button to update manual entry

### Step 9: Update Upload Quota (Free Users Only)
- Increment upload counter for current month
- Update quota display: "X/4 uploads remaining this month"

## 6. Purchase Flow

**Trigger:** User clicks "Upgrade Plan" or "Upgrade to Premium" button

### Step 1: Redirect to Stripe Checkout
- Platform creates Stripe Checkout session
- User redirected to Stripe-hosted payment page

### Step 2: Select Plan
- User chooses:
  - **Premium Monthly**: $19.99/month
  - **Premium Yearly**: $199/year (save 17%)

### Step 3: Enter Payment Information
- User enters:
  - Credit/debit card details
  - Billing address
  - Email (pre-filled)

### Step 4: Complete Payment
- User clicks "Subscribe" or "Pay Now"
- Stripe processes payment (test mode)

### Step 5: Stripe Webhook Updates Database
- Stripe sends webhook to platform
- Platform receives payment confirmation
- Database updated with subscription details:
  - Subscription ID
  - Plan type (monthly/yearly)
  - Billing cycle start date
  - Next deduction date
  - Status: "Active"

### Step 6: Update User Type to Member
- System updates user type from "Free User" to "Member"
- Unlock all Premium features

### Step 7: Redirect Back to Dashboard
- User automatically redirected to Dashboard
- URL includes success parameter

### Step 8: Display Success Message
- Show confirmation:
  - "✅ Welcome to Premium!"
  - "You now have unlimited resume uploads and access to all premium features."
- Update Dashboard to reflect Premium status

## 7. Subscription Management Flow

**Trigger:** Member clicks "Manage Subscription" button on Dashboard

### Step 1: Redirect to Stripe Customer Portal
- Platform creates Stripe Portal session
- User redirected to Stripe-hosted portal

### Step 2: Available Actions in Portal

User can perform:

- **Switch Plans**:
  - Change from Monthly to Yearly (or vice versa)
  - Prorated billing applied
  - Changes effective immediately

- **Cancel Subscription**:
  - Select "Cancel Subscription"
  - Confirm cancellation
  - Access continues until end of current billing period
  - Subscription state: "Cancelled"

- **Update Payment Method**:
  - Add new credit card
  - Remove old card
  - Update billing address

- **View Billing History**:
  - See past invoices
  - Download receipts

### Step 3: Changes Reflected via Webhook
- Stripe sends webhook for any changes
- Platform receives update
- Database updated accordingly

### Step 4: Dashboard Updates Subscription Status
- User returns to platform
- Dashboard reflects new subscription state:
  - Active subscription shows next billing date
  - Cancelled subscription shows "Access until [End Date]"
  - Plan changes show updated plan name

## 8. Resume Version Management Flow (Members Only)

**Trigger:** Member has multiple stored resumes

### Step 1: Dashboard Displays Resume Version Selector
- Dropdown menu or tabs showing all resume versions
- Each version labeled:
  - Default: "Resume uploaded on [Date]"
  - Custom: User-defined label (e.g., "Software Engineer Resume", "Data Analyst Resume")

### Step 2: User Clicks to View All Versions
- Dropdown expands showing list of versions:
  - "Software Engineer Resume (uploaded Jan 5, 2026)"
  - "Data Analyst Resume (uploaded Dec 15, 2025)"
  - "Marketing Manager Resume (uploaded Nov 20, 2025)"

### Step 3: User Selects Different Version
- User clicks on different resume version
- Loading indicator displays briefly

### Step 4: Dashboard Updates to Show Selected Resume's Data
- Resume information section updates:
  - Basic information for selected version
  - Skills extracted from selected version
  - Experiences from selected version
  - Career advice for selected version

### Step 5: User Can Upload New Version
- Click "Upload New Version" button
- Follow resume upload flow (Step 1-8 of Resume Analysis Flow)
- New version created and added to selector

### Step 6: User Can Delete Old Versions (Optional Feature)
- Click "..." menu next to version
- Select "Delete Version"
- Confirm deletion
- Version removed from database and storage

## 9. Upload Quota Management Flow (Free Users)

**Trigger:** Free user attempts to upload resume

### Step 1: Check Current Month's Upload Count
- Platform queries database for uploads in current calendar month
- Compare count with quota limit (4)

### Step 2: If Count < 4 (Quota Available)

**Allow Upload:**
- Proceed with resume upload flow
- Display preview window
- User confirms upload
- Send to Claude API for analysis
- Increment upload counter (+1)
- Replace previous resume in storage (single storage mode)
- Run analysis and display results
- Update quota indicator: "X/4 uploads remaining this month"

### Step 3: If Count >= 4 (Quota Exceeded)

**Block Upload:**
- Display modal/alert:
  - **Header**: "Monthly Upload Limit Reached"
  - **Message**: "You've used all 4 uploads for this month (4/4)"
  - **Quota Reset Date**: "Quota resets on [1st of Next Month]"
  - **Upgrade CTA**: "Upgrade to Premium" button
  - **Benefits List**:
    - ✅ Unlimited resume uploads
    - ✅ Store multiple resume versions
    - ✅ Detailed career roadmap
    - ✅ Priority support
- User options:
  - Click "Upgrade to Premium" → Go to Purchase Flow
  - Click "Cancel" or "Close" → Return to Dashboard

## 10. Error Handling Flows

### 10.1 Failed Resume Upload

**Scenario:** Upload fails due to network error, file corruption, or API timeout

**Flow:**
1. Display error message:
   - "❌ Upload Failed"
   - "We couldn't process your resume. Please try again."
2. Provide "Try Again" button
3. Do NOT increment upload quota counter
4. Maintain previous state (previous resume unchanged if Free User)
5. Allow user to re-upload without penalty

### 10.2 Quota Exceeded (Free Users)

**Scenario:** Free user has reached 4 uploads for current month

**Flow:**
1. Display quota exceeded modal (see Step 3 of Upload Quota Management Flow)
2. Show quota reset date (1st of next month)
3. Provide "Upgrade to Premium" button with benefits list
4. Explain Premium benefits:
   - Unlimited uploads
   - Multiple resume version storage
5. User options:
   - Upgrade → Purchase Flow
   - Cancel → Return to Dashboard

### 10.3 Failed Payment

**Scenario:** Payment declined or Stripe checkout error

**Flow:**
1. Stripe displays error on checkout page
2. User returned to platform with error parameter
3. Display error message:
   - "❌ Payment Failed"
   - "Your payment couldn't be processed. Please try again or use a different payment method."
4. Provide "Try Again" button → Return to pricing page
5. Maintain Free User status (no upgrade)
6. User can retry purchase

### 10.4 Session Expiry

**Scenario:** User session expires while on protected route

**Flow:**
1. Detect expired session (Clerk auth check fails)
2. Redirect user to sign-in page
3. Display message: "Your session has expired. Please sign in again."
4. Preserve intended destination URL
5. After successful sign-in:
   - Redirect back to original destination
   - Restore previous state if possible
6. User can continue from where they left off

### 10.5 Resume Analysis Timeout

**Scenario:** Claude API takes longer than 60 seconds

**Flow:**
1. Display timeout error:
   - "⏱️ Analysis Taking Longer Than Expected"
   - "We're still processing your resume. Please check back in a few moments."
2. Options:
   - "Refresh" button to check status
   - "Try Again" button to re-upload
3. Background: Continue attempting analysis
4. If successful: Display results when ready
5. If failed: Allow re-upload without quota penalty

### 10.6 Date Discrepancy Detected

**Scenario:** Resume dates don't match manual entries

**Flow:**
1. Complete analysis successfully
2. Display results with warning banner:
   - "⚠️ Date Discrepancy Detected"
3. Show specific discrepancies:
   - "Your resume shows you worked at [Company X] from [Jan 2020 - Dec 2022], but your profile says [Jan 2020 - Nov 2022]. Please verify and update."
4. Provide "Edit Work Experience" button
5. User clicks → Opens edit form pre-filled with current data
6. User updates dates
7. System saves changes
8. Remove discrepancy warning
9. Re-run validation in future analyses
