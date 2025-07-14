'use client';

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Save, X, Wand2, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CompactStatusView } from './compact-status-view';
import { BaseFormData } from './base-form';
import './compact-form.css';

export interface CompactFormWrapperProps<T extends BaseFormData> {
  children: React.ReactNode;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
  onAIGenerate?: () => void;
  onPreview?: () => void;
  message?: { type: 'success' | 'error' | 'info'; message: string } | null;
  itemId?: string;
}

export function CompactFormWrapper<T extends BaseFormData>({
  children,
  form,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
  onAIGenerate,
  onPreview,
  message,
  itemId
}: CompactFormWrapperProps<T>) {
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data);
      setIsFormVisible(false); // Close form after successful submit
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleEdit = () => {
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    onCancel();
  };

  // Get current form values for status view
  const currentValues = form.getValues();

  // If form is not visible, show compact status view
  if (!isFormVisible && isEditing) {
    return (
      <CompactStatusView
        title={currentValues.title}
        slug={currentValues.slug}
        status={currentValues.status || 'draft'}
        itemId={itemId}
        publishDate={(currentValues as any).publishDate}
        onEdit={handleEdit}
        onPreview={onPreview}
      />
    );
  }

  return (
    <div className="compact-form w-full space-y-2" style={{ fontSize: '8px' }}>
      {/* Compact Header */}
      <div className="flex items-center justify-between py-1 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-800">
          {isEditing ? 'Edit' : 'Create'} Item
        </h2>
        <div className="flex items-center gap-1">
          {onAIGenerate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAIGenerate}
              className="h-6 px-2 text-[8px]"
            >
              <Wand2 className="h-2 w-2 mr-1" />
              AI
            </Button>
          )}
          {onPreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPreview}
              className="h-6 px-2 text-[8px]"
            >
              <Eye className="h-2 w-2 mr-1" />
              Preview
            </Button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <Alert className="py-1 px-2">
          <AlertDescription className="text-[8px]">
            {message.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Form Content - Single Scrollable Container */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
          <div
            className="compact-form-container max-h-[70vh] overflow-y-auto pr-2 space-y-3"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e0 #f7fafc'
            }}
          >
            {children}
          </div>

          {/* Compact Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 bg-white sticky bottom-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="h-6 px-3 text-[8px]"
            >
              <X className="h-2 w-2 mr-1" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-6 px-3 text-[8px]"
            >
              <Save className="h-2 w-2 mr-1" />
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
