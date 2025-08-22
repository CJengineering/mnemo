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
  WebflowImageField,
  // WebflowTagsField, // removed legacy tags field
  WebflowRichTextField,
  WebflowReferenceSelectField // added unified reference selector
} from './webflow-form-fields';
import { IncomingTeamData } from '../interfaces-incoming';
import { generateSlug } from './base-form';
import './compact-form.css';
import { SaveConfirmation } from '@/components/ui/save-confirmation';

// Webflow CMS Team Schema
const webflowTeamSchema = z.object({
  title: z.string().min(1, 'Name is required'), // maps to name
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft'),
  name: z.string().min(1, 'Name is required'),
  nameArabic: z.string().optional(),
  position: z.string().optional(),
  positionArabic: z.string().optional(),
  photo: z.object({
    url: z.string().min(1, 'Photo is required'),
    alt: z.string().optional()
  }),
  photoHires: z.string().url().optional().or(z.literal('')),
  paragraphDescription: z.string().min(1, 'Biography is required'),
  biographyArabic: z.string().optional(),
  metaDescription: z.string().optional(),
  metaDescriptionArabic: z.string().optional(),
  altTextImage: z.string().optional(),
  altTextImageArabic: z.string().optional(),
  filter: z
    .enum([
      'Leadership',
      'Team',
      'Advisory Committee',
      'Alumnus',
      'COP27 Youth Delegate'
    ])
    .optional(),
  order: z.number().min(0, 'Order must be a positive number'),
  newsOnOff: z.boolean().default(false),
  // Tags now store only slugs
  tags: z.array(z.string()).default([])
});

type WebflowTeamFormData = z.infer<typeof webflowTeamSchema>;

