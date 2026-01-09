'use client';

import React, { useState, useEffect } from 'react';
import { differenceInMonths } from 'date-fns';
import { WorkExperience } from '@/lib/supabase';
import Button from '../ui/button';
import Input from '../ui/input';
import Select from '../ui/select';
import Checkbox from '../ui/checkbox';

export interface WorkExperienceUpdate {
  id?: string;
  company_name: string;
  job_title: string;
  location?: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  isNew?: boolean;
}

interface EditWorkExperienceProps {
  isOpen: boolean;
  onClose: () => void;
  experiences: WorkExperience[];
  onSave: (updates: WorkExperienceUpdate[]) => Promise<void>;
}

// Same months array as WorkExperienceForm
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

// Same years array as WorkExperienceForm
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1969 }, (_, i) => ({
  value: currentYear - i,
  label: (currentYear - i).toString(),
}));

// Interface for editable experience with month/year split
interface EditableExperience {
  id: string;
  company_name: string;
  job_title: string;
  location: string;
  start_month: string;
  start_year: number;
  end_month: string;
  end_year: number | undefined;
  is_current: boolean;
  isNew?: boolean;
}

// Generate a temporary ID for new experiences
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface FieldErrors {
  company_name?: string;
  job_title?: string;
  start?: string;
  end?: string;
}

