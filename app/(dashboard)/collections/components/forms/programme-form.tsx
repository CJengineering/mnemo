'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IncomingProgrammeData } from '../interfaces-incoming';
import { CompactFormWrapper } from './compact-form-wrapper';
import { baseSchema, generateSlug } from './base-form';
import {
  TextField,
  TextAreaField,
  RichTextField,
  SwitchField,
  ImageField,
  ReferenceField,
  URLField,
  AIContentField
} from './form-fields';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wand2 } from 'lucide-react';

// Programme-specific schema extending base schema
const programmeSchema = baseSchema.extend({
  // Programme specific fields
  nameArabic: z.string().optional(),
  shortNameEnglish: z.string().optional(),
  shortNameArabic: z.string().optional(),

  // Content
  missionEnglish: z.string().optional(),
  missionArabic: z.string().optional(),
  summaryEnglish: z.string().optional(),
  summaryArabic: z.string().optional(),
  researchEnglish: z.string().optional(),
  researchArabic: z.string().optional(),

  // Details
  yearEstablished: z.number().optional(),
  yearClosed: z.number().optional(),
  headquartersEnglish: z.string().optional(),
  headquartersArabic: z.string().optional(),

  // Media
  logoSvgDark: z
    .object({
      url: z.string().url().optional(),
      alt: z.string().optional()
    })
    .optional(),
  logoSvgLight: z
    .object({
      url: z.string().url().optional(),
      alt: z.string().optional()
    })
    .optional(),
  heroSquare: z
    .object({
      url: z.string().url().optional(),
      alt: z.string().optional()
    })
    .optional(),
  heroWide: z
    .object({
      url: z.string().url().optional(),
      alt: z.string().optional()
    })
    .optional(),

  // Location
  longitude: z.string().optional(),
  latitude: z.string().optional(),

  // External links
  website: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),

  // Relations
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

  // Flags
  lab: z.boolean().default(false),
  pushToGR: z.boolean().default(false),
  order: z.number().optional(),
  aiGenerate: z.string().optional()
});

type ProgrammeFormData = z.infer<typeof programmeSchema>;

interface ProgrammeFormProps {
  initialData?: Partial<IncomingProgrammeData>;
  onSubmit: (data: IncomingProgrammeData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function ProgrammeForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false
}: ProgrammeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const form = useForm<ProgrammeFormData>({
    resolver: zodResolver(programmeSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      slug: initialData?.slug || '',
      status: initialData?.status || 'draft',
      nameArabic: initialData?.nameArabic || '',
      shortNameEnglish: initialData?.shortNameEnglish || '',
      shortNameArabic: initialData?.shortNameArabic || '',
      missionEnglish: initialData?.missionEnglish || '',
      missionArabic: initialData?.missionArabic || '',
      summaryEnglish: initialData?.summaryEnglish || '',
      summaryArabic: initialData?.summaryArabic || '',
      researchEnglish: initialData?.researchEnglish || '',
      researchArabic: initialData?.researchArabic || '',
      yearEstablished: initialData?.yearEstablished,
      yearClosed: initialData?.yearClosed,
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
      partners: initialData?.partners || [],
      leadership: initialData?.leadership || [],
      relatedProgrammes: initialData?.relatedProgrammes || [],
      lab: initialData?.lab || false,
      pushToGR: initialData?.pushToGR || false,
      order: initialData?.order,
      aiGenerate: ''
    }
  });

