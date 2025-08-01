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
  WebflowTagsField
} from './webflow-form-fields';
import { IncomingEventData } from '../interfaces-incoming';
import { generateSlug } from './base-form';
import { WebflowFormWrapper } from './webflow-form-wrapper';

// Webflow CMS Event Schema
const webflowEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  eventDate: z.string().optional(),
  endDate: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  rsvpLink: z.string().url().optional().or(z.literal('')),
  livestreamLink: z.string().url().optional().or(z.literal('')),
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
  tags: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string()
      })
    )
    .default([]),
  featured: z.boolean().default(false),
  attendanceType: z
    .enum(['in-person', 'virtual', 'hybrid'])
    .default('in-person')
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

  const form = useForm<WebflowEventFormData>({
    resolver: zodResolver(webflowEventSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      description: initialData?.description || '',
      shortDescription: initialData?.shortDescription || '',
      eventDate: initialData?.eventDate || '',
      endDate: initialData?.endDate || '',
      city: initialData?.city || '',
      address: initialData?.address || '',
      rsvpLink: initialData?.rsvpLink || '',
      livestreamLink: initialData?.livestreamLink || '',
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      tags: initialData?.tags || [],
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
      eventDate: initialData?.eventDate || '',
      endDate: initialData?.endDate || '',
      city: initialData?.city || '',
      address: initialData?.address || '',
      rsvpLink: initialData?.rsvpLink || '',
      livestreamLink: initialData?.livestreamLink || '',
      thumbnail: initialData?.thumbnail || { url: '', alt: '' },
      heroImage: initialData?.heroImage || { url: '', alt: '' },
      tags: initialData?.tags || [],
      featured: initialData?.featured || false,
      attendanceType:
        (initialData?.attendanceType as 'in-person' | 'virtual' | 'hybrid') ||
        'in-person'
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

  const handleSubmit = async (data: WebflowEventFormData) => {
    try {
      await onSubmit(data as IncomingEventData);
    } catch (error) {
      console.error('Form submission error:', error);
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

  return (
    <div className="h-full flex flex-col">
      {/* Action Bar with Delete Button */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 p-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {isEditing ? 'Edit' : 'Create'} Event
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
          <div className="flex-1 overflow-y-auto px-1">
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
                  {/* Description Fields */}
                  <WebflowTextareaField
                    control={form.control}
                    name="description"
                    label="Description"
                    placeholder="Enter event description..."
                    rows={6}
                  />

                  <WebflowTextareaField
                    control={form.control}
                    name="shortDescription"
                    label="Short Description"
                    placeholder="Brief event summary..."
                    rows={3}
                  />

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

                  {/* Links */}
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

                  {/* Images */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowImageField
                      control={form.control}
                      name="thumbnail"
                      label="Thumbnail"
                    />

                    <WebflowImageField
                      control={form.control}
                      name="heroImage"
                      label="Hero Image"
                    />
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
                      label="Featured Event"
                      description="Display this event prominently on the homepage"
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
    </div>
  );
});
