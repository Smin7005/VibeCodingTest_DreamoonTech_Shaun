# Rules

## 1. User Type Rules

### 1.1 Guest Rules

**Access Permissions:**
- ❌ Cannot access Dashboard
- ❌ Cannot upload resumes
- ❌ Cannot view analysis results
- ❌ Cannot access any protected routes
- ✅ Can view landing page
- ✅ Can access sign-up page
- ✅ Can access sign-in page

**Actions Required:**
- Must create account to use platform features
- Must complete sign-up process to become Free User

### 1.2 Free User Rules

**Access Permissions:**
- ✅ Can access Dashboard
- ✅ Can upload resumes (up to 4 per month)
- ✅ Can view analysis results
- ✅ Can view basic career advice
- ❌ Cannot generate cover letters (feature not included in MVP)
- ❌ Cannot store multiple resume versions
- ❌ Cannot access detailed career roadmap

**Upload Restrictions:**
- Maximum 5 resume uploads per calendar month
- Quota resets on 1st day of each month at 00:00 UTC
- Only latest resume is stored (new upload replaces previous)
- Limited to 4 analyses per month (tied to upload quota)

**Display Features:**
- See upgrade prompts for Premium features
- View upload quota indicator: "X/5 uploads remaining this month"
- Access basic improvement suggestions
- View profile completion percentage

### 1.3 Member Rules

**Access Permissions:**
- ✅ Unlimited resume uploads (no monthly quota)
- ✅ Unlimited resume analyses
- ✅ Can store multiple resume versions with custom labels
- ✅ Can switch between stored resume versions
- ✅ Full Dashboard access
- ✅ Detailed career roadmap and improvement suggestions
- ✅ Can manage subscription via Stripe Portal
- ❌ Cannot generate cover letters (NOT included in MVP - future iteration)

**Resume Management:**
- Unlimited uploads (no quota restrictions)
- Each upload creates new resume version
- All versions stored indefinitely
- Can name/label resume versions (e.g., "Software Engineer Resume", "Data Analyst Resume")
- Can switch between versions via dropdown/tabs
- Can delete old versions (optional)

**Subscription Management:**
- View current plan details
- View billing cycle and next deduction date
- Switch plans (monthly ↔ yearly)
- Update payment method
- Cancel subscription (access continues until period end)

## 2. Authentication Rules

### 2.1 Password Requirements

**For Email + Password Signup:**
- Minimum 8 characters
- Must contain at least 1 uppercase letter (A-Z)
- Must contain at least 1 lowercase letter (a-z)
- Must contain at least 1 number (0-9)
- Must contain at least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
- No maximum length limit (reasonable limit enforced by Clerk)
- Password cannot be same as email address

**Password Confirmation:**
- Must match initial password exactly
- Case-sensitive matching

### 2.2 Email Validation

**Email Format:**
- Must be valid email format (validated by Clerk)
- Must contain @ symbol and domain
- Must be unique (no duplicate accounts)

**Email Verification Process:**
- Verification code sent to email within 30 seconds
- Code valid for 10 minutes
- After 3 failed verification attempts, send new code
- New code invalidates previous codes
- Maximum 5 code requests per hour (anti-spam)

**Duplicate Email Prevention:**
- System checks email uniqueness before sending verification code
- If email exists: Display "Email already registered. Please sign in or use different email."
- Prevent account creation with duplicate email

### 2.3 OAuth Rules

**Google OAuth:**
- Automatically creates account if new user
- Auto-verifies email (no verification code needed)
- No password required for OAuth users
- User profile auto-filled with Google account data (name, email)
- Email from Google account must be unique

**OAuth Account Linking:**
- If email already exists with password account: Prompt to sign in instead
- Cannot link OAuth to existing non-OAuth account (security restriction)

## 3. File Upload Rules

### 3.1 Resume Upload Constraints

**File Format:**
- **Accepted:** PDF only (.pdf)
- **Rejected:** DOCX, DOC, TXT, RTF, JPEG, PNG, or any non-PDF format
- Display error: "Only PDF files are accepted. Please convert your resume to PDF and try again."

