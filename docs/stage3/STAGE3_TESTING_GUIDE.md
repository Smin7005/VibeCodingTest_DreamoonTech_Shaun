# Stage 3 Testing Guide - Resume Management

## Prerequisites

1. Dev server running: `npm run dev`
2. Environment variables configured in `.env.local`:
   - `ANTHROPIC_API_KEY` - Your Claude API key
   - Supabase keys configured
   - Clerk keys configured

## Quick API Test (No Auth)

Run the test script to verify endpoints are reachable:

```bash
npx ts-node scripts/test-stage3.ts
```

This tests that:
- All endpoints return 401 for unauthenticated requests (expected)
- Endpoints are reachable and responding

---

## Manual Browser Testing

### Test 1: Full Onboarding Flow with Resume Analysis

1. **Start fresh:** Open http://localhost:3000
2. **Sign up** as a new user (or use existing test account)
3. **Complete onboarding Step 2:** Fill in basic info + work experience
   - Add at least one work experience with dates
4. **Complete onboarding Step 3:** Upload a PDF resume
5. **Verify Step 4:** Resume analysis should:
   - Show loading state ("Analyzing your resume with AI...")
   - Display extracted basic info (name, email, phone)
   - Display extracted skills as tags
   - Display extracted work experiences
   - Show career advice preview
   - Show improvement suggestions

**Expected Result:** Analysis completes within 60 seconds and displays all extracted data.

---

### Test 2: Quota Check (Free Users)

1. Sign in as a **free user**
2. Go to dashboard or upload page
3. Check the quota indicator shows "X/4 uploads remaining"

**API Test:**
```bash
# In browser console (after signing in):
fetch('/api/quota/check')
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "remaining": 4,
  "used": 0,
  "limit": 4,
  "canUpload": true,
  "resetDate": "2026-02-01T00:00:00.000Z",
  "userType": "free"
}
```

---

### Test 3: Upload Quota Enforcement

1. Sign in as a **free user**
2. Upload 4 resumes through the onboarding flow
3. Try to upload a 5th resume

**Expected Result:** 5th upload should be blocked with message:
> "Upload quota exceeded. Upgrade to Premium for unlimited uploads."

---

### Test 4: Resume Analysis API

After uploading a resume, test the analysis endpoint:

```javascript
// In browser console (after signing in and uploading resume):
fetch('/api/resume/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ resume_id: 'YOUR_RESUME_ID' })
})
.then(r => r.json())
.then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "uuid",
    "basic_info": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1 555-1234",
      "address": null
    },
    "skills": ["JavaScript", "Python", "React", ...],
    "experiences": [...],
    "career_advice": "1. Focus on...\n\n2. Consider...",
    "improvement_suggestions": "Your resume would benefit from...",
    "date_discrepancies": null
  }
}
```

---

### Test 5: Date Discrepancy Detection

1. In onboarding Step 2, enter work experience with dates:
   - Company: "Acme Corp"
   - Start: January 2020
   - End: December 2022

2. Upload a resume that has different dates for the same company:
   - e.g., Resume shows "Jan 2020 - Mar 2023"

3. Verify the analysis shows a date discrepancy warning

**Expected Result:** Yellow warning box showing:
> "Date discrepancy: Your resume shows you ended at Acme Corp on 03/2023, but your profile says 12/2022."

---

### Test 6: Member vs Free User Career Advice

**Free User:**
- Should receive 3-5 career advice points
- Basic suggestions

**Member:**
- Should receive 10+ detailed career advice points
- Includes ATS optimization, networking tips, etc.

---

## Troubleshooting

### "Analysis took too long"
- Claude API has 60-second timeout
- Check your ANTHROPIC_API_KEY is valid
- Check API rate limits

### "Failed to read resume content"
- Ensure PDF is text-based (not scanned image)
- PDF must be between 1KB and 10MB
- Try a different PDF

### "User profile not found"
- Ensure Clerk webhook is configured
- Check user_profiles table in Supabase

### Quota not updating
- Check upload_quota table in Supabase
- Verify user_id matches

---

## Database Verification

After testing, verify data in Supabase:

1. **upload_quota table:** Check upload counts
2. **resume_analyses table:** Check analysis results stored
3. **resumes table:** Check resume records created

---

## Success Criteria

- [ ] Claude API successfully called and returns analysis
- [ ] Basic info extracted (name, email, phone)
- [ ] Skills extracted as array
- [ ] Work experiences extracted with dates
- [ ] Career advice generated (3-5 for free, 10+ for member)
- [ ] Upload quota tracked for free users
- [ ] Free users blocked after 4 uploads
- [ ] Analysis results stored in database
- [ ] Date discrepancies detected when present
