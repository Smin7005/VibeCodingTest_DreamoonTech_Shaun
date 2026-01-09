'use client';

import React, { useState, useEffect } from 'react';
import Button from '../ui/button';
import Input from '../ui/input';
import Label from '../ui/label';

interface BasicInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    name: string;
    role: string;
    target_position: string;
    city: string;
  };
  onSave: (data: {
    name: string;
    role: string;
    target_position: string;
    city: string;
  }) => Promise<void>;
}

export default function BasicInfoModal({ isOpen, onClose, initialData, onSave }: BasicInfoModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    target_position: '',
    city: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData.name || '',
        role: initialData.role || '',
        target_position: initialData.target_position || '',
        city: initialData.city || '',
      });
      setErrors({});
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 2 || formData.name.length > 50) {
      newErrors.name = 'Name must be 2-50 characters';
    }
    if (!formData.role || formData.role.length < 2 || formData.role.length > 50) {
      newErrors.role = 'Role must be 2-50 characters';
    }
    if (!formData.target_position || formData.target_position.length < 2 || formData.target_position.length > 100) {
      newErrors.target_position = 'Target position must be 2-100 characters';
    }
    if (!formData.city || formData.city.length < 2 || formData.city.length > 50) {
      newErrors.city = 'City must be 2-50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit Basic Information</h2>
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
          <div className="px-6 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="John Doe"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Role */}
              <div>
                <Label htmlFor="role">Current Role *</Label>
                <Input
                  id="role"
                  type="text"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  placeholder="Software Engineer"
                  className={errors.role ? 'border-red-500' : ''}
                />
                {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role}</p>}
              </div>

              {/* Target Position */}
              <div>
                <Label htmlFor="target_position">Target Position *</Label>
                <Input
                  id="target_position"
                  type="text"
                  value={formData.target_position}
                  onChange={(e) => handleChange('target_position', e.target.value)}
                  placeholder="Senior Software Engineer"
                  className={errors.target_position ? 'border-red-500' : ''}
                />
                {errors.target_position && <p className="text-sm text-red-500 mt-1">{errors.target_position}</p>}
              </div>

              {/* City */}
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="San Francisco, CA"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} loading={saving} disabled={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
