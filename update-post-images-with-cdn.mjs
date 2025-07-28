#!/usr/bin/env node

/**
 * Update Post Collection Images with CDN URLs
 *
 * This script:
 * 1. Fetches first 5 post collection items from external database
 * 2. Finds all image URLs (including OpenGraph)
 * 3. Uses existing /api/upload-image endpoint to upload to CDN
 * 4. Updates URLs to cdn.communityjameel.org with structure: website/collection/post/[slug]/
 * 5. Updates the database with new URLs
 *
 * Usage: node update-post-images-with-cdn.mjs
 */

import fetch from 'node-fetch';
import FormData from 'form-data';

// Configuration
const CONFIG = {
  MNEMO_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app',
  UPLOAD_API_URL: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/upload-image',
  CDN_BASE_URL: 'https://cdn.communityjameel.io',
  LIMIT: 5, // Process first 5 items
  TIMEOUT: 30000 // 30 seconds timeout
};

// Utility function to sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch post collection items from external database
 */
async function fetchPostItems() {
  console.log('🔍 Fetching post collection items...');

  try {
    const response = await fetch(
      `${CONFIG.MNEMO_API_BASE}/api/collection-items?type=post`,
      {
        timeout: CONFIG.TIMEOUT
      }
    );

    if (!response.ok) {
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    const posts = data.collectionItems || [];

    console.log(`✅ Found ${posts.length} post items`);

    // Return only first 5 items
    return posts.slice(0, CONFIG.LIMIT);
  } catch (error) {
    console.error('❌ Failed to fetch post items:', error.message);
    throw error;
  }
}

/**
 * Extract all image URLs from a post item
 */
function extractImageUrls(post) {
  const images = [];
  const data = post.data || {};

  // Common image fields to check
  const imageFields = [
    'thumbnail',
    'mainImage',
    'heroImage',
    'featuredImage',
    'openGraphImage',
    'profileImage',
    'imageCarousel'
  ];

  imageFields.forEach((field) => {
    const fieldValue = data[field];

    if (fieldValue) {
      if (typeof fieldValue === 'string' && fieldValue.startsWith('http')) {
        // Direct URL string
        images.push({
          field,
          url: fieldValue,
          type: 'single'
        });
      } else if (fieldValue.url && fieldValue.url.startsWith('http')) {
        // Object with url property
        images.push({
          field,
          url: fieldValue.url,
          alt: fieldValue.alt || '',
          type: 'single'
        });
      } else if (Array.isArray(fieldValue)) {
        // Array of images (carousel)
        fieldValue.forEach((img, index) => {
          if (img && img.url && img.url.startsWith('http')) {
            images.push({
              field,
              url: img.url,
              alt: img.alt || '',
              type: 'array',
              index
            });
          }
        });
      }
    }
  });

  console.log(`   📸 Found ${images.length} images in post "${post.title}"`);
  return images;
}

/**
 * Upload image using existing upload-image endpoint
 */
async function uploadImageToCDN(imageUrl, post, imageInfo) {
  try {
    console.log(`   📥 Downloading: ${imageUrl}`);

    // Download the image
    const imageResponse = await fetch(imageUrl, { timeout: CONFIG.TIMEOUT });
    if (!imageResponse.ok) {
      throw new Error(`Failed to download: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.buffer();
    const originalFilename =
      imageUrl.split('/').pop().split('?')[0] || 'image.jpg';

    // Create filename based on field and index
    let filename;
    if (imageInfo.type === 'array') {
      filename = `${imageInfo.field}-${imageInfo.index}-${originalFilename}`;
    } else {
      filename = `${imageInfo.field}-${originalFilename}`;
    }

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', imageBuffer, originalFilename);
    formData.append('fileName', filename);
    formData.append('folder', `website/collection/post/${post.slug}`);
    formData.append('preserveFormat', 'true');

    console.log(`   📤 Uploading to CDN: ${filename}`);

    // Upload using existing endpoint
    const uploadResponse = await fetch(CONFIG.UPLOAD_API_URL, {
      method: 'POST',
      body: formData,
      timeout: CONFIG.TIMEOUT
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();

    if (!uploadResult.url) {
      throw new Error('Upload response missing URL');
    }

    console.log(`   ✅ Uploaded: ${uploadResult.url}`);

    return {
      originalUrl: imageUrl,
      newUrl: uploadResult.url,
      field: imageInfo.field,
      type: imageInfo.type,
      index: imageInfo.index,
      alt: imageInfo.alt,
      status: 'success'
    };
  } catch (error) {
    console.error(`   ❌ Failed to upload ${imageUrl}:`, error.message);
    return {
      originalUrl: imageUrl,
      newUrl: null,
      field: imageInfo.field,
      type: imageInfo.type,
      index: imageInfo.index,
      alt: imageInfo.alt,
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * Update post data with new CDN URLs
 */
function updatePostWithNewUrls(post, uploadResults) {
  const updatedData = { ...post.data };

  uploadResults.forEach((result) => {
    if (result.status === 'success') {
      const { field, type, index, newUrl, alt } = result;

      if (type === 'single') {
        // Single image field
        if (typeof updatedData[field] === 'string') {
          updatedData[field] = newUrl;
        } else if (
          updatedData[field] &&
          typeof updatedData[field] === 'object'
        ) {
          updatedData[field] = {
            url: newUrl,
            alt: alt || updatedData[field].alt || ''
          };
        }
      } else if (type === 'array') {
        // Array image field (carousel)
        if (!updatedData[field]) updatedData[field] = [];
        if (!updatedData[field][index]) updatedData[field][index] = {};

        updatedData[field][index] = {
          url: newUrl,
          alt: alt || updatedData[field][index].alt || ''
        };
      }
    }
  });

  return {
    ...post,
    data: updatedData
  };
}

/**
 * Update post in database with new URLs
 */
async function updatePostInDatabase(post) {
  try {
    console.log(`   💾 Updating post in database: ${post.id}`);

    const updatePayload = {
      type: post.type,
      status: post.status,
      slug: post.slug,
      title: post.title,
      data: post.data
    };

    const response = await fetch(
      `${CONFIG.MNEMO_API_BASE}/api/collection-items/${post.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload),
        timeout: CONFIG.TIMEOUT
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Database update failed: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log(`   ✅ Database updated successfully`);

    return { success: true, result };
  } catch (error) {
    console.error(`   ❌ Failed to update database:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Process a single post item
 */
async function processPost(post, index) {
  console.log(`\n📝 Processing post ${index + 1}/5: "${post.title}"`);
  console.log(`   ID: ${post.id}`);
  console.log(`   Slug: ${post.slug}`);

  // Extract image URLs
  const images = extractImageUrls(post);

  if (images.length === 0) {
    console.log(`   ⚠️  No images found in this post`);
    return {
      post: { id: post.id, title: post.title, slug: post.slug },
      images: [],
      uploadResults: [],
      databaseUpdate: { success: true, message: 'No images to process' },
      summary: {
        totalImages: 0,
        successfulUploads: 0,
        failedUploads: 0,
        updated: false
      }
    };
  }

  // Upload each image
  const uploadResults = [];
  for (const imageInfo of images) {
    const result = await uploadImageToCDN(imageInfo.url, post, imageInfo);
    uploadResults.push(result);

    // Add delay between uploads
    await sleep(1000);
  }

  const successfulUploads = uploadResults.filter(
    (r) => r.status === 'success'
  ).length;
  const failedUploads = uploadResults.filter(
    (r) => r.status === 'failed'
  ).length;

  console.log(
    `   📊 Upload summary: ${successfulUploads} successful, ${failedUploads} failed`
  );

  // Update post with new URLs if any uploads succeeded
  let databaseUpdate = { success: true, message: 'No updates needed' };
  let updated = false;

  if (successfulUploads > 0) {
    const updatedPost = updatePostWithNewUrls(post, uploadResults);
    databaseUpdate = await updatePostInDatabase(updatedPost);
    updated = databaseUpdate.success;
  }

  return {
    post: { id: post.id, title: post.title, slug: post.slug },
    images,
    uploadResults,
    databaseUpdate,
    summary: {
      totalImages: images.length,
      successfulUploads,
      failedUploads,
      updated
    }
  };
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Post Images CDN Migration');
  console.log('='.repeat(50));

  try {
    // Fetch post items
    const posts = await fetchPostItems();

    if (posts.length === 0) {
      console.log('⚠️  No post items found');
      return;
    }

    console.log(`\n📋 Processing ${posts.length} post items...\n`);

    // Process each post
    const results = [];
    for (let i = 0; i < posts.length; i++) {
      const result = await processPost(posts[i], i);
      results.push(result);

      // Add delay between posts
      if (i < posts.length - 1) {
        await sleep(2000);
      }
    }

    // Generate summary report
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));

    const totalPosts = results.length;
    const totalImages = results.reduce(
      (sum, r) => sum + r.summary.totalImages,
      0
    );
    const totalSuccessfulUploads = results.reduce(
      (sum, r) => sum + r.summary.successfulUploads,
      0
    );
    const totalFailedUploads = results.reduce(
      (sum, r) => sum + r.summary.failedUploads,
      0
    );
    const postsUpdated = results.filter((r) => r.summary.updated).length;

    console.log(`📝 Posts processed: ${totalPosts}`);
    console.log(`📸 Total images found: ${totalImages}`);
    console.log(`✅ Successful uploads: ${totalSuccessfulUploads}`);
    console.log(`❌ Failed uploads: ${totalFailedUploads}`);
    console.log(`💾 Posts updated in database: ${postsUpdated}`);
    console.log(
      `🎯 Success rate: ${totalImages > 0 ? Math.round((totalSuccessfulUploads / totalImages) * 100) : 0}%`
    );

    // Individual post details
    console.log('\n📋 INDIVIDUAL POST RESULTS:');
    results.forEach((result, index) => {
      const { post, summary } = result;
      console.log(`\n${index + 1}. "${post.title}" (${post.slug})`);
      console.log(
        `   📸 Images: ${summary.totalImages} total, ${summary.successfulUploads} uploaded, ${summary.failedUploads} failed`
      );
      console.log(
        `   💾 Database: ${summary.updated ? '✅ Updated' : '❌ Not updated'}`
      );
    });

    // Failed uploads details
    const allFailedUploads = results.flatMap((r) =>
      r.uploadResults.filter((u) => u.status === 'failed')
    );
    if (allFailedUploads.length > 0) {
      console.log('\n❌ FAILED UPLOADS:');
      allFailedUploads.forEach((failed, index) => {
        console.log(`${index + 1}. ${failed.field}: ${failed.originalUrl}`);
        console.log(`   Error: ${failed.error}`);
      });
    }

    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
