'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Resume } from '@/lib/supabase';

interface ResumeVersionSelectorProps {
  resumes: Resume[];
  currentResumeId: string | null;
  onSelect: (resumeId: string) => void;
  onDelete?: (resumeId: string) => void;
  onRename?: (resumeId: string, newLabel: string) => void;
  userType: 'free' | 'member' | 'guest';
}

export default function ResumeVersionSelector({
  resumes,
  currentResumeId,
  onSelect,
  onDelete,
  onRename,
  userType,
}: ResumeVersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setMenuOpenId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Free users only see single resume, no selector needed
  if (userType !== 'member' || resumes.length <= 1) {
    return null;
  }

  const currentResume = resumes.find((r) => r.id === currentResumeId) || resumes[0];

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get display label for resume
  const getResumeLabel = (resume: Resume) => {
    return resume.version_label || `Resume (${formatDate(resume.uploaded_at)})`;
  };

  const handleRename = (resumeId: string) => {
    if (onRename && editLabel.trim()) {
      onRename(resumeId, editLabel.trim());
    }
    setEditingId(null);
    setEditLabel('');
  };

  const startEditing = (resume: Resume) => {
    setEditingId(resume.id);
    setEditLabel(resume.version_label || '');
    setMenuOpenId(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Versions</h3>

      {/* Version dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-left">
              <p className="font-medium text-gray-900 text-sm">
                {getResumeLabel(currentResume)}
              </p>
              <p className="text-xs text-gray-500">
                {currentResume.is_current && 'Current'} • {currentResume.file_name}
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className={`relative flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${
                  resume.id === currentResumeId ? 'bg-blue-50' : ''
                }`}
              >
                {editingId === resume.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Enter label..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(resume.id);
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditLabel('');
                        }
                      }}
                    />
                    <button
                      onClick={() => handleRename(resume.id)}
                      className="p-1 text-green-600 hover:text-green-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditLabel('');
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onSelect(resume.id);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left"
                    >
                      <p className="font-medium text-gray-900 text-sm">
                        {getResumeLabel(resume)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(resume.uploaded_at)} • {resume.file_name}
                      </p>
                    </button>

                    {/* Action menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === resume.id ? null : resume.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      {menuOpenId === resume.id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                          {onRename && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(resume);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Rename
                            </button>
                          )}
                          {onDelete && resumes.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(resume.id);
                                setMenuOpenId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Version count */}
      <p className="text-sm text-gray-500 mt-3">
        {resumes.length} resume version{resumes.length !== 1 ? 's' : ''} stored
      </p>
    </div>
  );
}
