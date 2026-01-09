# Scope

## 1. Must Have

### 1.1 User registration module

- Configuring 'ClerkProvider' component in global layout.
- Using 'SignIn', 'SignUp' or other corresponding routing components provided by Clerk.

#### 1.1.1 Sign-in page

- 1.1.1.1 To ask user type in existing account email address and password.
- 1.1.1.2 To validate user's email and password.
- 1.1.1.3 Requiring user clicks on continue button to sign-in.
- 1.1.1.4 If account email input cannot match to platform database, ask user to create a new account.
- 1.1.1.5 If account password input cannot match to platform database, ask user to type in the correct password, or create a new password.
- 1.1.1.6 Allowing users to sign-in by their Google account.

#### 1.1.2 Sign-up page

- 1.1.2.1 To ask users type in their email address for creating account, and send the validation code to user's email.
- 1.1.2.2 To ask user create a password, allow google password manager to autofill a new password when user agreed.
- 1.1.2.3 To ask users repeat their password, and match the passwords inputs of both times.
- 1.1.2.4 To ask user type in validation code, and then compare the value of validation code.
- 1.1.2.5 Allowing users to sign-up by their Google account.
- 1.1.2.6 After user finish all the inputs and click on finish button, store the account email address and password to platform database.
- 1.1.2.7 If validation code is incorrect, platform sends another validation code and ask user to type in again.

### 1.2 Onboarding flow

- Platform must record the user behaviours, and store all the value to database.
- Platform moves users to next step automatically after they finish a 'main step'. For instance, after they 'Sign-up new account', or after they 'Upload resume'.

#### 1.2.1 Flow for guests:

- 1.2.1.1 This onboarding flow must be implemented on landing page.
- 1.2.1.2 There are 4 main steps in total.
- 1.2.1.3 Sign-up new account: Email, Password, Password confirmation, Validation code.
- 1.2.1.4 Fill-in basic information: Name, Role, Target position, City, and Work Experiences.
  - Name: Required, 2-50 characters
  - Role: Required, 2-50 characters
  - Target position: Required, 2-100 characters
  - City: Required, 2-50 characters
  - Work Experiences (at least 1 required, repeatable form fields):
    - Company name: Required, 2-100 characters
    - Job title: Required, 2-100 characters
    - Start date: Required, month + year picker (e.g., "January 2020")
    - End date: Required (month + year picker) OR "Present" checkbox for current job
    - Total duration: Auto-calculated and displayed (e.g., "2 years 3 months")
    - Description: Optional, max 500 characters
    - "Add Another Experience" button for multiple entries
- 1.2.1.5 Upload resume: Also allow users to upload multiple times if they submit the wrong file, with a medium size window for preview purpose.
- 1.2.1.6 Provide analysis result: By using Claude API including basic information, skills and expertises, working and internship experiences with dates, and work experience date validation.
  - Claude API compares manual work experience dates with resume-extracted dates
  - If discrepancies found, flag in "Improvement Suggestions" section
  - Display both versions (manual entry vs resume) for user verification
- 1.2.1.7 After users finished all main steps, update their 'User type' to 'Free user'.
- 1.2.1.8 Platform will only starts the 'Dashboard introduction' once user click on 'Dashboard' button.
- 1.2.1.9 This onboarding flow should be implemented by 'React stepper component' or corresponding components.

#### 1.2.2 Flow for free users:

- 1.2.2.1 This onboarding flow should be started at the first time when users enter the 'Dashboard'.
- 1.2.2.2 There are 5 main steps in total.
- 1.2.2.3 Fill-in basic information: Name, Role, Target position, City, and Work Experiences, and this step is skippable if user already finished.
- 1.2.2.4 Upload resume: Also allow users to upload multiple times if they submit the wrong file, with a medium size window for preview purpose, and this step is skippable if user already finished.
- 1.2.2.5 Provide analysis result: By using Claude API including basic information, skills and expertises, working and internship experiences with date validation, and this step is skippable if user already finished.
- 1.2.2.6 Dashboard introduction: Welcome header, Onboarding guide, Resume information, Subscription states, and Statistics block.
- 1.2.2.7 Purchase navigation: to navigate users click on a button for upgrading their current plan, then jump to the 'User purchase module' built by Stripe. Also, allow user to cancell this step with one-click at anytime.
- 1.2.2.8 If users made their purchase, update their 'User type' to 'Member'.

