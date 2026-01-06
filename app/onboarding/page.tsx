import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome! 🎉
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your account has been created successfully!
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">
              Coming Soon: Onboarding Flow
            </h2>
            <p className="text-blue-800 mb-4">
              The full onboarding experience will be implemented in Stage 2, which includes:
            </p>
            <ul className="text-left text-blue-700 space-y-2 list-disc list-inside">
              <li>Multi-step onboarding forms</li>
              <li>Work experience collection</li>
              <li>Resume upload functionality</li>
              <li>AI-powered resume analysis</li>
            </ul>
          </div>
          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
