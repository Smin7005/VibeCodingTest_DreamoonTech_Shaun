# Stage 2: Onboarding Flow - Testing Checklist

## Overview

This document provides a comprehensive testing checklist for Stage 2 implementation. Use this to verify all onboarding flow functionality.

**Date Created:** January 8, 2026
**Status:** Guest flow tested ✅ | Free user flow pending ⏳

---

## Pre-Testing Setup

### Required Configuration

- [x] Next.js dev server running (`npm run dev`)
- [x] ngrok tunnel active (if testing new user signups)
- [x] Clerk webhook configured with ngrok URL
- [x] Supabase database schema applied
- [x] Supabase Storage bucket `resumes` created
- [x] RLS policies configured on `resumes` bucket
- [x] Environment variables set in `.env.local`

### Test Data Preparation

- [ ] Prepare 3-5 test PDF resumes (various sizes)
- [ ] Prepare 1 PDF > 10MB (for rejection test)
- [ ] Prepare 1 non-PDF file (e.g., .docx, .txt) (for rejection test)
- [ ] Test user accounts created (at least 2)

---

## Test Suite 1: Basic Functionality

### 1.1 Stepper Component

**Objective:** Verify visual progress indicator works correctly

- [x] **Test 1.1.1**: Stepper displays all steps on initial load
  - Expected: 4 steps shown for guest users
  - Status: ✅ PASS

- [x] **Test 1.1.2**: Current step is highlighted
  - Expected: Step 2 has blue indicator on fresh signup
  - Status: ✅ PASS

- [x] **Test 1.1.3**: Completed steps show green checkmark
  - Expected: Step 1 (Sign-up) shows green checkmark
  - Status: ✅ PASS

- [ ] **Test 1.1.4**: Stepper is responsive on mobile
  - Expected: Vertical layout on mobile (<768px), horizontal on desktop
  - Status: ⏳ PENDING

### 1.2 Basic Information Form

**Objective:** Verify first form collects user information correctly

- [x] **Test 1.2.1**: All fields display with proper labels
  - Expected: Name, Role, Target Position, City fields visible
  - Status: ✅ PASS

- [x] **Test 1.2.2**: Required field validation works
  - Action: Try to submit empty form
  - Expected: Error messages appear for all fields
  - Status: ✅ PASS

- [x] **Test 1.2.3**: Character length validation (minimum)
  - Action: Enter 1 character in name field, blur
  - Expected: Error "Name must be 2-50 characters"
  - Status: ✅ PASS

- [ ] **Test 1.2.4**: Character length validation (maximum)
  - Action: Enter 51 characters in name field, blur
  - Expected: Error "Name must be 2-50 characters"
  - Status: ⏳ PENDING

- [x] **Test 1.2.5**: Form advances to work experience
  - Action: Fill all fields correctly, click Continue
  - Expected: Work experience form appears
  - Status: ✅ PASS

- [ ] **Test 1.2.6**: Data persists in component state
  - Action: Fill form, click Continue, then click Back
  - Expected: Previously entered data still present
  - Status: ⏳ PENDING

### 1.3 Work Experience Form

**Objective:** Verify work history collection works correctly

- [x] **Test 1.3.1**: Add single work experience
  - Action: Fill company, job title, dates
  - Expected: Form accepts input without errors
  - Status: ✅ PASS

- [x] **Test 1.3.2**: Add multiple work experiences
  - Action: Click "Add Another Experience", fill second entry
  - Expected: Both entries visible and editable
  - Status: ✅ PASS (tested with 2 entries)

- [ ] **Test 1.3.3**: Remove work experience
  - Action: Add 3 experiences, remove the middle one
  - Expected: Second entry removed, others remain
  - Status: ⏳ PENDING

- [x] **Test 1.3.4**: "Present" checkbox disables end date
  - Action: Check "Present" checkbox
  - Expected: End month/year fields disabled or hidden
  - Status: ✅ PASS

- [x] **Test 1.3.5**: Duration calculates correctly
  - Action: Enter start date Jan 2023, end date Mar 2025
  - Expected: Shows "2 years 2 months" or similar
  - Status: ✅ PASS

- [x] **Test 1.3.6**: Start date validation (no future dates)
  - Action: Select future start date
  - Expected: Error "Start date cannot be in the future"
  - Status: ✅ PASS

- [x] **Test 1.3.7**: End date after start date validation
  - Action: Set end date before start date
  - Expected: Error "End date must be after start date"
  - Status: ✅ PASS

- [x] **Test 1.3.8**: Same month/year allowed
  - Action: Set start and end to Jan 2025
  - Expected: Accepted (represents 1 month duration)
  - Status: ✅ PASS

