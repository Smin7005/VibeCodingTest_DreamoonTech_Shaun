# Resume Management AI Platform

> An AI-powered platform that helps users create, improve, and optimize their resumes using Claude AI, with subscription-based monetization.

## 📌 Project Status

**Current Status:** 🚧 In Development (Pre-Implementation Phase)

**Development Stages:**
- [ ] Stage 1: User Registration
- [ ] Stage 2: Onboarding Flow
- [ ] Stage 3: Resume Management
- [ ] Stage 4: User Dashboard
- [ ] Stage 5: User Purchase
- [ ] Stage 6: User Interface

---

## 📖 Table of Contents

- [Background](#background)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Documentation](#documentation)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)

---

## 🎯 Background

### User Needs

1. **Resume Creation & Improvement**
   - Users want AI assistance to create new resumes and cover letters
   - Users want to improve their existing uploaded resumes and cover letters

2. **Information Extraction**
   - Platform collects crucial information from resumes
   - Provides job-search suggestions and career advice

3. **Monetization**
   - This is a premium platform with subscription-based pricing
   - Free tier with limited features
   - Premium tier with unlimited access

### User Types

- **Guest**: No account, browse-only access
- **Free User**: Account created, limited to 4 resume uploads per month, basic career advice
- **Member**: Premium subscription, unlimited uploads, detailed career roadmap, multiple resume versions

---

## ✨ Features

### Core Features (MVP)

- ✅ **User Authentication** (Clerk)
  - Email + password signup/signin
  - Google OAuth integration
  - Email verification
  - Session management

- ✅ **Multi-Step Onboarding**
  - Guest onboarding (4 steps)
  - Free user onboarding (5 steps)
  - Work experience form with date pickers
  - Resume upload with preview

- ✅ **AI-Powered Resume Analysis** (Claude API)
  - Grammar and spelling correction
  - Information extraction (name, email, phone, skills, experiences)
  - Work experience date validation
  - Career advice generation (basic for Free, detailed for Members)

- ✅ **Upload Quota System**
  - Free users: 4 uploads per month
  - Members: Unlimited uploads
  - Resume version management for Members

- ✅ **User Dashboard**
  - Profile completion tracker
  - Resume information display
  - Career advice section
  - Upload quota indicator
  - Subscription status

- ✅ **Subscription Management** (Stripe)
  - Two-tier pricing (Free + Premium)
  - Premium Monthly: $19.99/month
  - Premium Yearly: $199/year (save 17%)
  - Stripe Customer Portal for plan management

### Future Features (Phase 2)

- ⏳ Cover letter generation
- ⏳ Additional OAuth providers (LinkedIn, WhatsApp, Discord)
- ⏳ Account management (password/email change)

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: Custom components + 21st.dev design system
- **Charts**: Recharts (for profile completion pie chart)

### Backend
- **Runtime**: Node.js 18+
- **API Routes**: Next.js API Routes
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **File Storage**: Supabase Storage
- **AI Analysis**: [Claude API](https://www.anthropic.com/) (Anthropic)

### Payments
- **Payment Processing**: [Stripe](https://stripe.com/)
- **Subscription Model**: Recurring subscriptions
- **Mode**: Test mode (development), Live mode (production)

### Deployment & Hosting
- **Platform**: [Vercel](https://vercel.com/)
- **CI/CD**: Automatic deployments via GitHub integration
- **Domain**: Custom domain (optional)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Formatting**: Prettier (optional)
- **Version Control**: Git + GitHub

---

## 📚 Documentation

Comprehensive specification documents are available in the `/spec` folder:

| Document | Description | Purpose |
|----------|-------------|---------|
| **[product.md](./spec/product.md)** | Product strategy, user types, core hypotheses | Understand business goals |
| **[scope.md](./spec/scope.md)** | Detailed technical requirements, must-haves | Know what to build |
| **[flow.md](./spec/flow.md)** | User flows, state transitions, journey maps | Understand user journeys |
| **[rules.md](./spec/rules.md)** | Business rules, validation rules, constraints | Enforce correct behavior |
| **[success.md](./spec/success.md)** | KPIs, success criteria, testing checklists | Measure success |
| **[implementation.md](./spec/implementation.md)** | 6-stage implementation plan, setup guide | Follow development roadmap |

**📖 Read these documents before starting development!**

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm installed
- Git installed
- Accounts created on:
  - [Clerk](https://clerk.com/) (Authentication)
  - [Supabase](https://supabase.com/) (Database)
  - [Anthropic](https://www.anthropic.com/) (Claude API)
  - [Stripe](https://stripe.com/) (Payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/VibeCodingTest.git
cd VibeCodingTest

# Install dependencies
npm install

# Install additional packages
npm install @clerk/nextjs @supabase/supabase-js @anthropic-ai/sdk stripe
npm install react-pdf-viewer pdf-lib date-fns recharts

# Create environment file
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Database Setup

1. **Create Supabase Project**
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Create new project
   - Wait for database to be ready

2. **Run Database Schema**
   ```bash
   # Copy SQL from spec/implementation.md (Section 3. Database Schema Setup)
   # Run in Supabase SQL Editor
   ```

3. **Create Storage Bucket**
   - Navigate to Storage in Supabase Dashboard
   - Create bucket named `resumes`
   - Set as **private** (authenticated access only)

### Environment Configuration

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

### Run Development Server

```bash
# Start development server
npm run dev

# Open browser
# Navigate to http://localhost:3000
```

---

## 📁 Project Structure

```
resume-ai-platform/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── resume/               # Resume upload & analysis
│   │   └── stripe/               # Stripe webhooks & checkout
│   ├── dashboard/                # Dashboard pages
│   ├── onboarding/               # Onboarding flow
│   ├── pricing/                  # Pricing page
│   ├── sign-in/                  # Sign-in page (Clerk)
│   ├── sign-up/                  # Sign-up page (Clerk)
│   ├── subscription/             # Subscription success/cancel
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── dashboard/                # Dashboard components
│   ├── landing/                  # Landing page components
│   ├── onboarding/               # Onboarding components
│   ├── resume/                   # Resume-related components
│   └── ui/                       # UI library components
├── lib/                          # Utility libraries
│   ├── claude.ts                 # Claude API client
│   ├── supabase.ts               # Supabase client
│   ├── stripe.ts                 # Stripe client
│   ├── quota.ts                  # Upload quota management
│   ├── onboarding.ts             # Onboarding helpers
│   └── ...
├── styles/                       # Global styles
│   ├── globals.css               # Global CSS
│   └── theme.css                 # Theme variables
├── spec/                         # Specification documents
│   ├── product.md                # Product strategy
│   ├── scope.md                  # Technical requirements
│   ├── flow.md                   # User flows
│   ├── rules.md                  # Business rules
│   ├── success.md                # Success criteria
│   └── implementation.md         # Implementation guide
├── public/                       # Static assets
├── middleware.ts                 # Route protection
├── .env.local                    # Environment variables (not in git)
├── .env.example                  # Environment template
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies & scripts
```

---

## 🔄 Development Workflow

### Implementation Stages

Follow the **6-stage implementation plan** detailed in `spec/implementation.md`:

1. **Stage 1: User Registration** (Authentication & user management)
2. **Stage 2: Onboarding Flow** (Multi-step forms & resume upload)
3. **Stage 3: Resume Management** (Claude API integration & analysis)
4. **Stage 4: User Dashboard** (Data display & interactivity)
5. **Stage 5: User Purchase** (Stripe subscription integration)
6. **Stage 6: User Interface** (Design system & polish)

### Development Process

1. **Start with Stage 1**
   - Read `spec/implementation.md` Stage 1 section
   - Implement all deliverables
   - Complete testing checklist
   - Commit code

2. **Test Thoroughly**
   - Use testing checklist from implementation.md
   - Manual testing of all features
   - Fix any bugs before proceeding

3. **Move to Next Stage**
   - Only proceed when current stage is complete
   - Each stage builds on previous stages

4. **Iterate**
   - Commit after each major feature
   - Document any deviations from plan
   - Update specs if requirements change

---

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | [Clerk Dashboard](https://dashboard.clerk.com/) |
| `CLERK_SECRET_KEY` | Clerk secret key | Clerk Dashboard |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | [Supabase Dashboard](https://app.supabase.com/) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard (Settings > API) |
| `ANTHROPIC_API_KEY` | Claude API key | [Anthropic Console](https://console.anthropic.com/) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | [Stripe Dashboard](https://dashboard.stripe.com/) |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Stripe Dashboard (after creating webhook) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |

---

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)

# Build
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint

# Type checking
npm run type-check   # Run TypeScript compiler check (if configured)
```

---

## 🧪 Testing

### Manual Testing

After each implementation stage, use the testing checklists in `spec/implementation.md`:

- **Stage 1**: 12 authentication tests
- **Stage 2**: 18 onboarding tests
- **Stage 3**: 19 resume management tests
- **Stage 4**: 33 dashboard tests
- **Stage 5**: 21 payment tests
- **Stage 6**: 35 UI/UX tests

### Testing Checklist Example

```bash
# Stage 1: User Registration
[ ] Sign-up with email works
[ ] Email verification codes sent
[ ] Sign-up with Google OAuth works
[ ] Protected routes redirect correctly
# ... (see implementation.md for full list)
```

### Stripe Testing

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Authentication Required**: `4000 0025 0000 3155`

---

## 🚢 Deployment

### Deploy to Vercel

1. **Connect Repository**
   ```bash
   # Push code to GitHub
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Vercel Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import GitHub repository
   - Configure environment variables (use production values)

3. **Configure Environment Variables**
   - Add all variables from `.env.local`
   - Update URLs to production values
   - Use Stripe live mode keys

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Get production URL

5. **Configure Stripe Webhooks**
   - Add production webhook endpoint: `https://your-domain.com/api/stripe/webhook`
   - Update `STRIPE_WEBHOOK_SECRET` in Vercel

### Post-Deployment

- [ ] Test all features in production
- [ ] Verify Stripe webhooks working
- [ ] Check analytics tracking
- [ ] Monitor error logs
- [ ] Set up uptime monitoring

---

## 📊 Success Metrics

Track these KPIs after launch (see `spec/success.md` for details):

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
- >60% retention

---

## 🤝 Contributing

This is a personal project for DreamoonTech_Shaun's internship coding test. Contributions are not currently accepted.

---

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

## 📞 Support

For questions or issues during development:
- Review `spec/implementation.md` for detailed guidance
- Check `spec/rules.md` for business logic
- Refer to `spec/flow.md` for user journeys

---

## 🙏 Acknowledgments

- **Tech Stack**: Next.js, Clerk, Supabase, Anthropic (Claude), Stripe, Vercel
- **Design**: 21st.dev design system
- **AI Assistant**: Claude (Anthropic) for implementation planning

---

**Last Updated**: January 5, 2026
**Version**: 1.0
**Status**: Pre-Implementation Phase
