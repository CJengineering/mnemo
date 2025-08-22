'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  WebflowTextField,
  WebflowTextareaField,
  WebflowSlugField,
  WebflowSelectField
} from './webflow-form-fields';
import { IncomingPublicationData } from '../interfaces-incoming';
import { generateSlug } from './base-form';
import './compact-form.css';

const publicationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft')
});

export type WebflowPublicationFormData = z.infer<typeof publicationSchema>;

interface WebflowPublicationFormProps {
  initialData?: Partial<IncomingPublicationData>;
  onSubmit: (data: IncomingPublicationData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isEditing?: boolean;
}

export interface WebflowPublicationFormRef {
  triggerSubmit: () => void;
  setStatus: (status: 'draft' | 'published') => void;
}

function toIncoming(data: WebflowPublicationFormData): IncomingPublicationData {
  return {
    title: data.title,
    description: data.description,
    slug: data.slug,
    status: data.status
  };
}

export const WebflowPublicationForm = forwardRef<
  WebflowPublicationFormRef,
  WebflowPublicationFormProps
>(({ initialData, onSubmit, onCancel, onDelete, isEditing = false }, ref) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WebflowPublicationFormData>({
    resolver: zodResolver(publicationSchema),
    defaultValues: {
      title: (initialData?.title as string) || '',
      description: (initialData?.description as string) || '',
      slug: (initialData?.slug as string) || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft'
    }
  });

  useEffect(() => {
    form.reset({
      title: (initialData?.title as string) || '',
      description: (initialData?.description as string) || '',
      slug: (initialData?.slug as string) || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft'
    });
  }, [initialData, form]);

  useImperativeHandle(ref, () => ({
    triggerSubmit: () => form.handleSubmit(handleSubmit)(),
    setStatus: (status: 'draft' | 'published') =>
      form.setValue('status', status)
  }));

  const handleGenerateSlug = () => {
    const currentTitle = form.getValues('title');
    if (currentTitle) form.setValue('slug', generateSlug(currentTitle));
  };

  const handleSubmit = async (data: WebflowPublicationFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(toIncoming(data));
    } catch (e) {
      console.error('Publication form submit error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' }
  ];

  return (
    <div className="h-full flex flex-col prevent-layout-shift">
      {/* Header actions */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 p-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {isEditing ? 'Edit' : 'Create'} Publication
          </h3>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            {onDelete && isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={onDelete}
                className="bg-red-800 border-red-600 text-red-300 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              type="button"
              onClick={() => {
                form.setValue('status', 'draft');
                form.handleSubmit(handleSubmit)();
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                form.setValue('status', 'published');
                form.handleSubmit(handleSubmit)();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="h-full flex flex-col"
        >
          <div className="flex-1 overflow-y-scroll px-1 stable-scroll-container">
            <div className="space-y-8 pb-8">
              {/* Basic Details */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">
                  Basic details
                </h2>
                <WebflowTextField
                  control={form.control}
                  name="title"
                  label="Title"
                  required
                  placeholder="Enter publication title"
                />
                <WebflowTextareaField
                  control={form.control}
                  name="description"
                  label="Description"
                  rows={3}
                />

                <WebflowSlugField
                  control={form.control}
                  name="slug"
                  label="Slug"
                  required
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateSlug}
                    disabled={!form.watch('title')}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                  >
                    Generate Slug from Title
                  </Button>
                  {form.watch('title') && !form.watch('slug') && (
                    <span className="text-xs text-yellow-400">
                      💡 Enter a title to generate slug
                    </span>
                  )}
                  {form.watch('title') && form.watch('slug') && (
                    <span className="text-xs text-green-400">
                      ✅ Slug ready
                    </span>
                  )}
                </div>

                <WebflowSelectField
                  control={form.control}
                  name="status"
                  label="Status"
                  options={statusOptions}
                  required
                />
              </div>
            </div>
          </div>

          {/* Hidden Submit Button */}
          <button type="submit" className="hidden" disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : isEditing
                ? 'Update Publication'
                : 'Create Publication'}
          </button>
        </form>
      </Form>
    </div>
  );
});

WebflowPublicationForm.displayName = 'WebflowPublicationForm';
