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
import { Trash2 } from 'lucide-react';
import {
  WebflowTextField,
  WebflowSlugField,
  WebflowTextareaField,
  WebflowSelectField,
  WebflowSwitchField,
  WebflowDateField,
  WebflowImageField,
  WebflowTagsField,
  WebflowRichTextField,
  WebflowReferenceSelectField // added
} from './webflow-form-fields';
import { IncomingNewsData } from '../interfaces-incoming';
import { generateSlug } from './base-form';
import './compact-form.css';

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
  // Relations now store only slugs
  sources: z.string().optional(), // single reference slug
  programmeLabel: z.string().optional(), // single reference slug
  relatedProgrammes: z.array(z.string()).default([]),
  people: z.array(z.string()).default([]),
  relatedCjTeamMembers: z.array(z.string()).default([]),
  innovations: z.array(z.string()).default([]),
  relatedEvent: z.string().optional(),
  relatedEvents: z.array(z.string()).default([]),
  // Images
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
  imageAltTextEnglish: z.string().optional(),
  imageAltTextArabic: z.string().optional(),
  // Tags (multi reference slugs)
  tags: z.array(z.string()).default([]),
  // Settings
  featured: z.boolean().default(false),
  pushToGR: z.boolean().default(false),
  removeFromNewsGrid: z.boolean().default(false)
});

type WebflowNewsFormData = z.infer<typeof webflowNewsSchema>;

