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
  WebflowTagsField
} from './webflow-form-fields';
import { IncomingProgrammeData } from '../interfaces-incoming';
import { generateSlug } from './base-form';

// Webflow CMS Programme Schema
const webflowProgrammeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft'),
  description: z.string().optional(),
  type: z
    .enum([
      'Centre',
      'Fund',
      'Scholarship',
      'Project',
      'Programme',
      'Lab',
      'Community Jameel'
    ])
    .optional(),
  nameArabic: z.string().optional(),
  shortNameEnglish: z.string().optional(),
  shortNameArabic: z.string().optional(),
  missionEnglish: z.string().optional(),
  missionArabic: z.string().optional(),
  summaryEnglish: z.string().optional(),
  summaryArabic: z.string().optional(),
  researchEnglish: z.string().optional(),
  researchArabic: z.string().optional(),
  yearEstablished: z.number().optional(),
  yearClosed: z.number().optional(),
  headquartersEnglish: z.string().optional(),
  headquartersArabic: z.string().optional(),
  logoSvgDark: z
    .object({
      url: z.string().optional(),
      alt: z.string().optional()
    })
    .optional(),
  logoSvgLight: z
    .object({
      url: z.string().optional(),
      alt: z.string().optional()
    })
    .optional(),
  heroSquare: z
    .object({
      url: z.string().optional(),
      alt: z.string().optional()
    })
    .optional(),
  heroWide: z
    .object({
      url: z.string().optional(),
      alt: z.string().optional()
    })
    .optional(),
  longitude: z.string().optional(),
  latitude: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  features: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string()
      })
    )
    .default([]),
  partners: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string()
      })
    )
    .default([]),
  leadership: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string()
      })
    )
    .default([]),
  relatedProgrammes: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string()
      })
    )
    .default([]),
  lab: z.boolean().default(false),
  pushToGR: z.boolean().default(false),
  order: z.number().optional()
});

type WebflowProgrammeFormData = z.infer<typeof webflowProgrammeSchema>;

