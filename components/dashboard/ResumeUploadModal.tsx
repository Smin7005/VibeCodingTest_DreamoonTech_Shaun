'use client';

import React, { useState, useRef, useCallback } from 'react';
import Button from '../ui/button';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  userType: 'free' | 'member';
  quotaRemaining?: number;
}

type UploadState = 'idle' | 'preview' | 'uploading' | 'analyzing' | 'complete' | 'error';

export default function ResumeUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  userType,
  quotaRemaining = 5,
}: ResumeUploadModalProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setState('idle');
    setFile(null);
    setError(null);
    setPreviewUrl(null);
    setUploadProgress(0);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  const validateFile = (selectedFile: File): string | null => {
    // Check file type
    if (selectedFile.type !== 'application/pdf') {
      return 'Only PDF files are accepted. Please convert your resume to PDF.';
    }
    // Check file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      return 'File size exceeds 10 MB. Please reduce file size.';
    }
    // Check min size (1KB)
    if (selectedFile.size < 1024) {
      return 'File appears to be empty or corrupted.';
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setState('preview');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    const validationError = validateFile(droppedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(droppedFile);
    setError(null);

    const url = URL.createObjectURL(droppedFile);
    setPreviewUrl(url);
    setState('preview');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setState('uploading');
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload resume using Stage 3 API endpoint
      setUploadProgress(30);
      const uploadResponse = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      // Parse response once
      const uploadResult = await uploadResponse.json();

      // Check for upload errors
      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Verify resume_id was returned
      if (!uploadResult.resume_id) {
        throw new Error('Upload failed - no resume ID returned');
      }

      setUploadProgress(60);

      // Analyze resume using Stage 3 API endpoint
      setState('analyzing');
      const analyzeResponse = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: uploadResult.resume_id }),
      });

      // Parse analysis response once
      const analyzeResult = await analyzeResponse.json();

      setUploadProgress(90);

      // Check for analysis errors
      if (!analyzeResponse.ok || !analyzeResult.success) {
        throw new Error(analyzeResult.error || 'Analysis failed');
      }

      setUploadProgress(100);
      setState('complete');

      // Wait a moment then close and refresh dashboard
      setTimeout(() => {
        handleClose();
        onUploadComplete();
      }, 1500);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setState('error');
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'idle':
        return (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-2">
              Drop your resume here or click to browse
            </p>
            <p className="text-sm text-gray-500">PDF only, max 10MB</p>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            {/* Preview */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-64"
                  title="Resume Preview"
                />
              )}
            </div>

            {/* File info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{file?.name}</p>
                <p className="text-sm text-gray-500">
                  {file && (file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => {
                  resetState();
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  resetState();
                }}
                className="flex-1"
              >
                Choose Different File
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                className="flex-1"
              >
                Upload & Analyze
              </Button>
            </div>
          </div>
        );

      case 'uploading':
      case 'analyzing':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div
                className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin"
                style={{ borderTopColor: 'transparent' }}
              ></div>
            </div>
            <p className="font-medium text-gray-900 mb-2">
              {state === 'uploading' ? 'Uploading resume...' : 'Analyzing with AI...'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {state === 'analyzing' && 'This may take up to 60 seconds'}
            </p>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{uploadProgress}%</p>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-gray-900 mb-2">Upload Complete!</p>
            <p className="text-sm text-gray-500">
              Your resume has been analyzed. Refreshing dashboard...
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-medium text-gray-900 mb-2">Upload Failed</p>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button type="button" onClick={resetState}>
              Try Again
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={state === 'idle' || state === 'preview' || state === 'error' ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upload Resume</h2>
              {userType === 'free' && (
                <p className="text-sm text-gray-500 mt-1">
                  {quotaRemaining} upload{quotaRemaining !== 1 ? 's' : ''} remaining this month
                </p>
              )}
            </div>
            {(state === 'idle' || state === 'preview' || state === 'error') && (
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {error && state === 'idle' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {renderContent()}
          </div>

          {/* Info for free users */}
          {userType === 'free' && state === 'idle' && (
            <div className="px-6 pb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Note:</span> New upload will replace your current resume.
                  Upgrade to Premium to keep multiple versions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
