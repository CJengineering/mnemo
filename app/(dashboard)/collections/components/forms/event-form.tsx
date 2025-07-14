'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IncomingEventData } from '../interfaces-incoming';
import { baseSchema, generateSlug, BaseFormData } from './base-form';
import { CompactFormWrapper } from './compact-form-wrapper';
import {
  TextField,
  TextAreaField,
  RichTextField,
  SwitchField,
  SelectField,
  ImageField,
  ReferenceField,
  URLField,
  DateRangeField,
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

// Enhanced Zod schema for Event validation
const eventSchema = baseSchema.extend({
  // Event-specific fields
  arabicTitle: z.string().optional(),
  shortDescription: z.string().optional(),
  teaserText: z.string().optional(),
  eventDate: z.string().optional(),
  endDate: z.string().optional(),
  time: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  locationLink: z.string().url().optional(),
  rsvpLink: z.string().url().optional(),
  livestreamLink: z.string().url().optional(),
  mainVideo: z.string().optional(),
  contactDetails: z.string().optional(),
  attendanceType: z.enum(['in-person', 'virtual', 'hybrid']).optional(),

  // Media fields
  thumbnail: z
    .object({
      url: z.string().url().optional(),
      alt: z.string().optional()
    })
    .optional(),
  heroImage: z
    .object({
      url: z.string().url().optional(),
      alt: z.string().optional()
    })
    .optional(),

  // Relationships
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
  relatedPeople: z
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

  // SEO
  seoTitle: z.string().optional(),
  seoMetaDescription: z.string().optional(),

  // Settings
  featured: z.boolean().default(false),
  pushToGR: z.boolean().default(false),
  videoAsHero: z.boolean().default(false),

  // AI field
  aiGenerate: z.string().optional()
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  initialData?: Partial<IncomingEventData>;
  onSubmit: (data: IncomingEventData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function EventForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false
}: EventFormProps) {
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      status: initialData?.status || 'draft',
      description: initialData?.description || '',
      arabicTitle: initialData?.arabicTitle || '',
      shortDescription: initialData?.shortDescription || '',
      teaserText: initialData?.teaserText || '',
      eventDate: initialData?.eventDate || '',
      endDate: initialData?.endDate || '',
      time: initialData?.time || '',
      city: initialData?.city || '',
      address: initialData?.address || '',
      locationLink: initialData?.locationLink || '',
      rsvpLink: initialData?.rsvpLink || '',
      livestreamLink: initialData?.livestreamLink || '',
      mainVideo: initialData?.mainVideo || '',
      contactDetails: initialData?.contactDetails || '',
      attendanceType:
        (initialData?.attendanceType as 'in-person' | 'virtual' | 'hybrid') ||
        'in-person',
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      programmeLabel: initialData?.programmeLabel || undefined,
      relatedProgrammes: initialData?.relatedProgrammes || [],
      relatedPeople: initialData?.relatedPeople || [],
      tags: initialData?.tags || [],
      seoTitle: initialData?.seoTitle || '',
      seoMetaDescription: initialData?.seoMetaDescription || '',
      featured: initialData?.featured || false,
      pushToGR: initialData?.pushToGR || false,
      videoAsHero: initialData?.videoAsHero || false,
      aiGenerate: ''
    }
  });

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

  const handleSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      if (!data.slug && data.title) {
        data.slug = generateSlug(data.title);
      }

      await onSubmit(data as IncomingEventData);
      setMessage({
        type: 'success',
        message: `Event ${isEditing ? 'updated' : 'created'} successfully!`
      });
    } catch (error) {
      setMessage({
        type: 'error',
        message: `Failed to ${isEditing ? 'update' : 'create'} event. Please try again.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIGenerate = () => {
    setShowAIDialog(true);
  };

  const handleAISubmit = async () => {
    if (!aiPrompt.trim()) return;

    setIsAILoading(true);
    try {
      const currentData = form.getValues();
      const response = await fetch('/api/prompt-to-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'event',
          prompt: aiPrompt,
          existingData: currentData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const generatedData = await response.json();

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

  const handlePreview = () => {
    setShowPreview(true);
  };

  const attendanceTypeOptions = [
    { value: 'in-person', label: 'In Person' },
    { value: 'virtual', label: 'Virtual' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  return (
    <>
      <CompactFormWrapper
        form={form}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        isEditing={isEditing}
        isLoading={isLoading}
        onAIGenerate={handleAIGenerate}
        onPreview={handlePreview}
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
                label="Event Title"
                required
                placeholder="Enter event title"
              />
              <TextField
                control={form.control}
                name="arabicTitle"
                label="Arabic Title"
                placeholder="عنوان الحدث"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TextField
                control={form.control}
                name="slug"
                label="URL Slug"
                required
                placeholder="event-url-slug"
              />
              <SelectField
                control={form.control}
                name="status"
                label="Status"
                required
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' }
                ]}
              />
            </div>

            <RichTextField
              control={form.control}
              name="description"
              label="Description"
              placeholder="Enter event description..."
              minHeight="100px"
            />

            <div className="grid grid-cols-2 gap-2">
              <RichTextField
                control={form.control}
                name="shortDescription"
                label="Short Description"
                placeholder="Brief event summary..."
                minHeight="80px"
              />
              <RichTextField
                control={form.control}
                name="teaserText"
                label="Teaser Text"
                placeholder="Engaging teaser text..."
                minHeight="80px"
              />
            </div>
          </div>

          {/* Event Details Section */}
          <div className="space-y-2 pb-2 border-b border-gray-100">
            <h3 className="text-[10px] font-medium text-gray-700 mb-1">
              Event Details
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <TextField
                control={form.control}
                name="eventDate"
                label="Event Date"
                type="date"
                required
              />
              <TextField
                control={form.control}
                name="endDate"
                label="End Date"
                type="date"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TextField
                control={form.control}
                name="time"
                label="Time"
                placeholder="2:00 PM - 5:00 PM"
              />
              <SelectField
                control={form.control}
                name="attendanceType"
                label="Attendance Type"
                options={attendanceTypeOptions}
                placeholder="Select attendance type"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TextField
                control={form.control}
                name="city"
                label="City"
                placeholder="Event city"
              />
              <URLField
                control={form.control}
                name="locationLink"
                label="Location Link"
                placeholder="https://maps.google.com/..."
              />
            </div>

            <RichTextField
              control={form.control}
              name="address"
              label="Address"
              placeholder="Enter full event address..."
              minHeight="80px"
            />

            <div className="grid grid-cols-2 gap-2">
              <URLField
                control={form.control}
                name="rsvpLink"
                label="RSVP Link"
                placeholder="https://eventbrite.com/..."
              />
              <URLField
                control={form.control}
                name="livestreamLink"
                label="Livestream Link"
                placeholder="https://youtube.com/..."
              />
            </div>

            <TextField
              control={form.control}
              name="mainVideo"
              label="Main Video"
              placeholder="Video URL or embed code"
            />

            <RichTextField
              control={form.control}
              name="contactDetails"
              label="Contact Details"
              placeholder="Enter contact information for the event..."
              minHeight="80px"
            />
          </div>

          {/* Media & Relations Section */}
          <div className="space-y-2 pb-2 border-b border-gray-100">
            <h3 className="text-[10px] font-medium text-gray-700 mb-1">
              Media & Relations
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <ImageField
                control={form.control}
                name="thumbnail"
                label="Thumbnail Image"
              />
              <ImageField
                control={form.control}
                name="heroImage"
                label="Hero Image"
              />
            </div>

            <ReferenceField
              control={form.control}
              name="programmeLabel"
              label="Programme Label"
              searchEndpoint="/api/collection-items?type=programme"
              placeholder="Search programmes..."
            />

            <ReferenceField
              control={form.control}
              name="relatedProgrammes"
              label="Related Programmes"
              multiple
              searchEndpoint="/api/collection-items?type=programme"
              placeholder="Search and select programmes..."
            />

            <ReferenceField
              control={form.control}
              name="relatedPeople"
              label="Related People"
              multiple
              searchEndpoint="/api/collection-items?type=team"
              placeholder="Search and select people..."
            />

            <ReferenceField
              control={form.control}
              name="tags"
              label="Tags"
              multiple
              searchEndpoint="/api/collection-items?type=tag"
              placeholder="Search and select tags..."
            />
          </div>

          {/* SEO & Settings Section */}
          <div className="space-y-2 pb-2">
            <h3 className="text-[10px] font-medium text-gray-700 mb-1">
              SEO & Settings
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <TextField
                control={form.control}
                name="seoTitle"
                label="SEO Title"
                placeholder="SEO optimized title"
              />
              <TextAreaField
                control={form.control}
                name="seoMetaDescription"
                label="SEO Meta Description"
                placeholder="SEO meta description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <SwitchField
                control={form.control}
                name="featured"
                label="Featured"
              />

              <SwitchField
                control={form.control}
                name="pushToGR"
                label="Push to GR"
              />

              <SwitchField
                control={form.control}
                name="videoAsHero"
                label="Video as Hero"
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
                placeholder="Describe the event you want to create..."
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
