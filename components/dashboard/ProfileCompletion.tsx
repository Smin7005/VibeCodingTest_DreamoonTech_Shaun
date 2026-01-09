'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProfileCompletionData } from '@/lib/dashboard';

interface ProfileCompletionProps {
  data: ProfileCompletionData;
  userType: 'free' | 'member' | 'guest';
  onEditBasicInfo?: () => void;
  onUploadResume?: () => void;
}

export default function ProfileCompletion({
  data,
  userType,
  onEditBasicInfo,
  onUploadResume,
}: ProfileCompletionProps) {
  const router = useRouter();

  const sections = [
    {
      key: 'basicInfo',
      label: 'Basic Information',
      description: data.sections.basicInfo
        ? 'Name, role, target position, and city'
        : 'Click to add your information',
      completed: data.sections.basicInfo,
      onClick: onEditBasicInfo,
      clickable: true,
    },
    {
      key: 'resumeUploaded',
      label: 'Resume Uploaded',
      description: data.sections.resumeUploaded
        ? 'Resume uploaded successfully'
        : 'Click to upload your resume',
      completed: data.sections.resumeUploaded,
      onClick: onUploadResume,
      clickable: true,
    },
    {
      key: 'analysisComplete',
      label: 'Analysis Complete',
      description: data.sections.analysisComplete
        ? 'AI analysis completed'
        : 'Upload a resume to get analysis',
      completed: data.sections.analysisComplete,
      onClick: data.sections.resumeUploaded ? undefined : onUploadResume,
      clickable: !data.sections.analysisComplete && !data.sections.resumeUploaded,
    },
    {
      key: 'subscriptionActive',
      label: 'Premium Subscription',
      description: userType === 'member' ? 'Active subscription' : 'Click to upgrade',
      completed: data.sections.subscriptionActive,
      onClick: userType !== 'member' ? () => router.push('/pricing') : undefined,
      clickable: userType !== 'member',
      isPremium: true,
    },
  ];

  // Get progress bar color
  const getProgressColor = () => {
    if (data.percentage <= 25) return 'bg-red-500';
    if (data.percentage <= 50) return 'bg-orange-500';
    if (data.percentage <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Completion</h3>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{data.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${data.percentage}%` }}
          />
        </div>
      </div>

      {/* Section checklist */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isClickable = section.clickable && section.onClick && !section.completed;

          return (
            <button
              key={section.key}
              onClick={isClickable ? section.onClick : undefined}
              disabled={!isClickable}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                section.completed
                  ? 'bg-green-50'
                  : isClickable
                  ? 'bg-gray-50 hover:bg-blue-50 hover:ring-2 hover:ring-blue-200 cursor-pointer'
                  : 'bg-gray-50 cursor-default'
              }`}
            >
              {/* Checkbox icon */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  section.completed
                    ? 'bg-green-500 text-white'
                    : isClickable
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {section.completed ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isClickable ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                ) : (
                  <span className="text-xs">{sections.indexOf(section) + 1}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    section.completed
                      ? 'text-green-700'
                      : isClickable
                      ? 'text-blue-700'
                      : 'text-gray-700'
                  }`}
                >
                  {section.label}
                </p>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>

              {/* Action indicator */}
              {isClickable && (
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}

              {/* Premium badge */}
              {section.isPremium && userType !== 'member' && !isClickable && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Premium
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Max completion note for free users */}
      {userType === 'free' && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          Free users can reach up to 75% completion.{' '}
          <a href="/pricing" className="text-blue-600 hover:underline">
            Upgrade to Premium
          </a>{' '}
          for 100%.
        </p>
      )}
    </div>
  );
}
