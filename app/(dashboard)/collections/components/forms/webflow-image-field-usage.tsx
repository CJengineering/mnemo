'use client';

/**
 * Example of how to use the updated WebflowImageField with collection folder structure
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { WebflowImageField, WebflowTextField } from './webflow-form-fields';

interface ExampleFormData {
  slug: string;
  title: string;
  profileImage: {
    url: string;
    alt: string;
  };
  galleryImages: Array<{
    url: string;
    alt: string;
  }>;
  regularImage: {
    url: string;
    alt: string;
  };
}

export function WebflowImageFieldExample() {
  const form = useForm<ExampleFormData>();
  const watchedSlug = form.watch('slug');

  return (
    <form className="space-y-6">
      {/* Basic Fields */}
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

      {/* Single Image with Collection Structure */}
      <WebflowImageField
        control={form.control}
        name="profileImage"
        label="Profile Image"
        required
        helperText="Main profile image"
        collectionType="team" // Creates /collection/team/
        slug={watchedSlug} // Creates /[slug]/
        preserveFormat={false} // Convert to WebP
      />

      {/* Multiple Images with Collection Structure */}
      <WebflowImageField
        control={form.control}
        name="galleryImages"
        label="Gallery Images"
        helperText="Additional images"
        multiple={true}
        maxImages={5}
        collectionType="team"
        slug={watchedSlug}
        preserveFormat={false}
      />

      {/* Regular Image Field (without collection structure) */}
      <WebflowImageField
        control={form.control}
        name="regularImage"
        label="Regular Image"
        helperText="Uses the old upload system"
        // No collectionType or slug = uses original API
      />
    </form>
  );
}

/**
 * Usage Examples for Different Collection Types
 */
export function WebflowImageFieldUsageExamples() {
  const exampleForm = useForm({
    defaultValues: {
      profileImage: '',
      eventImage: '',
      featuredImage: '',
      coverImage: ''
    }
  });

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold mb-4">
        WebflowImageField Usage Examples
      </h2>

      {/* Team Member */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Team Member Profile</h3>
        <p className="text-sm text-gray-600 mb-4">
          Result:{' '}
          <code>collection/team/george-richards/profile-image.webp</code>
        </p>
        <WebflowImageField
          control={exampleForm.control}
          name="profileImage"
          label="Profile Photo"
          collectionType="team"
          slug="george-richards"
        />
      </div>

      {/* Event */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Event Banner</h3>
        <p className="text-sm text-gray-600 mb-4">
          Result:{' '}
          <code>
            collection/events/annual-conference-2024/event-banner.webp
          </code>
        </p>
        <WebflowImageField
          control={exampleForm.control}
          name="eventImage"
          label="Event Banner"
          collectionType="events"
          slug="annual-conference-2024"
        />
      </div>

      {/* News Article */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">
          News Article Featured Image
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Result:{' '}
          <code>
            collection/news/breaking-research-news/featured-image.webp
          </code>
        </p>
        <WebflowImageField
          control={exampleForm.control}
          name="featuredImage"
          label="Featured Image"
          collectionType="news"
          slug="breaking-research-news"
        />
      </div>

      {/* Publication */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">
          Publication Cover (Preserve Original Format)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Result:{' '}
          <code>
            collection/publications/climate-change-report-2024/cover-image.jpg
          </code>
        </p>
        <WebflowImageField
          control={exampleForm.control}
          name="coverImage"
          label="Publication Cover"
          collectionType="publications"
          slug="climate-change-report-2024"
          preserveFormat={true} // Keep original format
        />
      </div>
    </div>
  );
}