### 1.3 Resume management module

- Calling the Claude API to implement resume analysis function.

#### 1.3.1 Resume upload quota and storage rules

- 1.3.1.1 **Guest users**: No upload access (must sign up first)
- 1.3.1.2 **Free users**:
  - Maximum 5 resume uploads per calendar month
  - Quota resets on 1st day of each month at 00:00 UTC
  - Single resume storage (latest upload replaces previous)
  - Failed uploads do NOT count toward quota
  - If quota exceeded, display "Upgrade to Premium" message
- 1.3.1.3 **Members**:
  - Unlimited resume uploads (no monthly quota)
  - Multiple resume version storage with custom labeling
  - Each upload creates new resume version
  - All versions stored indefinitely
  - Can switch between stored resume versions via dropdown/tabs
  - Can delete old versions (optional)
- 1.3.1.4 **File format**: PDF only (.pdf), max 10MB
- 1.3.1.5 **Validation**: Reject non-PDF files and files > 10MB with clear error messages

#### 1.3.2 Resume review and management

- 1.3.2.1 To fix the grammar error in uploaded resume.
- 1.3.2.2 To fix the spelling error in uploaded resume.
- 1.3.2.3 After the review steps, store user's resume as pdf version into database.
  - Free users: Store single resume (new upload replaces old)
  - Members: Store as new version with timestamp and optional custom label

#### 1.3.3 Resume information analysis

- 1.3.3.1 To collect the basic information from user's resume, including name, phone number, email address, and home address.
- 1.3.3.2 To collect all the skills and expertises information from user's resume, then generate each skill and expertise as values.
- 1.3.3.3 To collect all working and internship experiences from user's resume, including:
  - Company name
  - Job title
  - Start date (month + year)
  - End date (month + year) OR "Present" for current job
  - Description/responsibilities
  - Location (if available)
- 1.3.3.4 Work experience date validation:
  - Compare extracted work experience dates with user's manual entries from basic information form
  - Identify discrepancies (start date or end date differs by more than 1 month)
  - Generate specific discrepancy warnings for improvement suggestions
  - Example: "Your resume shows you worked at Company X from Jan 2020 - Dec 2022, but your profile says Jan 2020 - Nov 2022. Please verify and update."
- 1.3.3.5 Storing all the informations to database.

#### 1.3.4 Job seeking suggestions (Career advice)

- 1.3.4.1 Powered by Claude API analyzing user's resume and profile information
- 1.3.4.2 **Free users** - Basic suggestions (3-5 bullet points):
  - High-level improvement recommendations
  - General skill gap identification
  - Basic formatting suggestions
  - Resume vs profile date discrepancy warnings
- 1.3.4.3 **Members** - Detailed career roadmap (10+ comprehensive points):
  - Specific skill development recommendations
  - Industry-specific insights and trends
  - Detailed resume content optimization
  - Keyword suggestions for ATS (Applicant Tracking Systems)
  - Interview preparation tips
  - Networking recommendations
  - Resume vs profile date discrepancy warnings with edit links
- 1.3.4.4 Analysis criteria:
  - Compare current skills vs target position requirements
  - Identify experience level and gaps
  - Provide industry trends and recommendations
  - Suggest resume improvements (formatting, content, keywords)
  - Flag work experience date discrepancies between manual entry and resume
- 1.3.4.5 Display location: Dashboard "Career Advice" section
- 1.3.4.6 Updates after each new resume analysis

### 1.4 User dashboard module

- 'Dashboard' and related routes must be login protected.
- Gathering values from platform database before outputs.

#### 1.4.1 Welcome header

- 1.4.1.1 To output user's full name.
- 1.4.1.2 To demonstrate a progress pie chart about profile completion.

#### 1.4.2 Onboarding guide

- 1.4.2.1 To demonstrate the current step, and also demonstrate the complete steps and incomplete steps.
- 1.4.2.2 Users can jump to the relative step by one-time click on step tags.

#### 1.4.3 Resume information

