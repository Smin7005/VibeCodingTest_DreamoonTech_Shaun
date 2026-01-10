'use client';

import React from 'react';
import Link from 'next/link';
import { getQuotaResetDate } from '@/lib/dashboard';

interface UploadQuotaIndicatorProps {
  used: number;
  limit: number;
  userType: 'free' | 'member' | 'guest';
  onUpload?: () => void;
}

export default function UploadQuotaIndicator({ used, limit, userType, onUpload }: UploadQuotaIndicatorProps) {

  // Members have unlimited uploads
  if (userType === 'member') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Resume Uploads</h3>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Unlimited
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          As a Premium member, you have unlimited resume uploads and version storage.
        </p>
        {onUpload && (
          <button
            onClick={onUpload}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Upload New Version
          </button>
        )}
      </div>
    );
  }

  const remaining = Math.max(0, limit - used);
  const percentage = (used / limit) * 100;
  const resetDate = getQuotaResetDate();

  // Color based on remaining quota
  const getColorClasses = () => {
    if (remaining === 0) return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' };
    if (remaining <= 2) return { bar: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' };
    return { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' };
  };

  const colors = getColorClasses();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload Quota</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
          {remaining}/{limit} remaining
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {used} of {limit} uploads used this month
        </p>
      </div>

      {/* Reset date */}
      <p className="text-sm text-gray-500 mb-4">
        Quota resets on <span className="font-medium">{resetDate}</span>
      </p>

      {/* Action buttons */}
      {remaining > 0 ? (
        onUpload && (
          <button
            onClick={onUpload}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Upload New Resume
          </button>
        )
      ) : (
        <div className={`p-4 rounded-lg ${colors.bg}`}>
          <p className={`text-sm font-medium ${colors.text} mb-2`}>
            Monthly upload limit reached
          </p>
          <p className="text-sm text-gray-600 mb-3">
            Upgrade to Premium for unlimited uploads and multiple resume versions.
          </p>
          <Link
            href="/pricing"
            className="block w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
          >
            Upgrade to Premium
          </Link>
        </div>
      )}
    </div>
  );
}