**File Size:**
- **Maximum:** 10 MB (10,485,760 bytes)
- **Minimum:** 1 KB (prevent empty files)
- If file > 10 MB: Display error "File size exceeds 10 MB limit. Please reduce file size and try again."
- If file < 1 KB: Display error "File appears to be empty or corrupted. Please try a different file."

**File Naming:**
- Accept any valid filename
- No restrictions on characters or length
- System auto-renames on storage: `{userId}_{timestamp}_{originalFilename}.pdf`

**Preview Requirements:**
- Display first page of PDF before confirmation
- Preview must render within 5 seconds
- If preview fails: Allow upload anyway with warning

### 3.2 Upload Quota Rules

**Free User Quota:**
- Maximum 5 uploads per calendar month
- Quota resets on 1st day of each month at 00:00 UTC
- Quota counter tracked per user in database
- If quota exceeded: Block upload and display upgrade prompt
- Failed uploads do NOT count toward quota

**Quota Reset Logic:**
- Automatic reset on 1st of every month
- Counter set to 0
- All Free Users reset simultaneously
- No proration or carryover from previous month

**Member Quota:**
- No upload quota (unlimited)
- No counter tracking needed
- All uploads allowed regardless of count

### 3.3 Upload Validation

**Pre-Upload Validation:**
1. Check file format (must be .pdf)
2. Check file size (must be 1 KB - 10 MB)
3. Check quota (Free Users only - must be < 4)
4. Check authentication (user must be signed in)

**Rejection Rules:**
- Non-PDF files → Reject immediately with error message
- Files > 10 MB → Reject with file size error
- Files < 1 KB → Reject with empty/corrupted error
- Quota exceeded (Free User) → Reject with upgrade prompt
- Unauthenticated user → Redirect to sign-in

**Error Messages:**
- Clear, actionable, user-friendly
- Never expose technical details
- Always provide next steps

### 3.4 Upload Storage Rules

**Free User Storage:**
- Single resume storage only
- New upload overwrites previous resume
- Old resume file deleted from Supabase Storage
- Old analysis data archived (not deleted - for history tracking)

**Member Storage:**
- Multiple resume versions stored indefinitely
- Each upload creates new version entry
- User can label versions with custom names
- No automatic deletion
- User can manually delete old versions

## 4. Resume Analysis Rules

### 4.1 Claude API Processing

**Grammar Correction:**
- Fix all grammar errors in resume content
- Preserve original formatting
- Return corrected version

**Spelling Correction:**
- Fix all spelling errors in resume content
- Use US English spelling by default
- Preserve proper nouns and company names

**Information Extraction:**

**Basic Information (Mandatory Fields):**
- Name (full name)
- Email address
- Phone number
- Home address (optional if not in resume)

**Skills Extraction:**
- Extract all mentioned skills
- Generate individual skill tags
- Categorize skills (technical, soft, language, etc.)
- Remove duplicates
- Store as array in database

**Experience Extraction:**
- Extract all work and internship experiences
- For each experience, extract:
  - Company name
  - Job title/position
  - Start date (month + year)
  - End date (month + year) OR "Present"
  - Description/responsibilities
  - Location (if available)
- Store as array of objects in database

### 4.2 Analysis Limits

**Free User Limits:**
- 4 analyses per month (tied to upload quota)
- Each upload = 1 analysis
- Cannot re-analyze same resume without re-uploading
- Quota resets with upload quota on 1st of month

**Member Limits:**
- Unlimited analyses
- Can re-analyze any stored resume version
- No quota restrictions

**Timeout Rules:**
- Maximum analysis time: 60 seconds
- If timeout exceeded:
  - Display error message
  - Allow re-upload without quota penalty
  - Log timeout for monitoring

### 4.3 Job Seeking Suggestions (Career Advice)

**Powered by Claude API analyzing user's resume and profile**

**Analysis Criteria:**
- Compare current skills vs target position requirements
- Identify experience level and gaps
- Provide industry trends and recommendations
- Suggest resume improvements (formatting, content, keywords)
- Flag work experience date discrepancies