interface WebflowTeamFormProps {
  initialData?: Partial<IncomingTeamData>;
  onSubmit: (data: IncomingTeamData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isEditing?: boolean;
}

export interface WebflowTeamFormRef {
  triggerSubmit: () => void;
  setStatus: (status: 'draft' | 'published') => void;
}

export const WebflowTeamForm = forwardRef<
  WebflowTeamFormRef,
  WebflowTeamFormProps
>(({ initialData, onSubmit, onCancel, onDelete, isEditing = false }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<WebflowTeamFormData>({
    resolver: zodResolver(webflowTeamSchema),
    defaultValues: {
      title: initialData?.name || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      name: initialData?.name || '',
      nameArabic: initialData?.nameArabic || '',
      position: initialData?.position || '',
      positionArabic: initialData?.positionArabic || '',
      photo: initialData?.photo || { url: '', alt: '' },
      photoHires: initialData?.photoHires || '',
      paragraphDescription: initialData?.paragraphDescription || '',
      biographyArabic: initialData?.biographyArabic || '',
      metaDescription: initialData?.metaDescription || '',
      metaDescriptionArabic: initialData?.metaDescriptionArabic || '',
      altTextImage: initialData?.altTextImage || '',
      altTextImageArabic: initialData?.altTextImageArabic || '',
      filter: initialData?.filter || undefined,
      order: initialData?.order || 0,
      newsOnOff: initialData?.newsOnOff || false,
      // map incoming tag objects -> slug[]
      tags: (initialData?.tags || []).map((t) => t.slug)
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
  })); // Reset form when initialData changes (when switching between items)
  useEffect(() => {
    const newValues = {
      title: initialData?.name || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      name: initialData?.name || '',
      nameArabic: initialData?.nameArabic || '',
      position: initialData?.position || '',
      positionArabic: initialData?.positionArabic || '',
      photo: initialData?.photo || { url: '', alt: '' },
      photoHires: initialData?.photoHires || '',
      paragraphDescription: initialData?.paragraphDescription || '',
      biographyArabic: initialData?.biographyArabic || '',
      metaDescription: initialData?.metaDescription || '',
      metaDescriptionArabic: initialData?.metaDescriptionArabic || '',
      altTextImage: initialData?.altTextImage || '',
      altTextImageArabic: initialData?.altTextImageArabic || '',
      filter: initialData?.filter || undefined,
      order: initialData?.order || 0,
      newsOnOff: initialData?.newsOnOff || false,
      tags: (initialData?.tags || []).map((t) => t.slug)
    };

    form.reset(newValues);
  }, [initialData, form]);

  // Manual slug generation function
  const handleGenerateSlug = () => {
    const currentName = form.getValues('name');
    if (currentName) {
      form.setValue('slug', generateSlug(currentName));
    }
  };

  // Sync title with name field (one-way to avoid circular dependency)
  useEffect(() => {
    const subscription = form.watch((value, { name: fieldName }) => {
      if (fieldName === 'name' && value.name) {
        form.setValue('title', value.name);
      }
    });
    return subscription.unsubscribe;
  }, [form]);

  const handleSubmit = async (data: WebflowTeamFormData) => {
    console.log(
      '📋 Team Form Raw Data (slug-based tags):',
      JSON.stringify(data, null, 2)
    );

    // Reconstruct reference objects for API consumption
    const reconstructedTags =
      data.tags?.map((slug) => ({ id: '', slug })) || [];

    const outgoing: IncomingTeamData = {
      // direct mappings
      title: data.name, // keep title synced with name
      slug: data.slug,
      status: data.status,
      name: data.name,
      nameArabic: data.nameArabic || undefined,
      position: data.position || undefined,
      positionArabic: data.positionArabic || undefined,
      photo: { url: data.photo.url, alt: data.photo.alt || '' },
      photoHires: data.photoHires || undefined,
      paragraphDescription: data.paragraphDescription,
      biographyArabic: data.biographyArabic || undefined,
      metaDescription: data.metaDescription || undefined,
      metaDescriptionArabic: data.metaDescriptionArabic || undefined,
      altTextImage: data.altTextImage || undefined,
      altTextImageArabic: data.altTextImageArabic || undefined,
      filter: data.filter || undefined,
      order: data.order,
      newsOnOff: data.newsOnOff,
      tags: reconstructedTags
    };

    console.log(
      '⬆️ Team Form Outgoing (reconstructed):',
      JSON.stringify(outgoing, null, 2)
    );

    try {
      setIsLoading(true);
      await onSubmit(outgoing);
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

  const filterOptions = [
    { value: 'Leadership', label: 'Leadership' },
    { value: 'Team', label: 'Team' },
    { value: 'Advisory Committee', label: 'Advisory Committee' },
    { value: 'Alumnus', label: 'Alumnus' },
    { value: 'COP27 Youth Delegate', label: 'COP27 Youth Delegate' }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900 prevent-layout-shift">
      {/* Action Bar with Delete Button */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 p-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {isEditing ? 'Edit' : 'Create'} Team Member
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
              itemLabel="Team Member"
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
                    name="name"
                    label="Name"
                    placeholder="Enter team member name"
                    required
                  />

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
                        variant="default"
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
                      name="filter"
                      label="Team Category"
                      options={filterOptions}
                      placeholder="Select category"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowTextField
                      control={form.control}
                      name="position"
                      label="Position"
                      placeholder="Job title or role"
                    />

                    <WebflowTextField
                      control={form.control}
                      name="order"
                      label="Display Order"
                      placeholder="0"
                      type="number"
                      helperText="Lower numbers appear first"
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
                  {/* Profile Photo */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Profile Photo
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowImageField
                        control={form.control}
                        name="photo"
                        label="Profile Photo"
                        helperText="Required - Main profile image"
                        required
                        collectionType="team"
                        slug={form.watch('slug')}
                      />

                      <WebflowTextField
                        control={form.control}
                        name="photoHires"
                        label="High-res Photo URL"
                        placeholder="https://example.com/photo-hires.jpg"
                        type="url"
                        helperText="Optional high-resolution version"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="altTextImage"
                        label="Alt Text (English)"
                        placeholder="Describe the image for accessibility"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="altTextImageArabic"
                        label="Alt Text (Arabic)"
                        placeholder="وصف الصورة بالعربية"
                      />
                    </div>
                  </div>

                  {/* Biography Content */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Biography
                    </h3>

                    <WebflowRichTextField
                      control={form.control}
                      name="paragraphDescription"
                      label="Biography (English)"
                      placeholder="Enter detailed biography..."
                      minHeight="200px"
                      helperText="Required - Rich text editor with formatting options"
                      required
                    />

                    <WebflowRichTextField
                      control={form.control}
                      name="biographyArabic"
                      label="Biography (Arabic)"
                      placeholder="السيرة الذاتية بالعربية..."
                      minHeight="200px"
                      helperText="Optional Arabic biography"
                    />
                  </div>

                  {/* Multilingual Fields */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Multilingual Content
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="nameArabic"
                        label="Name (Arabic)"
                        placeholder="الاسم بالعربية"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="positionArabic"
                        label="Position (Arabic)"
                        placeholder="المنصب بالعربية"
                      />
                    </div>
                  </div>

                  {/* Meta Information */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Meta Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextareaField
                        control={form.control}
                        name="metaDescription"
                        label="Meta Description (English)"
                        placeholder="SEO description for search engines"
                        rows={3}
                        helperText="Recommended: 150-160 characters"
                      />

                      <WebflowTextareaField
                        control={form.control}
                        name="metaDescriptionArabic"
                        label="Meta Description (Arabic)"
                        placeholder="وصف تحسين محركات البحث بالعربية"
                        rows={3}
                        helperText="Optional Arabic meta description"
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
                    placeholder="Search & select tags"
                    helperText="Add relevant tags for categorization"
                  />

                  {/* Settings */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Settings
                    </h3>

                    <WebflowSwitchField
                      control={form.control}
                      name="newsOnOff"
                      label="Show in News"
                      description="Include this team member in news-related content"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Submit Button - The form is submitted via the header buttons */}
          <button type="submit" className="hidden" disabled={isLoading}>
            {isEditing ? 'Update Team Member' : 'Create Team Member'}
          </button>
        </form>
      </Form>
    </div>
  );
});

WebflowTeamForm.displayName = 'WebflowTeamForm';
