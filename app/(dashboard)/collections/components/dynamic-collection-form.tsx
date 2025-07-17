'use client';

import React, { useState } from 'react';
import { CollectionFormRouter, CollectionType } from './forms';
import { IncomingCollectionItemData } from './interfaces-incoming';
import { Calendar, Globe, BookOpen, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types
export interface Collection {
  id: string;
  name: string;
}

export interface APICollectionItem {
  id?: string;
  title: string;
  type: CollectionType;
  slug: string;
  status: 'published' | 'draft';
  data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

const getIconForType = (type: CollectionType) => {
  switch (type) {
    case 'event':
      return Calendar;
    case 'programme':
      return BookOpen;
    case 'news':
    case 'post':
    case 'source':
    default:
      return Globe;
  }
};

interface DynamicCollectionFormProps {
  collection: Collection;
  item?: APICollectionItem | null;
  onSubmit: (
    data: Partial<APICollectionItem>
  ) => Promise<APICollectionItem | void>;
  onCancel: () => void;
  onBackToCollections?: () => void;
  isEditing?: boolean;
}

const DynamicCollectionForm: React.FC<DynamicCollectionFormProps> = ({
  collection,
  item,
  onSubmit,
  onCancel,
  onBackToCollections,
  isEditing = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [pendingStatus, setPendingStatus] = useState<
    'published' | 'draft' | null
  >(null);
  const IconComponent = getIconForType(collection.id as CollectionType);

  // Convert API item data to form data
  const getInitialFormData = (): Partial<IncomingCollectionItemData> => {
    if (!item?.data) {
      return {};
    }

    // The API returns data in a nested structure where the actual form fields
    // are inside the 'data' property. We need to flatten this and add top-level fields
    const formData = {
      // Top-level API fields
      title: item.title,
      slug: item.slug,
      status: item.status,
      // Spread all the nested data fields
      ...item.data
    };

    return formData;
  };

  const handleFormSubmit = async (formData: IncomingCollectionItemData) => {
    console.log('🚀 Form submission started');
    setIsLoading(true);
    setSubmissionStatus({ type: null, message: '' });

    // Debug: Log the form data being processed
    console.log('📝 Form Data Received:', JSON.stringify(formData, null, 2));

    try {
      // Use pending status if set, otherwise use form data status
      const finalStatus = pendingStatus || formData.status || 'draft';
      console.log('📌 Final status:', finalStatus);

      // Transform form data to API format
      const apiData: Partial<APICollectionItem> = {
        title: formData.title,
        slug: formData.slug,
        status: finalStatus,
        type: collection.id as CollectionType,
        data: {
          ...formData, // Include all form data
          title: formData.title, // Ensure title is in data object
          slug: formData.slug // Ensure slug is in data object
        }
      };

      if (item?.id) {
        apiData.id = item.id;
      }

      console.log('🔄 Transformed API Data:', JSON.stringify(apiData, null, 2));

      console.log('📡 Calling onSubmit and waiting for response...');
      await onSubmit(apiData);
      console.log('✅ API call completed successfully!');

      // Show success message only after API confirms success
      const statusText =
        finalStatus === 'published' ? 'published' : 'saved as draft';
      const actionText = isEditing ? 'updated' : 'created';
      const successMessage = `✅ Successfully ${actionText} and ${statusText}!`;

      console.log('🎉 Setting success message:', successMessage);
      setSubmissionStatus({
        type: 'success',
        message: successMessage
      });

      // Clear pending status
      setPendingStatus(null);

      // Redirect after 1.5 seconds to allow user to see success message
      console.log('⏰ Starting redirect timer...');
      setIsRedirecting(true);
      setTimeout(() => {
        console.log('🔄 Executing redirect...');
        if (onBackToCollections) {
          console.log('📍 Using onBackToCollections callback');
          onBackToCollections(); // Navigate back to items view with fresh data
        } else {
          console.log('📍 Using onCancel fallback');
          onCancel(); // Fallback
        }
        setIsRedirecting(false);
        console.log('✅ Redirect completed');
      }, 1500);
    } catch (error) {
      console.error('❌ Form submission error:', error);
      setSubmissionStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to save. Please try again.'
      });
      setPendingStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishNow = () => {
    setPendingStatus('published');
    // Update form status field for visual feedback
    if (formRef.current?.setStatus) {
      formRef.current.setStatus('published');
    }
    // Trigger form submission through the ref
    if (formRef.current) {
      formRef.current.triggerSubmit();
    }
  };

  const handleSaveDraft = () => {
    setPendingStatus('draft');
    // Update form status field for visual feedback
    if (formRef.current?.setStatus) {
      formRef.current.setStatus('draft');
    }
    // Trigger form submission through the ref
    if (formRef.current) {
      formRef.current.triggerSubmit();
    }
  };

  // Create a ref to communicate with the form
  const formRef = React.useRef<any>(null);

  return (
    <div className="h-full flex flex-col bg-gray-900 overflow-hidden relative">
      {/* Toast-style Success/Error Notification - Fixed position, more prominent */}
      {submissionStatus.type && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-2 text-sm font-medium transform transition-all duration-300 ${
              submissionStatus.type === 'success'
                ? 'bg-green-800 text-green-100 border-green-600 shadow-green-900/20'
                : 'bg-red-800 text-red-100 border-red-600 shadow-red-900/20'
            }`}
          >
            {submissionStatus.type === 'success' ? (
              <Check className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="flex-1">{submissionStatus.message}</span>
          </div>
        </div>
      )}

      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-700 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left side - Back button + Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={onBackToCollections || onCancel}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-1 rounded"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm">Back</span>
            </button>

            <div className="flex items-center space-x-3 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0">
                <IconComponent className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold capitalize text-white truncate">
                  {isEditing ? 'Edit' : 'Create'} {collection.name.slice(0, -1)}
                </h1>
              </div>
            </div>

            {submissionStatus.type && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm flex-shrink-0 min-w-0 ${
                  submissionStatus.type === 'success'
                    ? 'bg-green-900/80 text-green-200 border border-green-500/50'
                    : 'bg-red-900/80 text-red-200 border border-red-500/50'
                }`}
              >
                {submissionStatus.type === 'success' ? (
                  <Check className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="truncate">{submissionStatus.message}</span>
              </div>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              type="button"
              onClick={handleSaveDraft}
              disabled={isLoading || isRedirecting}
              className={`text-white text-sm px-3 py-1.5 h-auto transition-all ${
                isLoading
                  ? 'bg-blue-600 hover:bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isLoading && pendingStatus === 'draft'
                ? '✅ Saving Draft...'
                : isRedirecting
                  ? '🔄 Redirecting...'
                  : 'Save Draft'}
            </Button>
            <Button
              type="button"
              onClick={handlePublishNow}
              disabled={isLoading || isRedirecting}
              className={`text-white text-sm px-3 py-1.5 h-auto transition-all ${
                isLoading
                  ? 'bg-green-600 hover:bg-green-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading && pendingStatus === 'published'
                ? '✅ Publishing...'
                : isLoading
                  ? '✅ Saving...'
                  : isRedirecting
                    ? '🔄 Redirecting...'
                    : isEditing
                      ? 'Update'
                      : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Form Content Only */}
      <div className="flex-1 overflow-y-auto bg-gray-900">
        <div className="px-6 py-6">
          <CollectionFormRouter
            ref={formRef}
            type={collection.id as CollectionType}
            initialData={getInitialFormData()}
            onSubmit={handleFormSubmit}
            onCancel={onCancel}
            isEditing={isEditing}
          />
        </div>
      </div>
    </div>
  );
};

export default DynamicCollectionForm;
