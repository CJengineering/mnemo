/**
 * Example usage of Collection Image Fields
 * Shows how to use the organized folder structure for different collection types
 */

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import {
  CollectionImageField,
  CollectionMultiImageField
} from './collection-image-fields';
import { WebflowTextField } from './webflow-form-fields';
import { Button } from '@/components/ui/button';

interface ExampleFormData {
  slug: string;
  title: string;
  mainImage: {
    url: string;
    alt: string;
  };
  galleryImages: Array<{
    url: string;
    alt: string;
  }>;
}

interface CollectionImageExampleProps {
  collectionType: 'team' | 'events' | 'news' | 'publications' | 'awards';
  initialData?: Partial<ExampleFormData>;
}

export function CollectionImageExample({
  collectionType,
  initialData = {}
}: CollectionImageExampleProps) {
  const form = useForm<ExampleFormData>({
    defaultValues: {
      slug: initialData.slug || '',
      title: initialData.title || '',
      mainImage: initialData.mainImage || { url: '', alt: '' },
      galleryImages: initialData.galleryImages || []
    }
  });

  const watchedSlug = form.watch('slug');

  const onSubmit = (data: ExampleFormData) => {
    console.log('Form submitted with organized images:', data);
    // Images will be stored at:
    // Main image: https://cdn.communityjameel.io/collection/[collectionType]/[slug]/main-image.webp
    // Gallery: https://cdn.communityjameel.io/collection/[collectionType]/[slug]/gallery-image-1.webp
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">
          Collection Image Upload Example - {collectionType}
        </h2>

        {/* Basic Fields */}
        <div className="space-y-4 mb-6">
          <WebflowTextField
            control={form.control}
            name="title"
            label="Title"
            placeholder="Enter title..."
            required
          />

          <WebflowTextField
            control={form.control}
            name="slug"
            label="Slug"
            placeholder="auto-generated-slug"
            required
            helperText="This creates the folder structure for images"
          />
        </div>

        {/* Single Collection Image */}
        <div className="mb-6">
          <CollectionImageField
            control={form.control}
            name="mainImage"
            label="Main Image"
            required
            helperText={`Will be stored at: collection/${collectionType}/${watchedSlug || '[slug]'}/main-image.webp`}
            collectionType={collectionType}
            slug={watchedSlug}
            preserveFormat={false} // Convert to WebP for optimization
          />
        </div>

        {/* Multiple Collection Images */}
        <div className="mb-6">
          <CollectionMultiImageField
            control={form.control}
            name="galleryImages"
            label="Gallery Images"
            helperText={`Will be stored at: collection/${collectionType}/${watchedSlug || '[slug]'}/gallery-*.webp`}
            maxImages={5}
            collectionType={collectionType}
            slug={watchedSlug}
            preserveFormat={false}
            multiple
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!watchedSlug}
          >
            Save {collectionType} Item
          </Button>

          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset Form
          </Button>
        </div>

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-gray-800 rounded border border-gray-600">
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            Debug Info:
          </h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div>
              Collection Type:{' '}
              <span className="text-blue-400">{collectionType}</span>
            </div>
            <div>
              Current Slug:{' '}
              <span className="text-blue-400">{watchedSlug || 'Not set'}</span>
            </div>
            <div>
              Upload Enabled:{' '}
              <span className="text-blue-400">
                {watchedSlug ? 'Yes' : 'No (slug required)'}
              </span>
            </div>
            <div>
              Folder Structure:{' '}
              <span className="text-blue-400">
                collection/{collectionType}/{watchedSlug || '[slug]'}/
              </span>
            </div>
          </div>
        </div>

        {/* Example URLs */}
        {watchedSlug && (
          <div className="mt-4 p-4 bg-green-900/20 rounded border border-green-700">
            <h3 className="text-sm font-medium text-green-300 mb-2">
              Example URLs:
            </h3>
            <div className="text-xs text-green-200 space-y-1 break-all">
              <div>
                Main Image: https://cdn.communityjameel.io/collection/
                {collectionType}/{watchedSlug}/main-image.webp
              </div>
              <div>
                Gallery Image: https://cdn.communityjameel.io/collection/
                {collectionType}/{watchedSlug}/gallery-image-1.webp
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

/**
 * Different collection type examples
 */
export function TeamImageExample() {
  return (
    <CollectionImageExample
      collectionType="team"
      initialData={{
        title: 'George Richards',
        slug: 'george-richards'
      }}
    />
  );
}

export function EventImageExample() {
  return (
    <CollectionImageExample
      collectionType="events"
      initialData={{
        title: 'Community Jameel Annual Conference',
        slug: 'annual-conference-2024'
      }}
    />
  );
}

export function NewsImageExample() {
  return (
    <CollectionImageExample
      collectionType="news"
      initialData={{
        title: 'Breaking Research News',
        slug: 'breaking-research-news'
      }}
    />
  );
}
