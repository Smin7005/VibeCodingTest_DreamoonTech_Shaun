import { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dashboard | ResumeAI',
  description: 'Manage your resume, view career advice, and track your profile completion.',
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect('/sign-in?redirect=/dashboard');
  }

  return <>{children}</>;
}
