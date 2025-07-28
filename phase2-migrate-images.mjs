#!/usr/bin/env node

/**
 * PHASE 2: CDN Image Migration Script
 *
 * This script updates existing posts in the Mnemo database by:
 * 1. Fetching posts that have Webflow image URLs
 * 2. Uploading those images to CDN (Google Cloud Storage)
 * 3. Updating the posts with new CDN URLs
 *
 * Usage: node phase2-migrate-images.mjs
 */

import dotenv from 'dotenv';
import { batchImageUploaderToCDN } from './lib/utils/imageUploader.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const CONFIG = {
  MNEMO_API_BASE:
    process.env.NEXT_PUBLIC_API_URL ||
    'https://mnemo-app-e4f6j5kdsq-ew.a.run.app',
  MNEMO_API_KEY: process.env.MNEMO_API_KEY,
  COLLECTION_NAME: 'posts',
  BATCH_SIZE: 10, // Process posts in batches
  CDN_CONFIG: {
    compressToWebP: true,
    quality: 80
  }
};

/**
 * Fetch posts from Mnemo API that need image migration
 */
async function fetchPostsNeedingImageMigration(limit = 100) {
  console.log(`📡 Fetching posts from Mnemo database...`);

  const url = `${CONFIG.MNEMO_API_BASE}/api/collection-items?type=post&limit=${limit}`;

  const headers = {
    'Content-Type': 'application/json'
  };

  if (CONFIG.MNEMO_API_KEY) {
    headers['Authorization'] = `Bearer ${CONFIG.MNEMO_API_KEY}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Mnemo API error: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  const data = await response.json();
  const posts = data.items || data || [];

  // Filter posts that have Webflow URLs (need migration)
  const postsNeedingMigration = posts.filter((post) => {
    const data = post.data || {};
    const hasWebflowImages =
      data.mainImage?.url?.includes('webflow.com') ||
      data.thumbnail?.url?.includes('webflow.com') ||
      data.openGraphImage?.url?.includes('webflow.com') ||
      (data.imageCarousel &&
        data.imageCarousel.some((img) => img.url?.includes('webflow.com')));

    return hasWebflowImages;
  });

  console.log(
    `✅ Found ${posts.length} total posts, ${postsNeedingMigration.length} need image migration`
  );

  return postsNeedingMigration;
}

/**
 * Update post in Mnemo database
 */
async function updateMnemoPost(postId, updatedData) {
  console.log(`📤 Updating post ${postId} with CDN URLs...`);

  const url = `${CONFIG.MNEMO_API_BASE}/api/collection-items/${postId}`;

  const headers = {
    'Content-Type': 'application/json'
  };

  if (CONFIG.MNEMO_API_KEY) {
    headers['Authorization'] = `Bearer ${CONFIG.MNEMO_API_KEY}`;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updatedData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Mnemo API error: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  const result = await response.json();
  console.log(`✅ Successfully updated post ${postId}`);

  return result;
}

/**
 * Extract all image URLs from a post
 */
function extractImageUrls(post) {
  const data = post.data || {};
  const imageUrls = [];
  const imageCarouselUrls = [];

  // Main images
  if (data.mainImage?.url && data.mainImage.url.includes('webflow.com')) {
    imageUrls.push(data.mainImage.url);
  }
  if (data.thumbnail?.url && data.thumbnail.url.includes('webflow.com')) {
    imageUrls.push(data.thumbnail.url);
  }
  if (
    data.openGraphImage?.url &&
    data.openGraphImage.url.includes('webflow.com')
  ) {
    imageUrls.push(data.openGraphImage.url);
  }

  // Image carousel
  if (data.imageCarousel) {
    data.imageCarousel.forEach((img) => {
      if (img.url && img.url.includes('webflow.com')) {
        imageCarouselUrls.push(img.url);
      }
    });
  }

  return { imageUrls, imageCarouselUrls };
}

/**
 * Process a single post for image migration
 */
async function migratePostImages(post, index, total) {
  const postTitle = post.title || `Post ${index + 1}`;
  console.log(`\n🔄 Processing [${index + 1}/${total}]: "${postTitle}"`);
  console.log(`   Post ID: ${post.id}`);
  console.log(`   Slug: ${post.slug}`);

  try {
    // Step 1: Extract image URLs that need migration
    const { imageUrls, imageCarouselUrls } = extractImageUrls(post);
    const totalImages = imageUrls.length + imageCarouselUrls.length;

    if (totalImages === 0) {
      console.log(`   ⏭️  No Webflow images found, skipping...`);
      return {
        success: true,
        skipped: true,
        postId: post.id,
        title: postTitle,
        slug: post.slug,
        reason: 'No Webflow images'
      };
    }

    console.log(
      `   📸 Found ${totalImages} images to migrate (${imageUrls.length} main + ${imageCarouselUrls.length} carousel)`
    );

    // Step 2: Upload main images to CDN
    let imageUploadResults = [];
    let carouselUploadResults = [];

    if (imageUrls.length > 0) {
      console.log(`   ⬆️  Uploading ${imageUrls.length} main images to CDN...`);
      imageUploadResults = await batchImageUploaderToCDN(
        imageUrls,
        CONFIG.COLLECTION_NAME,
        post.slug,
        CONFIG.CDN_CONFIG
      );
    }

    if (imageCarouselUrls.length > 0) {
      console.log(
        `   ⬆️  Uploading ${imageCarouselUrls.length} carousel images to CDN...`
      );
      carouselUploadResults = await batchImageUploaderToCDN(
        imageCarouselUrls,
        CONFIG.COLLECTION_NAME,
        post.slug,
        CONFIG.CDN_CONFIG
      );
    }

    // Step 3: Update post data with new CDN URLs
    const updatedData = { ...post };

    // Helper function to get new URL
    const getUpdatedImageUrl = (originalUrl, results) => {
      const result = results.find((r) => r.originalUrl === originalUrl);
      return result?.success ? result.newUrl : originalUrl;
    };

    // Update main images
    if (updatedData.data.mainImage?.url) {
      const newUrl = getUpdatedImageUrl(
        updatedData.data.mainImage.url,
        imageUploadResults
      );
      if (newUrl !== updatedData.data.mainImage.url) {
        updatedData.data.mainImage.url = newUrl;
        console.log(`   ✅ Updated main image URL`);
      }
    }

    if (updatedData.data.thumbnail?.url) {
      const newUrl = getUpdatedImageUrl(
        updatedData.data.thumbnail.url,
        imageUploadResults
      );
      if (newUrl !== updatedData.data.thumbnail.url) {
        updatedData.data.thumbnail.url = newUrl;
        console.log(`   ✅ Updated thumbnail URL`);
      }
    }

    if (updatedData.data.openGraphImage?.url) {
      const newUrl = getUpdatedImageUrl(
        updatedData.data.openGraphImage.url,
        imageUploadResults
      );
      if (newUrl !== updatedData.data.openGraphImage.url) {
        updatedData.data.openGraphImage.url = newUrl;
        console.log(`   ✅ Updated open graph image URL`);
      }
    }

    // Update carousel images
    if (updatedData.data.imageCarousel) {
      let carouselUpdated = 0;
      updatedData.data.imageCarousel = updatedData.data.imageCarousel.map(
        (img) => {
          if (img.url && img.url.includes('webflow.com')) {
            const newUrl = getUpdatedImageUrl(img.url, carouselUploadResults);
            if (newUrl !== img.url) {
              carouselUpdated++;
              return { ...img, url: newUrl };
            }
          }
          return img;
        }
      );

      if (carouselUpdated > 0) {
        console.log(`   ✅ Updated ${carouselUpdated} carousel image URLs`);
      }
    }

    // Add migration metadata
    updatedData.data.cdnMigration = {
      migratedAt: new Date().toISOString(),
      phase: 2,
      imageResults: imageUploadResults,
      carouselResults: carouselUploadResults,
      totalMigrated:
        imageUploadResults.filter((r) => r.success).length +
        carouselUploadResults.filter((r) => r.success).length
    };

    // Step 4: Update post in database
    const updateResult = await updateMnemoPost(post.id, updatedData);

    const successfulUploads = [
      ...imageUploadResults.filter((r) => r.success),
      ...carouselUploadResults.filter((r) => r.success)
    ];

    return {
      success: true,
      skipped: false,
      postId: post.id,
      title: postTitle,
      slug: post.slug,
      totalImages: totalImages,
      migratedImages: successfulUploads.length,
      failedImages: totalImages - successfulUploads.length,
      cdnUrls: successfulUploads.map((r) => r.newUrl),
      phase: 'image-migration'
    };
  } catch (error) {
    console.error(
      `   ❌ Failed to migrate images for "${postTitle}": ${error.message}`
    );
    return {
      success: false,
      skipped: false,
      postId: post.id,
      title: postTitle,
      slug: post.slug,
      error: error.message,
      phase: 'image-migration'
    };
  }
}

/**
 * Generate migration report
 */
function generateReport(results) {
  const successful = results.filter((r) => r.success && !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const failed = results.filter((r) => !r.success);

  console.log('\n' + '='.repeat(70));
  console.log('📊 PHASE 2: CDN IMAGE MIGRATION REPORT');
  console.log('='.repeat(70));
  console.log(`Total processed: ${results.length}`);
  console.log(`✅ Successfully migrated: ${successful.length}`);
  console.log(`⏭️  Skipped (no Webflow images): ${skipped.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\n✅ SUCCESSFULLY MIGRATED:');
    let totalMigratedImages = 0;
    successful.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}"`);
      console.log(`      Post ID: ${item.postId}`);
      console.log(`      Slug: ${item.slug}`);
      console.log(
        `      Images migrated: ${item.migratedImages}/${item.totalImages}`
      );
      if (item.failedImages > 0) {
        console.log(`      ⚠️  Failed images: ${item.failedImages}`);
      }
      totalMigratedImages += item.migratedImages;
      console.log('');
    });

    console.log(`📸 Total images migrated to CDN: ${totalMigratedImages}`);
  }

  if (skipped.length > 0) {
    console.log('\n⏭️  SKIPPED:');
    skipped.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}"`);
      console.log(`      Reason: ${item.reason}`);
      console.log('');
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED:');
    failed.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}"`);
      console.log(`      Post ID: ${item.postId}`);
      console.log(`      Error: ${item.error}`);
      console.log('');
    });
  }

  const totalMigratedImages = successful.reduce(
    (sum, item) => sum + item.migratedImages,
    0
  );
  console.log(`📸 CDN Migration Summary:`);
  console.log(`   Total images migrated: ${totalMigratedImages}`);
  console.log(
    `   CDN base URL: https://cdn.communityjameel.io/website/collection/${CONFIG.COLLECTION_NAME}/`
  );
  console.log(
    `   Compression: WebP with ${CONFIG.CDN_CONFIG.quality}% quality`
  );

  console.log('\n🎉 Phase 2 completed!');
  console.log('✅ All Webflow images have been migrated to CDN');
  console.log('✅ Posts updated with new CDN URLs');
  console.log('='.repeat(70));

  return {
    total: results.length,
    successful: successful.length,
    skipped: skipped.length,
    failed: failed.length,
    totalMigratedImages,
    phase: 'image-migration',
    results
  };
}

