'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  step_number: number;
  step_name: string;
  completed: boolean;
}

interface OnboardingGuideProps {
  steps: OnboardingStep[];
  userType: 'free' | 'member' | 'guest';
}

// Human-readable step names
const STEP_LABELS: Record<string, string> = {
  sign_up: 'Sign Up',
  basic_info: 'Basic Information',
  upload_resume: 'Upload Resume',
  view_analysis: 'View Analysis',
  dashboard_tour: 'Dashboard Tour',
  'dashboard-tour': 'Dashboard Tour',
  purchase_navigation: 'Upgrade to Premium',
};

export default function OnboardingGuide({ steps, userType }: OnboardingGuideProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Find current step (first incomplete)
  const currentStepIndex = steps.findIndex((s) => !s.completed);
  const allComplete = currentStepIndex === -1;

  const handleStepClick = (step: OnboardingStep) => {
    // Navigate to appropriate page based on step
    switch (step.step_name) {
      case 'basic_info':
        router.push('/onboarding?step=2');
        break;
      case 'upload_resume':
        router.push('/onboarding?step=3');
        break;
      case 'view_analysis':
        router.push('/onboarding?step=4');
        break;
      case 'purchase_navigation':
        router.push('/pricing');
        break;
      default:
        break;
    }
  };

  if (allComplete) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-green-800">Onboarding Complete!</p>
            <p className="text-sm text-green-600">You&apos;ve completed all setup steps.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Getting Started</h3>
          <p className="text-sm text-gray-500">
            {steps.filter((s) => s.completed).length} of {steps.length} steps completed
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Steps list */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isComplete = step.completed;
              const isCurrent = index === currentStepIndex;
              const isClickable = step.step_name !== 'sign_up';

              return (
                <button
                  key={step.step_number}
                  onClick={() => isClickable && handleStepClick(step)}
                  disabled={!isClickable}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    isComplete
                      ? 'bg-green-50 hover:bg-green-100'
                      : isCurrent
                      ? 'bg-blue-50 hover:bg-blue-100 ring-2 ring-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  } ${!isClickable ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {/* Step indicator */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isComplete
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isComplete ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.step_number
                    )}
                  </div>

                  {/* Step label */}
                  <div className="flex-1">
                    <p className={`font-medium ${isComplete ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-700'}`}>
                      {STEP_LABELS[step.step_name] || step.step_name}
                    </p>
                  </div>

                  {/* Arrow for clickable incomplete steps */}
                  {!isComplete && isClickable && (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
