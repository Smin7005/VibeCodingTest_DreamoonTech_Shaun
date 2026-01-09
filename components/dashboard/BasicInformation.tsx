'use client';

import React from 'react';
import { UserProfile, WorkExperience } from '@/lib/supabase';

interface BasicInformationProps {
  userProfile: UserProfile | null;
  workExperiences?: WorkExperience[];
  onUpdate?: () => void;
  onEditExperience?: () => void;
}

// Month names for display
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Calculate duration from start_date to end_date (same logic as WorkExperienceForm)
function calculateDuration(startDate: string | null, endDate: string | null, isCurrent: boolean): string {
  if (!startDate) return '';

  const start = new Date(startDate);
  const end = isCurrent ? new Date() : (endDate ? new Date(endDate) : null);

  if (!end) return '';

  // Calculate difference in months
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

  if (months < 0) return 'Invalid dates';

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }
  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
  return `${years}y ${remainingMonths}m`;
}

// Format date for display (YYYY-MM-DD to "Mon YYYY")
function formatDateDisplay(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export default function BasicInformation({
  userProfile,
  workExperiences = [],
  onUpdate,
  onEditExperience
}: BasicInformationProps) {
  // Check if basic info is complete
  const hasBasicInfo = userProfile?.name && userProfile?.role &&
                       userProfile?.target_position && userProfile?.city;

  // Info items to display
  const infoItems = [
    {
      label: 'Full Name',
      value: userProfile?.name,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: 'Current Role',
      value: userProfile?.role,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Target Position',
      value: userProfile?.target_position,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: 'City',
      value: userProfile?.city,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header with Update button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          <p className="text-sm text-gray-500 mt-1">Your profile and career goals</p>
        </div>
        {onUpdate && (
          <button
            onClick={onUpdate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Update
          </button>
        )}
      </div>

      {/* Empty state for basic info */}
      {!hasBasicInfo && (
        <div className="text-center py-8 bg-gray-50 rounded-lg mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No basic information added yet</p>
          <p className="text-sm text-gray-500 mt-1">Click Update to add your information</p>
          {onUpdate && (
            <button
              onClick={onUpdate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Information
            </button>
          )}
        </div>
      )}

      {/* Info grid */}
      {hasBasicInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {infoItems.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 font-medium">{item.label}</p>
                <p className="text-gray-900 font-semibold truncate">
                  {item.value || <span className="text-gray-400 font-normal">Not set</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Partial info warning */}
      {userProfile && !hasBasicInfo && (userProfile.name || userProfile.role || userProfile.target_position || userProfile.city) && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">Incomplete Profile</p>
              <p className="text-sm text-yellow-700 mt-1">
                Some information is missing. Complete your profile to get better career advice.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Work Experience Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Work Experience ({workExperiences.length})
            </h4>
            <p className="text-sm text-gray-500 mt-1">Your employment history</p>
          </div>
          {onEditExperience && (
            <button
              onClick={onEditExperience}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        {/* Empty state for work experience */}
        {workExperiences.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No work experience added</p>
            <p className="text-sm text-gray-500 mt-1">Add your employment history to improve career advice</p>
          </div>
        )}

        {/* Work experience list */}
        {workExperiences.length > 0 && (
          <div className="space-y-4">
            {workExperiences.map((exp) => {
              const duration = calculateDuration(exp.start_date, exp.end_date || null, exp.is_current);
              const startFormatted = formatDateDisplay(exp.start_date);
              const endFormatted = exp.is_current ? 'Present' : formatDateDisplay(exp.end_date || null);

              return (
                <div
                  key={exp.id}
                  className="p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border border-gray-100 hover:border-green-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Job title and company */}
                      <h5 className="font-semibold text-gray-900 truncate">{exp.job_title}</h5>
                      <p className="text-gray-700 truncate">{exp.company_name}</p>

                      {/* Location if available */}
                      {exp.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {exp.location}
                        </p>
                      )}

                      {/* Date range */}
                      <div className="flex items-center gap-2 mt-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {startFormatted} - {endFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Duration badge */}
                    {duration && (
                      <div className="flex-shrink-0 ml-4">
                        <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {duration}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description if available */}
                  {exp.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{exp.description}</p>
                  )}

                  {/* Current job indicator */}
                  {exp.is_current && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        Currently Working
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
