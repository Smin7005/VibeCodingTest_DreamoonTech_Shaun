'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import DashboardTour from '@/components/onboarding/DashboardTour';
import {
  WelcomeHeader,
  ProfileCompletion,
  OnboardingGuide,
  BasicInformation,
  ResumeInformation,
  CareerAdvice,
  UploadQuotaIndicator,
  ResumeVersionSelector,
  SubscriptionStatus,
  Statistics,
  EditWorkExperience,
  BasicInfoModal,
  ResumeUploadModal,
} from '@/components/dashboard';
import { WorkExperienceUpdate } from '@/components/dashboard/EditWorkExperience';
import { UserProfile, Resume, ResumeAnalysis, WorkExperience, Subscription } from '@/lib/supabase';
import { ProfileCompletionData, QuotaData } from '@/lib/dashboard';

interface OnboardingStep {
  step_number: number;
  step_name: string;
  completed: boolean;
}

interface DashboardData {
  userProfile: UserProfile;
  currentResume: Resume | null;
  currentAnalysis: ResumeAnalysis | null;
  workExperiences: WorkExperience[];
  subscription: Subscription | null;
  allResumes: Resume[];
  profileCompletion: ProfileCompletionData;
  onboardingSteps: OnboardingStep[];
  quota: QuotaData | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [showTour, setShowTour] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBasicInfoModal, setShowBasicInfoModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/dashboard/data');

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
        setSelectedResumeId(result.data.currentResume?.id || null);

        // Check if we should show the tour
        if (result.data.userProfile.user_type === 'free') {
          const tourStep = result.data.onboardingSteps?.find(
            (s: OnboardingStep) => s.step_name === 'dashboard-tour' || s.step_name === 'dashboard_tour'
          );
          if (tourStep && !tourStep.completed) {
            setShowTour(true);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchDashboardData();
  }, [isLoaded, user, fetchDashboardData]);

  // Handle tour completion
  const handleTourComplete = async () => {
    try {
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
    } catch (err) {
      console.error('Error completing tour:', err);
      setShowTour(false);
    }
  };

