'use client';
import React, { useState } from 'react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './dialog';
import { toast } from 'react-hot-toast';

interface SaveConfirmationProps {
  onAction: (
    status: 'draft' | 'published'
  ) => Promise<{ slug?: string; error?: string } | void>;
  triggerClassName?: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  itemLabel?: string; // e.g. "Post", "Event"
  // New props for confirm-only mode
  mode?: 'chooser' | 'confirm';
  preset?: 'draft' | 'published';
  triggerLabel?: string;
}

export const SaveConfirmation: React.FC<SaveConfirmationProps> = ({
  onAction,
  triggerClassName = 'bg-blue-600 hover:bg-blue-700 text-white',
  disabled,
  isSubmitting,
  itemLabel = 'Item',
  mode = 'chooser',
  preset,
  triggerLabel
}) => {
  const [open, setOpen] = useState(false);
  const [internalLoading, setInternalLoading] = useState<
    'draft' | 'published' | null
  >(null);

  const run = async (status: 'draft' | 'published') => {
    setInternalLoading(status);
    try {
      const res = await onAction(status);
      const slug = (res as any)?.slug ? ` (slug: ${(res as any).slug})` : '';
      if ((res as any)?.error) {
        toast.error(`${itemLabel} save failed: ${(res as any).error}`);
      } else {
        toast.success(
          status === 'draft'
            ? `${itemLabel} saved as draft${slug}. Drafts are not publicly visible.`
            : `${itemLabel} published successfully${slug}. This ${itemLabel.toLowerCase()} is now publicly visible.`
        );
        // In confirm-only mode we close the dialog before running; in chooser mode we can also ensure closed after success
        setOpen(false);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    } finally {
      setInternalLoading(null);
    }
  };

  // Confirm-only mode: user already chose the action via the trigger button
  if (mode === 'confirm' && preset) {
    const isBusy = internalLoading === preset || isSubmitting;
    const actionLabel = preset === 'published' ? 'Publish' : 'Save as Draft';

    return (
      <>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled || isBusy}
          className={triggerClassName}
        >
          {isBusy ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              {preset === 'published' ? 'Publishing...' : 'Saving...'}
            </span>
          ) : (
            triggerLabel || actionLabel
          )}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionLabel} {itemLabel}
              </DialogTitle>
              <DialogDescription>
                Please confirm you want to {actionLabel.toLowerCase()} this{' '}
                {itemLabel.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                disabled={isBusy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  // Close the dialog immediately to avoid full-screen overlay during async save
                  setOpen(false);
                  // Defer the async action to the next tick so the overlay can unmount first
                  setTimeout(() => {
                    void run(preset);
                  }, 0);
                }}
                disabled={isBusy}
                className={triggerClassName}
              >
                {isBusy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    {preset === 'published' ? 'Publishing...' : 'Saving...'}
                  </span>
                ) : (
                  'Confirm'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Default chooser mode (existing behavior)
  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled || isSubmitting}
        className={triggerClassName}
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save {itemLabel}</DialogTitle>
            <DialogDescription>
              Choose how you would like to save this {itemLabel.toLowerCase()}.
              Drafts remain private; publishing makes it publicly visible
              immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm text-gray-200">
            <p>
              <strong>Save as Draft</strong> keeps your{' '}
              {itemLabel.toLowerCase()} hidden from the public while you
              continue editing.
            </p>
            <p>
              <strong>Publish</strong> will make this {itemLabel.toLowerCase()}{' '}
              visible to all site visitors. Ensure all content is final.
            </p>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
              disabled={internalLoading !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => run('draft')}
              disabled={internalLoading !== null}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              {internalLoading === 'draft' ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              type="button"
              onClick={() => run('published')}
              disabled={internalLoading !== null}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {internalLoading === 'published' ? 'Publishing...' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
