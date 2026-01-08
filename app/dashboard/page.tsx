'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import DashboardTour from '@/components/onboarding/DashboardTour';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [showTour, setShowTour] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkTourStatus = async () => {
      try {
        // Fetch onboarding progress
        const response = await fetch('/api/onboarding/progress');
        if (response.ok) {
          const data = await response.json();

          // Check if user is 'free' and hasn't completed dashboard tour (step 5)
          if (data.user_type === 'free') {
            const tourStep = data.steps?.find((s: any) => s.step_name === 'dashboard-tour');

            // Show tour if step 5 exists but is not completed
            if (tourStep && !tourStep.completed) {
              setShowTour(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking tour status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkTourStatus();
  }, [isLoaded, user]);

  const handleTourComplete = async () => {
    try {
      // Mark dashboard tour (step 5) as completed
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_number: 5,
          step_name: 'dashboard-tour',
          completed: true,
        }),
      });

      setShowTour(false);
    } catch (error) {
      console.error('Error completing tour:', error);
      // Still hide the tour even if API fails
      setShowTour(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Tour Modal */}
      {showTour && <DashboardTour onComplete={handleTourComplete} />}

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-600">Dashboard</h1>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h2>
          <p className="text-gray-600 mb-4">
            This is a placeholder dashboard page. Stage 2 (Onboarding Flow) is complete!
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>Stage 3: Resume Management with Claude API</li>
              <li>Stage 4: Build Full Dashboard Components</li>
              <li>Stage 5: Stripe Integration</li>
              <li>Stage 6: UI/UX Polish</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
