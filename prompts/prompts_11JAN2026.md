1. read prompts_10JAN2026.md. now there is a bug about user sign-up, after the step 2 input work experiences of onboarding flow, Vercel log reports 404, it cannot jump to step 3 Resume uploading.

**Reply:**

- Found it! The /api/onboarding/progress route is missing export const dynamic = 'force-dynamic' which is required for routes that use Clerk's auth() on Vercel. Let me fix this.Bug Fixed!

        The issue was that the /api/onboarding/progress route was missing export const dynamic = 'force-dynamic'.

        Root Cause:
        - The route uses Clerk's auth() which requires HTTP headers
        - Without force-dynamic, Next.js attempts to statically render the route on Vercel
        - This fails and returns 404 when the API is called during onboarding

        Fix Applied:
        - File: app/api/onboarding/progress/route.ts
        - Added: export const dynamic = 'force-dynamic'

        Same issue was previously fixed for:
        - /api/dashboard/data
        - /api/quota/check
        - /api/resume/current

        Next Steps:
        1. Commit and push:
        git add . && git commit -m "Fix: Add force-dynamic to onboarding progress API route" && git push
        2. Redeploy on Vercel
        3. Test the sign-up flow again - step 2 → step 3 should now work