- [ ] **Test 1.3.9**: Cannot submit without any experience
  - Action: Try to submit with 0 experiences
  - Expected: Error or disabled submit button
  - Status: ⏳ PENDING

- [x] **Test 1.3.10**: Form advances to resume upload
  - Action: Fill valid experience, click Continue
  - Expected: Resume upload component appears
  - Status: ✅ PASS

### 1.4 Resume Upload

**Objective:** Verify PDF upload functionality

- [x] **Test 1.4.1**: Drag-and-drop zone visible
  - Expected: Clear upload area with instructions
  - Status: ✅ PASS

- [x] **Test 1.4.2**: File selection via button
  - Action: Click "Browse Files" or similar button
  - Expected: File picker dialog opens
  - Status: ✅ PASS

- [x] **Test 1.4.3**: Accept valid PDF
  - Action: Upload a 2MB PDF file
  - Expected: File accepted, preview/filename shown
  - Status: ✅ PASS

- [ ] **Test 1.4.4**: Reject non-PDF file
  - Action: Try to upload .docx or .txt file
  - Expected: Error "Only PDF files are accepted"
  - Status: ⏳ PENDING

- [ ] **Test 1.4.5**: Reject file > 10MB
  - Action: Try to upload 15MB PDF
  - Expected: Error "File size exceeds 10 MB limit"
  - Status: ⏳ PENDING

- [ ] **Test 1.4.6**: Reject very small file (< 1KB)
  - Action: Try to upload corrupted or empty PDF
  - Expected: Error "File appears to be empty or corrupted"
  - Status: ⏳ PENDING

- [x] **Test 1.4.7**: Upload progress indicator shows
  - Action: Upload a file
  - Expected: Progress bar or spinner visible during upload
  - Status: ✅ PASS

- [x] **Test 1.4.8**: Upload completes successfully
  - Action: Wait for upload to finish
  - Expected: Success message, advance to next step
  - Status: ✅ PASS

- [ ] **Test 1.4.9**: Upload error handling
  - Action: Simulate network failure (disconnect wifi mid-upload)
  - Expected: Error message displayed, retry option available
  - Status: ⏳ PENDING

### 1.5 Analysis Results

**Objective:** Verify analysis display (currently with placeholder data)

- [x] **Test 1.5.1**: Loading state displays
  - Expected: Spinner with "Analyzing your resume..." message
  - Status: ✅ PASS

- [x] **Test 1.5.2**: Analysis data displays
  - Expected: Basic info, skills tags, work experiences shown
  - Status: ✅ PASS

- [x] **Test 1.5.3**: Continue button works
  - Action: Click "Continue to Dashboard"
  - Expected: Redirect to dashboard
  - Status: ✅ PASS

- [ ] **Test 1.5.4**: Back button works
  - Action: Click "Back"
  - Expected: Return to resume upload step
  - Status: ⏳ PENDING

---

## Test Suite 2: Data Persistence

### 2.1 Database Verification

**Objective:** Verify all data is correctly saved to Supabase

- [ ] **Test 2.1.1**: User profile created
  - Action: Sign up new user
  - Query: `SELECT * FROM user_profiles WHERE clerk_user_id = '{userId}'`
  - Expected: Record exists with user_type = 'guest'
  - Status: ⏳ PENDING

- [ ] **Test 2.1.2**: Onboarding progress initialized
  - Action: Check after signup
  - Query: `SELECT * FROM onboarding_progress WHERE user_id = '{profileId}'`
  - Expected: 4 records (steps 1-4), step 1 completed = true
  - Status: ⏳ PENDING

- [ ] **Test 2.1.3**: Step completion updates database
  - Action: Complete step 2, refresh page
  - Query: Check step 2 record in onboarding_progress
  - Expected: completed = true, completed_at has timestamp
  - Status: ⏳ PENDING

- [ ] **Test 2.1.4**: Resume record created
  - Action: Upload resume successfully
  - Query: `SELECT * FROM resumes WHERE user_id = '{profileId}'`
  - Expected: Record with file_name, file_path, file_size, is_current = true
  - Status: ⏳ PENDING

- [ ] **Test 2.1.5**: User type transitions to 'free'
  - Action: Complete all 4 onboarding steps
  - Query: `SELECT user_type FROM user_profiles WHERE id = '{profileId}'`
  - Expected: user_type = 'free'
  - Status: ⏳ PENDING (likely working, needs verification)

### 2.2 Storage Verification

**Objective:** Verify files are correctly uploaded to Supabase Storage

- [ ] **Test 2.2.1**: File uploaded to correct bucket
  - Action: Upload resume
  - Check: Supabase Storage > resumes bucket
  - Expected: File present with name format `{userId}_{timestamp}_{filename}.pdf`
  - Status: ⏳ PENDING

