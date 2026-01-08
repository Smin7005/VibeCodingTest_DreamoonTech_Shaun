'use client';

import React, { useState } from 'react';
import Button from '../ui/button';

interface DashboardTourProps {
  onComplete: () => Promise<void>;
}

const TOUR_STEPS = [
  {
    title: 'Welcome to Your Dashboard',
    description: 'This is your personal dashboard where you can manage your resumes, track your career progress, and get AI-powered advice.',
    icon: (
      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: 'Profile Completion',
    description: 'Track your profile completion percentage. A complete profile helps us provide better career advice and resume optimization suggestions.',
    icon: (
      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Resume Information',
    description: 'View your extracted skills and work experiences. We analyze your resume to provide insights and help you highlight your strengths.',
    icon: (
      <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Career Advice',
    description: 'Get AI-powered career advice tailored to your experience and goals. We help you identify opportunities and areas for improvement.',
    icon: (
      <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: 'Upload Quota',
    description: 'As a Free user, you have 4 resume uploads per month. Upgrade to Premium for unlimited uploads and advanced features.',
    icon: (
      <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
  {
    title: 'Subscription Management',
    description: 'View your current plan and manage your subscription. Premium members get unlimited uploads, detailed career roadmaps, and priority support.',
    icon: (
      <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function DashboardTour({ onComplete }: DashboardTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete();
    } catch (error) {
      console.error('Error completing tour:', error);
      setCompleting(false);
    }
  };

  const currentStepData = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-t-lg overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">{currentStepData.icon}</div>

          {/* Step Counter */}
          <p className="text-center text-sm text-gray-500 mb-2">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </p>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            {currentStepData.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-8">{currentStepData.description}</p>

          {/* Buttons */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={completing}
            >
              Skip Tour
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              loading={completing}
              disabled={completing}
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </Button>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
