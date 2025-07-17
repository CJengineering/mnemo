'use client';

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  WebflowTextField,
  WebflowSlugField,
  WebflowTextareaField,
  WebflowSelectField,
  WebflowSwitchField,
  WebflowDateField,
  WebflowImageField,
  WebflowTagsField,
  WebflowRichTextField
} from './webflow-form-fields';
import { IncomingNewsData } from '../interfaces-incoming';
import { generateSlug } from './base-form';

// Webflow CMS News Schema
const webflowNewsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft'),
  description: z.string().optional(),
  arabicTitle: z.string().optional(),
  summary: z.string().optional(),
  summaryArabic: z.string().optional(),
  excerpt: z.string().optional(),
  externalLink: z.string().url().optional().or(z.literal('')),
  datePublished: z.string(),
  thumbnail: z
    .object({
      url: z.string().optional(),
      alt: z.string().optional()
    })
    .optional(),
  heroImage: z
    .object({
      url: z.string().optional(),
      alt: z.string().optional()
    })
    .optional(),
  tags: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string()
      })
    )
    .default([]),
  featured: z.boolean().default(false),
  pushToGR: z.boolean().default(false),
  removeFromNewsGrid: z.boolean().default(false)
});

type WebflowNewsFormData = z.infer<typeof webflowNewsSchema>;

