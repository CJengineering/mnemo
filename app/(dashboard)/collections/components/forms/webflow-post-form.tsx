'use client';

import React, { useState, useEffect } from 'react';
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
import { IncomingPostData } from '../interfaces-incoming';
import { generateSlug } from './base-form';

// Webflow CMS Post Schema
const webflowPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft'),
  description: z.string().optional(),
  arabicTitle: z.string().optional(),
  datePublished: z.string(),
  location: z.string().optional(),
  locationArabic: z.string().optional(),
  seoTitle: z.string().min(1, 'SEO Title is required'),
  seoTitleArabic: z.string().optional(),
  seoMeta: z.string().min(1, 'SEO Meta is required'),
  seoMetaArabic: z.string().optional(),
  bodyEnglish: z.string().optional(),
  bodyArabic: z.string().optional(),
  bulletPointsEnglish: z.string().optional(),
  bulletPointsArabic: z.string().optional(),
  thumbnail: z.object({
    url: z.string().min(1, 'Thumbnail is required'),
    alt: z.string().optional()
  }),
  mainImage: z.object({
    url: z.string().min(1, 'Main image is required'),
    alt: z.string().optional()
  }),
  openGraphImage: z.object({
    url: z.string().min(1, 'Open Graph image is required'),
    alt: z.string().optional()
  }),
  heroVideoYoutubeId: z.string().optional(),
  heroVideoArabicYoutubeId: z.string().optional(),
  imageGalleryCredits: z.string().optional(),
  imageGalleryCreditsArabic: z.string().optional(),
  tags: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string()
      })
    )
    .default([]),
  featured: z.boolean().default(false),
  pushToGR: z.boolean().default(false)
});

type WebflowPostFormData = z.infer<typeof webflowPostSchema>;

interface WebflowPostFormProps {
  initialData?: Partial<IncomingPostData>;
  onSubmit: (data: IncomingPostData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function WebflowPostForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false
}: WebflowPostFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WebflowPostFormData>({
    resolver: zodResolver(webflowPostSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      description: initialData?.description || '',
      arabicTitle: initialData?.arabicTitle || '',
      datePublished:
        initialData?.datePublished || new Date().toISOString().split('T')[0],
      location: initialData?.location || '',
      locationArabic: initialData?.locationArabic || '',
      seoTitle: initialData?.seoTitle || '',
      seoTitleArabic: initialData?.seoTitleArabic || '',
      seoMeta: initialData?.seoMeta || '',
      seoMetaArabic: initialData?.seoMetaArabic || '',
      bodyEnglish: initialData?.bodyEnglish || '',
      bodyArabic: initialData?.bodyArabic || '',
      bulletPointsEnglish: initialData?.bulletPointsEnglish || '',
      bulletPointsArabic: initialData?.bulletPointsArabic || '',
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      mainImage: initialData?.mainImage || { url: '', alt: '' },
      openGraphImage: initialData?.openGraphImage || { url: '', alt: '' },
      heroVideoYoutubeId: initialData?.heroVideoYoutubeId || '',
      heroVideoArabicYoutubeId: initialData?.heroVideoArabicYoutubeId || '',
      imageGalleryCredits: initialData?.imageGalleryCredits || '',
      imageGalleryCreditsArabic: initialData?.imageGalleryCreditsArabic || '',
      tags: initialData?.tags || [],
      featured: initialData?.featured || false,
      pushToGR: initialData?.pushToGR || false
    }
  });

  // Reset form when initialData changes (when switching between items)
  useEffect(() => {
    const newValues = {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      description: initialData?.description || '',
      arabicTitle: initialData?.arabicTitle || '',
      datePublished:
        initialData?.datePublished || new Date().toISOString().split('T')[0],
      location: initialData?.location || '',
      locationArabic: initialData?.locationArabic || '',
      seoTitle: initialData?.seoTitle || '',
      seoTitleArabic: initialData?.seoTitleArabic || '',
      seoMeta: initialData?.seoMeta || '',
      seoMetaArabic: initialData?.seoMetaArabic || '',
      bodyEnglish: initialData?.bodyEnglish || '',
      bodyArabic: initialData?.bodyArabic || '',
      bulletPointsEnglish: initialData?.bulletPointsEnglish || '',
      bulletPointsArabic: initialData?.bulletPointsArabic || '',
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      mainImage: initialData?.mainImage || { url: '', alt: '' },
      openGraphImage: initialData?.openGraphImage || { url: '', alt: '' },
      heroVideoYoutubeId: initialData?.heroVideoYoutubeId || '',
      heroVideoArabicYoutubeId: initialData?.heroVideoArabicYoutubeId || '',
      imageGalleryCredits: initialData?.imageGalleryCredits || '',
      imageGalleryCreditsArabic: initialData?.imageGalleryCreditsArabic || '',
      tags: initialData?.tags || [],
      featured: initialData?.featured || false,
      pushToGR: initialData?.pushToGR || false
    };

    form.reset(newValues);
  }, [initialData, form]);

