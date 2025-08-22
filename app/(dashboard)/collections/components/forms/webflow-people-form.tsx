'use client';

import React, {
  useEffect,
  useImperativeHandle,
  useState,
  forwardRef
} from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  WebflowTextField,
  WebflowSlugField,
  WebflowTextareaField,
  WebflowSelectField,
  WebflowSwitchField,
  WebflowImageField,
  WebflowTagsField,
  WebflowRichTextField
} from './webflow-form-fields';
import { IncomingPersonData } from '../interfaces-incoming';
import { generateSlug } from './base-form';
import './compact-form.css';

// Reference and Image helpers (mirror shapes used elsewhere)
const referenceItemSchema = z.object({ id: z.string(), slug: z.string() });
const imageFieldSchema = z.object({
  url: z.string().optional().or(z.literal('')),
  alt: z.string().optional()
});

// Zod schema for People form (camelCase field names for form usage)
const webflowPeopleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft'),

  // Core
  name: z.string().min(1, 'Name is required'),
  nameArabic: z.string().optional(),
  arabicOnOff: z.boolean().default(false),
  pushToGr: z.boolean().default(false),
  hero: z.boolean().default(false),

  // Programme relations
  relatedProgramme: referenceItemSchema.optional(),
  relatedProgrammes: z.array(referenceItemSchema).default([]),

  // Appearance
  color: z.string().optional(),

  // Roles
  role: z.string().optional(),
  roleArabic: z.string().optional(),

  // Descriptions
  shortDescription: z.string().optional(),
  shortDescriptionArabic: z.string().optional(),

  // Rich text
  biography: z.string().optional(),
  biographyArabic: z.string().optional(),
  events: z.string().optional(),
  eventsArabic: z.string().optional(),
  researchAreaEnglish: z.string().optional(),
  researchAreasArabic: z.string().optional(),

  // Type classification
  type: z.string().optional(),

  // Media
  heroImage: imageFieldSchema.optional(),
  profilePicture: imageFieldSchema.optional(),

  // Video
  featureVideo: z.string().optional(),

  // Relations
  relatedPeopleS: z.array(referenceItemSchema).default([]),
  partnerOrganisation: z.array(referenceItemSchema).default([]),

  // Social
  instagramLink: z.string().optional(),
  linkedinLink: z.string().optional(),
  twitterLink: z.string().optional(),
  facebook: z.string().optional(),
  youtubeLink: z.string().optional(),
  github: z.string().optional(),
  websiteLink: z.string().optional(),
  shop: z.string().optional(),

  // Gallery
  photos: z.array(imageFieldSchema).default([]),

  // Visibility
  hideNews: z.boolean().default(false),
  hideMultimedia: z.boolean().default(false),
  hideEvents: z.boolean().default(false),
  hidePublications: z.boolean().default(false),
  hidePhotos: z.boolean().default(false),
  hideEventsRichText: z.boolean().default(false),

  // Additional relations
  multimedia: z.array(referenceItemSchema).default([]),
  tag: z.array(referenceItemSchema).default([]),

  // Ordering and location
  order: z.number().optional(),
  country: z.string().optional()
});

export type WebflowPeopleFormData = z.infer<typeof webflowPeopleSchema>;

