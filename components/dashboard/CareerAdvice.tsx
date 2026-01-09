'use client';

import React, { useState } from 'react';
import { ResumeAnalysis } from '@/lib/supabase';

interface DateDiscrepancy {
  companyName: string;
  field: 'startDate' | 'endDate';
  manualValue: string | null;
  extractedValue: string | null;
  message: string;
}

interface CareerAdviceProps {
  analysis: ResumeAnalysis | null;
  userType: 'free' | 'member' | 'guest';
  onEditWorkExperience?: () => void;
}

export default function CareerAdvice({ analysis, userType, onEditWorkExperience }: CareerAdviceProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!analysis) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Advice</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-gray-600">Career advice will appear here after analysis.</p>
          <p className="text-sm text-gray-500 mt-1">Upload and analyze a resume to get personalized advice.</p>
        </div>
      </div>
    );
  }

  // Safely parse date_discrepancies - could be array, JSON string, or null
  let dateDiscrepancies: DateDiscrepancy[] = [];
  try {
    if (Array.isArray(analysis.date_discrepancies)) {
      dateDiscrepancies = analysis.date_discrepancies;
    } else if (typeof analysis.date_discrepancies === 'string' && analysis.date_discrepancies.trim()) {
      dateDiscrepancies = JSON.parse(analysis.date_discrepancies);
    }
  } catch (e) {
    console.error('Error parsing date_discrepancies:', e);
    dateDiscrepancies = [];
  }

  // Safely get career_advice string
  const careerAdvice = typeof analysis.career_advice === 'string' ? analysis.career_advice : '';
  const improvementSuggestions = typeof analysis.improvement_suggestions === 'string' ? analysis.improvement_suggestions : '';

  // Split career advice into bullet points (handle different separators)
  const advicePoints = careerAdvice
    .split(/\n+/)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter((line) => line.length > 0);

  // For free users, limit to 5 points
  const displayedAdvice = userType === 'free' ? advicePoints.slice(0, 5) : advicePoints;
  const hasMoreAdvice = userType === 'free' && advicePoints.length > 5;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Advice</h3>

      {/* Date Discrepancy Warnings */}
      {dateDiscrepancies.length > 0 && (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-800 mb-2">Date Discrepancies Detected</h4>
                <div className="space-y-2">
                  {dateDiscrepancies.map((discrepancy, index) => (
                    <p key={index} className="text-sm text-yellow-700">
                      {discrepancy.message}
                    </p>
                  ))}
                </div>
                {onEditWorkExperience && (
                  <button
                    onClick={onEditWorkExperience}
                    className="mt-3 text-sm font-medium text-yellow-700 hover:text-yellow-800 underline"
                  >
                    Edit Work Experience
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Career Advice Points */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Personalized Recommendations
          {userType === 'free' && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              Basic (5 tips)
            </span>
          )}
          {userType === 'member' && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
              Premium ({advicePoints.length}+ tips)
            </span>
          )}
        </h4>
        <ul className="space-y-3">
          {displayedAdvice.map((point, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <p className="text-gray-700 text-sm">{point}</p>
            </li>
          ))}
        </ul>

        {/* Upgrade prompt for free users */}
        {hasMoreAdvice && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">+{advicePoints.length - 5} more tips available!</span>{' '}
              Upgrade to Premium for detailed career roadmap and advanced recommendations.
            </p>
            <a
              href="/pricing"
              className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Upgrade Now →
            </a>
          </div>
        )}
      </div>

      {/* Improvement Suggestions */}
      {improvementSuggestions && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full py-3 text-left"
          >
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resume Improvement Suggestions
            </h4>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isExpanded && (
            <div className="bg-gray-50 rounded-lg p-4 mt-2">
              <p className="text-sm text-gray-700 whitespace-pre-line">{improvementSuggestions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