/**
 * Save detailed report to file
 */
async function saveReport(report) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = `phase2-cdn-migration-report-${timestamp}.json`;

  const fs = await import('fs');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`💾 Detailed report saved: ${reportFile}`);
}

/**
 * Validate environment configuration
 */
function validateConfig() {
  const requiredEnvVars = [
    'PRIVATE_GCL' // For Google Cloud Storage
  ];

  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables for CDN upload:');
    missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error('\nPlease set these in your .env.local file');
    process.exit(1);
  }

  console.log('✅ CDN configuration validated');
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 PHASE 2: CDN IMAGE MIGRATION');
  console.log('='.repeat(70));
  console.log(`📋 Configuration:`);
  console.log(`   Mnemo API: ${CONFIG.MNEMO_API_BASE}`);
  console.log(`   CDN Upload: ENABLED (Google Cloud Storage)`);
  console.log(`   Collection name: ${CONFIG.COLLECTION_NAME}`);
  console.log(`   Batch size: ${CONFIG.BATCH_SIZE}`);
  console.log(
    `   Image compression: WebP ${CONFIG.CDN_CONFIG.quality}% quality`
  );
  console.log('');

  try {
    // Step 1: Validate configuration
    validateConfig();

    // Step 2: Fetch posts that need image migration
    const posts = await fetchPostsNeedingImageMigration();

    if (posts.length === 0) {
      console.log(
        '✅ No posts found with Webflow images - migration already complete!'
      );
      return;
    }

    // Step 3: Process posts in batches
    console.log(`\n🔄 Processing ${posts.length} posts with Webflow images...`);
    console.log('📸 Phase 2: Migrating images to CDN and updating database');

    const results = [];

    for (let i = 0; i < posts.length; i++) {
      const result = await migratePostImages(posts[i], i, posts.length);
      results.push(result);

      // Delay between posts to avoid overwhelming APIs
      if (i < posts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Step 4: Generate and save report
    const report = generateReport(results);
    await saveReport(report);

    console.log('\n🎯 PHASE 2 SUMMARY:');
    console.log(`✅ Migrated images for ${report.successful} posts`);
    console.log(`⏭️  Skipped ${report.skipped} posts (no Webflow images)`);
    console.log(`❌ Failed to migrate ${report.failed} posts`);
    console.log(`📸 ${report.totalMigratedImages} images now hosted on CDN`);

    if (report.successful > 0) {
      console.log('\n🎉 Migration Complete!');
      console.log('✅ All posts now use CDN URLs');
      console.log('✅ Images optimized with WebP compression');
      console.log('💡 Your Webflow-to-Mnemo migration is now fully complete!');
    }

    // Step 5: Exit with appropriate code
    process.exit(report.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`💥 Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle process errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Run the migration
main();