interface WebflowPeopleFormProps {
  initialData?: Partial<IncomingPersonData>;
  onSubmit: (data: IncomingPersonData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isEditing?: boolean;
}

export interface WebflowPeopleFormRef {
  triggerSubmit: () => void;
  setStatus: (status: 'draft' | 'published') => void;
}

// Map camelCase form data to IncomingPersonData with kebab-case keys
function toIncoming(data: WebflowPeopleFormData): IncomingPersonData {
  return {
    title: data.title,
    slug: data.slug,
    status: data.status,
    name: data.name,
    'name-arabic': data.nameArabic,
    'arabic-on-off': data.arabicOnOff,
    'push-to-gr': data.pushToGr,
    hero: data.hero,
    'related-programme': data.relatedProgramme,
    'related-programmes': data.relatedProgrammes,
    color: data.color,
    role: data.role,
    'role-arabic': data.roleArabic,
    'short-description': data.shortDescription,
    'short-description-arabic': data.shortDescriptionArabic,
    biography: data.biography,
    'biography-arabic': data.biographyArabic,
    events: data.events,
    'events-arabic': data.eventsArabic,
    'research-area-english': data.researchAreaEnglish,
    'research-areas-arabic': data.researchAreasArabic,
    type: data.type,
    'hero-image': data.heroImage as any,
    'profile-picture': data.profilePicture as any,
    'feature-video': data.featureVideo,
    'related-people-s': data.relatedPeopleS,
    'partner-organisation': data.partnerOrganisation,
    'instagram-link': data.instagramLink,
    'linkedin-link': data.linkedinLink,
    'twitter-link': data.twitterLink,
    facebook: data.facebook,
    'youtube-link': data.youtubeLink,
    github: data.github,
    'website-link': data.websiteLink,
    shop: data.shop,
    photos: data.photos as any,
    'hide-news': data.hideNews,
    'hide-multimedia': data.hideMultimedia,
    'hide-events': data.hideEvents,
    'hide-publications': data.hidePublications,
    'hide-photos': data.hidePhotos,
    'hide-events-rich-text': data.hideEventsRichText,
    multimedia: data.multimedia,
    tag: data.tag,
    order: data.order,
    country: data.country
  };
}

export const WebflowPeopleForm = forwardRef<
  WebflowPeopleFormRef,
  WebflowPeopleFormProps
>(({ initialData, onSubmit, onCancel, onDelete, isEditing = false }, ref) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WebflowPeopleFormData>({
    resolver: zodResolver(webflowPeopleSchema),
    defaultValues: {
      title:
        (initialData?.title as string) || (initialData?.name as string) || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',

      name: (initialData?.name as string) || '',
      nameArabic: (initialData?.['name-arabic'] as string) || '',
      arabicOnOff: Boolean(initialData?.['arabic-on-off']) || false,
      pushToGr: Boolean(initialData?.['push-to-gr']) || false,
      hero: Boolean(initialData?.hero) || false,

      relatedProgramme:
        (initialData?.['related-programme'] as any) || undefined,
      relatedProgrammes: (initialData?.['related-programmes'] as any) || [],

      color: (initialData?.color as string) || '',

      role: (initialData?.role as string) || '',
      roleArabic: (initialData?.['role-arabic'] as string) || '',

      shortDescription: (initialData?.['short-description'] as string) || '',
      shortDescriptionArabic:
        (initialData?.['short-description-arabic'] as string) || '',

      biography: (initialData?.biography as string) || '',
      biographyArabic: (initialData?.['biography-arabic'] as string) || '',
      events: (initialData?.events as string) || '',
      eventsArabic: (initialData?.['events-arabic'] as string) || '',
      researchAreaEnglish:
        (initialData?.['research-area-english'] as string) || '',
      researchAreasArabic:
        (initialData?.['research-areas-arabic'] as string) || '',

      type: (initialData?.type as string) || '',

      heroImage: (initialData?.['hero-image'] as any) || { url: '', alt: '' },
      profilePicture: (initialData?.['profile-picture'] as any) || {
        url: '',
        alt: ''
      },

      featureVideo: (initialData?.['feature-video'] as string) || '',

      relatedPeopleS: (initialData?.['related-people-s'] as any) || [],
      partnerOrganisation: (initialData?.['partner-organisation'] as any) || [],

      instagramLink: (initialData?.['instagram-link'] as string) || '',
      linkedinLink: (initialData?.['linkedin-link'] as string) || '',
      twitterLink: (initialData?.['twitter-link'] as string) || '',
      facebook: (initialData?.facebook as string) || '',
      youtubeLink: (initialData?.['youtube-link'] as string) || '',
      github: (initialData?.github as string) || '',
      websiteLink: (initialData?.['website-link'] as string) || '',
      shop: (initialData?.shop as string) || '',

      photos: (initialData?.photos as any) || [],

      hideNews: Boolean(initialData?.['hide-news']) || false,
      hideMultimedia: Boolean(initialData?.['hide-multimedia']) || false,
      hideEvents: Boolean(initialData?.['hide-events']) || false,
      hidePublications: Boolean(initialData?.['hide-publications']) || false,
      hidePhotos: Boolean(initialData?.['hide-photos']) || false,
      hideEventsRichText:
        Boolean(initialData?.['hide-events-rich-text']) || false,

      multimedia: (initialData?.multimedia as any) || [],
      tag: (initialData?.tag as any) || [],

      order: (initialData?.order as number) || undefined,
      country: (initialData?.country as string) || ''
    }
  });

  // Reset when initialData changes
  useEffect(() => {
    form.reset({
      title:
        (initialData?.title as string) || (initialData?.name as string) || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      name: (initialData?.name as string) || '',
      nameArabic: (initialData?.['name-arabic'] as string) || '',
      arabicOnOff: Boolean(initialData?.['arabic-on-off']) || false,
      pushToGr: Boolean(initialData?.['push-to-gr']) || false,
      hero: Boolean(initialData?.hero) || false,
      relatedProgramme:
        (initialData?.['related-programme'] as any) || undefined,
      relatedProgrammes: (initialData?.['related-programmes'] as any) || [],
      color: (initialData?.color as string) || '',
      role: (initialData?.role as string) || '',
      roleArabic: (initialData?.['role-arabic'] as string) || '',
      shortDescription: (initialData?.['short-description'] as string) || '',
      shortDescriptionArabic:
        (initialData?.['short-description-arabic'] as string) || '',
      biography: (initialData?.biography as string) || '',
      biographyArabic: (initialData?.['biography-arabic'] as string) || '',
      events: (initialData?.events as string) || '',
      eventsArabic: (initialData?.['events-arabic'] as string) || '',
      researchAreaEnglish:
        (initialData?.['research-area-english'] as string) || '',
      researchAreasArabic:
        (initialData?.['research-areas-arabic'] as string) || '',
      type: (initialData?.type as string) || '',
      heroImage: (initialData?.['hero-image'] as any) || { url: '', alt: '' },
      profilePicture: (initialData?.['profile-picture'] as any) || {
        url: '',
        alt: ''
      },
      featureVideo: (initialData?.['feature-video'] as string) || '',
      relatedPeopleS: (initialData?.['related-people-s'] as any) || [],
      partnerOrganisation: (initialData?.['partner-organisation'] as any) || [],
      instagramLink: (initialData?.['instagram-link'] as string) || '',
      linkedinLink: (initialData?.['linkedin-link'] as string) || '',
      twitterLink: (initialData?.['twitter-link'] as string) || '',
      facebook: (initialData?.facebook as string) || '',
      youtubeLink: (initialData?.['youtube-link'] as string) || '',
      github: (initialData?.github as string) || '',
      websiteLink: (initialData?.['website-link'] as string) || '',
      shop: (initialData?.shop as string) || '',
      photos: (initialData?.photos as any) || [],
      hideNews: Boolean(initialData?.['hide-news']) || false,
      hideMultimedia: Boolean(initialData?.['hide-multimedia']) || false,
      hideEvents: Boolean(initialData?.['hide-events']) || false,
      hidePublications: Boolean(initialData?.['hide-publications']) || false,
      hidePhotos: Boolean(initialData?.['hide-photos']) || false,
      hideEventsRichText:
        Boolean(initialData?.['hide-events-rich-text']) || false,
      multimedia: (initialData?.multimedia as any) || [],
      tag: (initialData?.tag as any) || [],
      order: (initialData?.order as number) || undefined,
      country: (initialData?.country as string) || ''
    });
  }, [initialData, form]);

  // Ref API
  useImperativeHandle(ref, () => ({
    triggerSubmit: () => form.handleSubmit(handleSubmit)(),
    setStatus: (status: 'draft' | 'published') =>
      form.setValue('status', status)
  }));

  // Manual slug generation from name
  const handleGenerateSlug = () => {
    const currentName = form.getValues('name');
    if (currentName) form.setValue('slug', generateSlug(currentName));
  };

  const handleSubmit = async (data: WebflowPeopleFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(toIncoming(data));
    } catch (e) {
      console.error('People form submit error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' }
  ];

  // Mock select options (replace with real data later)
  const programmeOptions = [
    { value: 'prog-1', label: 'Water Security' },
    { value: 'prog-2', label: 'Climate Change' },
    { value: 'prog-3', label: 'Education' }
  ];

  return (
    <div className="h-full flex flex-col prevent-layout-shift">
      {/* Header actions */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 p-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {isEditing ? 'Edit' : 'Create'} Person
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
              {/* Basic Info */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">Basic info</h2>
                <div className="space-y-6">
                  <WebflowTextField
                    control={form.control}
                    name="name"
                    label="Full Name"
                    required
                    placeholder="Enter full name"
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
                      disabled={!form.watch('name')}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    >
                      Generate Slug from Name
                    </Button>
                    {form.watch('name') && !form.watch('slug') && (
                      <span className="text-xs text-yellow-400">
                        💡 Enter a name to generate slug
                      </span>
                    )}
                    {form.watch('name') && form.watch('slug') && (
                      <span className="text-xs text-green-400">
                        ✅ Slug ready
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowTextField
                      control={form.control}
                      name="title"
                      label="Title"
                      placeholder="Display title (defaults to name)"
                    />
                    <WebflowSelectField
                      control={form.control}
                      name="status"
                      label="Status"
                      options={statusOptions}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <WebflowTextField
                      control={form.control}
                      name="nameArabic"
                      label="Name (Arabic)"
                      placeholder="الاسم بالعربية"
                    />
                    <WebflowSwitchField
                      control={form.control}
                      name="arabicOnOff"
                      label="Arabic Content"
                      description="Mark if Arabic content is available"
                    />
                    <WebflowSwitchField
                      control={form.control}
                      name="pushToGr"
                      label="Push to Global Repository"
                    />
                  </div>

                  <WebflowSwitchField
                    control={form.control}
                    name="hero"
                    label="Hero"
                    description="Feature this person as hero"
                  />
                </div>
              </div>

              {/* Role & Descriptions */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">
                  Role & Description
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WebflowTextField
                    control={form.control}
                    name="role"
                    label="Role (English)"
                    placeholder="e.g., Professor"
                  />
                  <WebflowTextField
                    control={form.control}
                    name="roleArabic"
                    label="Role (Arabic)"
                    placeholder="الدور"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WebflowTextareaField
                    control={form.control}
                    name="shortDescription"
                    label="Short Description (EN)"
                    rows={3}
                  />
                  <WebflowTextareaField
                    control={form.control}
                    name="shortDescriptionArabic"
                    label="Short Description (AR)"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WebflowRichTextField
                    control={form.control}
                    name="biography"
                    label="Biography (EN)"
                    minHeight="220px"
                  />
                  <WebflowRichTextField
                    control={form.control}
                    name="biographyArabic"
                    label="Biography (AR)"
                    minHeight="220px"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WebflowRichTextField
                    control={form.control}
                    name="events"
                    label="Events (EN)"
                    minHeight="180px"
                  />
                  <WebflowRichTextField
                    control={form.control}
                    name="eventsArabic"
                    label="Events (AR)"
                    minHeight="180px"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WebflowRichTextField
                    control={form.control}
                    name="researchAreaEnglish"
                    label="Research Areas (EN)"
                    minHeight="160px"
                  />
                  <WebflowRichTextField
                    control={form.control}
                    name="researchAreasArabic"
                    label="Research Areas (AR)"
                    minHeight="160px"
                  />
                </div>
              </div>

              {/* Relationships */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">
                  Relationships
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WebflowSelectField
                    control={form.control}
                    name="relatedProgramme"
                    label="Related Programme"
                    options={programmeOptions}
                    placeholder="Select programme"
                  />
                  <WebflowTagsField
                    control={form.control}
                    name="relatedProgrammes"
                    label="Related Programmes"
                    helperText="Multiple programmes (multi-select)"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WebflowTagsField
                    control={form.control}
                    name="relatedPeopleS"
                    label="Related People"
                    helperText="People linked to this person"
                  />
                  <WebflowTagsField
                    control={form.control}
                    name="partnerOrganisation"
                    label="Partner Organisations"
                    helperText="Associated organisations"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WebflowTagsField
                    control={form.control}
                    name="multimedia"
                    label="Multimedia"
                    helperText="Linked multimedia items"
                  />
                  <WebflowTagsField
                    control={form.control}
                    name="tag"
                    label="Tags"
                    helperText="Tag this profile"
                  />
                </div>
              </div>

              {/* Media */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">Media</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WebflowImageField
                    control={form.control}
                    name="heroImage"
                    label="Hero Image"
                    collectionType="people"
                    slug={form.watch('slug')}
                    helperText="Large banner image"
                  />
                  <WebflowImageField
                    control={form.control}
                    name="profilePicture"
                    label="Profile Picture"
                    collectionType="people"
                    slug={form.watch('slug')}
                    helperText="Square headshot"
                  />
                </div>
                <WebflowImageField
                  control={form.control}
                  name="photos"
                  label="Photo Gallery"
                  multiple
                  maxImages={12}
                  collectionType="people"
                  slug={form.watch('slug')}
                  helperText="Upload up to 12 images"
                />
              </div>

              {/* Video & Social */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">
                  Video & Social
                </h2>
                <WebflowTextField
                  control={form.control}
                  name="featureVideo"
                  label="Feature Video (YouTube ID)"
                  placeholder="dQw4w9WgXcQ"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <WebflowTextField
                    control={form.control}
                    name="instagramLink"
                    label="Instagram"
                    placeholder="https://instagram.com/..."
                  />
                  <WebflowTextField
                    control={form.control}
                    name="linkedinLink"
                    label="LinkedIn"
                    placeholder="https://linkedin.com/in/..."
                  />
                  <WebflowTextField
                    control={form.control}
                    name="twitterLink"
                    label="Twitter/X"
                    placeholder="https://x.com/..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <WebflowTextField
                    control={form.control}
                    name="facebook"
                    label="Facebook"
                    placeholder="https://facebook.com/..."
                  />
                  <WebflowTextField
                    control={form.control}
                    name="youtubeLink"
                    label="YouTube"
                    placeholder="https://youtube.com/@..."
                  />
                  <WebflowTextField
                    control={form.control}
                    name="github"
                    label="GitHub"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WebflowTextField
                    control={form.control}
                    name="websiteLink"
                    label="Website"
                    placeholder="https://example.com"
                  />
                  <WebflowTextField
                    control={form.control}
                    name="shop"
                    label="Shop"
                    placeholder="https://shop.example.com"
                  />
                </div>
              </div>

              {/* Visibility & Settings */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">
                  Visibility & Settings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <WebflowSwitchField
                    control={form.control}
                    name="hideNews"
                    label="Hide News"
                  />
                  <WebflowSwitchField
                    control={form.control}
                    name="hideMultimedia"
                    label="Hide Multimedia"
                  />
                  <WebflowSwitchField
                    control={form.control}
                    name="hideEvents"
                    label="Hide Events"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <WebflowSwitchField
                    control={form.control}
                    name="hidePublications"
                    label="Hide Publications"
                  />
                  <WebflowSwitchField
                    control={form.control}
                    name="hidePhotos"
                    label="Hide Photos"
                  />
                  <WebflowSwitchField
                    control={form.control}
                    name="hideEventsRichText"
                    label="Hide Events (Rich Text)"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <WebflowTextField
                    control={form.control}
                    name="order"
                    label="Order"
                    type="number"
                    placeholder="e.g., 10"
                  />
                  <WebflowTextField
                    control={form.control}
                    name="country"
                    label="Country"
                    placeholder="Country"
                  />
                  <WebflowTextField
                    control={form.control}
                    name="color"
                    label="Color"
                    placeholder="#000000 or name"
                  />
                </div>
                <WebflowTextField
                  control={form.control}
                  name="type"
                  label="Type"
                  placeholder="Professor, Doctor, etc."
                />
              </div>
            </div>
          </div>

          {/* Hidden Submit Button */}
          <button type="submit" className="hidden" disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : isEditing
                ? 'Update Person'
                : 'Create Person'}
          </button>
        </form>
      </Form>
    </div>
  );
});

WebflowPeopleForm.displayName = 'WebflowPeopleForm';
