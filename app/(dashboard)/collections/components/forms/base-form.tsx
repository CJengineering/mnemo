'use client';

import React from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Save, Wand2, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Base interface that all forms extend
export interface BaseFormData {
  title: string;
  description?: string;
  slug: string;
  status?: 'published' | 'draft';
}

// Base schema that all forms extend
export const baseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['published', 'draft']).default('draft')
});

// Base form props that all specific forms will extend
export interface BaseFormProps<T extends BaseFormData> {
  initialData?: Partial<T>;
  onSubmit: (data: T) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

// Tab interface for the tabbed form layout
export interface TabConfig {
  id: string;
  label: string;
  content: React.ReactNode;
}

// Base form component that provides common functionality
export function BaseFormWrapper<T extends BaseFormData>({
  children,
  form,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
  onAIGenerate,
  onPreview,
  message
}: {
  children: React.ReactNode;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
  onAIGenerate?: () => void;
  onPreview?: () => void;
  message?: { type: 'success' | 'error' | 'info'; message: string } | null;
}) {
  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {isEditing ? 'Edit' : 'Create'} Item
        </h2>
        <div className="flex items-center space-x-2">
          {onAIGenerate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAIGenerate}
              className="flex items-center space-x-2"
            >
              <Wand2 className="h-4 w-4" />
              <span>AI Generate</span>
            </Button>
          )}
          {onPreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPreview}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <Alert
          className={
            message.type === 'success'
              ? 'border-green-500 bg-green-50'
              : message.type === 'error'
                ? 'border-red-500 bg-red-50'
                : 'border-blue-500 bg-blue-50'
          }
        >
          <AlertDescription
            className={
              message.type === 'success'
                ? 'text-green-700'
                : message.type === 'error'
                  ? 'text-red-700'
                  : 'text-blue-700'
            }
          >
            {message.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {children}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>
                {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// Base Form component with tabs support
export function BaseForm<T extends BaseFormData>({
  form,
  onSubmit,
  onCancel,
  isEditing = false,
  title,
  tabs,
  message,
  isLoading = false,
  onAIGenerate,
  onPreview
}: {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  title?: string;
  tabs: TabConfig[];
  message?: { type: 'success' | 'error' | 'info'; message: string } | null;
  isLoading?: boolean;
  onAIGenerate?: () => void;
  onPreview?: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {title || `${isEditing ? 'Edit' : 'Create'} Item`}
        </h2>
        <div className="flex items-center space-x-2">
          {onAIGenerate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAIGenerate}
              className="flex items-center space-x-2"
            >
              <Wand2 className="h-4 w-4" />
              <span>AI Generate</span>
            </Button>
          )}
          {onPreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPreview}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <Alert
          className={
            message.type === 'success'
              ? 'border-green-500 bg-green-50'
              : message.type === 'error'
                ? 'border-red-500 bg-red-50'
                : 'border-blue-500 bg-blue-50'
          }
        >
          <AlertDescription
            className={
              message.type === 'success'
                ? 'text-green-700'
                : message.type === 'error'
                  ? 'text-red-700'
                  : 'text-blue-700'
            }
          >
            {message.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue={tabs[0]?.id} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className="space-y-6 mt-6"
              >
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>
                {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// Utility function to generate slug from title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
};
