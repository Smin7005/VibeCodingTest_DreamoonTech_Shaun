'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Handle checkout for premium plans
  const handleCheckout = async (planType: 'monthly' | 'yearly') => {
    if (!isSignedIn) {
      router.push('/sign-up');
      return;
    }

    setLoading(planType);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Resume AI Platform
            </Link>
            <div className="flex items-center gap-4">
              {isLoaded && !isSignedIn ? (
                <>
                  <Link
                    href="/sign-in"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <h3 className="text-2xl font-bold mb-4">Free</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">A$0</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">&#10003;</span>
                <span>5 resume uploads per month</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">&#10003;</span>
                <span>Basic career advice</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">&#10003;</span>
                <span>Single resume storage</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">&#10003;</span>
                <span>AI grammar checking</span>
              </li>
            </ul>
            <Link
              href="/sign-up"
              className="block w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-md text-center font-semibold hover:bg-gray-300 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Premium Monthly */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-600 relative">
            <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg rounded-tr-lg">
              Popular
            </div>
            <h3 className="text-2xl font-bold mb-4">Premium Monthly</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">A$20</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">&#10003;</span>
                <span>Unlimited resume uploads</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">&#10003;</span>
                <span>Detailed career roadmap</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">&#10003;</span>
                <span>Multiple resume versions</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">&#10003;</span>
                <span>Priority support (24h)</span>
              </li>
            </ul>
            <button
              onClick={() => handleCheckout('monthly')}
              disabled={loading === 'monthly'}
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-md text-center font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'monthly' ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>

          {/* Premium Yearly */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 relative">
            <div className="absolute top-0 right-0 bg-green-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg rounded-tr-lg">
              Save 17%
            </div>
            <h3 className="text-2xl font-bold mb-4">Premium Yearly</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">A$200</span>
              <span className="text-gray-600">/year</span>
            </div>
            <p className="text-sm text-green-600 mb-4">
              Save A$40 compared to monthly
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">&#10003;</span>
                <span>Unlimited resume uploads</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">&#10003;</span>
                <span>Detailed career roadmap</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">&#10003;</span>
                <span>Multiple resume versions</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">&#10003;</span>
                <span>Priority support (24h)</span>
              </li>
            </ul>
            <button
              onClick={() => handleCheckout('yearly')}
              disabled={loading === 'yearly'}
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-md text-center font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'yearly' ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. Your Premium access
                will continue until the end of your current billing period.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold mb-2">
                What happens after I cancel?
              </h3>
              <p className="text-gray-600">
                After your subscription ends, you will revert to the Free plan. Your
                uploaded resumes will remain accessible, but you will be limited to
                5 uploads per month.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="font-semibold mb-2">Can I switch plans?</h3>
              <p className="text-gray-600">
                Yes, you can switch between monthly and yearly plans at any time
                through your subscription management portal.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