export default function EditWorkExperience({ isOpen, onClose, experiences, onSave }: EditWorkExperienceProps) {
  const [editedExperiences, setEditedExperiences] = useState<EditableExperience[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors[]>([]);

  // Convert database format to editable format
  useEffect(() => {
    if (isOpen) {
      const converted = experiences.map((exp) => {
        const startDate = exp.start_date ? new Date(exp.start_date) : new Date();
        const endDate = exp.end_date ? new Date(exp.end_date) : new Date();

        return {
          id: exp.id,
          company_name: exp.company_name,
          job_title: exp.job_title,
          location: exp.location || '',
          start_month: String(startDate.getMonth() + 1).padStart(2, '0'),
          start_year: startDate.getFullYear(),
          end_month: exp.is_current ? '' : String(endDate.getMonth() + 1).padStart(2, '0'),
          end_year: exp.is_current ? undefined : endDate.getFullYear(),
          is_current: exp.is_current,
          isNew: false,
        };
      });
      setEditedExperiences(converted);
      setErrors(converted.map(() => ({})));
      setError(null);
    }
  }, [experiences, isOpen]);

  // Add a new blank work experience
  const addNewExperience = () => {
    const newExp: EditableExperience = {
      id: generateTempId(),
      company_name: '',
      job_title: '',
      location: '',
      start_month: '',
      start_year: currentYear,
      end_month: '',
      end_year: undefined,
      is_current: false,
      isNew: true,
    };
    setEditedExperiences((prev) => [...prev, newExp]);
    setErrors((prev) => [...prev, {}]);
  };

  // Remove an experience
  const removeExperience = (index: number) => {
    setEditedExperiences((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  // Calculate duration (same logic as WorkExperienceForm)
  const calculateDuration = (exp: EditableExperience): string => {
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

  // Handle field changes
  const handleChange = (index: number, field: keyof EditableExperience, value: string | number | boolean) => {
    setEditedExperiences((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Clear end date if "currently work here" is checked
      if (field === 'is_current' && value === true) {
        updated[index].end_month = '';
        updated[index].end_year = undefined;
      }

      return updated;
    });

    // Clear errors when field changes
    setErrors((prev) => {
      const updated = [...prev];
      if (field === 'company_name') {
        updated[index] = { ...updated[index], company_name: undefined };
      } else if (field === 'job_title') {
        updated[index] = { ...updated[index], job_title: undefined };
      } else if (field.startsWith('start')) {
        updated[index] = { ...updated[index], start: undefined };
      } else if (field.startsWith('end')) {
        updated[index] = { ...updated[index], end: undefined };
      }
      return updated;
    });
  };

  // Validate experiences
  const validate = (): boolean => {
    const newErrors = editedExperiences.map((exp) => {
      const errs: FieldErrors = {};

      // Check required fields
      if (!exp.company_name.trim()) {
        errs.company_name = 'Company name is required';
      }
      if (!exp.job_title.trim()) {
        errs.job_title = 'Job title is required';
      }

      // Check start date
      if (!exp.start_month) {
        errs.start = 'Start month is required';
      } else {
        const startDate = new Date(exp.start_year, parseInt(exp.start_month) - 1, 1);
        if (startDate > new Date()) {
          errs.start = 'Start date cannot be in the future';
        }
      }

      // Check end date if not current
      if (!exp.is_current) {
        if (!exp.end_month || !exp.end_year) {
          errs.end = 'End date is required (or check "I currently work here")';
        } else if (exp.start_month) {
          const startDate = new Date(exp.start_year, parseInt(exp.start_month) - 1, 1);
          const endDate = new Date(exp.end_year, parseInt(exp.end_month) - 1, 1);
          if (endDate < startDate) {
            errs.end = 'End date must be after start date';
          }
          if (endDate > new Date()) {
            errs.end = 'End date cannot be in the future';
          }
        }
      }

      return errs;
    });

    setErrors(newErrors);
    return !newErrors.some((e) => e.company_name || e.job_title || e.start || e.end);
  };

  // Convert back to database format and save
  const handleSave = async () => {
    if (editedExperiences.length === 0) {
      setError('Please add at least one work experience.');
      return;
    }

    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      const updates: WorkExperienceUpdate[] = editedExperiences.map((exp) => ({
        id: exp.isNew ? undefined : exp.id,
        company_name: exp.company_name.trim(),
        job_title: exp.job_title.trim(),
        location: exp.location.trim() || undefined,
        start_date: new Date(exp.start_year, parseInt(exp.start_month) - 1, 1).toISOString(),
        end_date: exp.is_current
          ? null
          : exp.end_year && exp.end_month
          ? new Date(exp.end_year, parseInt(exp.end_month) - 1, 1).toISOString()
          : null,
        is_current: exp.is_current,
        isNew: exp.isNew,
      }));

      await onSave(updates);
      onClose();
    } catch (err) {
      console.error('Error saving:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit Work Experience</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <p className="text-sm text-gray-600 mb-6">
              Add or update your work experiences. This will help improve your career advice and resolve any discrepancies between your profile and resume.
            </p>

            <div className="space-y-6">
              {editedExperiences.map((exp, index) => (
                <div
                  key={exp.id}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  {/* Header with remove button */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">
                      {exp.isNew ? 'New Work Experience' : `Experience ${index + 1}`}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Remove experience"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Company and Job Title */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input
                      label="Company Name"
                      placeholder="Enter company name"
                      value={exp.company_name}
                      onChange={(e) => handleChange(index, 'company_name', e.target.value)}
                      error={errors[index]?.company_name}
                      required
                    />
                    <Input
                      label="Job Title"
                      placeholder="Enter job title"
                      value={exp.job_title}
                      onChange={(e) => handleChange(index, 'job_title', e.target.value)}
                      error={errors[index]?.job_title}
                      required
                    />
                  </div>

                  {/* Location */}
                  <div className="mb-4">
                    <Input
                      label="Location"
                      placeholder="Enter location (optional)"
                      value={exp.location}
                      onChange={(e) => handleChange(index, 'location', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date - Month & Year dropdowns */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          options={[{ value: '', label: 'Month' }, ...MONTHS]}
                          value={exp.start_month}
                          onChange={(e) => handleChange(index, 'start_month', e.target.value)}
                        />
                        <Select
                          options={YEARS}
                          value={exp.start_year}
                          onChange={(e) => handleChange(index, 'start_year', parseInt(e.target.value))}
                        />
                      </div>
                      {errors[index]?.start && (
                        <p className="mt-1 text-sm text-red-600">{errors[index].start}</p>
                      )}
                    </div>

                    {/* End Date - Month & Year dropdowns */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date {!exp.is_current && <span className="text-red-500">*</span>}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          options={[{ value: '', label: exp.is_current ? 'Present' : 'Month' }, ...MONTHS]}
                          value={exp.is_current ? '' : (exp.end_month || '')}
                          onChange={(e) => handleChange(index, 'end_month', e.target.value)}
                          disabled={exp.is_current}
                        />
                        <Select
                          options={[{ value: '', label: exp.is_current ? 'Present' : 'Year' }, ...YEARS]}
                          value={exp.is_current ? '' : (exp.end_year?.toString() || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleChange(index, 'end_year', val ? parseInt(val) : undefined);
                          }}
                          disabled={exp.is_current}
                        />
                      </div>
                      {errors[index]?.end && (
                        <p className="mt-1 text-sm text-red-600">{errors[index].end}</p>
                      )}
                    </div>
                  </div>

                  {/* Current job checkbox */}
                  <div className="mt-4">
                    <Checkbox
                      label="I currently work here"
                      checked={exp.is_current}
                      onChange={(e) => handleChange(index, 'is_current', e.target.checked)}
                    />
                  </div>

                  {/* Duration (auto-calculated) - same as WorkExperienceForm */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (auto-calculated)
                    </label>
                    <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {calculateDuration(exp) || 'Select dates to see duration'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Work Experience button */}
            <button
              type="button"
              onClick={addNewExperience}
              className="mt-6 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Work Experience
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              loading={saving}
              disabled={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
