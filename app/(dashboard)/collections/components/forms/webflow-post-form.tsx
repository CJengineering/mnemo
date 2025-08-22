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
  WebflowRichTextField,
  WebflowReferenceSelectField // added for unified reference handling
} from './webflow-form-fields';
import { IncomingPostData } from '../interfaces-incoming';
import { generateSlug } from './base-form';
import './compact-form.css';
import { SaveConfirmation } from '@/components/ui/save-confirmation';

// Webflow CMS Post Schema
const webflowPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft'),
  description: z.string().optional(),

  // Bilingual content
  arabicTitle: z.string().optional(),
  arabicCompleteIncomplete: z.boolean().default(false),

  // Publication details
  datePublished: z.string(),
  location: z.string().optional(),
  locationArabic: z.string().optional(),

  // SEO
  seoTitle: z.string().min(1, 'SEO Title is required'),
  seoTitleArabic: z.string().optional(),
  seoMeta: z.string().min(1, 'SEO Meta is required'),
  seoMetaArabic: z.string().optional(),

  // Content
  bodyEnglish: z.string().optional(),
  bodyArabic: z.string().optional(),
  bulletPointsEnglish: z.string().optional(),
  bulletPointsArabic: z.string().optional(),

  // Images (required)
  thumbnail: z.object({
    url: z.string().min(1, 'Thumbnail is required'),
    alt: z.string().optional()
  }),
  heroImage: z.object({
    url: z.string().min(1, 'Hero image is required'),
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

  // Image metadata
  altTextHeroImageEnglish: z.string().optional(),
  altTextHeroImageArabic: z.string().optional(),
  photoCreditHeroImageEnglish: z.string().optional(),
  photoCreditHeroImageArabic: z.string().optional(),

  // Image gallery
  imageCarousel: z
    .array(
      z.object({
        url: z.string(),
        alt: z.string().optional()
      })
    )
    .default([]),
  imageGalleryCredits: z.string().optional(),
  imageGalleryCreditsArabic: z.string().optional(),

  // Video
  videoAsHero: z.boolean().default(false),
  heroVideoYoutubeId: z.string().optional(),
  heroVideoArabicYoutubeId: z.string().optional(),

  // Unified Relations now slug-only in form state
  programmeLabel: z.string().optional(),
  relatedProgrammes: z.array(z.string()).default([]),
  blogCategory: z.string().optional(),
  relatedEvent: z.string().optional(),
  people: z.array(z.string()).default([]),
  innovations: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),

  // Flags
  featured: z.boolean().default(false),
  pushToGR: z.boolean().default(false),
  sitemapIndexing: z.boolean().default(true)
});

type WebflowPostFormData = z.infer<typeof webflowPostSchema>;