- [ ] **Test 2.2.2**: File can be downloaded
  - Action: Try to download file from Storage UI
  - Expected: File downloads successfully and opens
  - Status: ⏳ PENDING

- [ ] **Test 2.2.3**: RLS policies enforce user access
  - Action: Try to access another user's file
  - Expected: Access denied
  - Status: ⏳ PENDING

### 2.3 Session Persistence

**Objective:** Verify state persists across page refreshes

- [ ] **Test 2.3.1**: Refresh during onboarding
  - Action: Fill basic info, refresh page
  - Expected: Resume at step 2 (form data may be lost, but progress saved)
  - Status: ⏳ PENDING

- [ ] **Test 2.3.2**: Return after leaving
  - Action: Start onboarding, close browser, return next day
  - Expected: Resume at last completed step + 1
  - Status: ⏳ PENDING

---

## Test Suite 3: User Type Flows

### 3.1 Guest User Flow (4 steps)

**Objective:** Verify complete guest onboarding journey

- [x] **Test 3.1.1**: Sign up with new account
  - Status: ✅ PASS

- [x] **Test 3.1.2**: Redirect to /onboarding automatically
  - Status: ✅ PASS

- [x] **Test 3.1.3**: Complete step 2 (basic info + work exp)
  - Status: ✅ PASS

- [x] **Test 3.1.4**: Complete step 3 (resume upload)
  - Status: ✅ PASS

- [x] **Test 3.1.5**: Complete step 4 (analysis)
  - Status: ✅ PASS

- [x] **Test 3.1.6**: Redirect to dashboard
  - Status: ✅ PASS

- [ ] **Test 3.1.7**: User type changed to 'free' in database
  - Status: ⏳ PENDING

### 3.2 Free User Flow (5 steps)

**Objective:** Verify returning free user experience

- [ ] **Test 3.2.1**: Free user visits /onboarding
  - Action: Existing free user goes to onboarding page
  - Expected: Can see all steps, completed ones marked
  - Status: ⏳ PENDING

- [ ] **Test 3.2.2**: Can skip completed steps
  - Action: Click on a completed step in stepper
  - Expected: Jump to that step
  - Status: ⏳ PENDING

- [ ] **Test 3.2.3**: Can edit previous information
  - Action: Go back to step 2, change information
  - Expected: Information updates successfully
  - Status: ⏳ PENDING

- [ ] **Test 3.2.4**: Upload replaces previous resume
  - Action: Free user uploads new resume
  - Expected: Old resume marked is_current = false, new one is_current = true
  - Status: ⏳ PENDING

- [ ] **Test 3.2.5**: Dashboard tour shows (step 5)
  - Action: Complete step 4 as free user
  - Expected: Tour modal appears with 6 steps
  - Status: ⏳ PENDING

- [ ] **Test 3.2.6**: Skip tour option works
  - Action: Click "Skip Tour"
  - Expected: Redirect to dashboard immediately
  - Status: ⏳ PENDING

- [ ] **Test 3.2.7**: Complete tour marks step 5 done
  - Action: Go through all 6 tour steps
  - Expected: Step 5 marked completed, redirect to dashboard
  - Status: ⏳ PENDING

---

## Test Suite 4: Edge Cases & Error Handling

### 4.1 Form Edge Cases

- [ ] **Test 4.1.1**: Special characters in text fields
  - Action: Enter `O'Brien` or `José` in name field
  - Expected: Accepted without errors
  - Status: ⏳ PENDING

- [ ] **Test 4.1.2**: Emoji in text fields
  - Action: Enter emoji in company name
  - Expected: Accepted or rejected gracefully
  - Status: ⏳ PENDING

- [ ] **Test 4.1.3**: Very long descriptions
  - Action: Enter 500+ characters in description
  - Expected: Error at 501 characters or truncation
  - Status: ⏳ PENDING

- [ ] **Test 4.1.4**: Rapid form submission (double-click)
  - Action: Double-click submit button quickly
  - Expected: Only one submission processed, button disabled during upload
  - Status: ⏳ PENDING

### 4.2 Upload Edge Cases

- [ ] **Test 4.2.1**: Upload same file twice
  - Action: Upload file, complete step, return and upload same file again
  - Expected: Accepted (timestamped filename should be unique)
  - Status: ⏳ PENDING

- [ ] **Test 4.2.2**: Cancel upload mid-process
  - Action: Start upload, close browser tab
  - Expected: Partial file cleaned up (if possible)
  - Status: ⏳ PENDING

- [ ] **Test 4.2.3**: Upload with very long filename
  - Action: Upload file with 255+ character name
  - Expected: Filename sanitized/truncated, upload succeeds
  - Status: ⏳ PENDING

### 4.3 Network & Server Errors

