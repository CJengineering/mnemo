#!/usr/bin/env node

/**
 * News Images Migration Script
 *
 * This script downloads news images and uploads them to Google Cloud Storage
 * It also updates the Mnemo database with the new image URLs
 * Usage: node migrate-news-images.js
 *
 * This script will:
 * 1. Fetch news from Mnemo API
 * 2. Find news with external image URLs
 * 3. Download images and upload to GCS with structure: website/collection/news/[slug]/
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
  CONCURRENCY_LIMIT: 3, // Process 3 news items at a time
  TIMEOUT: 45000, // 45 seconds timeout for downloads
  MNEMO_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api'
  // No limit - process ALL news
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

function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestModule = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: CONFIG.TIMEOUT,
      ...options
    };

    const req = requestModule.request(requestOptions, (res) => {
      let data = Buffer.alloc(0);

      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (options.returnBuffer) {
            resolve(data);
          } else {
            resolve(data.toString());
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Check if image is already on our CDN
function isImageOnCDN(imageUrl) {
  if (!imageUrl) return false;
  return imageUrl.includes('cdn.communityjameel.io');
}

// Extract filename from URL
function extractFilename(imageUrl) {
  try {
    const urlObj = new URL(imageUrl);
    const pathname = urlObj.pathname;
    const filename = path.basename(pathname);
    
    // If no extension or invalid filename, generate one
    if (!filename || !filename.includes('.')) {
      const timestamp = Date.now();
      return `image-${timestamp}.jpg`;
    }
    
    return filename;
  } catch (error) {
    const timestamp = Date.now();
    return `image-${timestamp}.jpg`;
  }
}

// Sanitize filename
function sanitizeFilename(filename) {
  return filename
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9.-]/g, '') // Remove special characters except dots and hyphens
    .toLowerCase(); // Convert to lowercase
}

// Upload image to Google Cloud Storage
async function uploadImageToGCS(imageUrl, gcsPath) {
  try {
    console.log(`  📥 Downloading: ${imageUrl}`);
    
    // Download image
    const imageBuffer = await makeHttpRequest(imageUrl, { returnBuffer: true });
    
    console.log(`  ☁️  Uploading to: ${gcsPath}`);
    
    // Upload to GCS
    const file = bucket.file(gcsPath);
    await file.save(imageBuffer, {
      metadata: {
        contentType: getContentType(gcsPath),
        cacheControl: 'public, max-age=31536000' // 1 year cache
      }
    });

    const newUrl = `${CONFIG.CDN_BASE_URL}/${gcsPath}`;
    console.log(`  ✅ Uploaded successfully: ${newUrl}`);
    
    return newUrl;
  } catch (error) {
    console.error(`  ❌ Upload failed for ${imageUrl}: ${error.message}`);
    throw error;
  }
}

// Get content type from filename
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  const contentTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml'
  };
  return contentTypes[ext] || 'image/jpeg';
}

// Process a single news item's images
async function processNewsImages(newsItem) {
  const { id, slug, data } = newsItem;
  const updates = {};
  let imageCount = 0;
  let processedCount = 0;

  console.log(`\n🔄 Processing news: "${data.title}" (${slug})`);

  // Process heroImage
  if (data.heroImage?.url && !isImageOnCDN(data.heroImage.url)) {
    imageCount++;
    try {
      const filename = sanitizeFilename(extractFilename(data.heroImage.url));
      const gcsPath = `website/collection/news/${slug}/${filename}`;
      const newUrl = await uploadImageToGCS(data.heroImage.url, gcsPath);
      
      updates['data.heroImage.url'] = newUrl;
      processedCount++;
      console.log(`  ✅ HeroImage migrated`);
    } catch (error) {
      console.error(`  ❌ HeroImage failed: ${error.message}`);
    }
  } else if (data.heroImage?.url && isImageOnCDN(data.heroImage.url)) {
    console.log(`  ⏭️  HeroImage already on CDN: ${data.heroImage.url}`);
  }

  // Process thumbnail
  if (data.thumbnail?.url && !isImageOnCDN(data.thumbnail.url)) {
    imageCount++;
    try {
      const filename = sanitizeFilename(extractFilename(data.thumbnail.url));
      const gcsPath = `website/collection/news/${slug}/${filename}`;
      const newUrl = await uploadImageToGCS(data.thumbnail.url, gcsPath);
      
      updates['data.thumbnail.url'] = newUrl;
      processedCount++;
      console.log(`  ✅ Thumbnail migrated`);
    } catch (error) {
      console.error(`  ❌ Thumbnail failed: ${error.message}`);
    }
  } else if (data.thumbnail?.url && isImageOnCDN(data.thumbnail.url)) {
    console.log(`  ⏭️  Thumbnail already on CDN: ${data.thumbnail.url}`);
  }

  // Check if any updates need to be made
  if (Object.keys(updates).length === 0) {
    console.log(`  ⏭️  No images to migrate for news: ${slug}`);
    return { success: true, updated: false, imageCount: 0 };
  }

  // Update the news item in Mnemo
  try {
    console.log(`  💾 Updating news in database...`);
    
    // Create updated data object with new image URLs
    const updatedData = { ...data };
    
    // Apply the image URL updates
    if (updates['data.heroImage.url']) {
      updatedData.heroImage = { ...updatedData.heroImage, url: updates['data.heroImage.url'] };
    }
    if (updates['data.thumbnail.url']) {
      updatedData.thumbnail = { ...updatedData.thumbnail, url: updates['data.thumbnail.url'] };
    }
    
    // Construct the full payload as expected by PUT endpoint
    const updatePayload = JSON.stringify({
      type: newsItem.type,
      status: newsItem.status,
      slug: newsItem.slug,
      title: newsItem.title,
      data: updatedData
    });
    
    await makeHttpRequest(`${CONFIG.MNEMO_API_BASE}/collection-items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updatePayload)
      },
      body: updatePayload
    });

    console.log(`  ✅ News updated successfully: ${processedCount} images migrated`);
    return { success: true, updated: true, imageCount: processedCount };
    
  } catch (error) {
    console.error(`  ❌ Database update failed: ${error.message}`);
    return { success: false, updated: false, imageCount: 0, error: error.message };
  }
}

// Fetch all news from Mnemo API
async function fetchAllNews() {
  try {
    console.log('📡 Fetching all news from Mnemo API...');
    
    const response = await makeHttpRequest(`${CONFIG.MNEMO_API_BASE}/collection-items?type=news&limit=2000`);
    const data = JSON.parse(response);
    
    // The API returns collectionItems, not items
    const newsItems = data.collectionItems || [];
    console.log(`✅ Fetched ${newsItems.length} news items`);
    return newsItems;
    
  } catch (error) {
    console.error('❌ Failed to fetch news:', error.message);
    throw error;
  }
}

// Main migration function
async function main() {
  const startTime = Date.now();
  
  console.log('🚀 Starting News Images Migration');
  console.log('==================================');
  console.log(`📂 Target folder structure: website/collection/news/[slug]/`);
  console.log(`🌐 CDN Base URL: ${CONFIG.CDN_BASE_URL}`);
  console.log(`⚡ Concurrency: ${CONFIG.CONCURRENCY_LIMIT} news items at a time`);

  try {
    // Fetch all news
    const allNews = await fetchAllNews();
    
    if (allNews.length === 0) {
      console.log('❌ No news found to process');
      return;
    }

    // Process news in batches
    const batchSize = CONFIG.CONCURRENCY_LIMIT;
    const totalBatches = Math.ceil(allNews.length / batchSize);
    
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalFailed = 0;
    let totalImages = 0;

    console.log(`\n📦 Processing ${allNews.length} news items in ${totalBatches} batches of ${batchSize}`);

    for (let i = 0; i < allNews.length; i += batchSize) {
      const batch = allNews.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`\n🎯 Batch ${batchNumber}/${totalBatches} (Items ${i + 1}-${Math.min(i + batchSize, allNews.length)})`);

      // Process batch concurrently
      const batchPromises = batch.map(newsItem => processNewsImages(newsItem));
      const batchResults = await Promise.all(batchPromises);

      // Update statistics
      batchResults.forEach(result => {
        totalProcessed++;
        if (result.success && result.updated) {
          totalUpdated++;
          totalImages += result.imageCount;
        } else if (!result.success) {
          totalFailed++;
        }
      });

      // Small delay between batches
      if (i + batchSize < allNews.length) {
        console.log(`⏸️  Pausing 2 seconds between batches...`);
        await sleep(2000);
      }
    }

    // Final statistics
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎉 News Images Migration Complete!');
    console.log('==================================');
    console.log(`📊 Total processed: ${totalProcessed} news items`);
    console.log(`✅ Successfully migrated: ${totalUpdated} news items (${totalImages} images)`);
    console.log(`⏭️  Skipped: ${totalProcessed - totalUpdated - totalFailed} news items (no images or already on CDN)`);
    console.log(`❌ Failed: ${totalFailed} news items`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    
    // Save migration report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalProcessed,
        totalUpdated,
        totalSkipped: totalProcessed - totalUpdated - totalFailed,
        totalFailed,
        totalImages,
        duration
      },
      config: CONFIG
    };

    const reportFilename = `news-images-migration-report-${new Date().toISOString().replace(/:/g, '-')}.json`;
    fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
    console.log(`📋 Migration report saved: ${reportFilename}`);

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { main, processNewsImages };