interface WebflowPostFormProps {
  initialData?: Partial<IncomingPostData>;
  onSubmit: (data: IncomingPostData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isEditing?: boolean;
}

export interface WebflowPostFormRef {
  triggerSubmit: () => void;
  setStatus: (status: 'draft' | 'published') => void;
}

export const WebflowPostForm = forwardRef<
  WebflowPostFormRef,
  WebflowPostFormProps
>(({ initialData, onSubmit, onCancel, onDelete, isEditing = false }, ref) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WebflowPostFormData>({
    resolver: zodResolver(webflowPostSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      description: initialData?.description || '',
      arabicTitle: initialData?.arabicTitle || '',
      arabicCompleteIncomplete: initialData?.arabicCompleteIncomplete || false,
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
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      mainImage: initialData?.mainImage || { url: '', alt: '' },
      openGraphImage: initialData?.openGraphImage || { url: '', alt: '' },
      altTextHeroImageEnglish: initialData?.altTextHeroImageEnglish || '',
      altTextHeroImageArabic: initialData?.altTextHeroImageArabic || '',
      photoCreditHeroImageEnglish:
        initialData?.photoCreditHeroImageEnglish || '',
      photoCreditHeroImageArabic: initialData?.photoCreditHeroImageArabic || '',
      imageCarousel: initialData?.imageCarousel || [],
      imageGalleryCredits: initialData?.imageGalleryCredits || '',
      imageGalleryCreditsArabic: initialData?.imageGalleryCreditsArabic || '',
      videoAsHero: initialData?.videoAsHero || false,
      heroVideoYoutubeId: initialData?.heroVideoYoutubeId || '',
      heroVideoArabicYoutubeId: initialData?.heroVideoArabicYoutubeId || '',
      // Map incoming reference objects -> slugs
      programmeLabel:
        (initialData?.programmeLabel as any)?.slug ||
        (initialData?.programmeLabel as any)?.id ||
        undefined,
      relatedProgrammes: Array.isArray(initialData?.relatedProgrammes)
        ? (initialData?.relatedProgrammes as any[]).map((r) => r.slug || r.id)
        : [],
      blogCategory:
        (initialData?.blogCategory as any)?.slug ||
        (initialData?.blogCategory as any)?.id ||
        undefined,
      relatedEvent:
        (initialData?.relatedEvent as any)?.slug ||
        (initialData?.relatedEvent as any)?.id ||
        undefined,
      people: Array.isArray(initialData?.people)
        ? (initialData?.people as any[]).map((r) => r.slug || r.id)
        : [],
      innovations: Array.isArray(initialData?.innovations)
        ? (initialData?.innovations as any[]).map((r) => r.slug || r.id)
        : [],
      tags: Array.isArray(initialData?.tags)
        ? (initialData?.tags as any[]).map((r) => r.slug || r.id)
        : [],
      featured: initialData?.featured || false,
      pushToGR: initialData?.pushToGR || false,
      sitemapIndexing: initialData?.sitemapIndexing || true
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
      arabicCompleteIncomplete: initialData?.arabicCompleteIncomplete || false,
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
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      mainImage: initialData?.mainImage || { url: '', alt: '' },
      openGraphImage: initialData?.openGraphImage || { url: '', alt: '' },
      altTextHeroImageEnglish: initialData?.altTextHeroImageEnglish || '',
      altTextHeroImageArabic: initialData?.altTextHeroImageArabic || '',
      photoCreditHeroImageEnglish:
        initialData?.photoCreditHeroImageEnglish || '',
      photoCreditHeroImageArabic: initialData?.photoCreditHeroImageArabic || '',
      imageCarousel: initialData?.imageCarousel || [],
      imageGalleryCredits: initialData?.imageGalleryCredits || '',
      imageGalleryCreditsArabic: initialData?.imageGalleryCreditsArabic || '',
      videoAsHero: initialData?.videoAsHero || false,
      heroVideoYoutubeId: initialData?.heroVideoYoutubeId || '',
      heroVideoArabicYoutubeId: initialData?.heroVideoArabicYoutubeId || '',
      programmeLabel:
        (initialData?.programmeLabel as any)?.slug ||
        (initialData?.programmeLabel as any)?.id ||
        undefined,
      relatedProgrammes: Array.isArray(initialData?.relatedProgrammes)
        ? (initialData?.relatedProgrammes as any[]).map((r) => r.slug || r.id)
        : [],
      blogCategory:
        (initialData?.blogCategory as any)?.slug ||
        (initialData?.blogCategory as any)?.id ||
        undefined,
      relatedEvent:
        (initialData?.relatedEvent as any)?.slug ||
        (initialData?.relatedEvent as any)?.id ||
        undefined,
      people: Array.isArray(initialData?.people)
        ? (initialData?.people as any[]).map((r) => r.slug || r.id)
        : [],
      innovations: Array.isArray(initialData?.innovations)
        ? (initialData?.innovations as any[]).map((r) => r.slug || r.id)
        : [],
      tags: Array.isArray(initialData?.tags)
        ? (initialData?.tags as any[]).map((r) => r.slug || r.id)
        : [],
      featured: initialData?.featured || false,
      pushToGR: initialData?.pushToGR || false,
      sitemapIndexing: initialData?.sitemapIndexing || true
    };

    form.reset(newValues);
  }, [initialData, form]);

  // Remove auto-generate-on-typing behavior in favor of explicit button like Team form
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

  const handleSubmit = async (data: WebflowPostFormData) => {
    setIsLoading(true);
    try {
      // Reconstruct reference objects for API consumption
      const transformed: IncomingPostData = {
        title: data.title,
        slug: data.slug,
        status: data.status,
        description: data.description,
        arabicTitle: data.arabicTitle,
        arabicCompleteIncomplete: data.arabicCompleteIncomplete,
        datePublished: data.datePublished,
        location: data.location,
        locationArabic: data.locationArabic,
        seoTitle: data.seoTitle,
        seoTitleArabic: data.seoTitleArabic,
        seoMeta: data.seoMeta,
        seoMetaArabic: data.seoMetaArabic,
        bodyEnglish: data.bodyEnglish,
        bodyArabic: data.bodyArabic,
        bulletPointsEnglish: data.bulletPointsEnglish,
        bulletPointsArabic: data.bulletPointsArabic,
        thumbnail: { url: data.thumbnail.url, alt: data.thumbnail.alt || '' },
        heroImage: { url: data.heroImage.url, alt: data.heroImage.alt || '' },
        mainImage: { url: data.mainImage.url, alt: data.mainImage.alt || '' },
        openGraphImage: {
          url: data.openGraphImage.url,
          alt: data.openGraphImage.alt || ''
        },
        altTextHeroImageEnglish: data.altTextHeroImageEnglish,
        altTextHeroImageArabic: data.altTextHeroImageArabic,
        photoCreditHeroImageEnglish: data.photoCreditHeroImageEnglish,
        photoCreditHeroImageArabic: data.photoCreditHeroImageArabic,
        videoAsHero: data.videoAsHero,
        heroVideoYoutubeId: data.heroVideoYoutubeId,
        heroVideoArabicYoutubeId: data.heroVideoArabicYoutubeId,
        programmeLabel: data.programmeLabel
          ? { id: data.programmeLabel, slug: data.programmeLabel }
          : undefined,
        relatedProgrammes: data.relatedProgrammes.map((s) => ({
          id: s,
          slug: s
        })),
        blogCategory: data.blogCategory
          ? { id: data.blogCategory, slug: data.blogCategory }
          : undefined,
        relatedEvent: data.relatedEvent
          ? { id: data.relatedEvent, slug: data.relatedEvent }
          : undefined,
        people: data.people.map((s) => ({ id: s, slug: s })),
        innovations: data.innovations.map((s) => ({ id: s, slug: s })),
        tags: data.tags.map((s) => ({ id: s, slug: s })),
        imageCarousel: data.imageCarousel
          ?.filter((img) => img.url)
          .map((img) => ({ url: img.url, alt: img.alt || '' })),
        imageGalleryCredits: data.imageGalleryCredits,
        imageGalleryCreditsArabic: data.imageGalleryCreditsArabic,
        featured: data.featured,
        pushToGR: data.pushToGR,
        sitemapIndexing: data.sitemapIndexing
      };
      await onSubmit(transformed as any);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose submit function via ref
  useImperativeHandle(ref, () => ({
    triggerSubmit: () => {
      form.handleSubmit(handleSubmit)();
    },
    setStatus: (status: 'draft' | 'published') => {
      form.setValue('status', status);
    }
  }));

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
            {isEditing ? 'Edit' : 'Create'} Post
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
            <SaveConfirmation
              onAction={async (status) => {
                form.setValue('status', status);
                await form.handleSubmit(handleSubmit)();
                return { slug: form.getValues().slug };
              }}
              disabled={isLoading}
              isSubmitting={isLoading}
              itemLabel="Post"
            />
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
                    placeholder="Enter post title"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowTextField
                      control={form.control}
                      name="locationArabic"
                      label="Location (Arabic)"
                      placeholder="الموقع بالعربية"
                    />

                    <WebflowSwitchField
                      control={form.control}
                      name="arabicCompleteIncomplete"
                      label="Arabic Content Complete"
                      description="Mark if Arabic translation is complete"
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

                  {/* Relationships */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Relationships
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowReferenceSelectField
                        control={form.control}
                        name="programmeLabel"
                        label="Programme Label"
                        collectionType="programme"
                        placeholder="Select programme"
                        allowClear
                      />

                      <WebflowReferenceSelectField
                        control={form.control}
                        name="blogCategory"
                        label="Blog Category"
                        collectionType="blogCategory" // TODO: confirm collection type key
                        placeholder="Select category"
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
                        placeholder="Search & select programmes"
                        helperText="Multiple programmes related to this post"
                      />

                      <WebflowReferenceSelectField
                        control={form.control}
                        name="relatedEvent"
                        label="Related Event"
                        collectionType="event"
                        placeholder="Select event"
                        allowClear
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowReferenceSelectField
                        control={form.control}
                        name="people"
                        label="People"
                        collectionType="people"
                        multiple
                        placeholder="Search people"
                        helperText="People featured or mentioned in this post"
                      />

                      <WebflowReferenceSelectField
                        control={form.control}
                        name="innovations"
                        label="Innovations"
                        collectionType="innovation"
                        multiple
                        placeholder="Search innovations"
                        helperText="Innovations featured in this post"
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">Images</h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <WebflowImageField
                        control={form.control}
                        name="thumbnail"
                        label="Thumbnail"
                        required
                        helperText="Small image for post listings (recommended: 400x300px)"
                        collectionType="posts"
                        slug={form.watch('slug')}
                      />

                      <WebflowImageField
                        control={form.control}
                        name="heroImage"
                        label="Hero Image"
                        required
                        helperText="Large banner image (recommended: 1200x800px)"
                        collectionType="posts"
                        slug={form.watch('slug')}
                      />

                      <WebflowImageField
                        control={form.control}
                        name="mainImage"
                        label="Main Image"
                        required
                        helperText="Primary post image (recommended: 1200x800px)"
                        collectionType="posts"
                        slug={form.watch('slug')}
                      />

                      <WebflowImageField
                        control={form.control}
                        name="openGraphImage"
                        label="Open Graph Image"
                        required
                        helperText="Social sharing image (recommended: 1200x630px)"
                        collectionType="posts"
                        slug={form.watch('slug')}
                      />
                    </div>

                    {/* Alt Text and Photo Credits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="altTextHeroImageEnglish"
                        label="Hero Image Alt Text (English)"
                        placeholder="Describe the hero image"
                        helperText="Alternative text for accessibility"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="altTextHeroImageArabic"
                        label="Hero Image Alt Text (Arabic)"
                        placeholder="وصف الصورة الرئيسية"
                        helperText="Alternative text in Arabic"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="photoCreditHeroImageEnglish"
                        label="Hero Image Photo Credit (English)"
                        placeholder="Photo by: John Doe"
                        helperText="Credit for hero image photographer"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="photoCreditHeroImageArabic"
                        label="Hero Image Photo Credit (Arabic)"
                        placeholder="تصوير: أحمد علي"
                        helperText="Credit in Arabic"
                      />
                    </div>

                    {/* Image Carousel */}
                    <WebflowImageField
                      control={form.control}
                      name="imageCarousel"
                      label="Image Carousel"
                      multiple={true}
                      maxImages={10}
                      helperText="Multiple images for post gallery (up to 10 images)"
                      collectionType="posts"
                      slug={form.watch('slug')}
                    />

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

                    <WebflowSwitchField
                      control={form.control}
                      name="videoAsHero"
                      label="Use Video as Hero"
                      description="Replace hero image with video content"
                    />

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
                  <WebflowReferenceSelectField
                    control={form.control}
                    name="tags"
                    label="Tags"
                    collectionType="tag"
                    multiple
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
                      label="Featured Post"
                      description="Display this post prominently"
                    />

                    <WebflowSwitchField
                      control={form.control}
                      name="pushToGR"
                      label="Push to Global Repository"
                      description="Include in global content distribution"
                    />

                    <WebflowSwitchField
                      control={form.control}
                      name="sitemapIndexing"
                      label="Include in Sitemap"
                      description="Allow search engines to index this post"
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
});

WebflowPostForm.displayName = 'WebflowPostForm';