  // Auto-generate slug from title
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'title' && value.title && !form.getValues('slug')) {
        const timer = setTimeout(() => {
          if (value.title) {
            form.setValue('slug', generateSlug(value.title));
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    });
    return subscription.unsubscribe;
  }, [form]);

  const handleSubmit = async (data: WebflowPostFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data as IncomingPostData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
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
          className="h-[79vh] flex flex-col overflow-y-auto"
        >
          <div className="flex-1 px-1">
            <div className="space-y-8 pb-8">
              {/* Basic Info Section */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">Basic info</h2>

                <div className="space-y-6">
                  <WebflowTextField
                    control={form.control}
                    name="title"
                    label="Name"
                    placeholder="Enter post title"
                    required
                  />

                  <WebflowSlugField
                    control={form.control}
                    name="slug"
                    label="Slug"
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowSelectField
                      control={form.control}
                      name="status"
                      label="Status"
                      options={statusOptions}
                      required
                    />

                    <WebflowDateField
                      control={form.control}
                      name="datePublished"
                      label="Publish Date"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowTextField
                      control={form.control}
                      name="arabicTitle"
                      label="Arabic Title"
                      placeholder="العنوان بالعربية"
                    />

                    <WebflowTextField
                      control={form.control}
                      name="location"
                      label="Location"
                      placeholder="Enter location"
                    />
                  </div>
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
                    placeholder="Enter post description..."
                    minHeight="150px"
                    helperText="Rich text description for the post"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowRichTextField
                      control={form.control}
                      name="bodyEnglish"
                      label="Body (English)"
                      placeholder="Post content in English..."
                      minHeight="300px"
                      helperText="Main post content in English with rich formatting"
                    />

                    <WebflowRichTextField
                      control={form.control}
                      name="bodyArabic"
                      label="Body (Arabic)"
                      placeholder="محتوى المقال بالعربية..."
                      minHeight="300px"
                      helperText="Main post content in Arabic with rich formatting"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowRichTextField
                      control={form.control}
                      name="bulletPointsEnglish"
                      label="Bullet Points (English)"
                      placeholder="• Point 1&#10;• Point 2&#10;• Point 3"
                      minHeight="150px"
                      helperText="Key points in English"
                    />

                    <WebflowRichTextField
                      control={form.control}
                      name="bulletPointsArabic"
                      label="Bullet Points (Arabic)"
                      placeholder="• النقطة الأولى&#10;• النقطة الثانية&#10;• النقطة الثالثة"
                      minHeight="150px"
                      helperText="Key points in Arabic"
                    />
                  </div>

                  {/* SEO Fields */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">SEO</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="seoTitle"
                        label="SEO Title"
                        placeholder="Enter SEO title"
                        required
                      />

                      <WebflowTextField
                        control={form.control}
                        name="seoTitleArabic"
                        label="SEO Title (Arabic)"
                        placeholder="عنوان SEO بالعربية"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextareaField
                        control={form.control}
                        name="seoMeta"
                        label="SEO Meta Description"
                        placeholder="Enter meta description"
                        rows={3}
                        required
                      />

                      <WebflowTextareaField
                        control={form.control}
                        name="seoMetaArabic"
                        label="SEO Meta (Arabic)"
                        placeholder="وصف الميتا بالعربية"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">Images</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <WebflowImageField
                        control={form.control}
                        name="thumbnail"
                        label="Thumbnail"
                        required
                        helperText="Small image for post listings (recommended: 400x300px)"
                      />

                      <WebflowImageField
                        control={form.control}
                        name="mainImage"
                        label="Main Image"
                        required
                        helperText="Primary post image (recommended: 1200x800px)"
                      />

                      <WebflowImageField
                        control={form.control}
                        name="openGraphImage"
                        label="Open Graph Image"
                        required
                        helperText="Social sharing image (recommended: 1200x630px)"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="imageGalleryCredits"
                        label="Image Gallery Credits"
                        placeholder="Photo credits"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="imageGalleryCreditsArabic"
                        label="Image Credits (Arabic)"
                        placeholder="مصدر الصور"
                      />
                    </div>
                  </div>

                  {/* Video */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">Video</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="heroVideoYoutubeId"
                        label="Hero Video (YouTube ID)"
                        placeholder="dQw4w9WgXcQ"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="heroVideoArabicYoutubeId"
                        label="Hero Video Arabic (YouTube ID)"
                        placeholder="dQw4w9WgXcQ"
                      />
                    </div>
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
                      label="Featured Post"
                      description="Display this post prominently"
                    />

                    <WebflowSwitchField
                      control={form.control}
                      name="pushToGR"
                      label="Push to Global Repository"
                      description="Include in global content distribution"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Submit Button - The form is submitted via the header buttons */}
          <button type="submit" className="hidden" disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : isEditing
                ? 'Update Post'
                : 'Create Post'}
          </button>
        </form>
      </Form>
    </div>
  );
}
