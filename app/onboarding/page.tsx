'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Stepper from '@/components/onboarding/Stepper';
import BasicInfoForm from '@/components/onboarding/BasicInfoForm';
import WorkExperienceForm, { WorkExperience } from '@/components/onboarding/WorkExperienceForm';
import ResumeUpload from '@/components/onboarding/ResumeUpload';
import AnalysisResults from '@/components/onboarding/AnalysisResults';

interface OnboardingStep {
  number: number;
  name: string;
  completed: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(2); // Start at step 2 (step 1 is sign-up)
  const [userType, setUserType] = useState<'guest' | 'free' | 'member'>('guest');
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  // Form data state
  const [basicInfo, setBasicInfo] = useState<any>(null);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [resumeId, setResumeId] = useState<string | null>(null);

  // Fetch user profile and onboarding progress
  useEffect(() => {
    if (!isLoaded || !user) return;

    const initializeOnboarding = async () => {
      try {
        // Fetch onboarding progress
        const response = await fetch('/api/onboarding/progress');
        if (response.ok) {
          const data = await response.json();

          // If no steps exist, initialize them
          if (!data.steps || data.steps.length === 0) {
            console.log('No onboarding progress found, initializing...');
            // Initialize with step 1 completed (user is already signed up)
            await fetch('/api/onboarding/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ step_number: 1, step_name: 'sign-up', completed: true }),
            });
            // Fetch again after initialization
            const retryResponse = await fetch('/api/onboarding/progress');
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              setSteps(retryData.steps);
              setCurrentStep(retryData.current_step);
              setUserType(retryData.user_type);
            }
          } else {
            setSteps(data.steps);
            setCurrentStep(data.current_step);
            setUserType(data.user_type);
          }

          // Pre-fill data if user is returning
          if (data.user_type === 'free') {
            // Fetch basic info and work experiences from database
            // NOTE: This will be implemented when we add user data API endpoints
            // For now, we'll let forms handle their own data fetching if needed
          }
        } else {
          console.error('Failed to fetch onboarding progress:', response.status);
        }
      } catch (error) {
        console.error('Error initializing onboarding:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeOnboarding();
  }, [isLoaded, user]);

  // Complete a step and move to next
  const completeStep = async (stepNumber: number, stepName: string) => {
    try {
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_number: stepNumber, step_name: stepName, completed: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentStep(data.current_step);

        // Refresh steps
        const progressResponse = await fetch('/api/onboarding/progress');
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setSteps(progressData.steps);
        }
      }
    } catch (error) {
      console.error('Error completing step:', error);
      throw error;
    }
  };

  // Update user type to 'free' after completing guest onboarding
  const transitionToFreeUser = async () => {
    try {
      const response = await fetch('/api/user/update-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_type: 'free' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update user type:', errorData);
        throw new Error(errorData.error || 'Failed to update user type');
      }

      const data = await response.json();
      console.log('User type updated successfully:', data);
      setUserType('free');
    } catch (error) {
      console.error('Error transitioning user type:', error);
      // Don't block the user - still redirect to dashboard even if update fails
      // The user can still use the app, and we can retry later
    }
  };

  // Step 2: Basic Information Form
  const handleBasicInfoSubmit = async (data: any) => {
    setBasicInfo(data);
    // Don't complete step yet - wait for work experience
  };

  // Step 2 (continued): Work Experience Form
  const handleWorkExperienceSubmit = async (experiences: WorkExperience[]) => {
    setWorkExperiences(experiences);
    // Complete step 2 after both basic info and work experience are done
    await completeStep(2, 'basic-information');
  };

  // Step 3: Resume Upload
  const handleResumeUploadSuccess = async (resumeId: string) => {
    setResumeId(resumeId);
    await completeStep(3, 'resume-upload');
  };

  // Step 4: Analysis Results
  const handleAnalysisComplete = async () => {
    await completeStep(4, 'analysis-results');

    // If guest user, transition to free first
    if (userType === 'guest') {
      await transitionToFreeUser();
    }

    // Always redirect to dashboard
    // Tour will show automatically for new free users
    router.push('/dashboard');
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Loading state
  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Onboarding flow is always 4 steps
  // Step 5 (dashboard tour) is now handled in the dashboard page
  const totalSteps = 4;

  // Debug logging
  console.log('=== ONBOARDING DEBUG ===');
  console.log('Current Step:', currentStep);
  console.log('User Type:', userType);
  console.log('Steps:', steps);
  console.log('Basic Info:', basicInfo);
  console.log('Work Experiences:', workExperiences);
  console.log('Resume ID:', resumeId);
  console.log('========================');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Stepper */}
        <div className="mb-8">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        </div>

        {/* Step Content */}
        {currentStep === 2 && !basicInfo && (
          <BasicInfoForm
            initialData={basicInfo}
            onSubmit={handleBasicInfoSubmit}
          />
        )}

        {currentStep === 2 && basicInfo && !workExperiences.length && (
          <WorkExperienceForm
            initialExperiences={workExperiences}
            onSubmit={handleWorkExperienceSubmit}
            onBack={() => setBasicInfo(null)}
          />
        )}

        {currentStep === 3 && (
          <ResumeUpload
            onUploadSuccess={handleResumeUploadSuccess}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && resumeId && (
          <AnalysisResults
            resumeId={resumeId}
            onContinue={handleAnalysisComplete}
            onBack={handleBack}
          />
        )}

        {/* Fallback for completed users or edge cases */}
        {currentStep > 4 && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-green-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Onboarding Complete! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                You&apos;ve successfully completed all onboarding steps.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