**Free User Career Advice:**
- Basic suggestions only (3-5 bullet points)
- High-level improvement recommendations
- General skill gap identification
- Basic formatting suggestions

**Member Career Advice:**
- Detailed, comprehensive career roadmap (10+ points)
- Specific skill development recommendations
- Industry-specific insights and trends
- Detailed resume content optimization
- Keyword suggestions for ATS systems
- Interview preparation tips
- Networking recommendations

**Display Location:**
- Dashboard "Career Advice" section
- Updates after each new analysis
- Persistent across sessions

### 4.4 Work Experience Date Validation

**Validation Process:**
1. Extract work experience dates from uploaded resume
2. Compare extracted dates with user's manual profile entries
3. Identify discrepancies (mismatched start/end dates)
4. Generate specific discrepancy warnings

**Discrepancy Detection:**
- Compare month and year only (ignore day)
- Flag if start date differs by more than 1 month
- Flag if end date differs by more than 1 month
- Ignore discrepancies for "Present" jobs (end date flexibility)

**If Discrepancy Detected:**
- Flag in "Improvement Suggestions" section
- Display both versions:
  - "Resume says: [Company X] - Jan 2020 to Dec 2022"
  - "Profile says: [Company X] - Jan 2020 to Nov 2022"
- Provide specific message:
  - "⚠️ Date Discrepancy: Your resume shows you worked at [Company X] from [Jan 2020 - Dec 2022], but your profile says [Jan 2020 - Nov 2022]. Please verify and update."
- Include "Edit" button to open work experience edit form

**User Action:**
- User can click "Edit" to update manual entry
- System saves correction
- Discrepancy warning removed from suggestions
- Future analyses will use updated dates for comparison

### 4.5 Data Storage

**Supabase Storage (for PDF files):**
- Original uploaded PDF stored
- Stored in bucket: `resumes`
- File path: `{userId}/{timestamp}_{filename}.pdf`
- Retention: Indefinite (unless user deletes or Free User re-uploads)

**Supabase Database (for extracted data):**
- Basic information (name, email, phone, address)
- Skills array (["JavaScript", "Python", "React", ...])
- Experiences array (with dates, descriptions, companies)
- Improvement suggestions text
- Analysis timestamp
- User ID (foreign key)
- Resume version ID (Members only)

**Analysis Results Cache:**
- Cached for 30 days
- Used for quick retrieval on Dashboard
- Automatically refreshed after new analysis

## 5. Subscription Rules

### 5.1 Plan Types

**Free Plan:**
- **Price:** $0 (no payment required)
- **Features:**
  - 5 resume uploads per month
  - Single resume storage (latest version only)
  - Basic analysis and career advice
  - Dashboard access
  - Email support (48-hour response time)
- **Restrictions:**
  - Cannot store multiple resume versions
  - Limited upload quota (5/month)
  - No detailed career roadmap
  - No cover letter generation (future feature)

**Premium Plan (Monthly):**
- **Price:** $19.99/month
- **Billing:** Charged on signup date each month
- **Features:**
  - Unlimited resume uploads
  - Multiple resume version storage with custom labeling
  - Unlimited analyses
  - Detailed career roadmap and improvement suggestions
  - Priority email support (24-hour response time)
  - (Future) Cover letter generation
- **Cancellation:** Access continues until end of current monthly cycle

**Premium Plan (Yearly):**
- **Price:** $199/year (save 17% vs monthly)
- **Billing:** Charged on signup date each year
- **Features:** Same as Monthly Premium
- **Cancellation:** Access continues until end of current yearly cycle
- **Savings:** $40.88/year compared to monthly billing

### 5.2 Billing Rules

**Monthly Plans:**
- Billed on signup date each month
- Example: Signup on Jan 15 → Billed on 15th of every month
- Prorated billing for plan changes (upgrade/downgrade)
- Auto-renewal unless cancelled

**Yearly Plans:**
- Billed on signup date each year
- Example: Signup on Jan 15, 2026 → Next bill Jan 15, 2027
- No monthly charges
- Prorated refund NOT offered for early cancellation

