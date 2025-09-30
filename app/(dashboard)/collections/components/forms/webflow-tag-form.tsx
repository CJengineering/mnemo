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
  WebflowSelectField
} from './webflow-form-fields';
import { IncomingTagData } from '../interfaces-incoming';
import { generateSlug } from './base-form';
import './compact-form.css';
import { SaveConfirmation } from '@/components/ui/save-confirmation';

const tagSchema = z.object({
  // Form fields
  name: z.string().min(1, 'Name is required'),
  nameArabic: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']).default('draft'),

  // Title is derived from name (not shown in UI)
  title: z.string().optional()
});

export type WebflowTagFormData = z.infer<typeof tagSchema>;

interface WebflowTagFormProps {
  initialData?: Partial<IncomingTagData>;
  onSubmit: (data: IncomingTagData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  isEditing?: boolean;
}

export interface WebflowTagFormRef {
  triggerSubmit: () => void;
  setStatus: (status: 'draft' | 'published') => void;
}

function toIncoming(data: WebflowTagFormData): IncomingTagData {
  return {
    title: data.title && data.title.length > 0 ? data.title : data.name,
    slug: data.slug,
    status: data.status,
    name: data.name,
    'name-arabic': data.nameArabic
  };
}

export const WebflowTagForm = forwardRef<
  WebflowTagFormRef,
  WebflowTagFormProps
>(({ initialData, onSubmit, onCancel, onDelete, isEditing = false }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<null | 'draft' | 'published'>(
    null
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const form = useForm<WebflowTagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name:
        (initialData?.name as string) || (initialData?.title as string) || '',
      nameArabic: (initialData?.['name-arabic'] as string) || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      title: (initialData?.title as string) || ''
    }
  });

  // Keep title synced to name if not manually set
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name' && value.name) {
        // Only sync if title is empty or equal to previous name
        const currentTitle = form.getValues('title');
        if (!currentTitle || currentTitle === value.name) {
          form.setValue('title', value.name);
        }
      }
    });
    return subscription.unsubscribe;
  }, [form]);

  useEffect(() => {
    form.reset({
      name:
        (initialData?.name as string) || (initialData?.title as string) || '',
      nameArabic: (initialData?.['name-arabic'] as string) || '',
      slug: initialData?.slug || '',
      status: (initialData?.status as 'draft' | 'published') || 'draft',
      title: (initialData?.title as string) || ''
    });
  }, [initialData, form]);

  const handleSubmit = async (data: WebflowTagFormData) => {
    const status = data.status;
    setBusyAction(status);

    try {
      setIsLoading(true);
      await onSubmit(toIncoming(data));
    } catch (error) {
      console.error('Tag form submit error:', error);
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
      throw new Error('An unexpected error occurred while saving the tag.');
    } finally {
      setIsLoading(false);
      setBusyAction(null);
    }
  };

  useImperativeHandle(ref, () => ({
    triggerSubmit: () => form.handleSubmit(handleSubmit)(),
    setStatus: (status: 'draft' | 'published') =>
      form.setValue('status', status)
  }));

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' }
  ];

  const handleGenerateSlug = () => {
    const currentName = form.getValues('name');
    if (currentName) {
      let baseSlug = generateSlug(currentName);

      // Add collection type suffix to reduce chance of conflicts
      const uniqueSlug = `${baseSlug}-tag`;

      form.setValue('slug', uniqueSlug);
    }
  };

  return (
    <div className="h-full flex flex-col prevent-layout-shift">
      {/* Header actions */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 p-4 -mx-6 -mt-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {isEditing ? 'Edit' : 'Create'} Tag
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
              itemLabel="Tag"
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
              itemLabel="Tag"
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
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">Basic info</h2>
                <WebflowTextField
                  control={form.control}
                  name="name"
                  label="Name"
                  placeholder="Enter tag name"
                  required
                />
                <WebflowTextField
                  control={form.control}
                  name="nameArabic"
                  label="Name (Arabic)"
                  placeholder="الاسم بالعربية"
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
            {isLoading ? 'Saving...' : isEditing ? 'Update Tag' : 'Create Tag'}
          </button>
        </form>
      </Form>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Tag</DialogTitle>
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

WebflowTagForm.displayName = 'WebflowTagForm';
