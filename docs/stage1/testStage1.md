# Stage 1 Setup Guide: User Registration

This guide walks you through setting up and testing Stage 1 of the Resume AI Platform.

## Prerequisites

- Node.js 18+ installed
- npm installed
- Git installed

## Step 1: Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Step 2: Set Up Clerk Authentication

1. **Create a Clerk Account**
   - Go to [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
   - Sign up for a free account
   - Create a new application

2. **Configure Clerk Settings**
   - In Clerk Dashboard, go to **Configure** → **Email, Phone, Username**
   - Enable **Email address** and **Google OAuth**
   - Set password requirements (min 8 chars, with complexity)
   - Enable email verification

3. **Get API Keys**
   - Go to **API Keys** in Clerk Dashboard
   - Copy **Publishable Key** and **Secret Key**
   - Update `.env.local`:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
     CLERK_SECRET_KEY=sk_test_YOUR_KEY
     ```

4. **Configure Webhooks**
   - In Clerk Dashboard, go to **Webhooks**
   - Click **+ Add Endpoint**
   - URL: `http://localhost:3000/api/user/create-profile` (for local testing)
   - Subscribe to event: `user.created`
   - Copy the **Signing Secret**
   - Update `.env.local`:
     ```
     CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET
     ```

5. **Set Redirect URLs**
   - In Clerk Dashboard, go to **Paths**
   - Set Sign-in URL: `/sign-in`
   - Set Sign-up URL: `/sign-up`
   - Set After sign-in URL: `/dashboard`
   - Set After sign-up URL: `/onboarding`

## Step 3: Set Up Supabase Database

1. **Create Supabase Account**
   - Go to [https://supabase.com/](https://supabase.com/)
   - Sign up and create a new project
   - Wait for database to be ready (2-3 minutes)

2. **Get API Keys**
   - In Supabase Dashboard, go to **Settings** → **API**
   - Copy **Project URL** and **anon/public key**
   - Copy **service_role key** (keep this secret!)
   - Update `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

3. **Run Database Schema**
   - In Supabase Dashboard, go to **SQL Editor**
   - Click **New Query**
   - Copy the entire SQL schema from `spec/implementation.md` (Section 3. Database Schema Setup)
   - Paste and run the query
   - Verify tables are created in **Table Editor**

4. **Create Storage Bucket**
   - In Supabase Dashboard, go to **Storage**
   - Click **New bucket**
   - Name: `resumes`
   - Make it **Private** (authenticated access only)
   - Click **Create bucket**

## Step 4: Test Local Development

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open Browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - You should see the landing page

## Step 5: Test Authentication (Stage 1 Testing Checklist)

### Test Sign-Up Flow

1. **Email + Password Sign-Up**
   - Click "Get Started" on landing page
   - Should redirect to `/sign-up`
   - Enter email address
   - Enter password (test validation: min 8 chars, uppercase, lowercase, number, special char)
   - Check email for verification code
   - Enter verification code
   - Should redirect to `/onboarding`
   - ✅ **Expected:** User created, email verified, redirected to onboarding

2. **Google OAuth Sign-Up**
   - Click "Sign up with Google"
   - Follow Google OAuth flow
   - Should auto-verify and redirect to `/onboarding`
   - ✅ **Expected:** User created, no email verification needed

3. **Duplicate Email Prevention**
   - Try signing up with an existing email
   - ✅ **Expected:** Error message "Email already registered"

### Test Sign-In Flow

1. **Email + Password Sign-In**
   - Go to `/sign-in`
   - Enter existing email and password
   - Should redirect to `/dashboard`
   - ✅ **Expected:** Successful login, session created

2. **Google OAuth Sign-In**
   - Click "Sign in with Google"
   - Should redirect to `/dashboard`
   - ✅ **Expected:** Successful login

3. **Invalid Credentials**
   - Try wrong password
   - ✅ **Expected:** Error message displayed

### Test Protected Routes

1. **Access Dashboard Without Auth**
   - Sign out (if signed in)
   - Try to access `/dashboard`
   - ✅ **Expected:** Redirected to `/sign-in`

2. **Access Dashboard With Auth**
   - Sign in
   - Navigate to `/dashboard`
   - ✅ **Expected:** Dashboard page loads, shows welcome message

### Test User Profile Creation

1. **Check Supabase**
   - After signing up, go to Supabase Dashboard
   - Navigate to **Table Editor** → `user_profiles`
   - ✅ **Expected:** New row created with:
     - `clerk_user_id`: Matches Clerk user ID
     - `email`: User's email
     - `name`: User's name
     - `user_type`: 'guest'
     - `profile_completion`: 0

2. **Check Webhook**
   - In terminal running `npm run dev`, check logs
   - ✅ **Expected:** Log showing "User profile created successfully"

### Test Session Persistence

1. **Refresh Page**
   - While signed in, refresh the page
   - ✅ **Expected:** Still signed in, session persists

2. **Close and Reopen Browser**
   - Sign in, close browser, reopen
   - Navigate to `/dashboard`
   - ✅ **Expected:** Still signed in

### Test Sign-Out

1. **Sign Out**
   - Click user button in dashboard
   - Click "Sign out"
   - ✅ **Expected:** Redirected to `/`, session cleared

## Step 6: Verify All Public Pages Load

1. **Landing Page** - [http://localhost:3000](http://localhost:3000)
   - ✅ Should load without errors

2. **Pricing Page** - [http://localhost:3000/pricing](http://localhost:3000/pricing)
   - ✅ Should show three pricing tiers

3. **Terms Page** - [http://localhost:3000/terms](http://localhost:3000/terms)
   - ✅ Should load terms of service

4. **Privacy Page** - [http://localhost:3000/privacy](http://localhost:3000/privacy)
   - ✅ Should load privacy policy

## Success Criteria

Stage 1 is complete when:

- ✅ All authentication flows working (email + OAuth)
- ✅ User profiles created in Supabase after sign-up
- ✅ Protected routes enforcing authentication
- ✅ Session persistence working
- ✅ No errors in browser console
- ✅ All public pages loading correctly
- ✅ Clerk webhook creating user profiles

## Common Issues

### Webhook Not Working

**Issue:** User profile not created in Supabase after sign-up

**Solution:**
- For local testing, use a tool like [ngrok](https://ngrok.com/) to expose localhost
- Run: `ngrok http 3000`
- Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
- Update Clerk webhook endpoint to: `https://abc123.ngrok.io/api/user/create-profile`
- Restart dev server

### Clerk Keys Not Working

**Issue:** "Missing publishableKey" error

**Solution:**
- Verify `.env.local` file exists in project root
- Check that keys are correct (copy-paste from Clerk Dashboard)
- Restart dev server after changing `.env.local`

### Supabase Connection Failed

**Issue:** Database operations failing

**Solution:**
- Verify Supabase URL and keys are correct
- Check that database schema was run successfully
- Verify service role key has proper permissions

## Next Steps

Once Stage 1 testing is complete:

1. **Commit your work:**
   ```bash
   git add .
   git commit -m "Complete Stage 1: User Registration

   - Set up Next.js 14 with TypeScript and Tailwind
   - Integrated Clerk authentication (email + Google OAuth)
   - Created Supabase client and database types
   - Implemented protected routes with middleware
   - Created sign-up, sign-in, and dashboard pages
   - Set up webhook for user profile creation
   - Created landing, pricing, terms, and privacy pages
   "
   ```

2. **Proceed to Stage 2: Onboarding Flow**
   - Reference `spec/implementation.md` Section: Stage 2
   - Implement multi-step onboarding forms
   - Add work experience collection
   - Implement resume upload functionality

## Troubleshooting

If you encounter any issues:

1. Check browser console for errors
2. Check terminal logs for server errors
3. Verify all environment variables are set correctly
4. Ensure Clerk and Supabase accounts are active
5. Try clearing browser cache and cookies
6. Restart development server

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Project Implementation Guide](./spec/implementation.md)
