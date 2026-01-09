'use client';

import React from 'react';
import { ResumeAnalysis } from '@/lib/supabase';
import { formatDate, calculateDuration } from '@/lib/dashboard';

interface Experience {
  companyName: string;
  jobTitle: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  location: string | null;
}

interface ResumeInformationProps {
  analysis: ResumeAnalysis | null;
  onEditExperience?: () => void;
}

export default function ResumeInformation({ analysis, onEditExperience }: ResumeInformationProps) {
  if (!analysis) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Information</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600">No resume analysis available.</p>
          <p className="text-sm text-gray-500 mt-1">Upload a resume to see your information here.</p>
        </div>
      </div>
    );
  }

  // Safely parse basic_info - handle string, object, or null
  let basicInfo: { name?: string; email?: string; phone?: string; address?: string } = {};
  try {
    if (typeof analysis.basic_info === 'string') {
      basicInfo = JSON.parse(analysis.basic_info);
    } else if (analysis.basic_info && typeof analysis.basic_info === 'object') {
      basicInfo = analysis.basic_info;
    }
  } catch (e) {
    console.error('Error parsing basic_info:', e);
    basicInfo = {};
  }

  // Safely parse skills - handle array, string, or null
  let skills: string[] = [];
  try {
    if (Array.isArray(analysis.skills)) {
      skills = analysis.skills;
    } else if (typeof analysis.skills === 'string') {
      skills = JSON.parse(analysis.skills);
    }
  } catch (e) {
    console.error('Error parsing skills:', e);
    skills = [];
  }

  // Safely parse experiences - handle array, string, or null
  let experiences: Experience[] = [];
  try {
    if (Array.isArray(analysis.experiences)) {
      experiences = analysis.experiences;
    } else if (typeof analysis.experiences === 'string') {
      experiences = JSON.parse(analysis.experiences);
    }
  } catch (e) {
    console.error('Error parsing experiences:', e);
    experiences = [];
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Resume Information</h3>
        {onEditExperience && (
          <button
            onClick={onEditExperience}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit Experience
          </button>
        )}
      </div>

      {/* Basic Information Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar placeholder */}
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {basicInfo.name ? basicInfo.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-semibold text-gray-900">
              {basicInfo.name || 'Name not found'}
            </h4>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              {basicInfo.email && (
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {basicInfo.email}
                </p>
              )}
              {basicInfo.phone && (
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {basicInfo.phone}
                </p>
              )}
              {basicInfo.address && (
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {basicInfo.address}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Skills ({skills.length})
        </h4>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No skills extracted from resume.</p>
        )}
      </div>

      {/* Work Experience Section */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Experience ({experiences.length})
        </h4>
        {experiences.length > 0 ? (
          <div className="space-y-4">
            {experiences.map((exp: Experience, index: number) => (
              <div
                key={index}
                className="border-l-2 border-blue-200 pl-4 py-2 hover:border-blue-400 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold text-gray-900">{exp.jobTitle}</h5>
                    <p className="text-gray-700">{exp.companyName}</p>
                    {exp.location && (
                      <p className="text-sm text-gray-500">{exp.location}</p>
                    )}
                  </div>
                  {exp.startDate && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                      {calculateDuration(exp.startDate, exp.isCurrent ? null : exp.endDate)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {exp.startDate || 'Unknown'} - {exp.isCurrent ? 'Present' : (exp.endDate || 'Unknown')}
                </p>
                {exp.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No work experience extracted from resume.</p>
        )}
      </div>
    </div>
  );
}
