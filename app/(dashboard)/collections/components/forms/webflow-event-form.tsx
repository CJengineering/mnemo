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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
import { IncomingEventData } from '../interfaces-incoming';
import { generateSlug } from './base-form';
import { WebflowFormWrapper } from './webflow-form-wrapper';
import './compact-form.css';
import { SaveConfirmation } from '@/components/ui/save-confirmation';

// Webflow CMS Event Schema
const webflowEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft'),

  // Basic fields
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  arabicTitle: z.string().optional(),
  teaserText: z.string().optional(),

  // SEO fields
  seoTitle: z.string().optional(),
  seoMetaDescription: z.string().optional(),

  // Date fields
  eventDate: z.string().optional(),
  endDate: z.string().optional(),

  // Location fields
  city: z.string().optional(),
  address: z.string().optional(),
  extraLocationInformation: z.string().optional(),

  // Links and CTAs
  rsvpLink: z.string().url().optional().or(z.literal('')),
  livestreamLink: z.string().url().optional().or(z.literal('')),
  ctaLink: z.string().url().optional().or(z.literal('')),
  buttonCtaText: z.string().optional(),

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
  imageGallery: z
    .array(
      z.object({
        url: z.string(),
        alt: z.string().optional()
      })
    )
    .default([]),
  galleryPhotoCredits: z.string().optional(),

  // Video fields
  videoAsHero: z.boolean().default(false),
  mainVideo: z.string().optional(),
  mainVideoEmbedCode: z.string().optional(),
  video2: z.string().optional(),
  video2EmbedCode: z.string().optional(),
  video3: z.string().optional(),
  video3EmbedCode: z.string().optional(),

  // Rich text content fields
  signupEmbed: z.string().optional(),
  moreInformation: z.string().optional(),
  moreDetails: z.string().optional(),
  relatedPeopleRichText: z.string().optional(),
  inTheMedia: z.string().optional(),
  customCodeForHidingWeglot: z.string().optional(),

  // Boolean toggles
  pushToGr: z.boolean().default(false),
  newsOnOff: z.boolean().default(false),
  moreDetailsOnOff: z.boolean().default(false),
  inTheMediaOnOff: z.boolean().default(false),

  // Dropdown fields
  attendanceType: z
    .enum(['in-person', 'virtual', 'hybrid'])
    .default('in-person'),
  group: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      try {
        return JSON.parse(val);
      } catch {
        return undefined;
      }
    }),
  programmeLabel: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      try {
        return JSON.parse(val);
      } catch {
        return undefined;
      }
    }),

  // Multi-reference fields now storing slug arrays
  relatedProgrammes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  relatedPeople: z.array(z.string()).default([]),
  organisers: z.array(z.string()).default([]),
  partners: z.array(z.string()).default([]),
  withRepresentativesFrom: z.array(z.string()).default([]),

  // Legacy field
  featured: z.boolean().default(false)
});

type WebflowEventFormData = z.infer<typeof webflowEventSchema>;

