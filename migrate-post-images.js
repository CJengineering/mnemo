#!/usr/bin/env node

/**
 * Post Images Migration Script
 *
 * This script downloads post images and uploads them to Google Cloud Storage
 * It also updates the Mnemo database with the new image URLs
 * Usage: node migrate-post-images.js
 *
 * This script will:
 * 1. Fetch posts from Mnemo API
 * 2. Find posts with external image URLs
 * 3. Download images and upload to GCS with structure: website/collection/post/[slug]/
 * 4. Update Mnemo database via API
 */

const { Storage } = require('@google-cloud/storage');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONFIG = {
  GOOGLE_CLOUD_PROJECT_ID: 'cj-tech-381914',
  BUCKET_NAME: 'mnemo',
  CDN_BASE_URL: 'https://cdn.communityjameel.io',
  CONCURRENCY_LIMIT: 3, // Process 3 posts at a time
  TIMEOUT: 45000, // 45 seconds timeout for downloads
  MNEMO_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api'
  // No limit - process ALL posts
};

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: CONFIG.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: 'todo-test@cj-tech-381914.iam.gserviceaccount.com',
    private_key: `-----BEGIN PRIVATE KEY-----\n${process.env.PRIVATE_GCL}=\n-----END PRIVATE KEY-----\n`
  }
});

const bucket = storage.bucket(CONFIG.BUCKET_NAME);

// Utility functions
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOriginalFilename(imageUrl) {
  try {
    const pathname = new URL(imageUrl).pathname;
    const filename = path.basename(pathname);
    return filename && filename.includes('.') ? filename : null;
  } catch {
    return null;
  }
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return contentTypes[ext] || 'image/jpeg';
}

