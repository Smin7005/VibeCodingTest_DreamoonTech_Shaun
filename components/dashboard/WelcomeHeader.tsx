'use client';

import React from 'react';
import { getGreeting } from '@/lib/dashboard';

interface WelcomeHeaderProps {
  userName: string;
  profileCompletion: number;
}

export default function WelcomeHeader({ userName, profileCompletion }: WelcomeHeaderProps) {
  const greeting = getGreeting();

  // Determine color based on completion percentage
  const getColorClass = () => {
    if (profileCompletion <= 25) return { stroke: '#ef4444', bg: 'bg-red-100' };
    if (profileCompletion <= 50) return { stroke: '#f97316', bg: 'bg-orange-100' };
    if (profileCompletion <= 75) return { stroke: '#eab308', bg: 'bg-yellow-100' };
    return { stroke: '#22c55e', bg: 'bg-green-100' };
  };

  const colors = getColorClass();

  // SVG pie chart calculation
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (profileCompletion / 100) * circumference;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {userName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome to your dashboard. Here&apos;s an overview of your profile.
          </p>
        </div>

        {/* Profile Completion Pie Chart */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={colors.stroke}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            {/* Percentage text in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-900">{profileCompletion}%</span>
            </div>
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-700">Profile Completion</p>
            <p className="text-gray-500">
              {profileCompletion === 100 ? 'Complete!' : 'Keep going!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