  // Handle resume version selection (members only)
  const handleResumeSelect = async (resumeId: string) => {
    try {
      await fetch('/api/dashboard/resume', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setCurrent', resumeId }),
      });
      setSelectedResumeId(resumeId);
      fetchDashboardData();
    } catch (err) {
      console.error('Error selecting resume:', err);
    }
  };

  // Handle resume deletion (members only)
  const handleResumeDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume version?')) return;

    try {
      const response = await fetch(`/api/dashboard/resume?resumeId=${resumeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
    }
  };

  // Handle resume rename (members only)
  const handleResumeRename = async (resumeId: string, newLabel: string) => {
    try {
      await fetch('/api/dashboard/resume', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', resumeId, label: newLabel }),
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Error renaming resume:', err);
    }
  };

  // Handle work experience save
  const handleSaveWorkExperience = async (updates: WorkExperienceUpdate[]) => {
    const response = await fetch('/api/dashboard/work-experience', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      throw new Error('Failed to save changes');
    }

    fetchDashboardData();
  };

  // Handle basic info save
  const handleSaveBasicInfo = async (data: {
    name: string;
    role: string;
    target_position: string;
    city: string;
  }) => {
    const response = await fetch('/api/dashboard/basic-info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to save');
    }

    fetchDashboardData();
  };

  // Handle upload complete
  const handleUploadComplete = () => {
    fetchDashboardData();
  };

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Auth check
  if (!user) {
    router.push('/sign-in');
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const userType = dashboardData?.userProfile.user_type || 'free';
  const userName = dashboardData?.userProfile.name || user.firstName || 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Tour Modal */}
      {showTour && <DashboardTour onComplete={handleTourComplete} />}

      {/* Edit Work Experience Modal */}
      {dashboardData && (
        <EditWorkExperience
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          experiences={dashboardData.workExperiences}
          onSave={handleSaveWorkExperience}
        />
      )}

      {/* Basic Info Modal */}
      {dashboardData && (
        <BasicInfoModal
          isOpen={showBasicInfoModal}
          onClose={() => setShowBasicInfoModal(false)}
          initialData={{
            name: dashboardData.userProfile.name || '',
            role: dashboardData.userProfile.role || '',
            target_position: dashboardData.userProfile.target_position || '',
            city: dashboardData.userProfile.city || '',
          }}
          onSave={handleSaveBasicInfo}
        />
      )}

      {/* Resume Upload Modal */}
      {dashboardData && (
        <ResumeUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
          userType={userType as 'free' | 'member'}
          quotaRemaining={dashboardData.quota?.remaining}
        />
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <a href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                ResumeAI
              </a>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              {userType === 'free' && (
                <a
                  href="/pricing"
                  className="hidden sm:block px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  Upgrade to Premium
                </a>
              )}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dashboardData && (
          <div className="space-y-6">
            {/* Welcome Header */}
            <WelcomeHeader
              userName={userName}
              profileCompletion={dashboardData.profileCompletion.percentage}
            />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Onboarding Guide (if not all complete) */}
                {dashboardData.onboardingSteps.length > 0 && (
                  <OnboardingGuide
                    steps={dashboardData.onboardingSteps}
                    userType={userType as 'free' | 'member' | 'guest'}
                  />
                )}

                {/* Basic Information - displays user profile info and work experience with update buttons */}
                <BasicInformation
                  userProfile={dashboardData.userProfile}
                  workExperiences={dashboardData.workExperiences}
                  onUpdate={() => setShowBasicInfoModal(true)}
                  onEditExperience={() => setShowEditModal(true)}
                />

                {/* Resume Information */}
                <ResumeInformation
                  analysis={dashboardData.currentAnalysis}
                  onEditExperience={() => setShowEditModal(true)}
                />

                {/* Career Advice */}
                <CareerAdvice
                  analysis={dashboardData.currentAnalysis}
                  userType={userType as 'free' | 'member' | 'guest'}
                  onEditWorkExperience={() => setShowEditModal(true)}
                />
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Profile Completion */}
                <ProfileCompletion
                  data={dashboardData.profileCompletion}
                  userType={userType as 'free' | 'member' | 'guest'}
                  onEditBasicInfo={() => setShowBasicInfoModal(true)}
                  onUploadResume={() => setShowUploadModal(true)}
                />

                {/* Resume Version Selector (Members only) */}
                {userType === 'member' && dashboardData.allResumes.length > 1 && (
                  <ResumeVersionSelector
                    resumes={dashboardData.allResumes}
                    currentResumeId={selectedResumeId}
                    onSelect={handleResumeSelect}
                    onDelete={handleResumeDelete}
                    onRename={handleResumeRename}
                    userType={userType as 'free' | 'member' | 'guest'}
                  />
                )}

                {/* Upload Quota Indicator (Free users) */}
                {userType === 'free' && dashboardData.quota && (
                  <UploadQuotaIndicator
                    used={dashboardData.quota.used}
                    limit={dashboardData.quota.limit}
                    userType="free"
                    onUpload={() => setShowUploadModal(true)}
                  />
                )}

                {/* Upload button for members */}
                {userType === 'member' && (
                  <UploadQuotaIndicator
                    used={0}
                    limit={0}
                    userType="member"
                    onUpload={() => setShowUploadModal(true)}
                  />
                )}

                {/* Statistics */}
                <Statistics
                  analysis={dashboardData.currentAnalysis}
                  resumeCount={dashboardData.allResumes.length}
                  userType={userType as 'free' | 'member' | 'guest'}
                />

                {/* Subscription Status */}
                <SubscriptionStatus
                  subscription={dashboardData.subscription}
                  userType={userType as 'free' | 'member' | 'guest'}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} ResumeAI. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                Terms of Service
              </a>
              <a href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy Policy
              </a>
              <a href="/pricing" className="text-sm text-gray-500 hover:text-gray-700">
                Pricing
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