async function downloadImage(imageUrl, timeout = CONFIG.TIMEOUT) {
  const parsedUrl = new URL(imageUrl);
  const requester = parsedUrl.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = requester.get(imageUrl, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        if (response.headers.location) {
          console.log(
            `    🔄 Following redirect to: ${response.headers.location}`
          );
          downloadImage(response.headers.location, timeout)
            .then(resolve)
            .catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
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

async function uploadToGCS(buffer, fileName, gcsPath) {
  try {
    const file = bucket.file(gcsPath);

    await file.save(buffer, {
      metadata: {
        contentType: getContentType(fileName),
        cacheControl: 'public, max-age=31536000' // 1 year cache
      }
    });

    return `${CONFIG.CDN_BASE_URL}/${gcsPath}`;
  } catch (error) {
    throw new Error(`GCS upload failed: ${error.message}`);
  }
}

async function updateMnemoPost(postId, updatedData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(updatedData);
    const options = {
      hostname: 'mnemo-app-e4f6j5kdsq-ew.a.run.app',
      port: 443,
      path: `/api/collection-items/${postId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });

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
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function processPost(mnemoPost, index, total) {
  const postTitle = mnemoPost.title || mnemoPost.data?.title || 'Unknown Post';
  const postSlug = mnemoPost.slug || mnemoPost.data?.slug || 'unknown';

  console.log(`\n📝 [${index + 1}/${total}] Processing: ${postTitle}`);
  console.log(`   Slug: ${postSlug}`);

  // Check if post has any image fields
  const data = mnemoPost.data || {};
  const imageFields = {};

  // Helper function to get string URL
  const getStringUrl = (field) => {
    if (typeof field === 'string') return field;
    if (field?.url && typeof field.url === 'string') return field.url;
    return null;
  };

  // Extract URLs safely
  const thumbnailUrl = getStringUrl(data.thumbnail);
  const mainImageUrl = getStringUrl(data.mainImage);
  const openGraphImageUrl = getStringUrl(data.openGraphImage);

  if (thumbnailUrl) imageFields.thumbnail = thumbnailUrl;
  if (mainImageUrl) imageFields.mainImage = mainImageUrl;
  if (openGraphImageUrl) imageFields.openGraphImage = openGraphImageUrl;

  // Also check for imageCarousel
  if (data.imageCarousel && Array.isArray(data.imageCarousel)) {
    data.imageCarousel.forEach((img, i) => {
      const carouselUrl = getStringUrl(img);
      if (carouselUrl) {
        imageFields[`carousel_${i}`] = carouselUrl;
      }
    });
  }

  // Filter out images that are already on our CDN
  const availableImages = Object.entries(imageFields).filter(([key, url]) => {
    if (!url || typeof url !== 'string' || !url.trim() || url === 'N/A') {
      return false;
    }
    // Skip if already on our CDN
    if (url.startsWith('https://cdn.communityjameel.io')) {
      console.log(`    ✅ ${key} already on CDN: ${url}`);
      return false;
    }
    return true;
  });

  if (availableImages.length === 0) {
    // Check if we had images but they were all already on CDN
    const totalImageFields = Object.keys(imageFields).length;
    if (totalImageFields > 0) {
      console.log(`  ✅ All ${totalImageFields} images already on CDN`);
      return {
        ...mnemoPost,
        migration: {
          status: 'skipped',
          reason: 'All images already on CDN',
          originalUrls: null,
          newUrls: null
        }
      };
    } else {
      console.log(`  ⚠️  No images found in post`);
      return {
        ...mnemoPost,
        migration: {
          status: 'skipped',
          reason: 'No images in post',
          originalUrls: null,
          newUrls: null
        }
      };
    }
  }

  const totalImageFields = Object.keys(imageFields).length;
  const alreadyOnCDN = totalImageFields - availableImages.length;

  console.log(
    `  📸 Found ${totalImageFields} total images: ${availableImages.length} to migrate, ${alreadyOnCDN} already on CDN`
  );

  const migratedImages = {};
  const originalUrls = {};
  const newUrls = {};

  try {
    // Process each available image
    for (const [fieldName, imageUrl] of availableImages) {
      console.log(`    📥 Processing ${fieldName}: ${imageUrl}`);

      const originalFilename = getOriginalFilename(imageUrl);
      if (!originalFilename) {
        console.log(`    ❌ Could not extract filename from ${fieldName} URL`);
        continue;
      }

      const gcsPath = `website/collection/post/${postSlug}/${fieldName}_${originalFilename}`;

      try {
        console.log(`    📥 Downloading ${fieldName}...`);
        const imageBuffer = await downloadImage(imageUrl);
        console.log(`    📤 Uploading ${fieldName} to: ${gcsPath}`);
        const newUrl = await uploadToGCS(
          imageBuffer,
          originalFilename,
          gcsPath
        );
        console.log(`    ✅ ${fieldName} uploaded: ${newUrl}`);

        // Store the migrated image info
        if (fieldName.startsWith('carousel_')) {
          const carouselIndex = parseInt(fieldName.split('_')[1]);
          if (!migratedImages.imageCarousel) {
            migratedImages.imageCarousel = [];
          }
          migratedImages.imageCarousel[carouselIndex] = {
            url: newUrl,
            alt:
              data.imageCarousel[carouselIndex]?.alt ||
              `${postTitle} - Image ${carouselIndex + 1}`
          };
        } else {
          migratedImages[fieldName] = {
            url: newUrl,
            alt: `${postTitle} - ${fieldName}`
          };
        }

        originalUrls[fieldName] = imageUrl;
        newUrls[fieldName] = newUrl;

        // Brief pause between image downloads
        await sleep(500);
      } catch (imageError) {
        console.error(
          `    ❌ Failed to process ${fieldName}: ${imageError.message}`
        );
      }
    }

    if (
      Object.keys(migratedImages).length === 0 &&
      !migratedImages.imageCarousel
    ) {
      throw new Error('No images were successfully migrated');
    }

    // Update the post data structure
    const updatedData = {
      ...mnemoPost.data,
      ...migratedImages
    };

    // Update post in Mnemo database
    console.log(`  💾 Updating post in database...`);
    const updatePayload = {
      type: mnemoPost.type,
      status: mnemoPost.status,
      slug: mnemoPost.slug,
      title: mnemoPost.title,
      data: updatedData
    };

    const updateResult = await updateMnemoPost(mnemoPost.id, updatePayload);
    console.log(`  ✅ Database updated successfully`);

    return {
      ...mnemoPost,
      data: updatedData,
      migration: {
        status: 'success',
        imagesProcessed: Object.keys(originalUrls).length,
        originalUrls,
        newUrls,
        updateResult
      }
    };
  } catch (error) {
    console.error(`  ❌ Failed for ${postTitle}: ${error.message}`);
    return {
      ...mnemoPost,
      migration: {
        status: 'failed',
        reason: error.message,
        originalUrls,
        newUrls
      }
    };
  }
}

async function processInBatches(items, batchSize, processor, ...args) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(
      `\n🚀 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`
    );

    const batchPromises = batch.map((item, batchIndex) =>
      processor(item, ...args, i + batchIndex, items.length)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Brief pause between batches
    if (i + batchSize < items.length) {
      await sleep(2000);
    }
  }

  return results;
}

function generateMigrationReport(results) {
  const successful = results.filter((r) => r.migration?.status === 'success');
  const failed = results.filter((r) => r.migration?.status === 'failed');
  const skipped = results.filter((r) => r.migration?.status === 'skipped');

  console.log('\n' + '='.repeat(70));
  console.log('📊 POST IMAGES MIGRATION REPORT');
  console.log('='.repeat(70));
  console.log(`Total processed: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⏭️  Skipped: ${skipped.length}`);

  if (successful.length > 0) {
    const totalImages = successful.reduce(
      (sum, post) => sum + (post.migration?.imagesProcessed || 0),
      0
    );
    console.log(`📸 Total images migrated: ${totalImages}`);
  }

  console.log('\n📋 Detailed Results:');
  results.forEach((post, index) => {
    const status = post.migration?.status || 'unknown';
    const icon =
      status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏭️';
    const title = post.title || post.data?.title || 'Unknown';
    const reason = post.migration?.reason || '';
    console.log(`${icon} ${index + 1}. ${title} (${status}) ${reason}`);
  });

  return { successful, failed, skipped };
}

async function main() {
  try {
    console.log('🚀 Post Images Migration Script Starting...');
    console.log('📊 Processing ALL posts in database');

    // Fetch posts from Mnemo
    console.log('\n📡 Fetching posts from Mnemo API...');
    const response = await fetch(
      `${CONFIG.MNEMO_API_BASE}/collection-items?type=post`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    const data = await response.json();
    const allPosts = data.collectionItems || [];

    console.log(`📋 Found ${allPosts.length} posts in Mnemo`);
    console.log(`🎯 Processing ALL ${allPosts.length} posts`);

    if (allPosts.length === 0) {
      console.log('⚠️  No posts to process');
      return;
    }

    // Process posts in batches
    const results = await processInBatches(
      allPosts,
      CONFIG.CONCURRENCY_LIMIT,
      processPost
    );

    // Generate and save report
    const reportData = generateMigrationReport(results);

    const reportFileName = `post-images-migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(
      reportFileName,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          totalProcessed: results.length,
          successful: reportData.successful.length,
          failed: reportData.failed.length,
          skipped: reportData.skipped.length,
          results: results
        },
        null,
        2
      )
    );

    console.log(`\n📄 Full report saved to: ${reportFileName}`);
    console.log('✨ Migration completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

main();
