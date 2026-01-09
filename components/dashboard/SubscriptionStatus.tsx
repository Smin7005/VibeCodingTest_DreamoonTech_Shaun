'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Subscription } from '@/lib/supabase';

interface SubscriptionStatusProps {
  subscription: Subscription | null;
  userType: 'free' | 'member' | 'guest';
}

export default function SubscriptionStatus({ subscription, userType }: SubscriptionStatusProps) {
  const router = useRouter();

  // Free user display
  if (userType !== 'member' || !subscription) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            Free Plan
          </span>
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Current Features:</h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              5 resume uploads per month
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Basic career advice (5 tips)
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Single resume storage
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-800 mb-2">Unlock Premium Features:</h4>
          <ul className="space-y-1 text-sm text-blue-700 mb-3">
            <li>• Unlimited resume uploads</li>
            <li>• Multiple resume versions</li>
            <li>• Detailed career roadmap (10+ tips)</li>
            <li>• Priority support</li>
          </ul>
          <p className="text-xs text-blue-600">Starting at $19.99/month</p>
        </div>

        <button
          onClick={() => router.push('/pricing')}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Upgrade to Premium
        </button>
      </div>
    );
  }

  // Member display
  const planLabel = subscription.plan_type === 'premium_yearly' ? 'Premium Yearly' : 'Premium Monthly';
  const isActive = subscription.status === 'active';
  const isCancelled = subscription.status === 'cancelled';

  // Format dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            isActive
              ? 'bg-green-100 text-green-700'
              : isCancelled
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {subscription.status === 'active'
            ? 'Active'
            : subscription.status === 'cancelled'
            ? 'Cancelling'
            : 'Expired'}
        </span>
      </div>

      {/* Plan details */}
      <div className="mb-6 space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Plan</span>
          <span className="font-medium text-gray-900">{planLabel}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Billing Cycle</span>
          <span className="font-medium text-gray-900">
            {subscription.plan_type === 'premium_yearly' ? 'Yearly' : 'Monthly'}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">
            {isCancelled ? 'Access Until' : 'Next Billing Date'}
          </span>
          <span className="font-medium text-gray-900">
            {formatDate(subscription.current_period_end)}
          </span>
        </div>
        {subscription.plan_type === 'premium_monthly' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Price</span>
            <span className="font-medium text-gray-900">$19.99/month</span>
          </div>
        )}
        {subscription.plan_type === 'premium_yearly' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Price</span>
            <span className="font-medium text-gray-900">$199/year</span>
          </div>
        )}
      </div>

      {/* Cancellation warning */}
      {isCancelled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">Subscription Cancelled</p>
              <p className="text-sm text-yellow-700 mt-1">
                Your Premium access will continue until {formatDate(subscription.current_period_end)}.
                After that, you&apos;ll revert to the Free plan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Premium features list */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Your Premium Features:</h4>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Unlimited resume uploads
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Multiple resume version storage
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Detailed career roadmap (10+ tips)
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Priority support (24h response)
          </li>
        </ul>
      </div>

      {/* Manage subscription button */}
      <button
        onClick={() => router.push('/api/stripe/portal')}
        className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
      >
        Manage Subscription
      </button>
    </div>
  );
}