- [ ] **Test 4.3.1**: API timeout
  - Action: Simulate slow network, submit form
  - Expected: Loading state, then error message or retry
  - Status: ⏳ PENDING

- [ ] **Test 4.3.2**: Database connection failure
  - Action: Temporarily disable Supabase (pause project)
  - Expected: User-friendly error message
  - Status: ⏳ PENDING

- [ ] **Test 4.3.3**: Storage quota exceeded
  - Action: Fill up storage bucket (unlikely in testing)
  - Expected: Error message about storage limit
  - Status: ⏳ PENDING

---

## Test Suite 5: Responsive Design

### 5.1 Mobile (< 768px)

- [ ] **Test 5.1.1**: Stepper displays vertically
  - Device: iPhone 13 (390px)
  - Status: ⏳ PENDING

- [ ] **Test 5.1.2**: Forms are scrollable and readable
  - Status: ⏳ PENDING

- [ ] **Test 5.1.3**: Buttons are large enough (44px min)
  - Status: ⏳ PENDING

- [ ] **Test 5.1.4**: Upload zone works with touch
  - Status: ⏳ PENDING

### 5.2 Tablet (768px - 1024px)

- [ ] **Test 5.2.1**: Stepper displays horizontally
  - Device: iPad (768px)
  - Status: ⏳ PENDING

- [ ] **Test 5.2.2**: Layout uses available space well
  - Status: ⏳ PENDING

### 5.3 Desktop (> 1024px)

- [ ] **Test 5.3.1**: Content doesn't stretch too wide
  - Status: ⏳ PENDING

- [ ] **Test 5.3.2**: Hover states work on buttons/links
  - Status: ⏳ PENDING

---

## Test Suite 6: Accessibility

### 6.1 Keyboard Navigation

- [ ] **Test 6.1.1**: Tab through all form fields
  - Expected: Logical tab order
  - Status: ⏳ PENDING

- [ ] **Test 6.1.2**: Submit forms with Enter key
  - Status: ⏳ PENDING

- [ ] **Test 6.1.3**: Close modals with Escape key
  - Status: ⏳ PENDING

### 6.2 Screen Reader

- [ ] **Test 6.2.1**: Form labels read correctly
  - Tool: NVDA or macOS VoiceOver
  - Status: ⏳ PENDING

- [ ] **Test 6.2.2**: Error messages announced
  - Status: ⏳ PENDING

---

## Test Suite 7: Performance

### 7.1 Load Times

- [ ] **Test 7.1.1**: Initial page load < 3 seconds
  - Tool: Chrome DevTools Network tab
  - Status: ⏳ PENDING

- [ ] **Test 7.1.2**: Step transitions feel instant (< 300ms)
  - Status: ⏳ PENDING

### 7.2 File Upload

- [ ] **Test 7.2.1**: 1MB file uploads in < 5 seconds (good connection)
  - Status: ⏳ PENDING

- [ ] **Test 7.2.2**: 10MB file uploads in < 30 seconds (good connection)
  - Status: ⏳ PENDING

---

## Summary

**Total Tests:** 85
**Completed:** 30 ✅
**Pending:** 55 ⏳
**Failed:** 0 ❌

**Coverage:**
- Basic Functionality: 35% complete
- Data Persistence: 0% complete (needs database verification)
- User Type Flows: 43% complete (guest ✅, free ⏳)
- Edge Cases: 0% complete
- Responsive Design: 0% complete
- Accessibility: 0% complete
- Performance: 0% complete

**Priority Tests:**
1. Database verification (Test Suite 2)
2. Free user flow (Test Suite 3.2)
3. Edge cases for file upload (Test Suite 4.2)
4. Responsive design on mobile (Test Suite 5.1)

**Ready for Stage 3:** ✅ YES (core flow works)
**Production Ready:** ⏳ NO (more testing needed)

---

## Notes for Testers

1. **Use real email addresses** for Clerk signup to receive verification emails
2. **Use ngrok** when testing new user signups (webhook requirement)
3. **Check Supabase directly** for database verification tests
4. **Test on multiple browsers**: Chrome, Firefox, Safari, Edge
5. **Test on real devices** if possible (not just DevTools simulation)

## Bug Report Template

```
**Test ID:** [e.g., Test 1.4.4]
**Test Name:** [e.g., Reject non-PDF file]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Steps to Reproduce:**
1.
2.
3.
**Environment:**
- Browser: [Chrome 120.0.0]
- Device: [MacBook Pro M1]
- User Type: [Guest/Free]
**Screenshots:** [If applicable]
**Console Errors:** [Copy any errors from browser console]
```

---

**Last Updated:** January 8, 2026
**Next Review:** After Stage 3 implementation or before production deployment