**Prorated Billing (Upgrade/Switch Plans):**
- Upgrade from Free to Premium: Full charge immediately
- Switch from Monthly to Yearly:
  - Unused monthly time credited
  - Charged yearly price minus credit
  - Effective immediately
- Switch from Yearly to Monthly:
  - Not allowed mid-cycle
  - Must wait until yearly cycle ends

**Cancellation:**
- User can cancel anytime via Stripe Portal
- Access continues until end of current billing period
- No refunds for unused time
- Auto-renewal disabled
- User reverts to Free User after period ends

**Downgrade:**
- Direct downgrade not allowed
- User must cancel subscription
- After period ends, user reverts to Free User
- Can restart as Free User or re-subscribe later

**Failed Payment:**
- Stripe retries payment 3 times over 1 week
- If all retries fail:
  - Subscription cancelled
  - User reverted to Free User
  - Email notification sent
- User can update payment method and re-subscribe

### 5.3 Subscription States

**Active:**
- Current paid subscription
- Full access to Premium features
- Billing date upcoming
- Auto-renewal enabled

**Cancelled:**
- User cancelled subscription
- Still within paid billing period
- Full access continues until period end
- Auto-renewal disabled
- Dashboard shows: "Cancelled - Access until [End Date]"

**Expired:**
- Subscription billing period ended
- No active payment
- User reverted to Free User status
- Access to Premium features removed
- Upload quota applies (5/month)
- Stored resume versions remain but cannot create new versions

**Trial:**
- NOT implemented in v1/MVP
- Reserved for future implementation
- Would allow 7-day free trial of Premium features

### 5.4 Subscription Management

**Stripe Customer Portal Access:**
- Available to Members only
- Access via "Manage Subscription" button on Dashboard
- Redirect to Stripe-hosted portal
- Session expires after 1 hour of inactivity

**Available Actions in Portal:**
- View subscription details
- View billing history and invoices
- Download receipts
- Update payment method (credit card)
- Update billing address
- Switch plans (monthly ↔ yearly)
- Cancel subscription
- Reactivate cancelled subscription (before period ends)

**Webhook Integration:**
- All changes trigger Stripe webhooks
- Platform receives real-time updates
- Database updated automatically
- Dashboard reflects changes immediately

## 6. Dashboard Display Rules

### 6.1 Profile Completion Percentage

**Calculation:**
- Basic info filled: 25%
- Resume uploaded: 25%
- Analysis completed: 25%
- Subscription active (Member only): 25%
- **Total: 100%**

**Display Format:**
- Pie chart or circular progress indicator
- Percentage number displayed prominently
- Color-coded:
  - 0-25%: Red
  - 26-50%: Orange
  - 51-75%: Yellow
  - 76-100%: Green

**Free User Max:**
- Maximum 75% (cannot reach 100% without subscription)
- Subscription section shows "Upgrade to reach 100%"

**Member:**
- Can reach 100% when all sections completed
- Pie chart fully filled with green color

### 6.2 Statistics Display

**Skills Count:**
- Total unique skills extracted from current resume
- Format: Large number with label "Skills"
- Example: "24 Skills"
- Updates in real-time after new analysis

**Experience Count:**
- Total work/internship entries in current resume
- Format: Large number with label "Experiences"
- Example: "5 Experiences"
- Updates in real-time after new analysis

**Members with Multiple Versions:**
- Statistics shown for currently selected resume version
- Switch version → Statistics update to reflect selected resume

### 6.3 Upload Quota Indicator (Free Users Only)

**Display Format:**
- Text: "X/5 uploads remaining this month"
- Progress bar showing usage
- Example:
  - "4/5 uploads remaining" → 75% filled (green)
  - "1/5 uploads remaining" → 25% filled (orange)
  - "0/5 uploads remaining" → 0% filled (red)

**Quota Reset Display:**
- Show reset date: "Quota resets on [Month 1st]"
- Countdown: "Resets in X days"

**When Quota Exhausted:**
- Display: "0/5 uploads remaining this month"
- Show "Upgrade to Premium for unlimited uploads" message
- Disable upload button
- Provide "Upgrade" CTA button

**Members:**
- No quota indicator displayed
- Upload button always enabled
- No monthly restrictions shown