  // Auto-generate slug from title
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'title' && value.title && !form.getValues('slug')) {
        form.setValue('slug', generateSlug(value.title));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Clear messages after delay
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (data: ProgrammeFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data as IncomingProgrammeData);
      setMessage({
        type: 'success',
        message: `Programme ${isEditing ? 'updated' : 'created'} successfully!`
      });
    } catch (error) {
      setMessage({
        type: 'error',
        message: `Failed to ${isEditing ? 'update' : 'create'} programme. Please try again.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIGenerate = () => {
    setShowAIDialog(true);
  };

  const handleAISubmit = async () => {
    if (!aiPrompt.trim()) {
      setMessage({
        type: 'error',
        message: 'Please enter a prompt for AI generation.'
      });
      return;
    }

    setIsAILoading(true);
    try {
      const currentData = form.getValues();

      const response = await fetch('/api/prompt-to-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'programme',
          prompt: aiPrompt,
          existingData: currentData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const generatedData = await response.json();

      // Merge generated data with existing form data
      Object.keys(generatedData).forEach((key) => {
        if (generatedData[key] !== undefined && key !== 'id') {
          form.setValue(key as any, generatedData[key]);
        }
      });

      setMessage({
        type: 'success',
        message: 'AI content generated successfully!'
      });
      setShowAIDialog(false);
      setAiPrompt('');
    } catch (error) {
      setMessage({
        type: 'error',
        message: 'Failed to generate AI content. Please try again.'
      });
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <>
      <CompactFormWrapper
        form={form}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        isEditing={isEditing}
        isLoading={isLoading}
        onAIGenerate={handleAIGenerate}
        message={message}
        itemId={(initialData as any)?.id}
      >
        {/* All form fields in one scrollable container - no tabs */}
        <div className="space-y-2">
          {/* Basic Details Section */}
          <div className="space-y-2 pb-2 border-b border-gray-100">
            <h3 className="text-[10px] font-medium text-gray-700 mb-1">
              Basic Details
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <TextField
                control={form.control}
                name="title"
                label="Programme Title"
                required
                placeholder="Enter programme title"
              />
              <TextField
                control={form.control}
                name="nameArabic"
                label="Arabic Name"
                placeholder="اسم البرنامج"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TextField
                control={form.control}
                name="shortNameEnglish"
                label="Short Name (English)"
                placeholder="Short programme name"
              />
              <TextField
                control={form.control}
                name="shortNameArabic"
                label="Short Name (Arabic)"
                placeholder="الاسم المختصر"
              />
            </div>

            <TextField
              control={form.control}
              name="slug"
              label="URL Slug"
              required
              placeholder="programme-url-slug"
            />

            <div className="grid grid-cols-3 gap-2">
              <TextField
                control={form.control}
                name="yearEstablished"
                label="Year Established"
                type="number"
                placeholder="2020"
              />
              <TextField
                control={form.control}
                name="yearClosed"
                label="Year Closed"
                type="number"
                placeholder="Leave empty if active"
              />
              <TextField
                control={form.control}
                name="order"
                label="Display Order"
                type="number"
                placeholder="1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TextField
                control={form.control}
                name="headquartersEnglish"
                label="Headquarters (English)"
                placeholder="Cambridge, MA, USA"
              />
              <TextField
                control={form.control}
                name="headquartersArabic"
                label="Headquarters (Arabic)"
                placeholder="المقر الرئيسي"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TextField
                control={form.control}
                name="longitude"
                label="Longitude"
                placeholder="-71.0942"
              />
              <TextField
                control={form.control}
                name="latitude"
                label="Latitude"
                placeholder="42.3601"
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-2 pb-2 border-b border-gray-100">
            <h3 className="text-[10px] font-medium text-gray-700 mb-1">
              Content
            </h3>

            <TextAreaField
              control={form.control}
              name="description"
              label="Description"
              placeholder="Programme description"
              rows={3}
            />

            <AIContentField
              control={form.control}
              name="missionEnglish"
              label="Mission (English)"
              contentType="content"
              contextFields={['title', 'description']}
            />

            <div className="grid grid-cols-2 gap-2">
              <RichTextField
                control={form.control}
                name="missionArabic"
                label="Mission (Arabic)"
                minHeight="100px"
              />
              <RichTextField
                control={form.control}
                name="summaryEnglish"
                label="Summary (English)"
                minHeight="100px"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <RichTextField
                control={form.control}
                name="summaryArabic"
                label="Summary (Arabic)"
                minHeight="100px"
              />
              <RichTextField
                control={form.control}
                name="researchEnglish"
                label="Research (English)"
                minHeight="100px"
              />
            </div>

            <RichTextField
              control={form.control}
              name="researchArabic"
              label="Research (Arabic)"
              minHeight="100px"
            />
          </div>

          {/* Media Section */}
          <div className="space-y-2 pb-2 border-b border-gray-100">
            <h3 className="text-[10px] font-medium text-gray-700 mb-1">
              Media & Branding
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <ImageField
                control={form.control}
                name="logoSvgDark"
                label="Logo (Dark)"
              />
              <ImageField
                control={form.control}
                name="logoSvgLight"
                label="Logo (Light)"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ImageField
                control={form.control}
                name="heroSquare"
                label="Hero Image (Square)"
              />
              <ImageField
                control={form.control}
                name="heroWide"
                label="Hero Image (Wide)"
              />
            </div>
          </div>

          {/* External Links Section */}
          <div className="space-y-2 pb-2 border-b border-gray-100">
            <h3 className="text-[10px] font-medium text-gray-700 mb-1">
              External Links
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <URLField
                control={form.control}
                name="website"
                label="Website"
                placeholder="https://example.com"
              />
              <URLField
                control={form.control}
                name="linkedin"
                label="LinkedIn"
                placeholder="https://linkedin.com/company/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <URLField
                control={form.control}
                name="instagram"
                label="Instagram"
                placeholder="https://instagram.com/..."
              />
              <URLField
                control={form.control}
                name="twitter"
                label="Twitter"
                placeholder="https://twitter.com/..."
              />
            </div>
          </div>

          {/* Relationships Section */}
          <div className="space-y-2 pb-2">
            <h3 className="text-[10px] font-medium text-gray-700 mb-1">
              Relationships & Settings
            </h3>

            <ReferenceField
              control={form.control}
              name="partners"
              label="Partners"
              multiple
              searchEndpoint="/api/collection-items?type=partner"
              placeholder="Search for partners..."
            />

            <ReferenceField
              control={form.control}
              name="leadership"
              label="Leadership"
              multiple
              searchEndpoint="/api/collection-items?type=team"
              placeholder="Search for leadership..."
            />

            <ReferenceField
              control={form.control}
              name="relatedProgrammes"
              label="Related Programmes"
              multiple
              searchEndpoint="/api/collection-items?type=programme"
              placeholder="Search for programmes..."
            />

            <div className="grid grid-cols-2 gap-2">
              <SwitchField
                control={form.control}
                name="lab"
                label="Lab Programme"
              />

              <SwitchField
                control={form.control}
                name="pushToGR"
                label="Push to GR"
              />
            </div>
          </div>
        </div>
      </CompactFormWrapper>

      {/* AI Generate Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border shadow-lg z-50">
          <DialogHeader>
            <DialogTitle>AI Generate Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="ai-prompt" className="text-sm font-medium">
                What would you like to generate?
              </label>
              <Textarea
                id="ai-prompt"
                placeholder="Describe the programme you want to create..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAIDialog(false);
                setAiPrompt('');
              }}
              disabled={isAILoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAISubmit}
              disabled={isAILoading || !aiPrompt.trim()}
              className="flex items-center space-x-2"
            >
              <Wand2 className="h-4 w-4" />
              <span>{isAILoading ? 'Generating...' : 'Generate'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
