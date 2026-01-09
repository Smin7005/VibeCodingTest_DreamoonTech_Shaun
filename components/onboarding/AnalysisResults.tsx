'use client';

import React, { useState, useEffect } from 'react';
import Button from '../ui/button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import Alert from '../ui/alert';

interface BasicInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface Experience {
  companyName: string;
  jobTitle: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  location: string | null;
}

interface DateDiscrepancy {
  companyName: string;
  field: 'startDate' | 'endDate';
  manualValue: string | null;
  extractedValue: string | null;
  message: string;
}

interface AnalysisData {
  id: string;
  basic_info: BasicInfo;
  skills: string[];
  experiences: Experience[];
  career_advice: string;
  improvement_suggestions: string;
  date_discrepancies: DateDiscrepancy[] | null;
}

interface AnalysisResultsProps {
  resumeId: string;
  onContinue: () => Promise<void>;
  onBack?: () => void;
}

export default function AnalysisResults({ resumeId, onContinue, onBack }: AnalysisResultsProps) {
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call the real analysis API
        const response = await fetch('/api/resume/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_id: resumeId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Analysis failed');
        }

        if (data.success && data.analysis) {
          setAnalysisData(data.analysis);
        } else {
          throw new Error('Invalid response from analysis API');
        }
      } catch (err) {
        console.error('Error fetching analysis:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to analyze resume';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (resumeId) {
      fetchAnalysis();
    }
  }, [resumeId, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

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

  // Format experience duration
  const formatDuration = (startDate: string | null, endDate: string | null, isCurrent: boolean): string => {
    if (!startDate) return '';

    const start = startDate;
    const end = isCurrent ? 'Present' : endDate || 'Present';

    return `${start} - ${end}`;
  };

  // Calculate duration in years/months
  const calculateDuration = (startDate: string | null, endDate: string | null): string => {
    if (!startDate) return '';

    const parseDate = (dateStr: string): Date | null => {
      const match = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
      if (match) {
        return new Date(parseInt(match[2]), parseInt(match[1]) - 1, 1);
      }
      return null;
    };

    const start = parseDate(startDate);
    const end = endDate && endDate.toLowerCase() !== 'present' ? parseDate(endDate) : new Date();

    if (!start || !end) return '';

    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0 && remainingMonths === 0) return 'Less than a month';
    if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <Card variant="bordered" className="max-w-4xl mx-auto">
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Analyzing your resume with AI...</p>
            <p className="mt-2 text-sm text-gray-500">This may take up to 60 seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !analysisData) {
    return (
      <Card variant="bordered" className="max-w-4xl mx-auto">
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Failed</h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">{error}</p>
            <div className="flex gap-4">
              {onBack && (
                <Button type="button" variant="ghost" onClick={onBack}>
                  Go Back
                </Button>
              )}
              <Button type="button" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
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
          We&apos;ve analyzed your resume and extracted key information. Review the results below.
        </p>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="error" className="mb-6" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Date Discrepancy Warnings */}
        {analysisData?.date_discrepancies && analysisData.date_discrepancies.length > 0 && (
          <div className="mb-8">
            <Alert variant="warning" className="mb-4">
              <strong>Date Discrepancies Detected</strong>
              <p className="text-sm mt-1">
                We found differences between your profile&apos;s work history dates and your resume. Please review and update if needed.
              </p>
            </Alert>
            <div className="space-y-2">
              {analysisData.date_discrepancies.map((discrepancy, index) => (
                <div
                  key={index}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm"
                >
                  <p className="text-yellow-800">{discrepancy.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">
                  {analysisData?.basic_info?.name || 'Not found'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">
                  {analysisData?.basic_info?.email || 'Not found'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">
                  {analysisData?.basic_info?.phone || 'Not found'}
                </p>
              </div>
              {analysisData?.basic_info?.address && (
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{analysisData.basic_info.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Extracted Skills ({analysisData?.skills?.length || 0})
          </h4>
          {analysisData?.skills && analysisData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysisData.skills.map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No skills extracted from resume.</p>
          )}
        </div>

        {/* Work Experience */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Work Experience ({analysisData?.experiences?.length || 0})
          </h4>
          {analysisData?.experiences && analysisData.experiences.length > 0 ? (
            <div className="space-y-4">
              {analysisData.experiences.map((exp: Experience, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-semibold text-gray-900">{exp.jobTitle}</h5>
                      <p className="text-gray-700">{exp.companyName}</p>
                      {exp.location && (
                        <p className="text-sm text-gray-500">{exp.location}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                      {calculateDuration(exp.startDate, exp.endDate)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDuration(exp.startDate, exp.endDate, exp.isCurrent)}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No work experience extracted from resume.</p>
          )}
        </div>

        {/* Career Advice Preview */}
        {analysisData?.career_advice && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Career Advice Preview</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 whitespace-pre-line">
                {analysisData.career_advice.split('\n\n').slice(0, 3).join('\n\n')}
              </p>
              {analysisData.career_advice.split('\n\n').length > 3 && (
                <p className="text-sm text-blue-600 mt-3 font-medium">
                  + {analysisData.career_advice.split('\n\n').length - 3} more tips available in your dashboard
                </p>
              )}
            </div>
          </div>
        )}

        {/* Improvement Suggestions Preview */}
        {analysisData?.improvement_suggestions && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Improvement Suggestions</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {analysisData.improvement_suggestions.substring(0, 500)}
                {analysisData.improvement_suggestions.length > 500 ? '...' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <Alert variant="success">
          <strong>Ready to continue!</strong> Your resume has been successfully uploaded and analyzed.
          Click below to proceed to your dashboard where you can view the full analysis.
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
