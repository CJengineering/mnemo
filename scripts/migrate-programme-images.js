#!/usr/bin/env node

/**
 * Programme Images Migration Script
 *
 * This script fetches programmes from the API, downloads images from Webflow CDN
 * and uploads them to Google Cloud Storage, then updates the programmes with new URLs
 *
 * Usage: node scripts/migrate-programme-images.js [--preview]
 */

const { Storage } = require('@google-cloud/storage');
const https = require('https');
const http = require('http');
const path = require('path');
const url = require('url');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONFIG = {
  GOOGLE_CLOUD_PROJECT_ID: 'cj-tech-381914',
  BUCKET_NAME: 'mnemo',
  CDN_BASE_URL: 'https://cdn.communityjameel.io',
  API_BASE_URL: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api',
  CONCURRENCY_LIMIT: 3, // Process 3 programmes at a time
  TIMEOUT: 30000 // 30 seconds timeout for downloads
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

function isWebflowCDN(url) {
  return url && url.includes('cdn.prod.website-files.com');
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

// API functions
async function fetchProgrammes() {
  try {
    console.log('📡 Fetching programmes from API...');
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/collection-items?type=programme`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const programmes = data.collectionItems || [];
    console.log(`✅ Fetched ${programmes.length} programmes`);
    return programmes;
  } catch (error) {
    throw new Error(`Failed to fetch programmes: ${error.message}`);
  }
}

async function updateProgramme(programmeId, updatedData) {
  try {
    console.log(`  📝 Updating programme via API...`);
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/collection-items/${programmeId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorText}`
      );
    }

    console.log(`  ✅ Programme updated successfully`);
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to update programme: ${error.message}`);
  }
}

// Programme processing functions
function hasWebflowImages(programme) {
  const data = programme.data || {};
  const imageFields = [
    'logoSvgDark',
    'logoSvgLight',
    'heroSquare',
    'heroWide',
    'openGraph'
  ];

  return imageFields.some((field) => {
    const imageObj = data[field];
    return imageObj?.url && isWebflowCDN(imageObj.url);
  });
}

function getWebflowImageUrls(programme) {
  const data = programme.data || {};
  const webflowUrls = [];
  const imageFields = [
    'logoSvgDark',
    'logoSvgLight',
    'heroSquare',
    'heroWide',
    'openGraph'
  ];

  imageFields.forEach((field) => {
    const imageObj = data[field];
    if (imageObj?.url && isWebflowCDN(imageObj.url)) {
      webflowUrls.push({
        field: field,
        url: imageObj.url
      });
    }
  });

  return webflowUrls;
}

async function processProgramme(programme, index, total) {
  const programmeName = programme.title || `Programme ${index + 1}`;
  const programmeSlug =
    programme.slug || programme.data?.slug || `programme-${index + 1}`;

  console.log(`\n🔄 Processing [${index + 1}/${total}]: ${programmeName}`);
  console.log(`  📋 Slug: ${programmeSlug}`);

  // Get all Webflow image URLs
  const webflowImages = getWebflowImageUrls(programme);

  if (webflowImages.length === 0) {
    console.log(`⚠️  No Webflow images found for ${programmeName}`);
    return {
      ...programme,
      migration: {
        status: 'skipped',
        reason: 'No Webflow images',
        originalUrls: [],
        newUrls: []
      }
    };
  }

  console.log(`  📸 Found ${webflowImages.length} Webflow images to migrate`);

  // Create a copy of the programme data for updates
  const updatedProgramme = JSON.parse(JSON.stringify(programme));
  const migratedImages = [];

  try {
    // Process each image
    for (const imageInfo of webflowImages) {
      const originalUrl = imageInfo.url;
      const originalFilename = getOriginalFilename(originalUrl);

      if (!originalFilename) {
        console.log(
          `  ⚠️  Could not extract filename from URL: ${originalUrl}`
        );
        continue;
      }

      const gcsPath = `website/collection/programme/${programmeSlug}/${originalFilename}`;
      const newUrl = `${CONFIG.CDN_BASE_URL}/${gcsPath}`;

      console.log(`    🔄 Processing ${imageInfo.field}: ${originalFilename}`);
      console.log(`    📥 Downloading: ${originalUrl}`);

      // Download image
      const imageBuffer = await downloadImage(originalUrl);
      console.log(`    📤 Uploading to: ${gcsPath}`);

      // Upload to GCS
      await uploadToGCS(imageBuffer, originalFilename, gcsPath);
      console.log(`    ✅ Success: ${newUrl}`);

      // Update the programme data
      if (updatedProgramme.data[imageInfo.field]) {
        updatedProgramme.data[imageInfo.field].url = newUrl;
      }

      migratedImages.push({
        field: imageInfo.field,
        originalUrl,
        newUrl,
        gcsPath,
        fileSize: imageBuffer.length
      });

      // Small delay between images
      await sleep(500);
    }

    // Update programme via API
    await updateProgramme(programme.id, updatedProgramme);

    console.log(
      `  🎉 Successfully migrated ${migratedImages.length} images for ${programmeName}`
    );

    return {
      ...updatedProgramme,
      migration: {
        status: 'success',
        originalUrls: migratedImages.map((img) => img.originalUrl),
        newUrls: migratedImages.map((img) => img.newUrl),
        migratedImages
      }
    };
  } catch (error) {
    console.error(`  ❌ Failed for ${programmeName}: ${error.message}`);
    return {
      ...programme,
      migration: {
        status: 'failed',
        reason: error.message,
        originalUrls: webflowImages.map((img) => img.url),
        newUrls: []
      }
    };
  }
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

    // Brief pause between batches to be nice to the servers
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

  // Count total images migrated
  const totalImagesMigrated = successful.reduce((count, r) => {
    return count + (r.migration?.migratedImages?.length || 0);
  }, 0);

  console.log('\n' + '='.repeat(60));
  console.log('📊 PROGRAMME IMAGES MIGRATION REPORT');
  console.log('='.repeat(60));
  console.log(`Total programmes processed: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⚠️  Skipped: ${skipped.length}`);
  console.log(`🖼️  Total images migrated: ${totalImagesMigrated}`);

  if (failed.length > 0) {
    console.log('\n❌ FAILED MIGRATIONS:');
    failed.forEach((item) => {
      const name = item.title || 'Unknown Programme';
      console.log(`  - ${name}: ${item.migration.reason}`);
    });
  }

  if (successful.length > 0) {
    console.log('\n✅ SUCCESSFUL MIGRATIONS:');
    successful.forEach((item) => {
      const name = item.title || 'Unknown Programme';
      const imageCount = item.migration?.migratedImages?.length || 0;
      console.log(`  - ${name}: ${imageCount} images migrated`);
    });
  }

  console.log('\n✨ Migration completed!');
  console.log('='.repeat(60));
}

// Preview function
async function previewMigration() {
  console.log(
    '👁️  PREVIEW MODE: Showing programmes with Webflow CDN images...\n'
  );

  try {
    const programmes = await fetchProgrammes();
    const programmesWithWebflowImages = programmes.filter(hasWebflowImages);

    console.log(
      `🔍 Found ${programmesWithWebflowImages.length} programmes with Webflow CDN images:\n`
    );

    let totalWebflowImages = 0;

    programmesWithWebflowImages.forEach((programme, index) => {
      const programmeName = programme.title || 'Unknown Programme';
      const programmeSlug =
        programme.slug || programme.data?.slug || 'unknown-programme';
      const webflowImages = getWebflowImageUrls(programme);

      console.log(`${index + 1}. ${programmeName} (${programmeSlug})`);
      console.log(`   📸 ${webflowImages.length} Webflow images:`);

      webflowImages.forEach((img) => {
        const filename = getOriginalFilename(img.url);
        const newPath = `website/collection/programme/${programmeSlug}/${filename}`;
        console.log(`   - ${img.field}: ${filename}`);
        console.log(`     From: ${img.url}`);
        console.log(`     To:   ${CONFIG.CDN_BASE_URL}/${newPath}`);
        totalWebflowImages++;
      });
      console.log('');
    });

    console.log(
      `📊 Total Webflow CDN images to migrate: ${totalWebflowImages}`
    );
    console.log(
      '\nTo run the actual migration: node scripts/migrate-programme-images.js'
    );
  } catch (error) {
    console.error('❌ Preview failed:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  const isPreview =
    process.argv.includes('--preview') || process.argv.includes('-p');

  if (!process.env.PRIVATE_GCL) {
    console.error('❌ Error: PRIVATE_GCL environment variable is required');
    console.error(
      '   Make sure your Google Cloud credentials are set up in .env.local'
    );
    process.exit(1);
  }

  try {
    if (isPreview) {
      await previewMigration();
      return;
    }

    console.log('🚀 Starting programme images migration...');
    console.log(`☁️  Target bucket: ${CONFIG.BUCKET_NAME}`);
    console.log(`🌐 CDN base URL: ${CONFIG.CDN_BASE_URL}`);
    console.log(`🔗 API base URL: ${CONFIG.API_BASE_URL}`);
    console.log(`⚡ Concurrency limit: ${CONFIG.CONCURRENCY_LIMIT}`);

    // Fetch programmes from API
    const programmes = await fetchProgrammes();

    // Filter programmes that have Webflow CDN images
    const programmesWithWebflowImages = programmes.filter(hasWebflowImages);
    console.log(
      `🔍 Found ${programmesWithWebflowImages.length} programmes with Webflow images`
    );

    if (programmesWithWebflowImages.length === 0) {
      console.log(
        '✅ No programmes with Webflow images found. Migration complete!'
      );
      return;
    }

    // Process in batches
    const results = await processInBatches(
      programmesWithWebflowImages,
      CONFIG.CONCURRENCY_LIMIT,
      processProgramme
    );

    // Generate report
    generateMigrationReport(results);
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

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Programme Images Migration Script

This script:
1. Fetches existing programmes from the collection API
2. Identifies programmes with Webflow CDN images 
3. Downloads images from Webflow CDN
4. Uploads images to Google Cloud Storage bucket
5. Updates programmes with new bucket URLs via API

Usage:
  node scripts/migrate-programme-images.js              # Run the migration
  node scripts/migrate-programme-images.js --preview    # Preview what will be migrated
  node scripts/migrate-programme-images.js --help       # Show this help

Configuration:
  API URL: ${CONFIG.API_BASE_URL}/collection-items
  Bucket: ${CONFIG.BUCKET_NAME}
  CDN: ${CONFIG.CDN_BASE_URL}
  
Image Migration:
  - Detects Webflow CDN URLs (cdn.prod.website-files.com)
  - Downloads images and uploads to bucket
  - Uses path structure: website/collection/programme/{slug}/{filename}
  - Updates programme data with new bucket URLs via PATCH API
  - Preserves original image formats (SVG, JPG, PNG)

Image Fields Processed:
  - logoSvgDark.url
  - logoSvgLight.url  
  - heroSquare.url
  - heroWide.url
  `);
  process.exit(0);
}

// Run the migration
main();
