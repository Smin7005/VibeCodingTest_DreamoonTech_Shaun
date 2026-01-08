'use client';

import React, { useState, useEffect } from 'react';
import Button from '../ui/button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import Alert from '../ui/alert';

interface AnalysisResultsProps {
  resumeId: string;
  onContinue: () => Promise<void>;
  onBack?: () => void;
}

export default function AnalysisResults({ resumeId, onContinue, onBack }: AnalysisResultsProps) {
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    // Fetch resume and analysis data
    // NOTE: Full Claude API integration happens in Stage 3
    // For now, this is a placeholder with static/mock data
    const fetchAnalysis = async () => {
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Placeholder data (will be replaced in Stage 3)
        setAnalysisData({
          basicInfo: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1 (555) 123-4567',
          },
          skills: [
            'JavaScript',
            'TypeScript',
            'React',
            'Next.js',
            'Node.js',
            'Python',
            'SQL',
            'Git',
          ],
          workExperiences: [
            {
              company: 'Tech Corp',
              title: 'Senior Software Engineer',
              duration: '2 years 3 months',
              dates: 'Jan 2021 - Mar 2023',
            },
            {
              company: 'Startup Inc',
              title: 'Software Engineer',
              duration: '1 year 6 months',
              dates: 'Jul 2019 - Dec 2020',
            },
          ],
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError('Failed to load analysis results. Please try again.');
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [resumeId]);

  const handleContinue = async () => {
    setContinuing(true);
    setError(null);
    try {
      await onContinue();
    } catch (err) {
      console.error('Error continuing:', err);
      setError('Failed to proceed. Please try again.');
      setContinuing(false);
    }
  };

  if (loading) {
    return (
      <Card variant="bordered" className="max-w-4xl mx-auto">
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Analyzing your resume...</p>
            <p className="mt-2 text-sm text-gray-500">This may take a moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="bordered" className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Resume Analysis Complete</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          We've analyzed your resume and extracted key information. Review the results below.
        </p>
        <Alert variant="info" className="mt-4">
          <strong>Note:</strong> Full AI-powered analysis with career advice will be available in the
          dashboard after completing onboarding.
        </Alert>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="error" className="mb-6" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Basic Information */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{analysisData?.basicInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{analysisData?.basicInfo.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{analysisData?.basicInfo.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Extracted Skills</h4>
          <div className="flex flex-wrap gap-2">
            {analysisData?.skills.map((skill: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Work Experience */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h4>
          <div className="space-y-4">
            {analysisData?.workExperiences.map((exp: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-semibold text-gray-900">{exp.title}</h5>
                    <p className="text-gray-700">{exp.company}</p>
                  </div>
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                    {exp.duration}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{exp.dates}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <Alert variant="success">
          <strong>Ready to continue!</strong> Your resume has been successfully uploaded and analyzed.
          Click below to proceed to your dashboard.
        </Alert>
      </CardContent>

      <CardFooter className="justify-between">
        {onBack && (
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
        )}
        <Button type="button" onClick={handleContinue} loading={continuing} disabled={continuing}>
          Continue to Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
}