## 7. Navigation & Access Control

### 7.1 Protected Routes

**Dashboard Routes (Require Authentication):**
- `/dashboard` - Main dashboard
- `/dashboard/profile` - User profile settings
- `/dashboard/resumes` - Resume management (Members)
- `/dashboard/subscription` - Subscription management

**Settings Routes (Require Authentication):**
- `/settings` - General settings
- `/settings/account` - Account settings
- `/settings/billing` - Billing settings (Members only)

**Subscription Routes (Require Authentication):**
- `/subscription/plans` - View pricing plans
- `/subscription/checkout` - Stripe checkout (redirects)
- `/subscription/success` - Post-purchase success page
- `/subscription/manage` - Stripe portal (redirects)

### 7.2 Public Routes

**Landing & Auth:**
- `/` - Landing page (public)
- `/sign-in` - Sign-in page (public)
- `/sign-up` - Sign-up page (public)
- `/features` - Features page (public)
- `/pricing` - Pricing page (public)

**Legal:**
- `/terms` - Terms of Service (public)
- `/privacy` - Privacy Policy (public)

### 7.3 Redirect Rules

**Unauthenticated User Accessing Protected Route:**
- Redirect to `/sign-in`
- Preserve intended destination in URL parameter
- Example: `/sign-in?redirect=/dashboard`
- After sign-in, redirect to intended destination

**Authenticated User Accessing `/sign-in` or `/sign-up`:**
- Redirect to `/dashboard`
- No need to sign in again if already authenticated

**Member Accessing Free-User-Only Content:**
- Allow access (backward compatibility)
- Premium users can access all Free user features

**Free User Accessing Member-Only Features:**
- Display paywall modal
- Show "Upgrade to Premium" message
- Provide "Upgrade" button → Pricing page
- Block access to feature

## 8. Data Validation Rules

### 8.1 Basic Information Form

