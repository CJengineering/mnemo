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
import './compact-form.css';

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
  summaryLongEnglish: z.string().optional(),
  summaryLongArabic: z.string().optional(),
  oldMissionEnglish: z.string().optional(),
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
  logoSvgDarkOriginal: z
    .object({
      url: z.string().optional(),
      alt: z.string().optional()
    })
    .optional(),
  logoSvgLightOriginal: z
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
  hero1x1: z
    .object({
      url: z.string().optional(),
      alt: z.string().optional()
    })
    .optional(),
  hero16x9: z
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
  thumbnail: z
    .object({
      url: z.string().optional(),
      alt: z.string().optional()
    })
    .optional(),
  openGraph: z
    .object({
      url: z.string().optional(),
      alt: z.string().optional()
    })
    .optional(),
  mainVideo: z.string().optional(),
  customLink: z.string().url().optional().or(z.literal('')),
  buttonText: z.string().optional(),
  longitude: z.string().optional(),
  latitude: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  youtube: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
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
  // Impact metrics (6 sets)
  impact01: z.string().optional(),
  impact01TitleArabic: z.string().optional(),
  impact02: z.string().optional(),
  impact02TitleArabic: z.string().optional(),
  impact03: z.string().optional(),
  impact03TitleArabic: z.string().optional(),
  impact04: z.string().optional(),
  impact04TitleArabic: z.string().optional(),
  impact05: z.string().optional(),
  impact05TitleArabic: z.string().optional(),
  impact06: z.string().optional(),
  impact06TitleArabic: z.string().optional(),
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
      summaryLongEnglish: initialData?.summaryLongEnglish || '',
      summaryLongArabic: initialData?.summaryLongArabic || '',
      oldMissionEnglish: initialData?.oldMissionEnglish || '',
      researchEnglish: initialData?.researchEnglish || '',
      researchArabic: initialData?.researchArabic || '',
      yearEstablished: initialData?.yearEstablished || undefined,
      yearClosed: initialData?.yearClosed || undefined,
      headquartersEnglish: initialData?.headquartersEnglish || '',
      headquartersArabic: initialData?.headquartersArabic || '',
      logoSvgDark: initialData?.logoSvgDark || { url: '', alt: '' },
      logoSvgLight: initialData?.logoSvgLight || { url: '', alt: '' },
      logoSvgDarkOriginal: initialData?.logoSvgDarkOriginal || {
        url: '',
        alt: ''
      },
      logoSvgLightOriginal: initialData?.logoSvgLightOriginal || {
        url: '',
        alt: ''
      },
      heroSquare: initialData?.heroSquare || { url: '', alt: '' },
      heroWide: initialData?.heroWide || { url: '', alt: '' },
      hero1x1: initialData?.hero1x1 || { url: '', alt: '' },
      hero16x9: initialData?.hero16x9 || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      openGraph: initialData?.openGraph || { url: '', alt: '' },
      mainVideo: initialData?.mainVideo || '',
      customLink: initialData?.customLink || '',
      buttonText: initialData?.buttonText || '',
      longitude: initialData?.longitude || '',
      latitude: initialData?.latitude || '',
      website: initialData?.website || '',
      linkedin: initialData?.linkedin || '',
      instagram: initialData?.instagram || '',
      twitter: initialData?.twitter || '',
      youtube: initialData?.youtube || '',
      facebook: initialData?.facebook || '',
      features: initialData?.features || [],
      partners: initialData?.partners || [],
      leadership: initialData?.leadership || [],
      relatedProgrammes: initialData?.relatedProgrammes || [],
      impact01: initialData?.impact01 || '',
      impact01TitleArabic: initialData?.impact01TitleArabic || '',
      impact02: initialData?.impact02 || '',
      impact02TitleArabic: initialData?.impact02TitleArabic || '',
      impact03: initialData?.impact03 || '',
      impact03TitleArabic: initialData?.impact03TitleArabic || '',
      impact04: initialData?.impact04 || '',
      impact04TitleArabic: initialData?.impact04TitleArabic || '',
      impact05: initialData?.impact05 || '',
      impact05TitleArabic: initialData?.impact05TitleArabic || '',
      impact06: initialData?.impact06 || '',
      impact06TitleArabic: initialData?.impact06TitleArabic || '',
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
      summaryLongEnglish: initialData?.summaryLongEnglish || '',
      summaryLongArabic: initialData?.summaryLongArabic || '',
      oldMissionEnglish: initialData?.oldMissionEnglish || '',
      researchEnglish: initialData?.researchEnglish || '',
      researchArabic: initialData?.researchArabic || '',
      yearEstablished: initialData?.yearEstablished || undefined,
      yearClosed: initialData?.yearClosed || undefined,
      headquartersEnglish: initialData?.headquartersEnglish || '',
      headquartersArabic: initialData?.headquartersArabic || '',
      logoSvgDark: initialData?.logoSvgDark || { url: '', alt: '' },
      logoSvgLight: initialData?.logoSvgLight || { url: '', alt: '' },
      logoSvgDarkOriginal: initialData?.logoSvgDarkOriginal || {
        url: '',
        alt: ''
      },
      logoSvgLightOriginal: initialData?.logoSvgLightOriginal || {
        url: '',
        alt: ''
      },
      heroSquare: initialData?.heroSquare || { url: '', alt: '' },
      heroWide: initialData?.heroWide || { url: '', alt: '' },
      hero1x1: initialData?.hero1x1 || { url: '', alt: '' },
      hero16x9: initialData?.hero16x9 || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      openGraph: initialData?.openGraph || { url: '', alt: '' },
      mainVideo: initialData?.mainVideo || '',
      customLink: initialData?.customLink || '',
      buttonText: initialData?.buttonText || '',
      longitude: initialData?.longitude || '',
      latitude: initialData?.latitude || '',
      website: initialData?.website || '',
      linkedin: initialData?.linkedin || '',
      instagram: initialData?.instagram || '',
      twitter: initialData?.twitter || '',
      youtube: initialData?.youtube || '',
      facebook: initialData?.facebook || '',
      features: initialData?.features || [],
      partners: initialData?.partners || [],
      leadership: initialData?.leadership || [],
      relatedProgrammes: initialData?.relatedProgrammes || [],
      impact01: initialData?.impact01 || '',
      impact01TitleArabic: initialData?.impact01TitleArabic || '',
      impact02: initialData?.impact02 || '',
      impact02TitleArabic: initialData?.impact02TitleArabic || '',
      impact03: initialData?.impact03 || '',
      impact03TitleArabic: initialData?.impact03TitleArabic || '',
      impact04: initialData?.impact04 || '',
      impact04TitleArabic: initialData?.impact04TitleArabic || '',
      impact05: initialData?.impact05 || '',
      impact05TitleArabic: initialData?.impact05TitleArabic || '',
      impact06: initialData?.impact06 || '',
      impact06TitleArabic: initialData?.impact06TitleArabic || '',
      lab: initialData?.lab || false,
      pushToGR: initialData?.pushToGR || false,
      order: initialData?.order || undefined
    };

    form.reset(newValues);
  }, [initialData, form]);

  // Disable auto-generate-on-typing in favor of explicit Team-style button
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

  // Debug: Log schema fields and form structure on mount
  useEffect(() => {
    console.log('🔧 Programme Form Debug Info:');
    console.log('============================');
    console.log(
      '📋 Schema fields available:',
      Object.keys(webflowProgrammeSchema.shape)
    );
    console.log('📊 Form default values keys:', Object.keys(form.getValues()));
    console.log('🎯 Expected programme fields from interface:');

    // Let's check what fields we should have based on common programme data
    const expectedFields = [
      // Basic
      'title',
      'slug',
      'status',
      'description',
      'type',

      // Multilingual names
      'nameArabic',
      'shortNameEnglish',
      'shortNameArabic',

      // Content
      'missionEnglish',
      'missionArabic',
      'summaryEnglish',
      'summaryArabic',
      'researchEnglish',
      'researchArabic',

      // Timeline & Location
      'yearEstablished',
      'yearClosed',
      'order',
      'headquartersEnglish',
      'headquartersArabic',
      'latitude',
      'longitude',

      // Images
      'logoSvgDark',
      'logoSvgLight',
      'heroSquare',
      'heroWide',

      // Social
      'website',
      'linkedin',
      'instagram',
      'twitter',

      // Relationships
      'features',
      'partners',
      'leadership',
      'relatedProgrammes',

      // Settings
      'lab',
      'pushToGR'
    ];

    const currentSchemaFields = Object.keys(webflowProgrammeSchema.shape);
    const missingFromSchema = expectedFields.filter(
      (field) => !currentSchemaFields.includes(field)
    );
    const extraInSchema = currentSchemaFields.filter(
      (field) => !expectedFields.includes(field)
    );

    console.log('❌ Missing from schema:', missingFromSchema);
    console.log('➕ Extra in schema:', extraInSchema);
    console.log('✅ Total schema fields:', currentSchemaFields.length);
    console.log('🏷️ All current schema fields:', currentSchemaFields.sort());
    console.log('============================');
  }, []);

  const handleSubmit = async (data: WebflowProgrammeFormData) => {
    setIsLoading(true);

    console.log('🚀 Programme Form Submission Data:');
    console.log('=====================================');
    console.log('📋 Full form data:', JSON.stringify(data, null, 2));
    console.log('');
    console.log('🔍 Form fields analysis:');
    console.log('Basic Info:', {
      title: data.title,
      slug: data.slug,
      status: data.status,
      type: data.type
    });
    console.log('');
    console.log('🌐 Multilingual fields:', {
      nameArabic: data.nameArabic,
      shortNameEnglish: data.shortNameEnglish,
      shortNameArabic: data.shortNameArabic,
      missionEnglish: data.missionEnglish?.substring(0, 50) + '...',
      missionArabic: data.missionArabic?.substring(0, 50) + '...',
      summaryEnglish: data.summaryEnglish?.substring(0, 50) + '...',
      summaryArabic: data.summaryArabic?.substring(0, 50) + '...',
      researchEnglish: data.researchEnglish?.substring(0, 50) + '...',
      researchArabic: data.researchArabic?.substring(0, 50) + '...',
      headquartersEnglish: data.headquartersEnglish,
      headquartersArabic: data.headquartersArabic
    });
    console.log('');
    console.log('📅 Timeline & Location:', {
      yearEstablished: data.yearEstablished,
      yearClosed: data.yearClosed,
      latitude: data.latitude,
      longitude: data.longitude,
      order: data.order
    });
    console.log('');
    console.log('🖼️ Images:', {
      logoSvgDark: data.logoSvgDark,
      logoSvgLight: data.logoSvgLight,
      heroSquare: data.heroSquare,
      heroWide: data.heroWide
    });
    console.log('');
    console.log('🔗 Social Links:', {
      website: data.website,
      linkedin: data.linkedin,
      instagram: data.instagram,
      twitter: data.twitter
    });
    console.log('');
    console.log('👥 Relationships:', {
      features: data.features,
      partners: data.partners,
      leadership: data.leadership,
      relatedProgrammes: data.relatedProgrammes
    });
    console.log('');
    console.log('⚙️ Settings:', {
      lab: data.lab,
      pushToGR: data.pushToGR,
      description: data.description?.substring(0, 50) + '...'
    });
    console.log('');
    console.log('📊 Total fields in form data:', Object.keys(data).length);
    console.log('📋 All field names:', Object.keys(data).sort());
    console.log('=====================================');

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
    <div className="h-full flex flex-col prevent-layout-shift">
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
                    placeholder="Enter programme name"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowRichTextField
                        control={form.control}
                        name="summaryLongEnglish"
                        label="Long Summary (English)"
                        placeholder="Detailed programme summary in English..."
                        minHeight="200px"
                        helperText="Extended programme summary in English"
                      />

                      <WebflowRichTextField
                        control={form.control}
                        name="summaryLongArabic"
                        label="Long Summary (Arabic)"
                        placeholder="ملخص مفصل للبرنامج بالعربية..."
                        minHeight="200px"
                        helperText="Extended programme summary in Arabic"
                      />
                    </div>

                    <WebflowRichTextField
                      control={form.control}
                      name="oldMissionEnglish"
                      label="Previous Mission (English)"
                      placeholder="Previous mission statement..."
                      minHeight="150px"
                      helperText="Historical mission statement for reference"
                    />
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
                        collectionType="programmes"
                        slug={form.watch('slug')}
                      />

                      <WebflowImageField
                        control={form.control}
                        name="logoSvgLight"
                        label="Logo (Light Mode)"
                        helperText="Programme logo for light backgrounds (SVG preferred)"
                        collectionType="programmes"
                        slug={form.watch('slug')}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowImageField
                        control={form.control}
                        name="logoSvgDarkOriginal"
                        label="Logo Dark (Original)"
                        helperText="Original ratio dark logo"
                        collectionType="programmes"
                        slug={form.watch('slug')}
                      />

                      <WebflowImageField
                        control={form.control}
                        name="logoSvgLightOriginal"
                        label="Logo Light (Original)"
                        helperText="Original ratio light logo"
                        collectionType="programmes"
                        slug={form.watch('slug')}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowImageField
                        control={form.control}
                        name="heroSquare"
                        label="Hero Image (Square)"
                        helperText="Square format hero image (recommended: 600x600px)"
                        collectionType="programmes"
                        slug={form.watch('slug')}
                      />

                      <WebflowImageField
                        control={form.control}
                        name="heroWide"
                        label="Hero Image (Wide)"
                        helperText="Wide format hero image (recommended: 1200x600px)"
                        collectionType="programmes"
                        slug={form.watch('slug')}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowImageField
                        control={form.control}
                        name="hero1x1"
                        label="Hero Image (1:1)"
                        helperText="1:1 aspect ratio hero image"
                        collectionType="programmes"
                        slug={form.watch('slug')}
                      />

                      <WebflowImageField
                        control={form.control}
                        name="hero16x9"
                        label="Hero Image (16:9)"
                        helperText="16:9 aspect ratio hero image"
                        collectionType="programmes"
                        slug={form.watch('slug')}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <WebflowImageField
                        control={form.control}
                        name="heroImage"
                        label="Hero Image"
                        helperText="Main hero image"
                        collectionType="programmes"
                        slug={form.watch('slug')}
                      />

                      <WebflowImageField
                        control={form.control}
                        name="thumbnail"
                        label="Thumbnail"
                        helperText="Small preview image"
                        collectionType="programmes"
                        slug={form.watch('slug')}
                      />

                      <WebflowImageField
                        control={form.control}
                        name="openGraph"
                        label="Open Graph Image"
                        helperText="Social sharing image (1200x630px)"
                        collectionType="programmes"
                        slug={form.watch('slug')}
                      />
                    </div>
                  </div>

                  {/* Video & Links */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Video & Links
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="mainVideo"
                        label="Main Video URL"
                        placeholder="https://www.youtube.com/watch?v=..."
                        type="url"
                        helperText="Main video content (YouTube, Vimeo, etc.)"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="customLink"
                        label="Custom Link"
                        placeholder="https://example.com"
                        type="url"
                        helperText="Custom external link"
                      />
                    </div>

                    <WebflowTextField
                      control={form.control}
                      name="buttonText"
                      label="Button Text"
                      placeholder="Learn More"
                      helperText="Text for custom link button"
                    />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <WebflowTextField
                        control={form.control}
                        name="youtube"
                        label="YouTube"
                        placeholder="https://youtube.com/@example"
                        type="url"
                      />

                      <WebflowTextField
                        control={form.control}
                        name="facebook"
                        label="Facebook"
                        placeholder="https://facebook.com/example"
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

                  {/* Impact Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium text-white">
                      Impact Metrics
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-300">
                          Impact 01
                        </h4>
                        <WebflowTextField
                          control={form.control}
                          name="impact01"
                          label="Impact 01 Value"
                          placeholder="1000+"
                          helperText="First impact metric value"
                        />
                        <WebflowTextField
                          control={form.control}
                          name="impact01TitleArabic"
                          label="Impact 01 Title (Arabic)"
                          placeholder="عنوان التأثير الأول"
                          helperText="Arabic title for first impact"
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-300">
                          Impact 02
                        </h4>
                        <WebflowTextField
                          control={form.control}
                          name="impact02"
                          label="Impact 02 Value"
                          placeholder="50M+"
                          helperText="Second impact metric value"
                        />
                        <WebflowTextField
                          control={form.control}
                          name="impact02TitleArabic"
                          label="Impact 02 Title (Arabic)"
                          placeholder="عنوان التأثير الثاني"
                          helperText="Arabic title for second impact"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-300">
                          Impact 03
                        </h4>
                        <WebflowTextField
                          control={form.control}
                          name="impact03"
                          label="Impact 03 Value"
                          placeholder="250K+"
                          helperText="Third impact metric value"
                        />
                        <WebflowTextField
                          control={form.control}
                          name="impact03TitleArabic"
                          label="Impact 03 Title (Arabic)"
                          placeholder="عنوان التأثير الثالث"
                          helperText="Arabic title for third impact"
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-300">
                          Impact 04
                        </h4>
                        <WebflowTextField
                          control={form.control}
                          name="impact04"
                          label="Impact 04 Value"
                          placeholder="95%"
                          helperText="Fourth impact metric value"
                        />
                        <WebflowTextField
                          control={form.control}
                          name="impact04TitleArabic"
                          label="Impact 04 Title (Arabic)"
                          placeholder="عنوان التأثير الرابع"
                          helperText="Arabic title for fourth impact"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-300">
                          Impact 05
                        </h4>
                        <WebflowTextField
                          control={form.control}
                          name="impact05"
                          label="Impact 05 Value"
                          placeholder="30+"
                          helperText="Fifth impact metric value"
                        />
                        <WebflowTextField
                          control={form.control}
                          name="impact05TitleArabic"
                          label="Impact 05 Title (Arabic)"
                          placeholder="عنوان التأثير الخامس"
                          helperText="Arabic title for fifth impact"
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-300">
                          Impact 06
                        </h4>
                        <WebflowTextField
                          control={form.control}
                          name="impact06"
                          label="Impact 06 Value"
                          placeholder="85%"
                          helperText="Sixth impact metric value"
                        />
                        <WebflowTextField
                          control={form.control}
                          name="impact06TitleArabic"
                          label="Impact 06 Title (Arabic)"
                          placeholder="عنوان التأثير السادس"
                          helperText="Arabic title for sixth impact"
                        />
                      </div>
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
                ? 'Update Programme'
                : 'Create Programme'}
          </button>
        </form>
      </Form>
    </div>
  );
});

WebflowProgrammeForm.displayName = 'WebflowProgrammeForm';
