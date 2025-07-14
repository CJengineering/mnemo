'use client';

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, ExternalLink, Check, AlertCircle } from 'lucide-react';

interface BaseFormData {
  title: string;
  slug: string;
  status?: 'published' | 'draft';
  [key: string]: any;
}

export interface SubmissionResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface WebflowFormWrapperProps<T extends BaseFormData> {
  children: React.ReactNode;
  form: UseFormReturn<T>;
  onSubmit: (
    data: T,
    status: 'published' | 'draft'
  ) => Promise<SubmissionResult>;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
  collectionName?: string;
}

export function WebflowFormWrapper<T extends BaseFormData>({
  children,
  form,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
  collectionName = 'Item'
}: WebflowFormWrapperProps<T>) {
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: T, status: 'published' | 'draft') => {
    setIsSubmitting(true);
    setSubmissionStatus({ type: null, message: '' });

    try {
      const dataWithStatus = { ...data, status };
      const result = await onSubmit(dataWithStatus, status);

      if (result.success) {
        setSubmissionStatus({
          type: 'success',
          message:
            result.message ||
            `${collectionName} ${status === 'published' ? 'published' : 'saved as draft'} successfully!`
        });

        // Redirect after 2 seconds
        setTimeout(() => {
          onCancel(); // This will close the modal and return to the list
        }, 2000);
      } else {
        setSubmissionStatus({
          type: 'error',
          message: result.message || 'Failed to save. Please try again.'
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmissionStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formData = form.watch();
  const currentTitle = formData?.title || '';
  const currentSlug = formData?.slug || '';
  const baseUrl = 'https://communityjamel.org';

  return (
    <div className="space-y-6">
      {/* Fixed Action Bar */}
      <div className="sticky top-0 w-10 z-10 bg-blue-100 border-b border-gray-700 p-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium text-white">
              {isEditing ? 'Edit' : 'Create'} {collectionName}
            </h3>
            {submissionStatus.type && (
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  submissionStatus.type === 'success'
                    ? 'bg-green-900/60 text-green-300 border border-green-500/30'
                    : 'bg-red-900/60 text-red-300 border border-red-500/30'
                }`}
              >
                {submissionStatus.type === 'success' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {submissionStatus.message}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                form.handleSubmit((data) => handleSubmit(data, 'draft'))()
              }
              disabled={isSubmitting}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              type="button"
              onClick={() =>
                form.handleSubmit((data) => handleSubmit(data, 'published'))()
              }
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting
                ? 'Publishing...'
                : isEditing
                  ? 'Update & Publish'
                  : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-8">
          {/* Basic Info Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-white">Basic info</h2>

            <div className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white flex items-center gap-1">
                  Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...form.register('title' as any)}
                  placeholder={`Enter ${collectionName.toLowerCase()} name`}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Slug Field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white flex items-center gap-1">
                  Slug
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...form.register('slug' as any)}
                  placeholder="url-slug"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
                {currentSlug && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Link className="h-3 w-3" />
                    <span>
                      {baseUrl}/{currentSlug}
                    </span>
                    <ExternalLink className="h-3 w-3 cursor-pointer hover:text-gray-300" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-white">Custom fields</h2>
            <div className="space-y-6">{children}</div>
          </div>
        </form>
      </Form>
    </div>
  );
}