- 1.4.3.1 To ouput the name, email address, and phone number by 'header' or similar element.
- 1.4.3.2 To ouput the skills and expertises by 'tag' or similar element.
- 1.4.3.3 To ouput the working and internship experiences by 'ordered list' or similar element, including dates.
- 1.4.3.4 Integrating all the informations, and create the result of analysis by the 'React card' or similar component.
- 1.4.3.5 For **Free users**:
  - Provide "Upload New Resume" button (enabled if quota available)
  - Display upload quota indicator (e.g., "4/5 uploads remaining this month")
  - After submission, do the analysis again, and replace the previous result (single storage)
- 1.4.3.6 For **Members**:

  - Provide "Upload New Version" button (always enabled, unlimited uploads)
  - Display resume version selector (dropdown or tabs) to switch between stored versions
  - After submission, create new resume version (does not replace previous)
  - Each version can have custom label (e.g., "Software Engineer Resume", "Data Analyst Resume")
  - Can delete old versions via "..." menu

- 1.4.3.7 Career advice and improvement suggestions

  - Display AI-generated career advice based on resume analysis
  - Show improvement suggestions including:
  - Resume formatting recommendations
  - Content optimization suggestions
  - Keyword suggestions for target position
  - Work experience date discrepancy warnings (if any)
  - Skill gap identification
  - **Free users**: Basic suggestions (3-5 bullet points)
  - **Members**: Detailed career roadmap (10+ comprehensive points)
  - Include "Edit Work Experience" button for date discrepancy corrections
  - Updates after each new resume analysis

- 1.4.3.8 Upload quota indicator (Free users only)

  - Display current month's upload quota usage
  - Format: "X/5 uploads remaining this month"
  - Include progress bar showing quota usage
  - Color coding:
    - 3-4 remaining: Green
    - 1-2 remaining: Orange
    - 0 remaining: Red
  - Show quota reset date: "Quota resets on [1st of next month]"
  - If quota exhausted (0/4):
    - Disable upload button
    - Display "Monthly upload limit reached"
    - Show "Upgrade to Premium for unlimited uploads" CTA button

#### 1.4.4 Subscription states

- 1.4.4.1 If user is free user, platform shows 'Free Plan' with features list and a button to upgrade user's plan must be set alongside.
  - Features displayed: "5 uploads/month", "Basic career advice", "Single resume storage"
- 1.4.4.2 If user is member, platform shows current plan information, including:
  - Plan level: "Premium Monthly" or "Premium Yearly"
  - Bill cycle: Monthly or Yearly
  - Next deduction date
  - Features: "Unlimited uploads", "Detailed career roadmap", "Multiple resume versions"
- 1.4.4.3 To provide a subscription management button:
  - Free users: "Upgrade to Premium" → jump to purchase page
  - Members: "Manage Subscription" → redirect to Stripe Customer Portal

#### 1.4.5 Statistics block

- 1.4.5.1 To output the number of user's skills and expertises.
  - Format: Large number with label "Skills"
  - Example: "24 Skills"
  - Updates after each new resume analysis
- 1.4.5.2 To output the number of user's working and internship experiences.
  - Format: Large number with label "Experiences"
  - Example: "5 Experiences"
  - Updates after each new resume analysis
- 1.4.5.3 For Members with multiple resume versions:
  - Statistics shown for currently selected resume version
  - Switch version → Statistics update to reflect selected resume

### 1.5 User purchase module

- 1.5.1 Building this module by the 'Stripe Billing' in test mode.

- 1.5.2 To create a 'upgrade plan' button in the front end.

- 1.5.3 Setting the 'Stripe Portal Redirect Link' to update the user's subscription states after user's purchase.

- 1.5.4 To provide 'switch plan' and 'cancell subscription' logic for users.

### 1.6 User interface design

- 1.6.1 To find a template from 21st.dev, and generate design system.
- 1.6.2 All components of the platform should follow the same style of design system.

## 2. Should Have

### 2.1 Cover letter generation

- 2.1.1 Users can generate a cover letter that matched the jobs they applied.

### 2.2 Multiple one-click sign-in and sign-up options

- 2.2.1 LinkedIn
- 2.2.2 WhatsApp
- 2.2.3 Discord
- 2.2.4 Atlassian

### 2.3 Account management on 'Dashboard'

- 2.3.1 Allowing user to change password.
- 2.3.2 Allowing user to change email.

## 3. Not Have

### 3.1 Functions about recruitment and related implementation.

### 3.2 Functions about community services.