interface WebflowProgrammeFormProps {
  initialData?: Partial<IncomingProgrammeData>;
  onSubmit: (data: IncomingProgrammeData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isEditing?: boolean;
}

export interface WebflowProgrammeFormRef {
  triggerSubmit: () => void;
  setStatus: (status: 'draft' | 'published') => void;
}

export const WebflowProgrammeForm = forwardRef<
  WebflowProgrammeFormRef,
  WebflowProgrammeFormProps
>(({ initialData, onSubmit, onCancel, onDelete, isEditing = false }, ref) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WebflowProgrammeFormData>({
    resolver: zodResolver(webflowProgrammeSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      description: initialData?.description || '',
      type: initialData?.type || undefined,
      nameArabic: initialData?.nameArabic || '',
      shortNameEnglish: initialData?.shortNameEnglish || '',
      shortNameArabic: initialData?.shortNameArabic || '',
      missionEnglish: initialData?.missionEnglish || '',
      missionArabic: initialData?.missionArabic || '',
      summaryEnglish: initialData?.summaryEnglish || '',
      summaryArabic: initialData?.summaryArabic || '',
      researchEnglish: initialData?.researchEnglish || '',
      researchArabic: initialData?.researchArabic || '',
      yearEstablished: initialData?.yearEstablished || undefined,
      yearClosed: initialData?.yearClosed || undefined,
      headquartersEnglish: initialData?.headquartersEnglish || '',
      headquartersArabic: initialData?.headquartersArabic || '',
      logoSvgDark: initialData?.logoSvgDark || { url: '', alt: '' },
      logoSvgLight: initialData?.logoSvgLight || { url: '', alt: '' },
      heroSquare: initialData?.heroSquare || { url: '', alt: '' },
      heroWide: initialData?.heroWide || { url: '', alt: '' },
      longitude: initialData?.longitude || '',
      latitude: initialData?.latitude || '',
      website: initialData?.website || '',
      linkedin: initialData?.linkedin || '',
      instagram: initialData?.instagram || '',
      twitter: initialData?.twitter || '',
      features: initialData?.features || [],
      partners: initialData?.partners || [],
      leadership: initialData?.leadership || [],
      relatedProgrammes: initialData?.relatedProgrammes || [],
      lab: initialData?.lab || false,
      pushToGR: initialData?.pushToGR || false,
      order: initialData?.order || undefined
    }
  });

  // Reset form when initialData changes (when switching between items)
  useEffect(() => {
    const newValues = {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      description: initialData?.description || '',
      type: initialData?.type || undefined,
      nameArabic: initialData?.nameArabic || '',
      shortNameEnglish: initialData?.shortNameEnglish || '',
      shortNameArabic: initialData?.shortNameArabic || '',
      missionEnglish: initialData?.missionEnglish || '',
      missionArabic: initialData?.missionArabic || '',
      summaryEnglish: initialData?.summaryEnglish || '',
      summaryArabic: initialData?.summaryArabic || '',
      researchEnglish: initialData?.researchEnglish || '',
      researchArabic: initialData?.researchArabic || '',
      yearEstablished: initialData?.yearEstablished || undefined,
      yearClosed: initialData?.yearClosed || undefined,
      headquartersEnglish: initialData?.headquartersEnglish || '',
      headquartersArabic: initialData?.headquartersArabic || '',
      logoSvgDark: initialData?.logoSvgDark || { url: '', alt: '' },
      logoSvgLight: initialData?.logoSvgLight || { url: '', alt: '' },
      heroSquare: initialData?.heroSquare || { url: '', alt: '' },
      heroWide: initialData?.heroWide || { url: '', alt: '' },
      longitude: initialData?.longitude || '',
      latitude: initialData?.latitude || '',
      website: initialData?.website || '',
      linkedin: initialData?.linkedin || '',
      instagram: initialData?.instagram || '',
      twitter: initialData?.twitter || '',
      features: initialData?.features || [],
      partners: initialData?.partners || [],
      leadership: initialData?.leadership || [],
      relatedProgrammes: initialData?.relatedProgrammes || [],
      lab: initialData?.lab || false,
      pushToGR: initialData?.pushToGR || false,
      order: initialData?.order || undefined
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

  const handleSubmit = async (data: WebflowProgrammeFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data as IncomingProgrammeData);
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

  const typeOptions = [
    { value: 'Centre', label: 'Centre' },
    { value: 'Fund', label: 'Fund' },
    { value: 'Scholarship', label: 'Scholarship' },
    { value: 'Project', label: 'Project' },
    { value: 'Programme', label: 'Programme' },
    { value: 'Lab', label: 'Lab' },
    { value: 'Community Jameel', label: 'Community Jameel' }
  ];

  // Hardcoded options for now - will be replaced with real data later
  const featuresOptions = [
    { value: 'feature-1', label: 'Feature 1' },
    { value: 'feature-2', label: 'Feature 2' },
    { value: 'feature-3', label: 'Feature 3' }
  ];

  const partnersOptions = [
    { value: 'mit', label: 'MIT' },
    { value: 'harvard', label: 'Harvard University' },
    { value: 'oxford', label: 'Oxford University' }
  ];

  const leadershipOptions = [
    { value: 'john-doe', label: 'John Doe' },
    { value: 'jane-smith', label: 'Jane Smith' },
    { value: 'ahmed-hassan', label: 'Ahmed Hassan' }
  ];

  const relatedProgrammesOptions = [
    { value: 'j-pal', label: 'J-PAL' },
    { value: 'j-wafs', label: 'J-WAFS' },
    { value: 'jameel-clinic', label: 'Jameel Clinic' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Action Bar with Delete Button */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 p-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {isEditing ? 'Edit' : 'Create'} Programme
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
                    placeholder="Enter programme name"
                    required
                  />

                  <WebflowSlugField
                    control={form.control}
                    name="slug"
                    label="Slug"
                    required
                  />

                  <WebflowSelectField
                    control={form.control}
                    name="status"
                    label="Status"
                    options={statusOptions}
                    required
                  />

                  <WebflowSelectField
                    control={form.control}
                    name="type"
                    label="Type"
                    options={typeOptions}
                  />

                  {/* Relationship Fields */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Relationships
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTagsField
                        control={form.control}
                        name="features"
                        label="Features"
                        helperText="Add programme features (multi-select)"
                      />

                      <WebflowTagsField
                        control={form.control}
                        name="partners"
                        label="Partners"
                        helperText="Add partner organizations (multi-select)"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTagsField
                        control={form.control}
                        name="leadership"
                        label="Leadership"
                        helperText="Add leadership team members (multi-select)"
                      />

                      <WebflowTagsField
                        control={form.control}
                        name="relatedProgrammes"
                        label="Related Programmes"
                        helperText="Add related programmes (multi-select)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowTextField
                      control={form.control}
                      name="nameArabic"
                      label="Name (Arabic)"
                      placeholder="اسم البرنامج"
                    />

                    <WebflowTextField
                      control={form.control}
                      name="shortNameEnglish"
                      label="Short Name (English)"
                      placeholder="Short name"
                    />
                  </div>

                  <WebflowTextField
                    control={form.control}
                    name="shortNameArabic"
                    label="Short Name (Arabic)"
                    placeholder="الاسم المختصر"
                  />
                </div>
              </div>

              {/* Custom Fields Section */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">
                  Custom fields
                </h2>

                <div className="space-y-6">
                  {/* Description */}
                  <WebflowRichTextField
                    control={form.control}
                    name="description"
                    label="Description"
                    placeholder="Enter programme description..."
                    minHeight="150px"
                    helperText="Rich text description of the programme"
                  />

                  {/* Mission */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Mission
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowRichTextField
                        control={form.control}
                        name="missionEnglish"
                        label="Mission (English)"
                        placeholder="Programme mission in English..."
                        minHeight="200px"
                        helperText="Programme mission statement in English"
                      />

                      <WebflowRichTextField
                        control={form.control}
                        name="missionArabic"
                        label="Mission (Arabic)"
                        placeholder="مهمة البرنامج بالعربية..."
                        minHeight="200px"
                        helperText="Programme mission statement in Arabic"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Summary
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowRichTextField
                        control={form.control}
                        name="summaryEnglish"
                        label="Summary (English)"
                        placeholder="Programme summary in English..."
                        minHeight="150px"
                        helperText="Brief programme summary in English"
                      />

                      <WebflowRichTextField
                        control={form.control}
                        name="summaryArabic"
                        label="Summary (Arabic)"
                        placeholder="ملخص البرنامج بالعربية..."
                        minHeight="150px"
                        helperText="Brief programme summary in Arabic"
                      />
                    </div>
                  </div>

                  {/* Research */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Research
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowRichTextField
                        control={form.control}
                        name="researchEnglish"
                        label="Research (English)"
                        placeholder="Research information in English..."
                        minHeight="200px"
                        helperText="Research activities and focus areas in English"
                      />

                      <WebflowRichTextField
                        control={form.control}
                        name="researchArabic"
                        label="Research (Arabic)"
                        placeholder="معلومات البحث بالعربية..."
                        minHeight="200px"
                        helperText="Research activities and focus areas in Arabic"
                      />
                    </div>
                  </div>

                  {/* Timeline & Location */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Timeline & Location
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="yearEstablished"
                        label="Year Established"
                        placeholder="2020"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="yearClosed"
                        label="Year Closed"
                        placeholder="2025"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="order"
                        label="Display Order"
                        placeholder="1"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="headquartersEnglish"
                        label="Headquarters (English)"
                        placeholder="Location in English"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="headquartersArabic"
                        label="Headquarters (Arabic)"
                        placeholder="الموقع بالعربية"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="latitude"
                        label="Latitude"
                        placeholder="40.7128"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="longitude"
                        label="Longitude"
                        placeholder="-74.0060"
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">Images</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowImageField
                        control={form.control}
                        name="logoSvgDark"
                        label="Logo (Dark Mode)"
                        helperText="Programme logo for dark backgrounds (SVG preferred)"
                      />

                      <WebflowImageField
                        control={form.control}
                        name="logoSvgLight"
                        label="Logo (Light Mode)"
                        helperText="Programme logo for light backgrounds (SVG preferred)"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowImageField
                        control={form.control}
                        name="heroSquare"
                        label="Hero Image (Square)"
                        helperText="Square format hero image (recommended: 600x600px)"
                      />

                      <WebflowImageField
                        control={form.control}
                        name="heroWide"
                        label="Hero Image (Wide)"
                        helperText="Wide format hero image (recommended: 1200x600px)"
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Social Links
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="website"
                        label="Website"
                        placeholder="https://example.com"
                        type="url"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="linkedin"
                        label="LinkedIn"
                        placeholder="https://linkedin.com/company/example"
                        type="url"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="instagram"
                        label="Instagram"
                        placeholder="https://instagram.com/example"
                        type="url"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="twitter"
                        label="Twitter"
                        placeholder="https://twitter.com/example"
                        type="url"
                      />
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Settings
                    </h3>

                    <WebflowSwitchField
                      control={form.control}
                      name="lab"
                      label="Laboratory Programme"
                      description="Mark this as a laboratory programme"
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
                ? 'Update Programme'
                : 'Create Programme'}
          </button>
        </form>
      </Form>
    </div>
  );
});

WebflowProgrammeForm.displayName = 'WebflowProgrammeForm';
