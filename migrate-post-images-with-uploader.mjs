#!/usr/bin/env node

/**
 * Post Images Migration Script Using Existing ImageUploader Utility
 *
 * This script fetches post collection items from the external database,
 * finds all image URLs (including OpenGraph images), and migrates them
 * using the existing imageUploader.ts utility.
 *
 * Usage: node migrate-post-images-with-uploader.mjs [--limit=20] [--dry-run]
 *
 * Examples:
 * - node migrate-post-images-with-uploader.mjs --limit=5     # Process first 5 posts for testing
 * - node migrate-post-images-with-uploader.mjs --dry-run     # Preview what would be migrated
 * - node migrate-post-images-with-uploader.mjs --limit=20    # Process first 20 posts
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { register } from 'ts-node';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Register TypeScript support for importing TS modules
register({
  project: join(dirname(fileURLToPath(import.meta.url)), 'tsconfig.json'),
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS'
  }
});

// Configuration
const CONFIG = {
  MNEMO_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app',
  CDN_BASE_URL: 'https://cdn.communityjameel.io',
  LIMIT: 20, // Process first 20 posts by default
  TIMEOUT: 30000, // 30 seconds timeout
  CONCURRENCY: 2 // Process 2 posts at a time
};

// Parse command line arguments
const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const isDryRun = args.includes('--dry-run');

const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : CONFIG.LIMIT;

console.log('🚀 Post Images Migration Script');
console.log('================================');
console.log(`📊 Processing limit: ${LIMIT} posts`);
console.log(
  `🔧 Mode: ${isDryRun ? 'DRY RUN (preview only)' : 'LIVE MIGRATION'}`
);
console.log(`🌐 API Base: ${CONFIG.MNEMO_API_BASE}`);
console.log(`📁 CDN Base: ${CONFIG.CDN_BASE_URL}`);
console.log('');

/**
 * Fetch post collection items from external database
 */
