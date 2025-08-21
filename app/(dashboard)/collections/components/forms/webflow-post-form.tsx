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
  WebflowRichTextField
} from './webflow-form-fields';
import { IncomingPostData } from '../interfaces-incoming';
import { generateSlug } from './base-form';
import './compact-form.css';

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

  // Multi-reference relationships
  programmeLabel: z
    .object({
      id: z.string(),
      slug: z.string()
    })
    .optional(),
  relatedProgrammes: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string()
      })
    )
    .default([]),
  blogCategory: z
    .object({
      id: z.string(),
      slug: z.string()
    })
    .optional(),
  relatedEvent: z
    .object({
      id: z.string(),
      slug: z.string()
    })
    .optional(),
  people: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string()
      })
    )
    .default([]),
  innovations: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string()
      })
    )
    .default([]),
  tags: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string()
      })
    )
    .default([]),

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

      // Bilingual content
      arabicTitle: initialData?.arabicTitle || '',
      arabicCompleteIncomplete: initialData?.arabicCompleteIncomplete || false,

      // Publication details
      datePublished:
        initialData?.datePublished || new Date().toISOString().split('T')[0],
      location: initialData?.location || '',
      locationArabic: initialData?.locationArabic || '',

      // SEO
      seoTitle: initialData?.seoTitle || '',
      seoTitleArabic: initialData?.seoTitleArabic || '',
      seoMeta: initialData?.seoMeta || '',
      seoMetaArabic: initialData?.seoMetaArabic || '',

      // Content
      bodyEnglish: initialData?.bodyEnglish || '',
      bodyArabic: initialData?.bodyArabic || '',
      bulletPointsEnglish: initialData?.bulletPointsEnglish || '',
      bulletPointsArabic: initialData?.bulletPointsArabic || '',

      // Images
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      mainImage: initialData?.mainImage || { url: '', alt: '' },
      openGraphImage: initialData?.openGraphImage || { url: '', alt: '' },

      // Image metadata
      altTextHeroImageEnglish: initialData?.altTextHeroImageEnglish || '',
      altTextHeroImageArabic: initialData?.altTextHeroImageArabic || '',
      photoCreditHeroImageEnglish:
        initialData?.photoCreditHeroImageEnglish || '',
      photoCreditHeroImageArabic: initialData?.photoCreditHeroImageArabic || '',

      // Image gallery
      imageCarousel: initialData?.imageCarousel || [],
      imageGalleryCredits: initialData?.imageGalleryCredits || '',
      imageGalleryCreditsArabic: initialData?.imageGalleryCreditsArabic || '',

      // Video
      videoAsHero: initialData?.videoAsHero || false,
      heroVideoYoutubeId: initialData?.heroVideoYoutubeId || '',
      heroVideoArabicYoutubeId: initialData?.heroVideoArabicYoutubeId || '',

      // Relationships
      programmeLabel: initialData?.programmeLabel || undefined,
      relatedProgrammes: initialData?.relatedProgrammes || [],
      blogCategory: initialData?.blogCategory || undefined,
      relatedEvent: initialData?.relatedEvent || undefined,
      people: initialData?.people || [],
      innovations: initialData?.innovations || [],
      tags: initialData?.tags || [],

      // Flags
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

      // Bilingual content
      arabicTitle: initialData?.arabicTitle || '',
      arabicCompleteIncomplete: initialData?.arabicCompleteIncomplete || false,

      // Publication details
      datePublished:
        initialData?.datePublished || new Date().toISOString().split('T')[0],
      location: initialData?.location || '',
      locationArabic: initialData?.locationArabic || '',

      // SEO
      seoTitle: initialData?.seoTitle || '',
      seoTitleArabic: initialData?.seoTitleArabic || '',
      seoMeta: initialData?.seoMeta || '',
      seoMetaArabic: initialData?.seoMetaArabic || '',

      // Content
      bodyEnglish: initialData?.bodyEnglish || '',
      bodyArabic: initialData?.bodyArabic || '',
      bulletPointsEnglish: initialData?.bulletPointsEnglish || '',
      bulletPointsArabic: initialData?.bulletPointsArabic || '',

      // Images
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      mainImage: initialData?.mainImage || { url: '', alt: '' },
      openGraphImage: initialData?.openGraphImage || { url: '', alt: '' },

      // Image metadata
      altTextHeroImageEnglish: initialData?.altTextHeroImageEnglish || '',
      altTextHeroImageArabic: initialData?.altTextHeroImageArabic || '',
      photoCreditHeroImageEnglish:
        initialData?.photoCreditHeroImageEnglish || '',
      photoCreditHeroImageArabic: initialData?.photoCreditHeroImageArabic || '',

      // Image gallery
      imageCarousel: initialData?.imageCarousel || [],
      imageGalleryCredits: initialData?.imageGalleryCredits || '',
      imageGalleryCreditsArabic: initialData?.imageGalleryCreditsArabic || '',

      // Video
      videoAsHero: initialData?.videoAsHero || false,
      heroVideoYoutubeId: initialData?.heroVideoYoutubeId || '',
      heroVideoArabicYoutubeId: initialData?.heroVideoArabicYoutubeId || '',

      // Relationships
      programmeLabel: initialData?.programmeLabel || undefined,
      relatedProgrammes: initialData?.relatedProgrammes || [],
      blogCategory: initialData?.blogCategory || undefined,
      relatedEvent: initialData?.relatedEvent || undefined,
      people: initialData?.people || [],
      innovations: initialData?.innovations || [],
      tags: initialData?.tags || [],

      // Flags
      featured: initialData?.featured || false,
      pushToGR: initialData?.pushToGR || false,
      sitemapIndexing: initialData?.sitemapIndexing || true
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

  // Dropdown options for multi-reference fields
  const programmeLabelOptions = [
    { id: 'prog-1', slug: 'water-security', label: 'Water Security' },
    { id: 'prog-2', slug: 'climate-change', label: 'Climate Change' },
    { id: 'prog-3', slug: 'education', label: 'Education' },
    { id: 'prog-4', slug: 'healthcare', label: 'Healthcare' },
    { id: 'prog-5', slug: 'innovation', label: 'Innovation' }
  ];

  const relatedProgrammesOptions = [
    { id: 'prog-1', slug: 'water-security', label: 'Water Security' },
    { id: 'prog-2', slug: 'climate-change', label: 'Climate Change' },
    { id: 'prog-3', slug: 'education', label: 'Education' },
    { id: 'prog-4', slug: 'healthcare', label: 'Healthcare' },
    { id: 'prog-5', slug: 'innovation', label: 'Innovation' },
    { id: 'prog-6', slug: 'food-security', label: 'Food Security' },
    { id: 'prog-7', slug: 'poverty-alleviation', label: 'Poverty Alleviation' }
  ];

  const blogCategoryOptions = [
    { id: 'cat-1', slug: 'news', label: 'News' },
    { id: 'cat-2', slug: 'research', label: 'Research' },
    { id: 'cat-3', slug: 'insights', label: 'Insights' },
    { id: 'cat-4', slug: 'events', label: 'Events' },
    { id: 'cat-5', slug: 'announcements', label: 'Announcements' }
  ];

  const relatedEventOptions = [
    { id: 'event-1', slug: 'water-summit-2024', label: 'Water Summit 2024' },
    { id: 'event-2', slug: 'climate-conference', label: 'Climate Conference' },
    { id: 'event-3', slug: 'innovation-forum', label: 'Innovation Forum' },
    {
      id: 'event-4',
      slug: 'education-symposium',
      label: 'Education Symposium'
    },
    { id: 'event-5', slug: 'health-workshop', label: 'Health Workshop' }
  ];

  const peopleOptions = [
    { id: 'person-1', slug: 'dr-john-smith', label: 'Dr. John Smith' },
    { id: 'person-2', slug: 'prof-sarah-jones', label: 'Prof. Sarah Jones' },
    { id: 'person-3', slug: 'ahmed-hassan', label: 'Ahmed Hassan' },
    { id: 'person-4', slug: 'fatima-al-zahra', label: 'Fatima Al-Zahra' },
    { id: 'person-5', slug: 'dr-mohammed-ali', label: 'Dr. Mohammed Ali' },
    { id: 'person-6', slug: 'laura-wilson', label: 'Laura Wilson' }
  ];

  const innovationsOptions = [
    {
      id: 'innov-1',
      slug: 'water-purification-tech',
      label: 'Water Purification Technology'
    },
    {
      id: 'innov-2',
      slug: 'solar-desalination',
      label: 'Solar Desalination System'
    },
    { id: 'innov-3', slug: 'ai-healthcare', label: 'AI Healthcare Platform' },
    { id: 'innov-4', slug: 'education-app', label: 'Digital Education App' },
    {
      id: 'innov-5',
      slug: 'climate-monitoring',
      label: 'Climate Monitoring System'
    },
    {
      id: 'innov-6',
      slug: 'food-production',
      label: 'Sustainable Food Production'
    }
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
            <Button
              type="button"
              onClick={() => form.setValue('status', 'draft')}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              Save Draft
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
                      <WebflowSelectField
                        control={form.control}
                        name="programmeLabel"
                        label="Programme Label"
                        options={programmeLabelOptions.map((opt) => ({
                          value: opt.id,
                          label: opt.label
                        }))}
                        placeholder="Select programme"
                      />

                      <WebflowSelectField
                        control={form.control}
                        name="blogCategory"
                        label="Blog Category"
                        options={blogCategoryOptions.map((opt) => ({
                          value: opt.id,
                          label: opt.label
                        }))}
                        placeholder="Select category"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTagsField
                        control={form.control}
                        name="relatedProgrammes"
                        label="Related Programmes"
                        helperText="Multiple programmes related to this post"
                      />

                      <WebflowSelectField
                        control={form.control}
                        name="relatedEvent"
                        label="Related Event"
                        options={relatedEventOptions.map((opt) => ({
                          value: opt.id,
                          label: opt.label
                        }))}
                        placeholder="Select event"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTagsField
                        control={form.control}
                        name="people"
                        label="People"
                        helperText="People featured or mentioned in this post"
                      />

                      <WebflowTagsField
                        control={form.control}
                        name="innovations"
                        label="Innovations"
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
                      />

                      <WebflowImageField
                        control={form.control}
                        name="heroImage"
                        label="Hero Image"
                        required
                        helperText="Large banner image (recommended: 1200x800px)"
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