interface WebflowNewsFormProps {
  initialData?: Partial<IncomingNewsData>;
  onSubmit: (data: IncomingNewsData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isEditing?: boolean;
}

export interface WebflowNewsFormRef {
  triggerSubmit: () => void;
  setStatus: (status: 'draft' | 'published') => void;
}

export const WebflowNewsForm = forwardRef<
  WebflowNewsFormRef,
  WebflowNewsFormProps
>(({ initialData, onSubmit, onCancel, onDelete, isEditing = false }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
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
      // Map incoming reference objects -> slugs
      sources: (initialData?.sources as any)?.slug || undefined,
      programmeLabel: (initialData?.programmeLabel as any)?.slug || undefined,
      relatedProgrammes: Array.isArray(initialData?.relatedProgrammes)
        ? (initialData?.relatedProgrammes as any[]).map((r) => r.slug)
        : [],
      people: Array.isArray(initialData?.people)
        ? (initialData?.people as any[]).map((r) => r.slug)
        : [],
      relatedCjTeamMembers: Array.isArray(initialData?.relatedCjTeamMembers)
        ? (initialData?.relatedCjTeamMembers as any[]).map((r) => r.slug)
        : [],
      innovations: Array.isArray(initialData?.innovations)
        ? (initialData?.innovations as any[]).map((r) => r.slug)
        : [],
      relatedEvent: (initialData?.relatedEvent as any)?.slug || undefined,
      relatedEvents: Array.isArray(initialData?.relatedEvents)
        ? (initialData?.relatedEvents as any[]).map((r) => r.slug)
        : [],
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      imageAltTextEnglish: initialData?.imageAltTextEnglish || '',
      imageAltTextArabic: initialData?.imageAltTextArabic || '',
      tags: Array.isArray(initialData?.tags)
        ? (initialData?.tags as any[]).map((r) => r.slug)
        : [],
      featured: initialData?.featured || false,
      pushToGR: initialData?.pushToGR || false,
      removeFromNewsGrid: initialData?.removeFromNewsGrid || false
    }
  });

  // Mock data for dropdown options
  const sourcesOptions = [
    { value: 'source-1', label: 'MIT Technology Review' },
    { value: 'source-2', label: 'Nature Journal' },
    { value: 'source-3', label: 'Reuters' },
    { value: 'source-4', label: 'BBC News' },
    { value: 'source-5', label: 'Al Jazeera' }
  ];

  const programmeLabelOptions = [
    { value: 'prog-1', label: 'Water Security' },
    { value: 'prog-2', label: 'Climate Change' },
    { value: 'prog-3', label: 'Education' },
    { value: 'prog-4', label: 'Healthcare' },
    { value: 'prog-5', label: 'Innovation' },
    { value: 'prog-6', label: 'Poverty Alleviation' }
  ];

  const relatedEventOptions = [
    { value: 'event-1', label: 'Annual Climate Summit 2024' },
    { value: 'event-2', label: 'Water Innovation Conference' },
    { value: 'event-3', label: 'Healthcare Technology Forum' },
    { value: 'event-4', label: 'Education Excellence Awards' },
    { value: 'event-5', label: 'Innovation Showcase' }
  ];

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
      sources: (initialData?.sources as any)?.slug || undefined,
      programmeLabel: (initialData?.programmeLabel as any)?.slug || undefined,
      relatedProgrammes: Array.isArray(initialData?.relatedProgrammes)
        ? (initialData?.relatedProgrammes as any[]).map((r) => r.slug)
        : [],
      people: Array.isArray(initialData?.people)
        ? (initialData?.people as any[]).map((r) => r.slug)
        : [],
      relatedCjTeamMembers: Array.isArray(initialData?.relatedCjTeamMembers)
        ? (initialData?.relatedCjTeamMembers as any[]).map((r) => r.slug)
        : [],
      innovations: Array.isArray(initialData?.innovations)
        ? (initialData?.innovations as any[]).map((r) => r.slug)
        : [],
      relatedEvent: (initialData?.relatedEvent as any)?.slug || undefined,
      relatedEvents: Array.isArray(initialData?.relatedEvents)
        ? (initialData?.relatedEvents as any[]).map((r) => r.slug)
        : [],
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      imageAltTextEnglish: initialData?.imageAltTextEnglish || '',
      imageAltTextArabic: initialData?.imageAltTextArabic || '',
      tags: Array.isArray(initialData?.tags)
        ? (initialData?.tags as any[]).map((r) => r.slug)
        : [],
      featured: initialData?.featured || false,
      pushToGR: initialData?.pushToGR || false,
      removeFromNewsGrid: initialData?.removeFromNewsGrid || false
    } as WebflowNewsFormData;
    form.reset(newValues);
  }, [initialData, form]);

  // Remove auto slug-on-typing in favor of explicit Team-style generation
  // useEffect(() => {
  //   const subscription = form.watch((value, { name }) => {
  //     if (name === 'title' && value.title && !form.getValues('slug')) {
  //       const timer = setTimeout(() => {
  //         if (value.title) {
  //           form.setValue('slug', generateSlug(value.title));
  //         }
  //       }, 500);
  //       return () => clearTimeout(timer);
  //     }
  //   });
  //   return subscription.unsubscribe;
  // }, [form]);

  // Manual slug generation function (Team-style)
  const handleGenerateSlug = () => {
    const currentTitle = form.getValues('title');
    if (currentTitle) {
      form.setValue('slug', generateSlug(currentTitle));
    }
  };

  const handleSubmit = async (data: WebflowNewsFormData) => {
    console.log(
      '📋 News Form Raw Data (slug state):',
      JSON.stringify(data, null, 2)
    );
    // Transform slug fields back into reference object structures
    const transformed: IncomingNewsData = {
      title: data.title,
      slug: data.slug,
      status: data.status,
      description: data.description,
      arabicTitle: data.arabicTitle,
      summary: data.summary,
      summaryArabic: data.summaryArabic,
      excerpt: data.excerpt,
      externalLink: data.externalLink || '',
      datePublished: data.datePublished,
      thumbnail: data.thumbnail?.url
        ? { url: data.thumbnail.url, alt: data.thumbnail.alt || '' }
        : undefined,
      heroImage: data.heroImage?.url
        ? { url: data.heroImage.url, alt: data.heroImage.alt || '' }
        : undefined,
      imageAltTextEnglish: data.imageAltTextEnglish,
      imageAltTextArabic: data.imageAltTextArabic,
      featured: data.featured,
      pushToGR: data.pushToGR,
      removeFromNewsGrid: data.removeFromNewsGrid,
      // Reconstruct single refs
      sources: data.sources
        ? { id: data.sources, slug: data.sources }
        : undefined,
      programmeLabel: data.programmeLabel
        ? { id: data.programmeLabel, slug: data.programmeLabel }
        : undefined,
      relatedEvent: data.relatedEvent
        ? { id: data.relatedEvent, slug: data.relatedEvent }
        : undefined,
      // Reconstruct arrays
      relatedProgrammes: data.relatedProgrammes.map((s) => ({
        id: s,
        slug: s
      })),
      people: data.people.map((s) => ({ id: s, slug: s })),
      relatedCjTeamMembers: data.relatedCjTeamMembers.map((s) => ({
        id: s,
        slug: s
      })),
      innovations: data.innovations.map((s) => ({ id: s, slug: s })),
      relatedEvents: data.relatedEvents.map((s) => ({ id: s, slug: s })),
      tags: data.tags.map((s) => ({ id: s, slug: s }))
    };
    try {
      setIsLoading(true);
      await onSubmit(transformed);
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
    <div className="h-full flex flex-col prevent-layout-shift">
      {/* Action Bar with Delete Button */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 p-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {isEditing ? 'Edit' : 'Create'} News
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
              Save Draft
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

                  <WebflowSlugField
                    control={form.control}
                    name="slug"
                    label="Slug"
                    required
                  />
                  {/* Team-style slug actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="default"
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
                      collectionType="news"
                      slug={form.watch('slug')}
                    />

                    <WebflowImageField
                      control={form.control}
                      name="heroImage"
                      label="Hero Image"
                      helperText="Large banner image for news article (recommended: 1200x600px)"
                      collectionType="news"
                      slug={form.watch('slug')}
                    />
                  </div>

                  {/* Tags */}
                  <WebflowReferenceSelectField
                    control={form.control}
                    name="tags"
                    label="Tags"
                    collectionType="tag"
                    multiple
                    statusFilter="all"
                    placeholder="Search tags"
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

                  {/* Relationship Fields */}
                  <div className="space-y-6">
                    <h3 className="text-base font-medium text-white">
                      Relationships
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowReferenceSelectField
                        control={form.control}
                        name="sources"
                        label="Sources"
                        collectionType="source"
                        placeholder="Select source"
                        allowClear
                      />

                      <WebflowReferenceSelectField
                        control={form.control}
                        name="programmeLabel"
                        label="Programme Label"
                        collectionType="programme"
                        placeholder="Select programme"
                        allowClear
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowReferenceSelectField
                        control={form.control}
                        name="relatedProgrammes"
                        label="Related Programmes"
                        collectionType="programme"
                        multiple
                        placeholder="Search programmes"
                        helperText="Multiple programmes related to this news"
                      />

                      <WebflowReferenceSelectField
                        control={form.control}
                        name="relatedEvent"
                        label="Related Event"
                        collectionType="event"
                        placeholder="Select related event"
                        allowClear
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowReferenceSelectField
                        control={form.control}
                        name="relatedEvents"
                        label="Related Events"
                        collectionType="event"
                        multiple
                        placeholder="Search events"
                        helperText="Multiple events related to this news"
                      />

                      <WebflowReferenceSelectField
                        control={form.control}
                        name="people"
                        label="People"
                        collectionType="people"
                        multiple
                        placeholder="Search people"
                        helperText="People featured or mentioned"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowReferenceSelectField
                        control={form.control}
                        name="relatedCjTeamMembers"
                        label="Related CJ Team Members"
                        collectionType="team" // switched from 'people' to correct internal team collection
                        multiple
                        placeholder="Search team"
                        helperText="CJ team members related to this news"
                      />

                      <WebflowReferenceSelectField
                        control={form.control}
                        name="innovations"
                        label="Innovations"
                        collectionType="innovation"
                        multiple
                        placeholder="Search innovations"
                        helperText="Innovations featured in this news"
                      />
                    </div>
                  </div>

                  {/* Image Alt Text Fields */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Image Alt Text
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="imageAltTextEnglish"
                        label="Image Alt Text (English)"
                        placeholder="Describe the image for accessibility"
                        helperText="Alternative text for images in English"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="imageAltTextArabic"
                        label="Image Alt Text (Arabic)"
                        placeholder="وصف الصورة بالعربية"
                        helperText="Alternative text for images in Arabic"
                      />
                    </div>
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
                ? 'Update News'
                : 'Create News'}
          </button>
        </form>
      </Form>
    </div>
  );
});
