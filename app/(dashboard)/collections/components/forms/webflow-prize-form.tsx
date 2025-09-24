'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  WebflowTextField,
  WebflowTextareaField,
  WebflowSlugField,
  WebflowSelectField
} from './webflow-form-fields';
import { IncomingPrizeData } from '../interfaces-incoming';
import { generateSlug } from './base-form';
import './compact-form.css';
import { SaveConfirmation } from '@/components/ui/save-confirmation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

const prizeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft')
});

export type WebflowPrizeFormData = z.infer<typeof prizeSchema>;

interface WebflowPrizeFormProps {
  initialData?: Partial<IncomingPrizeData>;
  onSubmit: (data: IncomingPrizeData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isEditing?: boolean;
}

export interface WebflowPrizeFormRef {
  triggerSubmit: () => void;
  setStatus: (status: 'draft' | 'published') => void;
}

function toIncoming(data: WebflowPrizeFormData): IncomingPrizeData {
  return {
    title: data.title,
    description: data.description,
    slug: data.slug,
    status: data.status
  };
}

export const WebflowPrizeForm = forwardRef<
  WebflowPrizeFormRef,
  WebflowPrizeFormProps
>(({ initialData, onSubmit, onCancel, onDelete, isEditing = false }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<null | 'draft' | 'published'>(
    null
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const form = useForm<WebflowPrizeFormData>({
    resolver: zodResolver(prizeSchema),
    defaultValues: {
      title: (initialData?.title as string) || '',
      description: (initialData?.description as string) || '',
      slug: (initialData?.slug as string) || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft'
    }
  });

  useEffect(() => {
    form.reset({
      title: (initialData?.title as string) || '',
      description: (initialData?.description as string) || '',
      slug: (initialData?.slug as string) || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft'
    });
  }, [initialData, form]);

  useImperativeHandle(ref, () => ({
    triggerSubmit: () => form.handleSubmit(handleSubmit)(),
    setStatus: (status: 'draft' | 'published') =>
      form.setValue('status', status)
  }));

  const handleGenerateSlug = () => {
    const currentTitle = form.getValues('title');
    if (currentTitle) {
      let baseSlug = generateSlug(currentTitle);

      // Add collection type suffix to reduce chance of conflicts
      const uniqueSlug = `${baseSlug}-prize`;

      form.setValue('slug', uniqueSlug);
    }
  };

  const handleSubmit = async (data: WebflowPrizeFormData) => {
    const status = data.status;
    setBusyAction(status);

    try {
      setIsLoading(true);
      await onSubmit(toIncoming(data));
    } catch (error) {
      console.error('Prize form submit error:', error);
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
      throw new Error('An unexpected error occurred while saving the prize.');
    } finally {
      setIsLoading(false);
      setBusyAction(null);
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' }
  ];

  return (
    <div className="h-full flex flex-col prevent-layout-shift">
      {/* Header actions */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 p-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {isEditing ? 'Edit' : 'Create'} Prize
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
              preset="draft"
              onAction={async (status) => {
                form.setValue('status', status);
                await form.handleSubmit(handleSubmit)();
                return { slug: form.getValues().slug };
              }}
              disabled={isLoading}
              isSubmitting={busyAction === 'draft'}
              itemLabel="Prize"
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
              itemLabel="Prize"
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
              {/* Basic Details */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">
                  Basic details
                </h2>
                <WebflowTextField
                  control={form.control}
                  name="title"
                  label="Title"
                  required
                  placeholder="Enter prize title"
                />
                <WebflowTextareaField
                  control={form.control}
                  name="description"
                  label="Description"
                  rows={3}
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
              </div>
            </div>
          </div>

          {/* Hidden Submit Button */}
          <button type="submit" className="hidden" disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : isEditing
                ? 'Update Prize'
                : 'Create Prize'}
          </button>
        </form>
      </Form>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Prize</DialogTitle>
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

WebflowPrizeForm.displayName = 'WebflowPrizeForm';
