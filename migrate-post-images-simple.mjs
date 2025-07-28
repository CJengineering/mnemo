#!/usr/bin/env node

/**
 * Post Images CDN Migration Script (using upload-image endpoint)
 *
 * This script fetches post collection items from the external Mnemo database,
 * downloads images (including OpenGraph), uploads them via your upload-image API,
 * and updates the URLs to point to cdn.communityjameel.org
 *
 * Usage: node migrate-post-images-simple.mjs [--limit=5] [--dry-run]
 */

import https from 'https';
import http from 'http';
import path from 'path';
import FormData from 'form-data';

// Configuration
const CONFIG = {
  // External API endpoints
  MNEMO_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app',
  UPLOAD_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app',

  // CDN configuration
  CDN_BASE_URL: 'https://cdn.communityjameel.org',

  // Processing limits
  LIMIT: 5, // Process first 5 posts only
  CONCURRENCY_LIMIT: 2, // Process 2 posts at a time
  TIMEOUT: 30000 // 30 seconds timeout
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : CONFIG.LIMIT;

console.log('🚀 Post Images CDN Migration Script (Simple)');
console.log('=============================================');
console.log(`📊 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
console.log(`📝 Limit: ${limit ? `${limit} posts` : 'All posts'}`);
console.log(`🌐 CDN Base: ${CONFIG.CDN_BASE_URL}`);
console.log(`📡 API Base: ${CONFIG.MNEMO_API_BASE}`);
console.log('');

// Utility functions
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Download image from URL
async function downloadImage(imageUrl, timeout = CONFIG.TIMEOUT) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https:') ? https : http;

    const request = protocol.get(imageUrl, (response) => {
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        // Handle redirects
        return downloadImage(response.headers.location, timeout)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        reject(
          new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`)
        );
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });

    request.setTimeout(timeout, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });

    request.on('error', reject);
  });
}

// Extract filename from URL
function getFileNameFromUrl(url) {
  try {
    const urlPath = new URL(url).pathname;
    const fileName = path.basename(urlPath);
    return fileName || 'image.jpg';
  } catch {
    return 'image.jpg';
  }
}

// Upload image via your upload-image API
async function uploadImageViaAPI(imageBuffer, fileName, folderPath) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', imageBuffer, fileName);
    form.append('fileName', fileName);
    form.append('folder', folderPath);
    form.append('preserveFormat', 'true'); // Keep original format

    const url = `${CONFIG.UPLOAD_API_BASE}/api/upload-image`;

    form.submit(url, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            throw new Error(`Upload API returned ${res.statusCode}: ${data}`);
          }
          const result = JSON.parse(data);
          resolve(result.url);
        } catch (error) {
          reject(error);
        }
      });
      res.on('error', reject);
    });
  });
}

// Process a single image
async function processImage(imageUrl, imageType, postSlug, index = null) {
  if (!imageUrl || imageUrl === '' || imageUrl === 'N/A') {
    return {
      type: imageType,
      index,
      status: 'skipped',
      reason: 'No valid URL',
      originalUrl: imageUrl,
      newUrl: null
    };
  }

  const originalFilename = getFileNameFromUrl(imageUrl);
  const fileName =
    index !== null
      ? `${imageType}-${index}${path.extname(originalFilename)}`
      : `${imageType}${path.extname(originalFilename)}`;

  const folderPath = `website/collection/post/${postSlug}`;

  if (isDryRun) {
    return {
      type: imageType,
      index,
      status: 'dry-run',
      reason: 'Dry run mode',
      originalUrl: imageUrl,
      newUrl: `${CONFIG.CDN_BASE_URL}/${folderPath}/${fileName}`
    };
  }

  try {
    console.log(
      `      📥 Downloading ${imageType}${index !== null ? `[${index}]` : ''}: ${imageUrl}`
    );
    const imageBuffer = await downloadImage(imageUrl);

    console.log(`      📤 Uploading via API: ${fileName}`);
    const newUrl = await uploadImageViaAPI(imageBuffer, fileName, folderPath);

    console.log(`      ✅ Success: ${newUrl}`);

    return {
      type: imageType,
      index,
      status: 'success',
      originalUrl: imageUrl,
      newUrl,
      fileSize: imageBuffer.length
    };
  } catch (error) {
    console.error(
      `      ❌ Failed ${imageType}${index !== null ? `[${index}]` : ''}: ${error.message}`
    );
    return {
      type: imageType,
      index,
      status: 'failed',
      reason: error.message,
      originalUrl: imageUrl,
      newUrl: null
    };
  }
}

