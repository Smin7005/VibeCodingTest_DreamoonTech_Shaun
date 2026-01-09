'use client';

import React from 'react';
import { ResumeAnalysis } from '@/lib/supabase';

interface StatisticsProps {
  analysis: ResumeAnalysis | null;
  resumeCount?: number;
  userType: 'free' | 'member' | 'guest';
}

export default function Statistics({ analysis, resumeCount = 1, userType }: StatisticsProps) {
  // Safely parse skills - handle array, string, or null
  let skills: string[] = [];
  try {
    if (analysis?.skills) {
      if (Array.isArray(analysis.skills)) {
        skills = analysis.skills;
      } else if (typeof analysis.skills === 'string') {
        skills = JSON.parse(analysis.skills);
      }
    }
  } catch (e) {
    console.error('Error parsing skills in Statistics:', e);
    skills = [];
  }

  // Safely parse experiences - handle array, string, or null
  let experiences: unknown[] = [];
  try {
    if (analysis?.experiences) {
      if (Array.isArray(analysis.experiences)) {
        experiences = analysis.experiences;
      } else if (typeof analysis.experiences === 'string') {
        experiences = JSON.parse(analysis.experiences);
      }
    }
  } catch (e) {
    console.error('Error parsing experiences in Statistics:', e);
    experiences = [];
  }

  const skillsCount = skills.length;
  const experiencesCount = experiences.length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Skills count */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{skillsCount}</div>
          <div className="text-sm text-blue-700 font-medium mt-1">Skills</div>
          <div className="text-xs text-blue-600 mt-1">Extracted from resume</div>
        </div>

        {/* Experiences count */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{experiencesCount}</div>
          <div className="text-sm text-green-700 font-medium mt-1">Experiences</div>
          <div className="text-xs text-green-600 mt-1">Work & internships</div>
        </div>
      </div>

      {/* Resume versions count (members only) */}
      {userType === 'member' && (
        <div className="mt-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{resumeCount}</div>
            <div className="text-sm text-purple-700 font-medium mt-1">Resume Versions</div>
            <div className="text-xs text-purple-600 mt-1">Stored in your account</div>
          </div>
        </div>
      )}

      {/* No analysis message */}
      {!analysis && (
        <div className="mt-4 text-center py-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            Upload and analyze a resume to see your statistics.
          </p>
        </div>
      )}
    </div>
  );
}
