'use client';

import React, { useState } from 'react';
import { CollectionFormRouter, CollectionType } from './forms';
import { IncomingCollectionItemData } from './interfaces-incoming';
import {
  Calendar,
  Globe,
  BookOpen,
  Check,
  AlertCircle,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SaveConfirmation } from '@/components/ui/save-confirmation';
import { toast } from 'react-hot-toast';

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
    case 'people':
      return Users;
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
  onSubmit: (data: Partial<APICollectionItem>) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  onBackToCollections?: () => void;
  isEditing?: boolean;
}

const DynamicCollectionForm: React.FC<DynamicCollectionFormProps> = ({
  collection,
  item,
  onSubmit,
  onCancel,
  onDelete,
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
  const isTeam = (collection.id as CollectionType) === 'team';

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
    setIsLoading(true);
    setSubmissionStatus({ type: null, message: '' });

    // Debug: Log the form data being processed
    console.log('📝 Form Data Received:', JSON.stringify(formData, null, 2));

    try {
      // Use pending status if set, otherwise use form data status
      const finalStatus = pendingStatus || formData.status || 'draft';

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

      console.log('✅ Form submission successful!');
      await onSubmit(apiData);
      console.log('📊 Context data updated, preparing redirect...');

      // Show success message with better feedback
      const statusText =
        finalStatus === 'published' ? 'published' : 'saved as draft';
      const actionText = isEditing ? 'updated' : 'created';

      if (isTeam) {
        // For Team flow, do not redirect. Let the inner Team form handle toasts.
        setSubmissionStatus({
          type: 'success',
          message: `Successfully ${actionText} and ${statusText}!`
        });
        // Clear pending status
        setPendingStatus(null);
      } else {
        setSubmissionStatus({
          type: 'success',
          message: `Successfully ${actionText} and ${statusText}! Redirecting to list...`
        });

        // Clear pending status
        setPendingStatus(null);

        // Redirect after 1.5 seconds to give user time to see success message and allow data to refresh
        setIsRedirecting(true);
        setTimeout(() => {
          console.log('🔄 Redirecting back to items view...');
          if (onBackToCollections) {
            onBackToCollections(); // Navigate back to items view with fresh data
          } else {
            onCancel(); // Fallback
          }
          setIsRedirecting(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Form submission error:', error);
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
      setIsRedirecting(false);
    }
  };

  // New unified save handler triggered from SaveConfirmation
  const handleUnifiedSave = async (
    status: 'draft' | 'published'
  ): Promise<{ slug?: string; error?: string } | void> => {
    try {
      if (formRef.current?.setStatus) {
        formRef.current.setStatus(status);
      }
      setPendingStatus(status);
      if (formRef.current) {
        await formRef.current.triggerSubmit();
      }
      return { slug: formRef.current?.getValues?.().slug };
    } catch (e: any) {
      return { error: e?.message || 'Failed' };
    } finally {
      setPendingStatus(null);
    }
  };

  // Create a ref to communicate with the form
  const formRef = React.useRef<any>(null);

  return (
    <div className="h-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-700 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left side - Back button + Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {!isTeam && (
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
            )}

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

            {submissionStatus.type && !isTeam && (
              <div
                className={`hidden sm:flex items-center gap-2 px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                  submissionStatus.type === 'success'
                    ? 'bg-green-900/60 text-green-300 border border-green-500/30'
                    : 'bg-red-900/60 text-red-300 border border-red-500/30'
                }`}
              >
                {submissionStatus.type === 'success' ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                <span>{submissionStatus.message}</span>
              </div>
            )}
          </div>

          {/* Right side - Action buttons */}
          {!isTeam && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                type="button"
                onClick={onCancel}
                disabled={isLoading || isRedirecting}
                className="bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <SaveConfirmation
                onAction={handleUnifiedSave}
                disabled={isLoading || isRedirecting}
                isSubmitting={isLoading}
                itemLabel={collection.name.slice(0, -1)}
              />
            </div>
          )}
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
            onDelete={onDelete}
            isEditing={isEditing}
          />
        </div>
      </div>
    </div>
  );
};

export default DynamicCollectionForm;