// Update post with new image URLs
async function updatePostInDatabase(postId, updatedData) {
  const url = `${CONFIG.MNEMO_API_BASE}/api/collection-items/${postId}`;

  const payload = JSON.stringify({
    type: updatedData.type,
    status: updatedData.status,
    slug: updatedData.slug,
    title: updatedData.title,
    data: updatedData.data
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const result = JSON.parse(responseData);
              resolve(result);
            } catch (parseError) {
              resolve({ success: true, message: 'Updated successfully' });
            }
          } else {
            reject(
              new Error(
                `HTTP ${res.statusCode}: ${responseData.substring(0, 500)}...`
              )
            );
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Process a single post
async function processPost(post) {
  const postName = post.title || post.data?.title || 'Untitled Post';
  const postSlug = post.slug || generateSlug(postName);

  console.log(`\n📝 Processing post: "${postName}" (${post.id})`);
  console.log(`   📎 Slug: ${postSlug}`);

  const imageResults = [];
  const fieldData = post.data || {};

  // Find and process all image fields
  const imageFields = [
    { key: 'thumbnail', type: 'thumbnail' },
    { key: 'mainImage', type: 'mainImage' },
    { key: 'heroImage', type: 'heroImage' },
    { key: 'openGraphImage', type: 'openGraphImage' },
    { key: 'featuredImage', type: 'featuredImage' }
  ];

  // Process individual image fields
  for (const field of imageFields) {
    const imageData = fieldData[field.key];
    let imageUrl = null;

    if (typeof imageData === 'string') {
      imageUrl = imageData;
    } else if (imageData && typeof imageData === 'object') {
      imageUrl = imageData.url || imageData.src;
    }

    if (imageUrl && imageUrl !== '' && imageUrl !== 'N/A') {
      console.log(`   📸 Processing ${field.type}: ${imageUrl}`);
      const result = await processImage(imageUrl, field.type, postSlug);
      imageResults.push(result);
      await sleep(500); // Rate limiting
    } else {
      console.log(`   ⚠️  No ${field.type} URL found`);
    }
  }

  // Process image carousel/gallery arrays
  const arrayImageFields = ['imageCarousel', 'imageGallery', 'images'];

  for (const arrayField of arrayImageFields) {
    const imageArray = fieldData[arrayField];
    if (imageArray && Array.isArray(imageArray)) {
      console.log(
        `   📸 Processing ${arrayField} (${imageArray.length} images)...`
      );

      for (let i = 0; i < imageArray.length; i++) {
        const imageItem = imageArray[i];
        let imageUrl = null;

        if (typeof imageItem === 'string') {
          imageUrl = imageItem;
        } else if (imageItem && typeof imageItem === 'object') {
          imageUrl = imageItem.url || imageItem.src;
        }

        if (imageUrl && imageUrl !== '' && imageUrl !== 'N/A') {
          console.log(`   📸 Processing ${arrayField} image ${i}: ${imageUrl}`);
          const result = await processImage(imageUrl, arrayField, postSlug, i);
          imageResults.push(result);
          await sleep(500); // Rate limiting
        } else {
          console.log(`   ⚠️  Skipping ${arrayField} image ${i}: no valid URL`);
        }
      }
    }
  }

  console.log(`   📊 Total images found: ${imageResults.length}`);

  // Update post with new URLs
  let updateResult = null;
  if (!isDryRun && imageResults.some((r) => r.status === 'success')) {
    try {
      console.log(`   💾 Updating post in database...`);

      // Create updated data object with new image URLs
      const updatedData = { ...post };
      const updatedFieldData = { ...fieldData };

      // Update individual image fields
      imageResults.forEach((result) => {
        if (result.status === 'success') {
          if (result.type === 'thumbnail') {
            updatedFieldData.thumbnail = {
              url: result.newUrl,
              alt: fieldData.thumbnail?.alt || ''
            };
          } else if (result.type === 'mainImage') {
            updatedFieldData.mainImage = {
              url: result.newUrl,
              alt: fieldData.mainImage?.alt || ''
            };
          } else if (result.type === 'heroImage') {
            updatedFieldData.heroImage = {
              url: result.newUrl,
              alt: fieldData.heroImage?.alt || ''
            };
          } else if (result.type === 'openGraphImage') {
            updatedFieldData.openGraphImage = {
              url: result.newUrl,
              alt: fieldData.openGraphImage?.alt || ''
            };
          } else if (result.type === 'featuredImage') {
            updatedFieldData.featuredImage = {
              url: result.newUrl,
              alt: fieldData.featuredImage?.alt || ''
            };
          } else if (result.type === 'imageCarousel' && result.index !== null) {
            if (!updatedFieldData.imageCarousel)
              updatedFieldData.imageCarousel = [];
            updatedFieldData.imageCarousel[result.index] = {
              url: result.newUrl,
              alt: fieldData.imageCarousel?.[result.index]?.alt || ''
            };
          } else if (result.type === 'imageGallery' && result.index !== null) {
            if (!updatedFieldData.imageGallery)
              updatedFieldData.imageGallery = [];
            updatedFieldData.imageGallery[result.index] = {
              url: result.newUrl,
              alt: fieldData.imageGallery?.[result.index]?.alt || ''
            };
          }
        }
      });

      updatedData.data = updatedFieldData;
      updateResult = await updatePostInDatabase(post.id, updatedData);
      console.log(`   ✅ Post updated in database`);
    } catch (error) {
      console.error(
        `   ❌ Failed to update post in database: ${error.message}`
      );
      updateResult = { success: false, error: error.message };
    }
  } else if (isDryRun) {
    console.log(
      `   🏃 Dry run: Would update post with ${imageResults.filter((r) => r.status === 'dry-run').length} new URLs`
    );
  }

  return {
    post: {
      id: post.id,
      title: postName,
      slug: postSlug
    },
    images: imageResults,
    update: updateResult,
    summary: {
      totalImages: imageResults.length,
      successfulImages: imageResults.filter((r) => r.status === 'success')
        .length,
      dryRunImages: imageResults.filter((r) => r.status === 'dry-run').length,
      failedImages: imageResults.filter((r) => r.status === 'failed').length,
      skippedImages: imageResults.filter((r) => r.status === 'skipped').length,
      postUpdated: updateResult?.success !== false
    }
  };
}

// Fetch posts from external API
async function fetchPostsFromAPI() {
  console.log('📡 Fetching posts from external Mnemo API...');

  const url = `${CONFIG.MNEMO_API_BASE}/api/collection-items?type=post`;

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              throw new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
            }
            const result = JSON.parse(data);
            resolve(result.collectionItems || []);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

// Main execution
async function main() {
  try {
    // Fetch posts from external API
    const posts = await fetchPostsFromAPI();
    console.log(`✅ Fetched ${posts.length} posts from external API`);

    if (posts.length === 0) {
      console.log('⚠️  No posts found. Exiting.');
      return;
    }

    // Apply limit if specified
    const postsToProcess = limit ? posts.slice(0, limit) : posts;
    console.log(`📋 Processing ${postsToProcess.length} posts...`);

    // Process posts with concurrency control
    const results = [];
    for (let i = 0; i < postsToProcess.length; i += CONFIG.CONCURRENCY_LIMIT) {
      const batch = postsToProcess.slice(i, i + CONFIG.CONCURRENCY_LIMIT);
      const batchPromises = batch.map((post) => processPost(post));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches
      if (i + CONFIG.CONCURRENCY_LIMIT < postsToProcess.length) {
        await sleep(2000);
      }
    }

    // Generate summary report
    console.log('\n📊 Migration Summary');
    console.log('===================');

    const totalPosts = results.length;
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
    const dryRunImages = results.reduce(
      (sum, r) => sum + r.summary.dryRunImages,
      0
    );
    const updatedPosts = results.filter((r) => r.summary.postUpdated).length;

    console.log(`📝 Posts processed: ${totalPosts}`);
    console.log(`📸 Total images found: ${totalImages}`);
    console.log(`✅ Successful migrations: ${successfulImages}`);
    console.log(`❌ Failed migrations: ${failedImages}`);
    console.log(`⚠️  Skipped images: ${skippedImages}`);
    if (isDryRun) {
      console.log(`🏃 Dry run images: ${dryRunImages}`);
    }
    console.log(`💾 Posts updated: ${updatedPosts}`);

    // Save detailed report
    const reportData = {
      summary: {
        totalPosts,
        totalImages,
        successfulImages,
        failedImages,
        skippedImages,
        dryRunImages,
        updatedPosts,
        mode: isDryRun ? 'dry-run' : 'live',
        timestamp: new Date().toISOString()
      },
      results
    };

    const reportFileName = `post-images-simple-migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    await import('fs/promises').then((fs) =>
      fs.writeFile(reportFileName, JSON.stringify(reportData, null, 2))
    );
    console.log(`\n📄 Detailed report saved: ${reportFileName}`);

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