**Name:**
- Required field
- Minimum 2 characters
- Maximum 50 characters
- Allow letters, spaces, hyphens, apostrophes
- No numbers or special characters (except - and ')
- Error: "Name must be 2-50 characters and contain only letters"

**Role:**
- Required field
- Minimum 2 characters
- Maximum 50 characters
- Allow letters, numbers, spaces
- Error: "Role must be 2-50 characters"

**Target Position:**
- Required field
- Minimum 2 characters
- Maximum 100 characters
- Allow letters, numbers, spaces, common punctuation
- Error: "Target Position must be 2-100 characters"

**City:**
- Required field
- Minimum 2 characters
- Maximum 50 characters
- Allow letters, spaces, commas
- Error: "City must be 2-50 characters"

### 8.2 Work Experience Form

**At Least 1 Experience Required:**
- Form cannot be submitted without at least 1 work experience entry
- Error: "Please add at least one work experience"

**Company Name:**
- Required field
- Minimum 2 characters
- Maximum 100 characters
- Allow letters, numbers, spaces, common punctuation
- Error: "Company name must be 2-100 characters"

**Job Title:**
- Required field
- Minimum 2 characters
- Maximum 100 characters
- Allow letters, numbers, spaces, common punctuation
- Error: "Job title must be 2-100 characters"

**Start Date:**
- Required field
- Format: Month + Year (e.g., "January 2020")
- Must be valid date
- Cannot be in future
- Error: "Please select a valid start date"

**End Date:**
- Required UNLESS "Present" checkbox is checked
- Format: Month + Year (e.g., "December 2022")
- Must be valid date
- Must be after start date
- Can be in future (for "Present" jobs)
- Error: "End date must be after start date"

**"Present" Checkbox:**
- If checked, end date field disabled
- Indicates current job
- End date stored as NULL in database

**Total Duration:**
- Auto-calculated based on start and end dates
- Display format: "X years Y months"
- Examples:
  - "2 years 3 months"
  - "6 months"
  - "1 year"
- Display-only (not editable by user)
- Updates automatically when dates change

**Description:**
- Optional field
- Maximum 500 characters
- Allow all characters including line breaks
- Error (if > 500 chars): "Description must be 500 characters or less"

### 8.3 Contact Information (from Resume)

**Email:**
- Must be valid email format
- Auto-extracted by Claude API
- User can edit if extraction incorrect
- Validation: Standard email regex pattern

**Phone:**
- Accept international formats
- Allow: numbers, spaces, dashes, parentheses, plus sign
- Examples:
  - +1 (555) 123-4567
  - 555-123-4567
  - +44 20 1234 5678
- No strict format enforcement (international flexibility)

**Address:**
- Optional field
- If extracted from resume, display
- If not in resume, leave blank
- User can manually add/edit

## 9. API Rate Limits

### 9.1 Claude API Rate Limits

**Per-User Limits:**
- Maximum 10 requests per minute per user
- Maximum 100 requests per hour per user
- If exceeded: Display error message "Too many requests. Please try again in a few minutes."
- Implement exponential backoff for retries

**Platform-Wide Limits:**
- Follow Anthropic API rate limits
- Monitor total usage across all users
- Implement queuing system if approaching limits
- Display maintenance message if limits reached

**Error Handling:**
- Rate limit exceeded (429 error): Queue request and retry
- API timeout: Retry up to 3 times with exponential backoff
- API error (500): Log error and notify user with generic message

### 9.2 Stripe API Rate Limits

**Follow Stripe's Default Rate Limits:**
- 100 requests per second in test mode
- 100 requests per second in live mode
- Rate limits apply per account, not per user

**Webhook Handling:**
- Retry failed webhooks up to 3 times
- Exponential backoff: 5 seconds, 25 seconds, 125 seconds
- After 3 failures, log error and notify admin
- Manual reconciliation required for failed webhooks

**Best Practices:**
- Cache Stripe data when possible
- Batch API calls when feasible
- Implement idempotency keys for critical operations

## 10. Error Handling Rules

### 10.1 User-Facing Errors

**Display Principles:**
- Clear, actionable error messages
- Never expose technical details
- Always provide next steps
- Use friendly, non-technical language

**Error Message Format:**
- **Icon:** ❌ or ⚠️
- **Header:** Brief error title
- **Message:** Explanation of what went wrong
- **Action:** Button or link for next steps

**Examples:**

**Bad:**
- "Error 500: Internal server error at /api/upload"

**Good:**
- "❌ Upload Failed"
- "We couldn't process your resume. Please try again or contact support if the problem persists."
- [Try Again Button]

### 10.2 System Errors

**Logging:**
- Log all errors to console/monitoring service
- Include: timestamp, user ID, error type, stack trace
- Never log sensitive data (passwords, API keys)

**User Display:**
- Display generic message: "Something went wrong. Please try again."
- Provide error reference ID for support
- Offer "Contact Support" option

**Error Categories:**

**Critical Errors (require immediate attention):**
- Database connection failures
- Payment processing errors
- Authentication system failures

**Non-Critical Errors (log and monitor):**
- Resume upload failures
- Analysis timeouts
- Rate limit exceeded

**Auto-Recovery:**
- Implement automatic retry for transient errors
- Use exponential backoff
- Maximum 3 retry attempts
- If all retries fail, display user error message

### 10.3 Validation Errors

**Frontend Validation:**
- Validate all form inputs before submission
- Display errors inline next to input fields
- Prevent form submission if validation fails
- Use red color and error icon for clarity

**Backend Validation:**
- Re-validate all inputs on backend (never trust frontend)
- Return structured error messages
- HTTP 400 Bad Request for validation errors
- Include field name and specific error in response

**Example Validation Error Response:**
```json
{
  "error": "Validation failed",
  "fields": {
    "name": "Name must be 2-50 characters",
    "email": "Invalid email format"
  }
}
```

### 10.4 Network Errors

**Connection Timeout:**
- Display: "Connection timeout. Please check your internet connection and try again."
- Provide "Retry" button
- Log error for monitoring

**No Internet Connection:**
- Display: "No internet connection. Please check your network and try again."
- Disable submit buttons until connection restored
- Auto-retry when connection detected

**Server Unreachable:**
- Display: "Unable to reach server. Please try again in a few moments."
- Suggest checking system status page
- Provide "Retry" button
