'use client';

import React, { useState } from 'react';
import Input from '../ui/input';
import Button from '../ui/button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import Alert from '../ui/alert';

interface BasicInfoData {
  name: string;
  role: string;
  target_position: string;
  city: string;
}

interface BasicInfoFormProps {
  initialData?: Partial<BasicInfoData>;
  onSubmit: (data: BasicInfoData) => Promise<void>;
  onBack?: () => void;
}

export default function BasicInfoForm({ initialData, onSubmit, onBack }: BasicInfoFormProps) {
  const [formData, setFormData] = useState<BasicInfoData>({
    name: initialData?.name || '',
    role: initialData?.role || '',
    target_position: initialData?.target_position || '',
    city: initialData?.city || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfoData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateField = (name: keyof BasicInfoData, value: string): string | null => {
    switch (name) {
      case 'name':
        if (value.length < 2 || value.length > 50) {
          return 'Name must be 2-50 characters';
        }
        break;
      case 'role':
        if (value.length < 2 || value.length > 50) {
          return 'Role must be 2-50 characters';
        }
        break;
      case 'target_position':
        if (value.length < 2 || value.length > 100) {
          return 'Target position must be 2-100 characters';
        }
        break;
      case 'city':
        if (value.length < 2 || value.length > 50) {
          return 'City must be 2-50 characters';
        }
        break;
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof BasicInfoData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name as keyof BasicInfoData, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validateAll = (): boolean => {
    const newErrors: Partial<Record<keyof BasicInfoData, string>> = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof BasicInfoData>).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting basic info:', error);
      setSubmitError('Failed to save information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="bordered" className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Tell us about yourself and your career goals.
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent>
          {submitError && (
            <Alert variant="error" className="mb-6" onDismiss={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              required
              placeholder="John Doe"
            />

            <Input
              label="Current Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.role}
              required
              placeholder="Software Engineer"
            />

            <Input
              label="Target Position"
              name="target_position"
              value={formData.target_position}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.target_position}
              required
              placeholder="Senior Software Engineer"
            />

            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.city}
              required
              placeholder="San Francisco"
            />
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
