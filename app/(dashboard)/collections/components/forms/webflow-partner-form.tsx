'use client';

import React, {
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState
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
  WebflowImageField,
  WebflowTagsField
} from './webflow-form-fields';
import { IncomingPartnerData } from '../interfaces-incoming';
import { generateSlug } from './base-form';
import './compact-form.css';
import { SaveConfirmation } from '@/components/ui/save-confirmation';

// Webflow CMS Partner Schema
const webflowPartnerSchema = z.object({
  title: z.string().min(1, 'Name is required'), // maps to name
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft'),
  nameArabic: z.string().optional(),
  shortDescription: z.string().optional(),
  shortDescriptionArabic: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  logo: z
    .object({
      url: z.string().optional(),
      alt: z.string().optional()
    })
    .optional(),
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
  tags: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string()
      })
    )
    .default([])
});

export type WebflowPartnerFormData = z.infer<typeof webflowPartnerSchema>;

interface WebflowPartnerFormProps {
  initialData?: Partial<IncomingPartnerData>;
  onSubmit: (data: IncomingPartnerData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isEditing?: boolean;
}

export interface WebflowPartnerFormRef {
  triggerSubmit: () => void;
  setStatus: (status: 'draft' | 'published') => void;
}

export const WebflowPartnerForm = forwardRef<
  WebflowPartnerFormRef,
  WebflowPartnerFormProps
>(({ initialData, onSubmit, onCancel, onDelete, isEditing = false }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<null | 'draft' | 'published'>(
    null
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const form = useForm<WebflowPartnerFormData>({
    resolver: zodResolver(webflowPartnerSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      nameArabic: initialData?.nameArabic || '',
      shortDescription: initialData?.shortDescription || '',
      shortDescriptionArabic: initialData?.shortDescriptionArabic || '',
      website: initialData?.website || '',
      logo: initialData?.logo || { url: '', alt: '' },
      group: initialData?.group ? JSON.stringify(initialData.group) : '',
      tags: initialData?.tags || []
    }
  });

  // Reset when initialData changes
  useEffect(() => {
    const newValues = {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      nameArabic: initialData?.nameArabic || '',
      shortDescription: initialData?.shortDescription || '',
      shortDescriptionArabic: initialData?.shortDescriptionArabic || '',
      website: initialData?.website || '',
      logo: initialData?.logo || { url: '', alt: '' },
      group: initialData?.group ? JSON.stringify(initialData.group) : '',
      tags: initialData?.tags || []
    };
    form.reset(newValues);
  }, [initialData, form]);

  // Manual slug generation with collection type suffix
  const handleGenerateSlug = () => {
    const currentTitle = form.getValues('title');
    if (currentTitle) {
      let baseSlug = generateSlug(currentTitle);

      // Add collection type suffix to reduce chance of conflicts
      const uniqueSlug = `${baseSlug}-partner`;

      form.setValue('slug', uniqueSlug);
    }
  };

  const handleSubmit = async (data: WebflowPartnerFormData) => {
    const status = data.status;
    setBusyAction(status);

    try {
      setIsLoading(true);
      await onSubmit(data as IncomingPartnerData);
    } catch (error) {
      console.error('Partner form submission error:', error);
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
      throw new Error('An unexpected error occurred while saving the partner.');
    } finally {
      setIsLoading(false);
      setBusyAction(null);
    }
  };

  // Expose submit/draft via ref
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

  const groupOptions = [
    { value: 'group-1', label: 'Academic' },
    { value: 'group-2', label: 'Corporate' },
    { value: 'group-3', label: 'NGO' },
    { value: 'group-4', label: 'Government' }
  ];

  return (
    <div className="h-full flex flex-col prevent-layout-shift">
      {/* Action Bar with Delete Button */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 p-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {isEditing ? 'Edit' : 'Create'} Partner
          </h3>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
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
              mode="confirm"
              preset="draft"
              triggerLabel="Save as Draft"
              triggerClassName="bg-gray-700 hover:bg-gray-600 text-white"
              onAction={async (status) => {
                setBusyAction('draft');
                form.setValue('status', status);
                await form.handleSubmit(handleSubmit)();
                return { slug: form.getValues().slug };
              }}
              disabled={isLoading}
              isSubmitting={busyAction === 'draft'}
              itemLabel="Partner"
            />
            <SaveConfirmation
              mode="confirm"
              preset="published"
              triggerLabel="Publish"
              triggerClassName="bg-blue-600 hover:bg-blue-700 text-white"
              onAction={async (status) => {
                setBusyAction('published');
                form.setValue('status', status);
                await form.handleSubmit(handleSubmit)();
                return { slug: form.getValues().slug };
              }}
              disabled={isLoading}
              isSubmitting={busyAction === 'published'}
              itemLabel="Partner"
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
              {/* Basic Info */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">Basic info</h2>

                <div className="space-y-6">
                  <WebflowTextField
                    control={form.control}
                    name="title"
                    label="Name"
                    placeholder="Enter partner name"
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
                  </div>

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
                      name="nameArabic"
                      label="Arabic Name"
                      placeholder="الاسم بالعربية"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">
                  Custom fields
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WebflowTextareaField
                      control={form.control}
                      name="shortDescription"
                      label="Short Description (English)"
                      rows={4}
                      placeholder="Brief partner description"
                    />

                    <WebflowTextareaField
                      control={form.control}
                      name="shortDescriptionArabic"
                      label="Short Description (Arabic)"
                      rows={4}
                      placeholder="وصف مختصر للشريك"
                    />
                  </div>

                  {/* Logo upload with collectionType + slug for folder organization */}
                  <WebflowImageField
                    control={form.control}
                    name="logo"
                    label="Logo"
                    helperText="Upload partner logo"
                    collectionType="partners"
                    slug={form.watch('slug')}
                  />

                  {/* Tags */}
                  <WebflowTagsField
                    control={form.control}
                    name="tags"
                    label="Tags"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Submit Button - submitted via header buttons */}
          <button type="submit" className="hidden" disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : isEditing
                ? 'Update Partner'
                : 'Create Partner'}
          </button>
        </form>
      </Form>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Partner</DialogTitle>
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

WebflowPartnerForm.displayName = 'WebflowPartnerForm';