interface WebflowEventFormProps {
  initialData?: Partial<IncomingEventData>;
  onSubmit: (data: IncomingEventData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isEditing?: boolean;
}

export interface WebflowEventFormRef {
  triggerSubmit: () => void;
  setStatus: (status: 'draft' | 'published') => void;
}

export const WebflowEventForm = forwardRef<
  WebflowEventFormRef,
  WebflowEventFormProps
>(({ initialData, onSubmit, onCancel, onDelete, isEditing = false }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<null | 'draft' | 'published'>(
    null
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const form = useForm<WebflowEventFormData>({
    resolver: zodResolver(webflowEventSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      description: initialData?.description || '',
      shortDescription: initialData?.shortDescription || '',
      arabicTitle: initialData?.arabicTitle || '',
      teaserText: initialData?.teaserText || '',
      seoTitle: initialData?.seoTitle || '',
      seoMetaDescription: initialData?.seoMetaDescription || '',
      eventDate: initialData?.eventDate || '',
      endDate: initialData?.endDate || '',
      city: initialData?.city || '',
      address: initialData?.address || '',
      extraLocationInformation: initialData?.extraLocationInformation || '',
      rsvpLink: initialData?.rsvpLink || '',
      livestreamLink: initialData?.livestreamLink || '',
      ctaLink: initialData?.ctaLink || '',
      buttonCtaText: initialData?.buttonCtaText || '',
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      imageGallery: initialData?.imageGallery || [],
      galleryPhotoCredits: initialData?.galleryPhotoCredits || '',
      videoAsHero: initialData?.videoAsHero || false,
      mainVideo: initialData?.mainVideo || '',
      mainVideoEmbedCode: initialData?.mainVideoEmbedCode || '',
      video2: initialData?.video2 || '',
      video2EmbedCode: initialData?.video2EmbedCode || '',
      video3: initialData?.video3 || '',
      video3EmbedCode: initialData?.video3EmbedCode || '',
      signupEmbed: initialData?.signupEmbed || '',
      moreInformation: initialData?.moreInformation || '',
      moreDetails: initialData?.moreDetails || '',
      relatedPeopleRichText: initialData?.relatedPeopleRichText || '',
      inTheMedia: initialData?.inTheMedia || '',
      customCodeForHidingWeglot: initialData?.customCodeForHidingWeglot || '',
      pushToGr: initialData?.pushToGr || false,
      newsOnOff: initialData?.newsOnOff || false,
      moreDetailsOnOff: initialData?.moreDetailsOnOff || false,
      inTheMediaOnOff: initialData?.inTheMediaOnOff || false,
      group: initialData?.group ? JSON.stringify(initialData.group) : '',
      programmeLabel: initialData?.programmeLabel
        ? JSON.stringify(initialData.programmeLabel)
        : '',
      relatedProgrammes: (initialData?.relatedProgrammes || []).map(
        (r: any) => r.slug
      ),
      tags: (initialData?.tags || []).map((r: any) => r.slug),
      relatedPeople: (initialData?.relatedPeople || []).map((r: any) => r.slug),
      organisers: (initialData?.organisers || []).map((r: any) => r.slug),
      partners: (initialData?.partners || []).map((r: any) => r.slug),
      withRepresentativesFrom: (initialData?.withRepresentativesFrom || []).map(
        (r: any) => r.slug
      ),
      featured: initialData?.featured || false,
      attendanceType:
        (initialData?.attendanceType as 'in-person' | 'virtual' | 'hybrid') ||
        'in-person'
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
      shortDescription: initialData?.shortDescription || '',
      arabicTitle: initialData?.arabicTitle || '',
      teaserText: initialData?.teaserText || '',
      seoTitle: initialData?.seoTitle || '',
      seoMetaDescription: initialData?.seoMetaDescription || '',
      eventDate: initialData?.eventDate || '',
      endDate: initialData?.endDate || '',
      city: initialData?.city || '',
      address: initialData?.address || '',
      extraLocationInformation: initialData?.extraLocationInformation || '',
      rsvpLink: initialData?.rsvpLink || '',
      livestreamLink: initialData?.livestreamLink || '',
      ctaLink: initialData?.ctaLink || '',
      buttonCtaText: initialData?.buttonCtaText || '',
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      imageGallery: initialData?.imageGallery || [],
      galleryPhotoCredits: initialData?.galleryPhotoCredits || '',
      videoAsHero: initialData?.videoAsHero || false,
      mainVideo: initialData?.mainVideo || '',
      mainVideoEmbedCode: initialData?.mainVideoEmbedCode || '',
      video2: initialData?.video2 || '',
      video2EmbedCode: initialData?.video2EmbedCode || '',
      video3: initialData?.video3 || '',
      video3EmbedCode: initialData?.video3EmbedCode || '',
      signupEmbed: initialData?.signupEmbed || '',
      moreInformation: initialData?.moreInformation || '',
      moreDetails: initialData?.moreDetails || '',
      relatedPeopleRichText: initialData?.relatedPeopleRichText || '',
      inTheMedia: initialData?.inTheMedia || '',
      customCodeForHidingWeglot: initialData?.customCodeForHidingWeglot || '',
      pushToGr: initialData?.pushToGr || false,
      newsOnOff: initialData?.newsOnOff || false,
      moreDetailsOnOff: initialData?.moreDetailsOnOff || false,
      inTheMediaOnOff: initialData?.inTheMediaOnOff || false,
      group: initialData?.group ? JSON.stringify(initialData.group) : '',
      programmeLabel: initialData?.programmeLabel
        ? JSON.stringify(initialData.programmeLabel)
        : '',
      relatedProgrammes: (initialData?.relatedProgrammes || []).map(
        (r: any) => r.slug
      ),
      tags: (initialData?.tags || []).map((r: any) => r.slug),
      relatedPeople: (initialData?.relatedPeople || []).map((r: any) => r.slug),
      organisers: (initialData?.organisers || []).map((r: any) => r.slug),
      partners: (initialData?.partners || []).map((r: any) => r.slug),
      withRepresentativesFrom: (initialData?.withRepresentativesFrom || []).map(
        (r: any) => r.slug
      ),
      featured: initialData?.featured || false,
      attendanceType:
        (initialData?.attendanceType as 'in-person' | 'virtual' | 'hybrid') ||
        'in-person'
    };

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

  // Manual slug generation function with collection type suffix
  const handleGenerateSlug = () => {
    const currentTitle = form.getValues('title');
    if (currentTitle) {
      let baseSlug = generateSlug(currentTitle);

      // Add collection type suffix to reduce chance of conflicts
      const uniqueSlug = `${baseSlug}-event`;

      form.setValue('slug', uniqueSlug);
    }
  };

  const handleSubmit = async (data: WebflowEventFormData) => {
    const status = data.status;
    setBusyAction(status);

    try {
      setIsLoading(true);
      // map slug arrays back to reference objects for API
      const toRefArray = (arr: string[]) =>
        arr.map((slug) => ({ id: slug, slug }));
      const payload: IncomingEventData = {
        ...data,
        relatedProgrammes: toRefArray(data.relatedProgrammes),
        tags: toRefArray(data.tags),
        relatedPeople: toRefArray(data.relatedPeople),
        organisers: toRefArray(data.organisers),
        partners: toRefArray(data.partners),
        withRepresentativesFrom: toRefArray(data.withRepresentativesFrom)
      } as any;
      await onSubmit(payload);
    } catch (error) {
      console.error('Form submission error:', error);
      if (error instanceof Error) {
        if (
          error.message.includes('slug') &&
          error.message.includes('already')
        ) {
          throw new Error(
            `This slug is already in use. Please choose a different slug.`
          );
        }
        throw error;
      }
      throw new Error('An unexpected error occurred while saving the event.');
    } finally {
      setIsLoading(false);
      setBusyAction(null);
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' }
  ];

  const attendanceTypeOptions = [
    { value: 'in-person', label: 'In Person' },
    { value: 'virtual', label: 'Virtual' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  // Mock data for dropdown options
  const groupOptions = [
    { value: 'group-1', label: 'Research Group A' },
    { value: 'group-2', label: 'Innovation Lab' },
    { value: 'group-3', label: 'Policy Team' },
    { value: 'group-4', label: 'Development Unit' }
  ];

  const programmeLabelOptions = [
    { value: 'prog-1', label: 'Water Security' },
    { value: 'prog-2', label: 'Climate Change' },
    { value: 'prog-3', label: 'Education' },
    { value: 'prog-4', label: 'Healthcare' },
    { value: 'prog-5', label: 'Innovation' },
    { value: 'prog-6', label: 'Food Security' },
    { value: 'prog-7', label: 'Energy' }
  ];

  return (
    <div className="h-full flex flex-col prevent-layout-shift">
      {/* Action Bar with Delete Button */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 p-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {isEditing ? 'Edit' : 'Create'} Event
          </h3>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
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
              preset="draft"
              onAction={async (status) => {
                form.setValue('status', status);
                await form.handleSubmit(handleSubmit)();
                return { slug: form.getValues().slug };
              }}
              disabled={isLoading}
              isSubmitting={busyAction === 'draft'}
              itemLabel="Event"
            />
            <SaveConfirmation
              preset="published"
              onAction={async (status) => {
                form.setValue('status', status);
                await form.handleSubmit(handleSubmit)();
                return { slug: form.getValues().slug };
              }}
              disabled={isLoading}
              isSubmitting={busyAction === 'published'}
              itemLabel="Event"
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
              {/* Status Field */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">Basic info</h2>
                <div className="space-y-6">
                  <WebflowTextField
                    control={form.control}
                    name="title"
                    label="Name"
                    placeholder="Enter event name"
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

                    <WebflowSelectField
                      control={form.control}
                      name="attendanceType"
                      label="Attendance Type"
                      options={attendanceTypeOptions}
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
                  {/* Description Fields d */}
                  <WebflowRichTextField
                    control={form.control}
                    name="description"
                    label="Description"
                    placeholder="Enter event description..."
                    minHeight="200px"
                    helperText="Rich text editor with formatting options"
                  />

                  <WebflowRichTextField
                    control={form.control}
                    name="shortDescription"
                    label="Short Description"
                    placeholder="Brief event summary..."
                    minHeight="120px"
                    helperText="Concise rich text summary of the event"
                  />

                  {/* Additional Content Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowTextField
                      control={form.control}
                      name="arabicTitle"
                      label="Arabic Title"
                      placeholder="العنوان بالعربية"
                    />

                    <WebflowTextField
                      control={form.control}
                      name="teaserText"
                      label="Teaser Text"
                      placeholder="Catchy teaser text..."
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
                        placeholder="SEO-optimized title"
                        helperText="Recommended: 50-60 characters"
                      />

                      <WebflowTextareaField
                        control={form.control}
                        name="seoMetaDescription"
                        label="SEO Meta Description"
                        placeholder="Brief description for search engines"
                        rows={3}
                        helperText="Recommended: 150-160 characters"
                      />
                    </div>
                  </div>

                  {/* Date & Location Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowDateField
                      control={form.control}
                      name="eventDate"
                      label="Event Date"
                    />

                    <WebflowDateField
                      control={form.control}
                      name="endDate"
                      label="End Date"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowTextField
                      control={form.control}
                      name="city"
                      label="City"
                      placeholder="Enter city"
                    />

                    <WebflowTextField
                      control={form.control}
                      name="address"
                      label="Address"
                      placeholder="Enter full address"
                    />
                  </div>

                  <WebflowTextareaField
                    control={form.control}
                    name="extraLocationInformation"
                    label="Extra Location Information"
                    placeholder="Additional location details, parking info, accessibility notes..."
                    rows={3}
                  />

                  {/* Links and CTAs */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Links & CTAs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="rsvpLink"
                        label="RSVP Link"
                        placeholder="https://example.com/rsvp"
                        type="url"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="livestreamLink"
                        label="Livestream Link"
                        placeholder="https://example.com/livestream"
                        type="url"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="ctaLink"
                        label="CTA Link"
                        placeholder="https://example.com/action"
                        type="url"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="buttonCtaText"
                        label="CTA Button Text"
                        placeholder="Register Now"
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">Images</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowImageField
                        control={form.control}
                        name="thumbnail"
                        label="Thumbnail"
                        helperText="Small preview image (recommended: 400x300px)"
                        collectionType="events"
                        slug={form.watch('slug')}
                      />

                      <WebflowImageField
                        control={form.control}
                        name="heroImage"
                        label="Hero Image"
                        helperText="Large banner image (recommended: 1200x600px)"
                        collectionType="events"
                        slug={form.watch('slug')}
                      />
                    </div>

                    {/* Image Gallery */}
                    <WebflowImageField
                      control={form.control}
                      name="imageGallery"
                      label="Image Gallery"
                      multiple={true}
                      maxImages={10}
                      helperText="Multiple images for event gallery (up to 10 images)"
                      collectionType="events"
                      slug={form.watch('slug')}
                    />

                    <WebflowTextField
                      control={form.control}
                      name="galleryPhotoCredits"
                      label="Gallery Photo Credits"
                      placeholder="Photo credits for gallery images"
                    />
                  </div>

                  {/* Video Fields */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Video Content
                    </h3>

                    <WebflowSwitchField
                      control={form.control}
                      name="videoAsHero"
                      label="Use Video as Hero"
                      description="Display video instead of hero image"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="mainVideo"
                        label="Main Video URL"
                        placeholder="https://www.youtube.com/watch?v=..."
                        type="url"
                        helperText="YouTube, Vimeo, or direct video URL"
                      />

                      <WebflowTextareaField
                        control={form.control}
                        name="mainVideoEmbedCode"
                        label="Main Video Embed Code"
                        placeholder="<iframe src=... or custom embed code"
                        rows={3}
                        helperText="Alternative embed code for main video"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="video2"
                        label="Video #2 URL"
                        placeholder="https://www.youtube.com/watch?v=..."
                        type="url"
                      />

                      <WebflowTextareaField
                        control={form.control}
                        name="video2EmbedCode"
                        label="Video #2 Embed Code"
                        placeholder="<iframe src=... or custom embed code"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="video3"
                        label="Video #3 URL"
                        placeholder="https://www.youtube.com/watch?v=..."
                        type="url"
                      />

                      <WebflowTextareaField
                        control={form.control}
                        name="video3EmbedCode"
                        label="Video #3 Embed Code"
                        placeholder="<iframe src=... or custom embed code"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Rich Text Content Fields */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Rich Text Content
                    </h3>

                    <WebflowRichTextField
                      control={form.control}
                      name="signupEmbed"
                      label="Signup Embed"
                      placeholder="Signup form or registration embed code..."
                      minHeight="150px"
                      helperText="HTML embed code for registration forms"
                    />

                    <WebflowRichTextField
                      control={form.control}
                      name="moreInformation"
                      label="More Information"
                      placeholder="Additional event information..."
                      minHeight="200px"
                      helperText="Detailed information about the event"
                    />

                    <WebflowRichTextField
                      control={form.control}
                      name="moreDetails"
                      label="More Details"
                      placeholder="Extended event details..."
                      minHeight="200px"
                      helperText="Extended details section"
                    />

                    <WebflowRichTextField
                      control={form.control}
                      name="relatedPeopleRichText"
                      label="Related People (Rich Text)"
                      placeholder="Information about people involved..."
                      minHeight="150px"
                      helperText="Rich text description of related people"
                    />

                    <WebflowRichTextField
                      control={form.control}
                      name="inTheMedia"
                      label="In the Media"
                      placeholder="Media coverage and press mentions..."
                      minHeight="150px"
                      helperText="Media coverage and press related content"
                    />

                    <WebflowTextareaField
                      control={form.control}
                      name="customCodeForHidingWeglot"
                      label="Custom Code for Hiding Weglot"
                      placeholder="Custom CSS/JS code for Weglot integration"
                      rows={4}
                      helperText="Technical code for language selector integration"
                    />
                  </div>

                  {/* Dropdown Relationships */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Relationships
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowSelectField
                        control={form.control}
                        name="group"
                        label="Group"
                        options={groupOptions.map((opt) => ({
                          value: JSON.stringify({
                            id: opt.value,
                            slug: opt.value
                          }),
                          label: opt.label
                        }))}
                        placeholder="Select a group"
                      />

                      <WebflowSelectField
                        control={form.control}
                        name="programmeLabel"
                        label="Programme Label"
                        options={programmeLabelOptions.map((opt) => ({
                          value: JSON.stringify({
                            id: opt.value,
                            slug: opt.value
                          }),
                          label: opt.label
                        }))}
                        placeholder="Select a programme"
                      />
                    </div>
                  </div>

                  {/* Multi-reference Fields */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Multi-Reference Fields
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowReferenceSelectField
                        control={form.control}
                        name="relatedProgrammes"
                        label="Related Programmes"
                        collectionType="programme"
                        multiple
                        statusFilter="all"
                        placeholder="Search programmes"
                        helperText="Programmes related to this event"
                      />

                      <WebflowReferenceSelectField
                        control={form.control}
                        name="tags"
                        label="Tags"
                        collectionType="tag"
                        multiple
                        statusFilter="all"
                        placeholder="Search tags"
                        helperText="Categorization tags"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowReferenceSelectField
                        control={form.control}
                        name="relatedPeople"
                        label="Related People"
                        collectionType="people"
                        multiple
                        statusFilter="all"
                        placeholder="Search people"
                        helperText="People involved in this event"
                      />

                      <WebflowReferenceSelectField
                        control={form.control}
                        name="organisers"
                        label="Organisers"
                        collectionType="partner" // changed from people to partner
                        multiple
                        statusFilter="all"
                        placeholder="Search organising partners"
                        helperText="Partner organisations acting as organisers"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowReferenceSelectField
                        control={form.control}
                        name="partners"
                        label="Partners"
                        collectionType="partner"
                        multiple
                        statusFilter="all"
                        placeholder="Search partners"
                        helperText="Partner organizations"
                      />

                      <WebflowReferenceSelectField
                        control={form.control}
                        name="withRepresentativesFrom"
                        label="With Representatives From"
                        collectionType="partner"
                        multiple
                        statusFilter="all"
                        placeholder="Search organizations"
                        helperText="Organizations with representatives"
                      />
                    </div>
                  </div>

                  {/* Settings & Boolean Toggles */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Settings
                    </h3>

                    <WebflowSwitchField
                      control={form.control}
                      name="featured"
                      label="Featured Event"
                      description="Display this event prominently on the homepage"
                    />

                    <WebflowSwitchField
                      control={form.control}
                      name="pushToGr"
                      label="Push to GR"
                      description="Include in global repository distribution"
                    />

                    <WebflowSwitchField
                      control={form.control}
                      name="newsOnOff"
                      label="Show in News"
                      description="Display this event in news-related sections"
                    />

                    <WebflowSwitchField
                      control={form.control}
                      name="moreDetailsOnOff"
                      label="Show More Details Section"
                      description="Enable the additional details section"
                    />

                    <WebflowSwitchField
                      control={form.control}
                      name="inTheMediaOnOff"
                      label="Show In The Media Section"
                      description="Enable the media coverage section"
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
                ? 'Update Event'
                : 'Create Event'}
          </button>
        </form>
      </Form>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? Any unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
            >
              Continue Editing
            </Button>
            <Button variant="destructive" onClick={onCancel}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