async function fetchPostItems() {
  console.log('📡 Fetching post collection items from external database...');

  try {
    const response = await fetch(
      `${CONFIG.MNEMO_API_BASE}/api/collection-items?type=post`
    );

    if (!response.ok) {
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    const posts = data.collectionItems || [];

    console.log(`✅ Found ${posts.length} total posts`);

    // Limit the posts to process
    const postsToProcess = posts.slice(0, LIMIT);
    console.log(`📋 Will process ${postsToProcess.length} posts`);

    return postsToProcess;
  } catch (error) {
    console.error('❌ Failed to fetch posts:', error.message);
    throw error;
  }
}

/**
 * Find all image URLs in a post's data
 */
function findImageUrls(post) {
  const images = [];
  const data = post.data || {};

  // Check for main images
  if (
    data.mainImage?.url &&
    data.mainImage.url !== '' &&
    data.mainImage.url !== 'N/A'
  ) {
    images.push({
      type: 'mainImage',
      url: data.mainImage.url,
      alt: data.mainImage.alt || ''
    });
  }

  // Check for thumbnail
  if (
    data.thumbnail?.url &&
    data.thumbnail.url !== '' &&
    data.thumbnail.url !== 'N/A'
  ) {
    images.push({
      type: 'thumbnail',
      url: data.thumbnail.url,
      alt: data.thumbnail.alt || ''
    });
  }

  // Check for OpenGraph image
  if (
    data.openGraphImage?.url &&
    data.openGraphImage.url !== '' &&
    data.openGraphImage.url !== 'N/A'
  ) {
    images.push({
      type: 'openGraphImage',
      url: data.openGraphImage.url,
      alt: data.openGraphImage.alt || ''
    });
  }

  // Check for image carousel
  if (data.imageCarousel && Array.isArray(data.imageCarousel)) {
    data.imageCarousel.forEach((img, index) => {
      if (img?.url && img.url !== '' && img.url !== 'N/A') {
        images.push({
          type: 'imageCarousel',
          url: img.url,
          alt: img.alt || '',
          index: index
        });
      }
    });
  }

  return images;
}

/**
 * Process a single post's images
 */
async function processPostImages(post) {
  const postTitle = post.title || 'Untitled';
  const postSlug = post.slug || 'untitled';

  console.log(`\n📝 Processing post: "${postTitle}" (${post.id})`);
  console.log(`   🔗 Slug: ${postSlug}`);

  // Find all image URLs in the post
  const images = findImageUrls(post);

  if (images.length === 0) {
    console.log('   ⚠️  No images found in this post');
    return {
      post: {
        id: post.id,
        title: postTitle,
        slug: postSlug
      },
      images: [],
      migration: { success: true, message: 'No images to migrate' },
      summary: {
        totalImages: 0,
        successfulImages: 0,
        failedImages: 0,
        skippedImages: 0
      }
    };
  }

  console.log(`   📸 Found ${images.length} images to process:`);
  images.forEach((img, i) => {
    console.log(
      `      ${i + 1}. ${img.type}${img.index !== undefined ? `[${img.index}]` : ''}: ${img.url}`
    );
  });

  if (isDryRun) {
    console.log('   🔍 DRY RUN: Would migrate these images to:');
    images.forEach((img, i) => {
      const filename = getFilenameFromUrl(img.url);
      const expectedPath = `website/collection/post/${postSlug}/${img.type}${img.index !== undefined ? `-${img.index}` : ''}-${filename}`;
      console.log(`      ${i + 1}. ${CONFIG.CDN_BASE_URL}/${expectedPath}`);
    });

    return {
      post: {
        id: post.id,
        title: postTitle,
        slug: postSlug
      },
      images: images.map((img) => ({
        type: img.type,
        index: img.index,
        originalUrl: img.url,
        newUrl: `${CONFIG.CDN_BASE_URL}/website/collection/post/${postSlug}/${img.type}-preview.webp`,
        status: 'dry-run'
      })),
      migration: { success: true, message: 'Dry run completed' },
      summary: {
        totalImages: images.length,
        successfulImages: 0,
        failedImages: 0,
        skippedImages: images.length
      }
    };
  }

  // Import the imageUploader utility dynamically
  let imageUploader;
  try {
    const module = await import('./lib/utils/imageUploader.js');
    imageUploader = module;
  } catch (error) {
    console.error(
      '   ❌ Failed to import imageUploader utility:',
      error.message
    );
    return {
      post: {
        id: post.id,
        title: postTitle,
        slug: postSlug
      },
      images: [],
      migration: {
        success: false,
        error: 'Failed to import imageUploader utility'
      },
      summary: {
        totalImages: images.length,
        successfulImages: 0,
        failedImages: images.length,
        skippedImages: 0
      }
    };
  }

  // Process images using the imageUploader utility
  const migrationResults = [];

  for (const img of images) {
    try {
      console.log(
        `   🔄 Migrating ${img.type}${img.index !== undefined ? `[${img.index}]` : ''}: ${img.url}`
      );

      // Create a specific filename for this image type
      const originalFilename = getFilenameFromUrl(img.url);
      const filename = `${img.type}${img.index !== undefined ? `-${img.index}` : ''}-${originalFilename}`;

      const result = await imageUploader.imageUploaderToCDN(
        img.url,
        'post', // collection name
        postSlug, // slug for folder organization
        filename, // custom filename
        {
          compressToWebP: true,
          quality: 80
        }
      );

      migrationResults.push({
        type: img.type,
        index: img.index,
        originalUrl: img.url,
        newUrl: result.newUrl,
        status: result.success ? 'success' : 'failed',
        error: result.error
      });

      if (result.success) {
        console.log(
          `   ✅ Successfully migrated: ${result.originalUrl} → ${result.newUrl}`
        );
      } else {
        console.log(`   ❌ Failed to migrate: ${result.error}`);
      }

      // Small delay between images
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`   ❌ Error processing ${img.type}: ${error.message}`);
      migrationResults.push({
        type: img.type,
        index: img.index,
        originalUrl: img.url,
        newUrl: img.url, // fallback to original
        status: 'failed',
        error: error.message
      });
    }
  }

  // Now update the post with the new image URLs
  let updateResult = {
    success: true,
    message: 'No update needed (dry run or no successful migrations)'
  };

  const successfulMigrations = migrationResults.filter(
    (r) => r.status === 'success'
  );
  if (successfulMigrations.length > 0) {
    try {
      console.log(
        `   📝 Updating post with ${successfulMigrations.length} new image URLs...`
      );

      // Create updated data object
      const updatedData = { ...post.data };

      successfulMigrations.forEach((result) => {
        if (result.type === 'mainImage') {
          updatedData.mainImage = {
            url: result.newUrl,
            alt: updatedData.mainImage?.alt || ''
          };
        } else if (result.type === 'thumbnail') {
          updatedData.thumbnail = {
            url: result.newUrl,
            alt: updatedData.thumbnail?.alt || ''
          };
        } else if (result.type === 'openGraphImage') {
          updatedData.openGraphImage = {
            url: result.newUrl,
            alt: updatedData.openGraphImage?.alt || ''
          };
        } else if (
          result.type === 'imageCarousel' &&
          result.index !== undefined
        ) {
          if (!updatedData.imageCarousel) updatedData.imageCarousel = [];
          if (!updatedData.imageCarousel[result.index])
            updatedData.imageCarousel[result.index] = {};
          updatedData.imageCarousel[result.index].url = result.newUrl;
        }
      });

      // Update the post in the database
      const updateResponse = await fetch(
        `${CONFIG.MNEMO_API_BASE}/api/collection-items/${post.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: post.type,
            status: post.status,
            slug: post.slug,
            title: post.title,
            data: updatedData
          })
        }
      );

      if (updateResponse.ok) {
        console.log(`   ✅ Successfully updated post in database`);
        updateResult = { success: true, message: 'Post updated successfully' };
      } else {
        const errorText = await updateResponse.text();
        console.log(
          `   ❌ Failed to update post: ${updateResponse.status} - ${errorText}`
        );
        updateResult = {
          success: false,
          error: `Update failed: ${updateResponse.status}`
        };
      }
    } catch (error) {
      console.error(`   ❌ Error updating post: ${error.message}`);
      updateResult = { success: false, error: error.message };
    }
  }

  const summary = {
    totalImages: images.length,
    successfulImages: migrationResults.filter((r) => r.status === 'success')
      .length,
    failedImages: migrationResults.filter((r) => r.status === 'failed').length,
    skippedImages: migrationResults.filter((r) => r.status === 'dry-run').length
  };

  console.log(
    `   📊 Migration summary: ${summary.successfulImages}/${summary.totalImages} successful`
  );

  return {
    post: {
      id: post.id,
      title: postTitle,
      slug: postSlug
    },
    images: migrationResults,
    migration: updateResult,
    summary
  };
}

/**
 * Helper function to extract filename from URL
 */
function getFilenameFromUrl(url) {
  try {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    const filename = lastPart.split('?')[0]; // Remove query parameters

    if (!filename || !filename.includes('.')) {
      const timestamp = Date.now();
      return `image-${timestamp}.jpg`;
    }

    return filename;
  } catch {
    const timestamp = Date.now();
    return `image-${timestamp}.jpg`;
  }
}

/**
 * Process posts with concurrency control
 */
async function processPostsWithConcurrency(posts, concurrency) {
  const results = [];

  for (let i = 0; i < posts.length; i += concurrency) {
    const batch = posts.slice(i, i + concurrency);

    console.log(
      `\n🔄 Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(posts.length / concurrency)} (${batch.length} posts)...`
    );

    const batchPromises = batch.map((post) => processPostImages(post));
    const batchResults = await Promise.all(batchPromises);

    results.push(...batchResults);

    // Small delay between batches
    if (i + concurrency < posts.length) {
      console.log('   ⏱️  Waiting 2 seconds before next batch...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Main execution function
 */
async function main() {
  try {
    const startTime = Date.now();

    // Step 1: Fetch posts from external database
    const posts = await fetchPostItems();

    if (posts.length === 0) {
      console.log('ℹ️  No posts found to process');
      return;
    }

    // Step 2: Process posts with concurrency control
    const results = await processPostsWithConcurrency(
      posts,
      CONFIG.CONCURRENCY
    );

    // Step 3: Generate summary report
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n🎯 MIGRATION COMPLETED');
    console.log('=====================');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Processed: ${results.length} posts`);

    const totalImages = results.reduce(
      (sum, r) => sum + r.summary.totalImages,
      0
    );
    const successfulImages = results.reduce(
      (sum, r) => sum + r.summary.successfulImages,
      0
    );
    const failedImages = results.reduce(
      (sum, r) => sum + r.summary.failedImages,
      0
    );
    const skippedImages = results.reduce(
      (sum, r) => sum + r.summary.skippedImages,
      0
    );

    console.log(`🖼️  Total images: ${totalImages}`);
    console.log(`✅ Successful migrations: ${successfulImages}`);
    console.log(`❌ Failed migrations: ${failedImages}`);
    console.log(`⏭️  Skipped (dry run): ${skippedImages}`);

    const successfulPosts = results.filter((r) => r.migration.success).length;
    const failedPosts = results.filter((r) => !r.migration.success).length;

    console.log(`📝 Posts updated: ${successfulPosts}`);
    console.log(`📝 Posts failed to update: ${failedPosts}`);

    // Save detailed report
    const reportData = {
      summary: {
        totalPosts: results.length,
        totalImages,
        successfulImages,
        failedImages,
        skippedImages,
        successfulPosts,
        failedPosts,
        duration: `${duration}s`,
        mode: isDryRun ? 'dry-run' : 'live-migration',
        timestamp: new Date().toISOString()
      },
      results
    };

    const reportFileName = `post-images-uploader-migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    await import('fs').then((fs) => {
      fs.writeFileSync(reportFileName, JSON.stringify(reportData, null, 2));
      console.log(`📄 Detailed report saved: ${reportFileName}`);
    });

    if (isDryRun) {
      console.log(
        '\n💡 This was a dry run. To perform actual migration, run without --dry-run flag'
      );
    }

    console.log('\n✅ Migration script completed successfully!');
  } catch (error) {
    console.error('\n💥 Migration script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();
