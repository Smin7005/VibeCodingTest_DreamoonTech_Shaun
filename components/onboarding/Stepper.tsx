'use client';

import React from 'react';

interface Step {
  number: number;
  name: string;
  completed: boolean;
}

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  steps: Step[];
  onStepClick?: (stepNumber: number) => void;
}

export default function Stepper({ currentStep, totalSteps, steps, onStepClick }: StepperProps) {
  const getStepStatus = (step: Step) => {
    if (step.completed) return 'completed';
    if (step.number === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepLabel = (stepName: string) => {
    const labels: Record<string, string> = {
      'sign-up': 'Sign Up',
      'basic-information': 'Basic Info',
      'resume-upload': 'Upload Resume',
      'analysis-results': 'View Analysis',
      'dashboard-tour': 'Dashboard Tour',
      'purchase-navigation': 'Upgrade',
    };
    return labels[stepName] || stepName;
  };

  return (
    <div className="w-full py-8">
      {/* Mobile: Vertical Stepper */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step);
          const isClickable = onStepClick && step.completed;

          return (
            <div
              key={step.number}
              className={`flex items-start ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => isClickable && onStepClick(step.number)}
            >
              {/* Step Icon */}
              <div className="flex-shrink-0">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                    ${
                      status === 'completed'
                        ? 'bg-green-500 text-white'
                        : status === 'current'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
              </div>

              {/* Step Label */}
              <div className="ml-4 flex-1">
                <p
                  className={`
                    text-sm font-medium
                    ${status === 'current' ? 'text-blue-600' : status === 'completed' ? 'text-green-600' : 'text-gray-500'}
                  `}
                >
                  {getStepLabel(step.name)}
                </p>
                {status === 'current' && (
                  <p className="text-xs text-gray-500 mt-1">In Progress</p>
                )}
                {status === 'completed' && (
                  <p className="text-xs text-gray-500 mt-1">Completed</p>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-5 top-10 h-full w-0.5 bg-gray-300 -z-10" />
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: Horizontal Stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between relative">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            const isClickable = onStepClick && step.completed;

            return (
              <React.Fragment key={step.number}>
                {/* Step Circle and Label */}
                <div
                  className={`flex flex-col items-center flex-1 ${isClickable ? 'cursor-pointer' : ''}`}
                  onClick={() => isClickable && onStepClick(step.number)}
                >
                  {/* Step Circle */}
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-semibold relative z-10
                      ${
                        status === 'completed'
                          ? 'bg-green-500 text-white'
                          : status === 'current'
                          ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                          : 'bg-gray-300 text-gray-600'
                      }
                    `}
                  >
                    {status === 'completed' ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>

                  {/* Step Label */}
                  <p
                    className={`
                      mt-3 text-sm font-medium text-center
                      ${status === 'current' ? 'text-blue-600' : status === 'completed' ? 'text-green-600' : 'text-gray-500'}
                    `}
                  >
                    {getStepLabel(step.name)}
                  </p>

                  {/* Status Indicator */}
                  {status === 'current' && (
                    <p className="text-xs text-gray-500 mt-1">In Progress</p>
                  )}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                      flex-1 h-1 -mx-2 relative z-0
                      ${status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}
                    `}
                    style={{ marginTop: '-2rem' }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