interface WebflowNewsFormProps {
  initialData?: Partial<IncomingNewsData>;
  onSubmit: (data: IncomingNewsData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export interface WebflowNewsFormRef {
  triggerSubmit: () => void;
  setStatus: (status: 'draft' | 'published') => void;
}

export const WebflowNewsForm = forwardRef<
  WebflowNewsFormRef,
  WebflowNewsFormProps
>(({ initialData, onSubmit, onCancel, isEditing = false }, ref) => {
  const form = useForm<WebflowNewsFormData>({
    resolver: zodResolver(webflowNewsSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      description: initialData?.description || '',
      arabicTitle: initialData?.arabicTitle || '',
      summary: initialData?.summary || '',
      summaryArabic: initialData?.summaryArabic || '',
      excerpt: initialData?.excerpt || '',
      externalLink: initialData?.externalLink || '',
      datePublished:
        initialData?.datePublished || new Date().toISOString().split('T')[0],
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      tags: initialData?.tags || [],
      featured: initialData?.featured || false,
      pushToGR: initialData?.pushToGR || false,
      removeFromNewsGrid: initialData?.removeFromNewsGrid || false
    }
  });

  // Expose submit function via ref
  useImperativeHandle(ref, () => ({
    triggerSubmit: () => {
      form.handleSubmit(handleSubmit)();
    },
    setStatus: (status: 'draft' | 'published') => {
      form.setValue('status', status);
    }
  }));

  // Reset form when initialData changes (when switching between items)
  useEffect(() => {
    const newValues = {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      description: initialData?.description || '',
      arabicTitle: initialData?.arabicTitle || '',
      summary: initialData?.summary || '',
      summaryArabic: initialData?.summaryArabic || '',
      excerpt: initialData?.excerpt || '',
      externalLink: initialData?.externalLink || '',
      datePublished:
        initialData?.datePublished || new Date().toISOString().split('T')[0],
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      tags: initialData?.tags || [],
      featured: initialData?.featured || false,
      pushToGR: initialData?.pushToGR || false,
      removeFromNewsGrid: initialData?.removeFromNewsGrid || false
    };

    form.reset(newValues);
  }, [initialData, form]);

  // Track if user manually edited slug
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isUpdatingSlugProgrammatically, setIsUpdatingSlugProgrammatically] =
    useState(false);

  // Manual slug generation function
  const handleGenerateSlug = () => {
    const currentTitle = form.getValues('title');
    if (currentTitle) {
      const newSlug = generateSlug(currentTitle);
      console.log('🎯 Manual slug generation:', {
        input: currentTitle,
        output: newSlug
      });
      form.setValue('slug', newSlug);
      setSlugManuallyEdited(true);
    }
  };

  // Remove automatic slug generation - using manual generation instead

  const handleSubmit = async (data: WebflowNewsFormData) => {
    console.log('📋 News Form Raw Data:', JSON.stringify(data, null, 2));

    try {
      await onSubmit(data as IncomingNewsData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' }
  ];

  return (
    <div className="h-full flex flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="h-full flex flex-col"
        >
          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-8 pb-8">
              {/* Basic Info Section */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">Basic info</h2>

                <div className="space-y-6">
                  <WebflowTextField
                    control={form.control}
                    name="title"
                    label="Name"
                    placeholder="Enter news article title"
                    required
                  />

                  {/* Enhanced Slug Field with Generate Button */}
                  <div className="space-y-3">
                    <WebflowSlugField
                      control={form.control}
                      name="slug"
                      label="Slug"
                      required
                    />

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateSlug}
                        className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                        disabled={!form.watch('title')}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Generate Slug from Title
                      </Button>

                      {form.watch('title') && !form.watch('slug') && (
                        <span className="text-xs text-yellow-400">
                          💡 Click "Generate Slug" to create URL-friendly slug
                        </span>
                      )}

                      {form.watch('slug') && (
                        <span className="text-xs text-green-400">
                          ✅ Slug ready
                        </span>
                      )}
                    </div>
                  </div>

                  <WebflowSelectField
                    control={form.control}
                    name="status"
                    label="Status"
                    options={statusOptions}
                    required
                  />

                  <WebflowTextField
                    control={form.control}
                    name="externalLink"
                    label="External Link"
                    placeholder="https://example.com/news-article"
                    type="url"
                  />

                  <WebflowDateField
                    control={form.control}
                    name="datePublished"
                    label="Publish Date"
                  />
                </div>
              </div>

              {/* Custom Fields Section */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">
                  Custom fields
                </h2>

                <div className="space-y-6">
                  {/* Content Fields */}
                  <WebflowRichTextField
                    control={form.control}
                    name="description"
                    label="Description"
                    placeholder="Enter news article description..."
                    minHeight="200px"
                    helperText="Rich text editor with formatting options"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowTextField
                      control={form.control}
                      name="arabicTitle"
                      label="Arabic Title"
                      placeholder="العنوان بالعربية"
                    />

                    <WebflowRichTextField
                      control={form.control}
                      name="excerpt"
                      label="Excerpt"
                      placeholder="Brief excerpt..."
                      minHeight="120px"
                      helperText="Short excerpt for previews"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowRichTextField
                      control={form.control}
                      name="summary"
                      label="Summary (English)"
                      placeholder="Summary in English..."
                      minHeight="150px"
                      helperText="Detailed summary in English"
                    />

                    <WebflowRichTextField
                      control={form.control}
                      name="summaryArabic"
                      label="Summary (Arabic)"
                      placeholder="الملخص بالعربية..."
                      minHeight="150px"
                      helperText="Detailed summary in Arabic"
                    />
                  </div>

                  {/* Images */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowImageField
                      control={form.control}
                      name="thumbnail"
                      label="Thumbnail"
                      helperText="Small image for news listings (recommended: 400x300px)"
                    />

                    <WebflowImageField
                      control={form.control}
                      name="heroImage"
                      label="Hero Image"
                      helperText="Large banner image for news article (recommended: 1200x600px)"
                    />
                  </div>

                  {/* Tags */}
                  <WebflowTagsField
                    control={form.control}
                    name="tags"
                    label="Tags"
                  />

                  {/* Settings */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Settings
                    </h3>

                    <WebflowSwitchField
                      control={form.control}
                      name="featured"
                      label="Featured Article"
                      description="Display this article prominently"
                    />

                    <WebflowSwitchField
                      control={form.control}
                      name="pushToGR"
                      label="Push to Global Repository"
                      description="Include in global content distribution"
                    />

                    <WebflowSwitchField
                      control={form.control}
                      name="removeFromNewsGrid"
                      label="Remove from News Grid"
                      description="Hide from main news grid display"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Submit Button - The form is submitted via the header buttons */}
          <button type="submit" className="hidden">
            {isEditing ? 'Update News' : 'Create News'}
          </button>
        </form>
      </Form>
    </div>
  );
});
