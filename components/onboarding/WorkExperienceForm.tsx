'use client';

import React, { useState } from 'react';
import { differenceInMonths } from 'date-fns';
import Input from '../ui/input';
import Select from '../ui/select';
import Checkbox from '../ui/checkbox';
import Button from '../ui/button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import Alert from '../ui/alert';

export interface WorkExperience {
  company_name: string;
  job_title: string;
  start_month: string;
  start_year: number;
  end_month?: string;
  end_year?: number;
  is_current: boolean;
  description?: string;
}

interface WorkExperienceFormProps {
  initialExperiences?: WorkExperience[];
  onSubmit: (experiences: WorkExperience[]) => Promise<void>;
  onBack?: () => void;
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1969 }, (_, i) => ({
  value: currentYear - i,
  label: (currentYear - i).toString(),
}));

const emptyExperience: WorkExperience = {
  company_name: '',
  job_title: '',
  start_month: '01',
  start_year: currentYear,
  end_month: '01',
  end_year: currentYear,
  is_current: false,
  description: '',
};

export default function WorkExperienceForm({ initialExperiences, onSubmit, onBack }: WorkExperienceFormProps) {
  const [experiences, setExperiences] = useState<WorkExperience[]>(
    initialExperiences && initialExperiences.length > 0 ? initialExperiences : [{ ...emptyExperience }]
  );
  const [errors, setErrors] = useState<Array<Partial<Record<keyof WorkExperience, string>>>>([{}]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const calculateDuration = (exp: WorkExperience): string => {
    if (!exp.start_month || !exp.start_year) return '';

    const startDate = new Date(exp.start_year, parseInt(exp.start_month) - 1, 1);
    const endDate = exp.is_current
      ? new Date()
      : exp.end_month && exp.end_year
      ? new Date(exp.end_year, parseInt(exp.end_month) - 1, 1)
      : null;

    if (!endDate) return '';

    const months = differenceInMonths(endDate, startDate);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (months < 0) return 'Invalid dates';

    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  };

  const validateExperience = (exp: WorkExperience, index: number): Partial<Record<keyof WorkExperience, string>> => {
    const errors: Partial<Record<keyof WorkExperience, string>> = {};

    if (exp.company_name.length < 2 || exp.company_name.length > 100) {
      errors.company_name = 'Company name must be 2-100 characters';
    }
    if (exp.job_title.length < 2 || exp.job_title.length > 100) {
      errors.job_title = 'Job title must be 2-100 characters';
    }
    if (!exp.start_month) {
      errors.start_month = 'Start month is required';
    }
    if (!exp.start_year) {
      errors.start_year = 'Start year is required';
    }

    // Check for future start date
    const startDate = new Date(exp.start_year, parseInt(exp.start_month || '0') - 1, 1);
    if (startDate > new Date()) {
      errors.start_month = 'Start date cannot be in the future';
    }

    if (!exp.is_current) {
      if (!exp.end_month) {
        errors.end_month = 'End month is required (or check "Present")';
      }
      if (!exp.end_year) {
        errors.end_year = 'End year is required (or check "Present")';
      }

      // Check end date is after start date
      if (exp.end_month && exp.end_year) {
        const endDate = new Date(exp.end_year, parseInt(exp.end_month) - 1, 1);
        if (endDate < startDate) {
          errors.end_month = 'End date must be after or equal to start date';
        }
        if (endDate > new Date()) {
          errors.end_month = 'End date cannot be in the future';
        }
      }
    }

    if (exp.description && exp.description.length > 500) {
      errors.description = 'Description must be max 500 characters';
    }

    return errors;
  };

  const handleExperienceChange = (index: number, field: keyof WorkExperience, value: any) => {
    const newExperiences = [...experiences];
    newExperiences[index] = { ...newExperiences[index], [field]: value };

    // Clear end date if "Present" is checked
    if (field === 'is_current' && value === true) {
      newExperiences[index].end_month = '';
      newExperiences[index].end_year = undefined;
    }

    setExperiences(newExperiences);

    // Clear error when user changes field
    const newErrors = [...errors];
    if (newErrors[index]?.[field]) {
      delete newErrors[index][field];
      setErrors(newErrors);
    }
  };

  const addExperience = () => {
    setExperiences([...experiences, { ...emptyExperience }]);
    setErrors([...errors, {}]);
  };

  const removeExperience = (index: number) => {
    if (experiences.length === 1) return; // Keep at least one
    setExperiences(experiences.filter((_, i) => i !== index));
    setErrors(errors.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate all experiences
    const newErrors = experiences.map((exp, index) => validateExperience(exp, index));
    setErrors(newErrors);

    const hasErrors = newErrors.some(err => Object.keys(err).length > 0);
    if (hasErrors) {
      setSubmitError('Please fix the errors before continuing');
      return;
    }

    if (experiences.length === 0) {
      setSubmitError('At least one work experience is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(experiences);
    } catch (error) {
      console.error('Error submitting work experiences:', error);
      setSubmitError('Failed to save work experiences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="bordered" className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Work Experience</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Add your work experience. At least one entry is required.
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent>
          {submitError && (
            <Alert variant="error" className="mb-6" onDismiss={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}

          <div className="space-y-6">
            {experiences.map((exp, index) => (
              <div key={index} className="border-2 border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-900">Experience {index + 1}</h4>
                  {experiences.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    value={exp.company_name}
                    onChange={(e) => handleExperienceChange(index, 'company_name', e.target.value)}
                    error={errors[index]?.company_name}
                    required
                    placeholder="Google"
                  />

                  <Input
                    label="Job Title"
                    value={exp.job_title}
                    onChange={(e) => handleExperienceChange(index, 'job_title', e.target.value)}
                    error={errors[index]?.job_title}
                    required
                    placeholder="Software Engineer"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        options={MONTHS}
                        value={exp.start_month}
                        onChange={(e) => handleExperienceChange(index, 'start_month', e.target.value)}
                        error={errors[index]?.start_month}
                        required
                      />
                      <Select
                        options={YEARS}
                        value={exp.start_year}
                        onChange={(e) => handleExperienceChange(index, 'start_year', parseInt(e.target.value))}
                        error={errors[index]?.start_year}
                        required
                      />
                    </div>
                    {errors[index]?.start_month && (
                      <p className="mt-1 text-sm text-red-600">{errors[index].start_month}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date {!exp.is_current && <span className="text-red-500">*</span>}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        options={MONTHS}
                        value={exp.end_month || ''}
                        onChange={(e) => handleExperienceChange(index, 'end_month', e.target.value)}
                        error={errors[index]?.end_month}
                        disabled={exp.is_current}
                        required={!exp.is_current}
                      />
                      <Select
                        options={YEARS}
                        value={exp.end_year || ''}
                        onChange={(e) => handleExperienceChange(index, 'end_year', parseInt(e.target.value))}
                        error={errors[index]?.end_year}
                        disabled={exp.is_current}
                        required={!exp.is_current}
                      />
                    </div>
                    {errors[index]?.end_month && (
                      <p className="mt-1 text-sm text-red-600">{errors[index].end_month}</p>
                    )}
                    <div className="mt-2">
                      <Checkbox
                        label="I currently work here"
                        checked={exp.is_current}
                        onChange={(e) => handleExperienceChange(index, 'is_current', e.target.checked)}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (auto-calculated)
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700">
                      {calculateDuration(exp) || 'Select dates to see duration'}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={exp.description || ''}
                      onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                      className={`
                        w-full px-3 py-2 border rounded-lg shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors[index]?.description ? 'border-red-500' : 'border-gray-300'}
                      `}
                      rows={3}
                      maxLength={500}
                      placeholder="Brief description of responsibilities and achievements"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {exp.description?.length || 0}/500 characters
                    </p>
                    {errors[index]?.description && (
                      <p className="mt-1 text-sm text-red-600">{errors[index].description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addExperience} className="w-full">
              + Add Another Experience
            </Button>
          </div>
        </CardContent>

        <CardFooter className="justify-between">
          {onBack && (
            <Button type="button" variant="ghost" onClick={onBack}>
              Back
            </Button>
          )}
          <Button type="submit" loading={loading} disabled={loading}>
            Continue
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
