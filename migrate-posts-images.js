#!/usr/bin/env node

/**
 * Posts Images Migration Script
 *
 * This script fetches posts from Community Jameel API, downloads images from Webflow CDN,
 * uploads them to Google Cloud Storage, and creates posts in Mnemo database
 *
 * Usage: node migrate-posts-images.js [--test-limit=5] [--dry-run]
 *
 * Examples:
 * - node migrate-posts-images.js --test-limit=5     # Process first 5 posts for testing
 * - node migrate-posts-images.js --dry-run          # Preview what would be migrated
 * - node migrate-posts-images.js                    # Process all posts
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
  CONCURRENCY_LIMIT: 3, // Process 3 posts at a time (slower for posts due to multiple images)
  TIMEOUT: 45000, // 45 seconds timeout for downloads

  // Webflow API v2 Configuration
  WEBFLOW_API_BASE: 'https://api.webflow.com/v2',
  WEBFLOW_SITE_ID: process.env.WEBFLOW_SITE_ID || '',
  WEBFLOW_POSTS_COLLECTION_ID:
    process.env.WEBFLOW_POSTS_COLLECTION_ID || '61ee828a15a3183262bde542', // Posts collection ID
  WEBFLOW_API_TOKEN:
    process.env.WEBFLOW_API_TOKEN ||
    'd2eac7bfcd8cc230db56e0dd9f9c7c7f4652db6195ad674c0b7939bb438fb33c',

  MNEMO_API_URL:
    'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/collection-items'
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

// Command line argument parsing
const args = process.argv.slice(2);
const testLimit =
  args.find((arg) => arg.startsWith('--test-limit='))?.split('=')[1] || null;
const isDryRun = args.includes('--dry-run');

// Utility functions
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOriginalFilename(imageUrl) {
  try {
    const parsedUrl = new URL(imageUrl);
    const pathname = parsedUrl.pathname;
    return path.basename(pathname);
  } catch (error) {
    console.error(`❌ Invalid URL: ${imageUrl}`);
    return null;
  }
}

function downloadImage(imageUrl, timeout = CONFIG.TIMEOUT) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(imageUrl);
    const httpModule = parsedUrl.protocol === 'https:' ? https : http;

    const request = httpModule.get(imageUrl, (response) => {
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

function generateSlug(name) {
  if (!name) return 'unknown-post';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

// Fetch data from API
function fetchData(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol
      .get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(
              new Error(`Failed to parse JSON from ${url}: ${error.message}`)
            );
          }
        });
      })
      .on('error', (error) => {
        reject(new Error(`Failed to fetch from ${url}: ${error.message}`));
      });
  });
}

// Fetch posts from Webflow API v2 with pagination
async function fetchWebflowPosts() {
  if (!CONFIG.WEBFLOW_API_TOKEN) {
    throw new Error('WEBFLOW_API_TOKEN environment variable is required');
  }
  if (!CONFIG.WEBFLOW_POSTS_COLLECTION_ID) {
    throw new Error(
      'WEBFLOW_POSTS_COLLECTION_ID environment variable is required'
    );
  }

  console.log('📡 Fetching posts from Webflow API v2...');
  console.log(`   Collection ID: ${CONFIG.WEBFLOW_POSTS_COLLECTION_ID}`);

  let allPosts = [];
  let offset = 0;
  const limit = 100; // Webflow API v2 max limit per request
  let hasMore = true;

  try {
    const startTime = Date.now();

    while (hasMore) {
      const url = `${CONFIG.WEBFLOW_API_BASE}/collections/${CONFIG.WEBFLOW_POSTS_COLLECTION_ID}/items?limit=${limit}&offset=${offset}`;

      console.log(`   📥 Fetching batch: offset=${offset}, limit=${limit}`);

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
          'Accept-Version': '2.0.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Webflow API returned ${response.status}: ${response.statusText}\n${errorText}`
        );
      }

      const data = await response.json();
      const posts = data.items || [];
      allPosts = allPosts.concat(posts);

      console.log(
        `   ✅ Fetched ${posts.length} posts (total so far: ${allPosts.length})`
      );

      // Check if there are more items
      hasMore = posts.length === limit;
      offset += posts.length;

      // Add delay between requests to respect rate limits
      if (hasMore) {
        await sleep(1000); // 1 second delay
      }
    }

    // Filter out draft items (matching your getData function)
    allPosts = allPosts.filter((item) => !item.isDraft);

    // Sort by date-published in descending order (matching your getData function)
    allPosts.sort((a, b) => {
      const dateA = a.fieldData?.['date-published']
        ? new Date(a.fieldData['date-published']).getTime()
        : 0;
      const dateB = b.fieldData?.['date-published']
        ? new Date(b.fieldData['date-published']).getTime()
        : 0;
      return dateB - dateA;
    });

    const endTime = Date.now();
    const fetchDuration = (endTime - startTime) / 1000;

    console.log(
      `📋 Total posts fetched from Webflow: ${allPosts.length} (${fetchDuration}s)`
    );
    return allPosts;
  } catch (error) {
    console.error(`❌ Error fetching from Webflow API: ${error.message}`);
    throw error;
  }
}

// Process a single image with detailed tracking
async function processImage(imageUrl, imageType, postSlug, index = null) {
  if (!imageUrl || imageUrl === '' || imageUrl === 'N/A') {
    return {
      type: imageType,
      index,
      status: 'skipped',
      reason: 'No URL provided',
      originalUrl: imageUrl,
      newUrl: null
    };
  }

  const originalFilename = getOriginalFilename(imageUrl);
  if (!originalFilename) {
    return {
      type: imageType,
      index,
      status: 'failed',
      reason: 'Invalid URL format',
      originalUrl: imageUrl,
      newUrl: null
    };
  }

  const fileName =
    index !== null
      ? `${imageType}-${index}${path.extname(originalFilename)}`
      : `${imageType}${path.extname(originalFilename)}`;

  const gcsPath = `website/collection/posts/${postSlug}/${fileName}`;

  if (isDryRun) {
    return {
      type: imageType,
      index,
      status: 'dry-run',
      reason: 'Dry run mode',
      originalUrl: imageUrl,
      newUrl: `${CONFIG.CDN_BASE_URL}/${gcsPath}`
    };
  }

  try {
    console.log(
      `      📥 Downloading ${imageType}${index !== null ? `[${index}]` : ''}: ${imageUrl}`
    );
    const imageBuffer = await downloadImage(imageUrl);

    console.log(`      📤 Uploading to: ${gcsPath}`);
    const newUrl = await uploadToGCS(imageBuffer, originalFilename, gcsPath);

    console.log(`      ✅ Success: ${newUrl}`);

    return {
      type: imageType,
      index,
      status: 'success',
      originalUrl: imageUrl,
      newUrl,
      gcsPath,
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

// Create post in Mnemo database
async function createPostInMnemo(postData) {
  if (isDryRun) {
    return { success: true, id: 'dry-run-id', message: 'Dry run mode' };
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(postData);
    const options = {
      hostname: 'mnemo-app-e4f6j5kdsq-ew.a.run.app',
      port: 443,
      path: '/api/collection-items',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data, 'utf8')
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => (responseData += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(responseData);
            resolve(result);
          } catch (parseError) {
            resolve({ success: true, message: 'Created successfully' });
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

// Transform Webflow API v2 post data to Mnemo format
function transformPostData(webflowPost, imageResults) {
  const fieldData = webflowPost.fieldData || webflowPost;
  const slug =
    fieldData.slug || generateSlug(fieldData.name || webflowPost.name);

  // DEBUG: Log available fields to check body content
  console.log(
    `   🔍 DEBUG - Available fields for ${fieldData.name || webflowPost.name}:`
  );
  console.log(`      Available fieldData keys:`, Object.keys(fieldData));
  console.log(
    `      body exists: ${!!fieldData.body}, length: ${fieldData.body?.length || 0}`
  );
  console.log(
    `      bodyArabic exists: ${!!fieldData['body-arabic']}, length: ${fieldData['body-arabic']?.length || 0}`
  );
  console.log(
    `      summary exists: ${!!fieldData.summary}, length: ${fieldData.summary?.length || 0}`
  );

  // Check for different possible field names
  const possibleBodyFields = [
    'body',
    'content',
    'description',
    'post-body',
    'article-body',
    'text-content'
  ];
  possibleBodyFields.forEach((field) => {
    if (fieldData[field]) {
      console.log(
        `      Found content in '${field}': ${fieldData[field].substring(0, 100)}...`
      );
    }
  });

  if (fieldData.body) {
    console.log(`      body preview: ${fieldData.body.substring(0, 100)}...`);
  }

  // Update image URLs with migrated versions
  const updatedImages = {};
  imageResults.forEach((result) => {
    if (result.status === 'success' || result.status === 'dry-run') {
      if (result.type === 'thumbnail') {
        updatedImages.thumbnail = {
          url: result.newUrl,
          alt: fieldData['thumbnail-image']?.alt || ''
        };
      } else if (result.type === 'mainImage') {
        updatedImages.mainImage = {
          url: result.newUrl,
          alt: fieldData['main-image']?.alt || ''
        };
      } else if (result.type === 'openGraphImage') {
        updatedImages.openGraphImage = { url: result.newUrl, alt: '' };
      } else if (result.type === 'imageCarousel') {
        if (!updatedImages.imageCarousel) updatedImages.imageCarousel = [];
        updatedImages.imageCarousel[result.index] = {
          url: result.newUrl,
          alt: fieldData['image-carousel']?.[result.index]?.alt || ''
        };
      }
    }
  });

  const transformedData = {
    type: 'post',
    status: 'published',
    slug: slug.replace(/^\/|\/$/g, ''), // Remove leading/trailing slashes
    title: fieldData.name || webflowPost.name,
    data: {
      // Basic fields (title and slug MUST be included in data object for validation)
      title: fieldData.name || webflowPost.name,
      slug: slug.replace(/^\/|\/$/g, ''),
      arabicTitle: fieldData['arabic-title'],
      datePublished:
        fieldData['event-date'] ||
        fieldData['date-published'] ||
        webflowPost.lastPublished ||
        webflowPost.createdOn,
      location: fieldData.city || fieldData.location,
      locationArabic: fieldData['location-arabic'],

      // Content fields - map to available fields
      bodyEnglish:
        fieldData.body ||
        fieldData['short-description-2'] ||
        fieldData.description,
      bodyArabic: fieldData['body-arabic'],
      summary: fieldData.summary || fieldData['short-description-2'],
      summaryArabic: fieldData['summary-arabic'],
      bulletPointsEnglish: fieldData['bullet-points-english'],
      bulletPointsArabic: fieldData['bullet-points-arabic'],

      // Event-specific fields
      eventDate: fieldData['event-date'],
      city: fieldData.city,
      time: fieldData.time,
      address: fieldData.address,
      shortDescription: fieldData['short-description-2'],

      // SEO fields
      seoTitle: fieldData['seo-title'],
      seoTitleArabic: fieldData['seo-title-arabic'],
      seoMeta: fieldData['seo-meta-description'],
      seoMetaArabic: fieldData['seo-meta-description-arabic'],

      // Images (updated with new URLs)
      thumbnail: updatedImages.thumbnail || {
        url:
          fieldData.thumbnail?.url || fieldData['thumbnail-image']?.url || '',
        alt: fieldData.thumbnail?.alt || fieldData['thumbnail-image']?.alt || ''
      },
      mainImage: updatedImages.mainImage || {
        url: fieldData['hero-image']?.url || fieldData['main-image']?.url || '',
        alt: fieldData['hero-image']?.alt || fieldData['main-image']?.alt || ''
      },
      openGraphImage: updatedImages.openGraphImage || {
        url:
          fieldData['open-graph-image']?.url ||
          fieldData.openGraphImage?.url ||
          '',
        alt: fieldData['open-graph-image']?.alt || ''
      },
      imageCarousel:
        updatedImages.imageCarousel || fieldData['image-carousel'] || [],

      // Media credits
      imageGalleryCredits: fieldData['image-gallery-credits'],
      imageGalleryCreditsArabic: fieldData['image-gallery-credits-arabic'],

      // Video fields
      heroVideoYoutubeId: fieldData['hero-video-youtube-id'],
      heroVideoArabicYoutubeId: fieldData['hero-video-arabic-youtube-id'],

      // Tags and categories (Webflow references)
      tags: fieldData.tags || [],

      // Flags
      featured: fieldData.featured || false,
      pushToGR: fieldData['push-to-gr'] || false,

      // Webflow metadata
      webflowId: webflowPost.id,
      webflowCollectionId: webflowPost.cmsLocaleId,
      originalSlug: fieldData.slug,
      createdOn: webflowPost.createdOn,
      lastPublished: webflowPost.lastPublished,
      lastUpdated: webflowPost.lastUpdated
    }
  };

  // DEBUG: Log the transformed data to see exactly what's being sent
  console.log(
    `   🔍 DEBUG - Transformed data bodyEnglish length: ${transformedData.data.bodyEnglish?.length || 0}`
  );
  if (transformedData.data.bodyEnglish) {
    console.log(
      `   🔍 DEBUG - bodyEnglish preview: ${transformedData.data.bodyEnglish.substring(0, 100)}...`
    );
  }

  return transformedData;
}

// Process a single post
async function processPost(post, index, total) {
  const postName = post.fieldData?.name || post.name || `Post ${index + 1}`;
  const slug = post.fieldData?.slug || generateSlug(postName);

  console.log(`\n🔄 Processing [${index + 1}/${total}]: ${postName}`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Webflow ID: ${post.id}`);

  // Check if this slug already exists in the external API
  console.log('🔍 Checking if slug already exists in external API...');
  try {
    const checkResponse = await fetch(
      `https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/collection-items`
    );
    if (checkResponse.ok) {
      const existingData = await checkResponse.json();
      const existingSlugs = existingData.collectionItems.map(
        (item) => item.slug
      );

      if (existingSlugs.includes(slug)) {
        console.log(
          `⚠️  SKIPPING: Post with slug "${slug}" already exists in external API`
        );
        return {
          post: {
            id: post.id,
            name: postName,
            slug,
            webflowId: post.id
          },
          images: [],
          mnemo: { success: false, error: 'Slug already exists' },
          summary: {
            totalImages: 0,
            successfulImages: 0,
            dryRunImages: 0,
            failedImages: 0,
            skippedImages: 0,
            mnemoCreated: false
          }
        };
      }

      console.log(`✅ Slug "${slug}" is unique, proceeding...`);
    }
  } catch (error) {
    console.log(
      '⚠️  Could not check existing slugs, proceeding anyway...',
      error.message
    );
  }

  const fieldData = post.fieldData || post;
  const imageResults = [];

  // Process thumbnail
  const thumbnailUrl =
    fieldData['thumbnail-image']?.url ||
    fieldData.thumbnail?.url ||
    fieldData.thumbnail;
  if (thumbnailUrl && thumbnailUrl !== '' && thumbnailUrl !== 'N/A') {
    console.log(`   📸 Processing thumbnail: ${thumbnailUrl}`);
    const result = await processImage(thumbnailUrl, 'thumbnail', slug);
    imageResults.push(result);
    await sleep(500); // Small delay between images
  } else {
    console.log(`   ⚠️  No thumbnail URL found`);
  }

  // Process main image (hero-image in this collection)
  const mainImageUrl =
    fieldData['hero-image']?.url ||
    fieldData['main-image']?.url ||
    fieldData.mainImage?.url ||
    fieldData.mainImage;
  if (mainImageUrl && mainImageUrl !== '' && mainImageUrl !== 'N/A') {
    console.log(`   📸 Processing mainImage (hero-image): ${mainImageUrl}`);
    const result = await processImage(mainImageUrl, 'mainImage', slug);
    imageResults.push(result);
    await sleep(500);
  } else {
    console.log(
      `   ⚠️  No mainImage URL found (checked hero-image and main-image)`
    );
  }

  // Process open graph image
  const openGraphImageUrl =
    fieldData['open-graph-image']?.url ||
    fieldData.openGraphImage?.url ||
    fieldData.openGraphImage;
  if (
    openGraphImageUrl &&
    openGraphImageUrl !== '' &&
    openGraphImageUrl !== 'N/A'
  ) {
    console.log(`   📸 Processing openGraphImage: ${openGraphImageUrl}`);
    const result = await processImage(
      openGraphImageUrl,
      'openGraphImage',
      slug
    );
    imageResults.push(result);
    await sleep(500);
  } else {
    console.log(`   ⚠️  No openGraphImage URL found`);
  }

  // Process image carousel
  const imageCarousel = fieldData['image-carousel'] || fieldData.imageCarousel;
  if (imageCarousel && Array.isArray(imageCarousel)) {
    console.log(
      `   📸 Processing imageCarousel (${imageCarousel.length} images)...`
    );
    for (let i = 0; i < imageCarousel.length; i++) {
      const carouselImage = imageCarousel[i];
      const carouselImageUrl = carouselImage?.url;
      if (
        carouselImageUrl &&
        carouselImageUrl !== '' &&
        carouselImageUrl !== 'N/A'
      ) {
        console.log(
          `   📸 Processing carousel image ${i}: ${carouselImageUrl}`
        );
        const result = await processImage(
          carouselImageUrl,
          'imageCarousel',
          slug,
          i
        );
        imageResults.push(result);
        await sleep(500);
      } else {
        console.log(`   ⚠️  Skipping carousel image ${i}: no valid URL`);
      }
    }
  } else {
    console.log(`   ⚠️  No imageCarousel found or not an array`);
  }

  console.log(`   📊 Total images found: ${imageResults.length}`);

  // Create post in Mnemo database
  let mnemoResult = null;
  try {
    console.log(`   📝 Creating post in Mnemo database...`);
    const postData = transformPostData(post, imageResults);
    mnemoResult = await createPostInMnemo(postData);
    console.log(
      `   ✅ Post created in Mnemo: ${mnemoResult.collectionItem?.id || 'success'}`
    );
  } catch (error) {
    console.error(`   ❌ Failed to create post in Mnemo: ${error.message}`);
    mnemoResult = { success: false, error: error.message };
  }

  return {
    post: {
      id: post.id,
      name: postName,
      slug,
      webflowId: post.id
    },
    images: imageResults,
    mnemo: mnemoResult,
    summary: {
      totalImages: imageResults.length,
      successfulImages: imageResults.filter((r) => r.status === 'success')
        .length,
      dryRunImages: imageResults.filter((r) => r.status === 'dry-run').length,
      failedImages: imageResults.filter((r) => r.status === 'failed').length,
      skippedImages: imageResults.filter((r) => r.status === 'skipped').length,
      mnemoCreated: mnemoResult?.success !== false
    }
  };
}

async function processInBatches(items, batchSize, processor) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(
      `\n🚀 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`
    );

    const batchPromises = batch.map((item, batchIndex) =>
      processor(item, i + batchIndex, items.length)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Longer pause between batches for posts (more complex processing)
    if (i + batchSize < items.length) {
      await sleep(3000);
    }
  }

  return results;
}

function generateMigrationReport(results) {
  const successful = results.filter((r) => r.summary.mnemoCreated);
  const failed = results.filter((r) => !r.summary.mnemoCreated);
  const totalImages = results.reduce(
    (sum, r) => sum + r.summary.totalImages,
    0
  );
  const successfulImages = results.reduce(
    (sum, r) => sum + r.summary.successfulImages,
    0
  );
  const dryRunImages = results.reduce(
    (sum, r) => sum + r.summary.dryRunImages,
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

  console.log('\n' + '='.repeat(80));
  console.log('📊 POSTS MIGRATION REPORT');
  console.log('='.repeat(80));
  console.log(`🎯 POSTS SUMMARY:`);
  console.log(`   Total posts processed: ${results.length}`);
  console.log(`   ✅ Successfully created in Mnemo: ${successful.length}`);
  console.log(`   ❌ Failed to create in Mnemo: ${failed.length}`);

  console.log(`\n🖼️  IMAGES SUMMARY:`);
  console.log(`   Total images processed: ${totalImages}`);
  if (isDryRun) {
    console.log(`   🧪 Dry-run simulated: ${dryRunImages}`);
  } else {
    console.log(`   ✅ Successfully migrated: ${successfulImages}`);
  }
  console.log(`   ❌ Failed to migrate: ${failedImages}`);
  console.log(`   ⚠️  Skipped (no URL): ${skippedImages}`);

  if (failed.length > 0) {
    console.log('\n❌ FAILED POSTS:');
    failed.forEach((result) => {
      console.log(`  - ${result.post.name} (${result.post.slug})`);
      if (result.mnemo.error) {
        console.log(`    Reason: ${result.mnemo.error}`);
      }
    });
  }

  // Detailed image breakdown
  console.log('\n🔍 DETAILED IMAGE BREAKDOWN:');
  results.forEach((result) => {
    const imagesByType = {};
    result.images.forEach((img) => {
      if (!imagesByType[img.type]) imagesByType[img.type] = [];
      imagesByType[img.type].push(img);
    });

    console.log(`\n  📄 ${result.post.name}:`);
    Object.entries(imagesByType).forEach(([type, images]) => {
      const successful = images.filter(
        (img) => img.status === 'success'
      ).length;
      const dryRun = images.filter((img) => img.status === 'dry-run').length;
      const failed = images.filter((img) => img.status === 'failed').length;
      const skipped = images.filter((img) => img.status === 'skipped').length;

      if (isDryRun) {
        console.log(`    ${type}: ${dryRun}🧪 ${failed}❌ ${skipped}⚠️`);
      } else {
        console.log(`    ${type}: ${successful}✅ ${failed}❌ ${skipped}⚠️`);
      }
    });
  });

  console.log('\n✨ Migration completed!');
  console.log('='.repeat(80));
}

async function main() {
  console.log('🚀 Starting posts images migration...');
  console.log(`📊 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
  console.log(`🌐 Webflow API: ${CONFIG.WEBFLOW_API_BASE}`);
  console.log(`📡 Mnemo API: ${CONFIG.MNEMO_API_URL}`);
  console.log(`☁️  Target bucket: ${CONFIG.BUCKET_NAME}`);
  console.log(`⚡ Concurrency limit: ${CONFIG.CONCURRENCY_LIMIT}`);

  if (testLimit) {
    console.log(`🧪 TEST MODE: Processing only first ${testLimit} posts`);
  }

  // Validate required environment variables
  if (!process.env.PRIVATE_GCL) {
    console.error('❌ Error: PRIVATE_GCL environment variable is required');
    process.exit(1);
  }

  if (!CONFIG.WEBFLOW_API_TOKEN) {
    console.error(
      '❌ Error: WEBFLOW_API_TOKEN environment variable is required'
    );
    console.error('Please add WEBFLOW_API_TOKEN to your .env.local file');
    process.exit(1);
  }

  if (!CONFIG.WEBFLOW_POSTS_COLLECTION_ID) {
    console.error(
      '❌ Error: WEBFLOW_POSTS_COLLECTION_ID environment variable is required'
    );
    console.error(
      'Please add WEBFLOW_POSTS_COLLECTION_ID to your .env.local file'
    );
    process.exit(1);
  }

  try {
    // Fetch posts from Webflow API v2
    console.log('\n📥 Fetching posts from Webflow API v2...');
    let posts = await fetchWebflowPosts();

    if (testLimit) {
      posts = posts.slice(0, parseInt(testLimit));
    }

    console.log(
      `📋 Loaded ${posts.length} posts${testLimit ? ` (limited to ${testLimit} for testing)` : ''}`
    );

    if (posts.length === 0) {
      console.log('⚠️  No posts found to process');
      return;
    }

    // Process posts in batches
    const results = await processInBatches(
      posts,
      CONFIG.CONCURRENCY_LIMIT,
      processPost
    );

    // Generate comprehensive report
    generateMigrationReport(results);

    // Save detailed results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `posts-migration-report-${timestamp}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportFile}`);

    // Save summary report
    const summaryFile = `posts-migration-summary-${timestamp}.json`;
    const summary = {
      timestamp: new Date().toISOString(),
      mode: isDryRun ? 'dry-run' : 'live',
      testLimit: testLimit ? parseInt(testLimit) : null,
      totals: {
        posts: results.length,
        successfulPosts: results.filter((r) => r.summary.mnemoCreated).length,
        failedPosts: results.filter((r) => !r.summary.mnemoCreated).length,
        totalImages: results.reduce((sum, r) => sum + r.summary.totalImages, 0),
        successfulImages: results.reduce(
          (sum, r) => sum + r.summary.successfulImages,
          0
        ),
        dryRunImages: results.reduce(
          (sum, r) => sum + r.summary.dryRunImages,
          0
        ),
        failedImages: results.reduce(
          (sum, r) => sum + r.summary.failedImages,
          0
        ),
        skippedImages: results.reduce(
          (sum, r) => sum + r.summary.skippedImages,
          0
        )
      }
    };
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📊 Summary report saved: ${summaryFile}`);
  } catch (error) {
    console.error(`💥 Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught errors gracefully
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
