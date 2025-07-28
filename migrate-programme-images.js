#!/usr/bin/env node

/**
 * Programme Images Migration Script
 *
 * This script downloads programme images from Community Jameel API and uploads them to Google Cloud Storage
 * It also updates the Mnemo database with the new image URLs
 * Usage: node migrate-programme-images.js
 *
 * This script will:
 * 1. Fetch programmes from Community Jameel API
 * 2. Fetch programmes from Mnemo API
 * 3. Match programmes by slug/name
 * 4. Download missing images and upload to GCS
 * 5. Update Mnemo database via API
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
  CONCURRENCY_LIMIT: 3, // Process 3 images at a time (slower for programmes)
  TIMEOUT: 45000, // 45 seconds timeout for downloads
  MNEMO_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api',
  CJ_API_BASE: 'https://www.communityjameel.org/api'
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

function fetchData(url) {
  return new Promise((resolve, reject) => {
    const httpModule = url.startsWith('https') ? https : http;

    httpModule
      .get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(
              new Error(`Failed to parse JSON from ${url}: ${error.message}`)
            );
          }
        });

        response.on('error', reject);
      })
      .on('error', reject);
  });
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
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens
}

function normalizeForMatching(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function findMatchingProgramme(cjProgrammes, mnemoProg) {
  const mnemoTitle = mnemoProg.data?.title || mnemoProg.title || '';
  const mnemoSlug = mnemoProg.data?.slug || mnemoProg.slug || '';

  // Try exact slug match first
  let match = cjProgrammes.find((cj) => {
    const cjSlug = cj.slug || generateSlug(cj.name || '');
    return cjSlug === mnemoSlug;
  });

  if (match) return match;

  // Try normalized title match
  const normalizedMnemoTitle = normalizeForMatching(mnemoTitle);
  match = cjProgrammes.find((cj) => {
    const normalizedCjName = normalizeForMatching(cj.name || '');
    return normalizedCjName === normalizedMnemoTitle;
  });

  if (match) return match;

  // Try partial title match (for abbreviations like J-PAL)
  if (normalizedMnemoTitle.length > 3) {
    match = cjProgrammes.find((cj) => {
      const normalizedCjName = normalizeForMatching(cj.name || '');
      return (
        normalizedCjName.includes(normalizedMnemoTitle) ||
        normalizedMnemoTitle.includes(normalizedCjName)
      );
    });
  }

  return match;
}

async function updateMnemoProgramme(programmeId, imageData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      data: imageData
    });

    const options = {
      hostname: 'mnemo-app-e4f6j5kdsq-ew.a.run.app',
      port: 443,
      path: `/api/collection-items/${programmeId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
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
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (error) {
            resolve({ success: true, statusCode: res.statusCode });
          }
        } else {
          reject(new Error(`API error: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function processProgramme(mnemoProg, cjProgrammes, index, total) {
  const progTitle =
    mnemoProg.data?.title || mnemoProg.title || `programme-${index}`;
  const progSlug = mnemoProg.data?.slug || mnemoProg.slug;

  console.log(`\n🔄 Processing [${index + 1}/${total}]: ${progTitle}`);

  // Check if already has images
  const hasExistingImages =
    mnemoProg.data?.heroImage?.url ||
    mnemoProg.data?.thumbnail?.url ||
    mnemoProg.data?.heroSquare?.url ||
    mnemoProg.data?.heroWide?.url;

  if (hasExistingImages) {
    console.log(`  ✅ Already has images, skipping`);
    return {
      ...mnemoProg,
      migration: {
        status: 'skipped',
        reason: 'Already has images',
        originalUrls: null,
        newUrls: null
      }
    };
  }

  // Find matching CJ programme
  const matchingCJ = findMatchingProgramme(cjProgrammes, mnemoProg);

  if (!matchingCJ) {
    console.log(`  ⚠️  No matching CJ programme found`);
    return {
      ...mnemoProg,
      migration: {
        status: 'failed',
        reason: 'No matching CJ programme found',
        originalUrls: null,
        newUrls: null
      }
    };
  }

  console.log(`  🎯 Matched with CJ programme: ${matchingCJ.name}`);

  // Collect available images from CJ
  const imageFields = {
    heroSquare: matchingCJ.hero_image_square,
    heroWide: matchingCJ.hero_image_wide,
    heroImage: matchingCJ.hero_image,
    thumbnail: matchingCJ.hero_image_square // Use square as thumbnail fallback
  };

  const availableImages = Object.entries(imageFields).filter(
    ([key, url]) => url && url.trim()
  );

  if (availableImages.length === 0) {
    console.log(`  ⚠️  No images found in CJ programme`);
    return {
      ...mnemoProg,
      migration: {
        status: 'failed',
        reason: 'No images in CJ programme',
        originalUrls: null,
        newUrls: null
      }
    };
  }

  console.log(`  📸 Found ${availableImages.length} images to migrate`);

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

      const gcsPath = `website/collection/programme/${progSlug}/${fieldName}_${originalFilename}`;

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

        migratedImages[fieldName] = {
          url: newUrl,
          alt: `${progTitle} - ${fieldName}`
        };

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

    if (Object.keys(migratedImages).length === 0) {
      throw new Error('No images were successfully migrated');
    }

    // Update the programme data structure
    const updatedData = {
      ...mnemoProg.data,
      ...migratedImages
    };

    // Update via API
    console.log(`  📝 Updating programme in database...`);
    await updateMnemoProgramme(mnemoProg.id, updatedData);
    console.log(`  ✅ Database updated successfully`);

    return {
      ...mnemoProg,
      data: updatedData,
      migration: {
        status: 'success',
        originalUrls,
        newUrls,
        imagesCount: Object.keys(migratedImages).length,
        matchedWith: matchingCJ.name
      }
    };
  } catch (error) {
    console.error(`  ❌ Failed for ${progTitle}: ${error.message}`);
    return {
      ...mnemoProg,
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
  console.log('📊 PROGRAMME IMAGES MIGRATION REPORT');
  console.log('='.repeat(70));
  console.log(`Total processed: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⚠️  Skipped: ${skipped.length}`);

  if (successful.length > 0) {
    console.log('\n✅ SUCCESSFUL MIGRATIONS:');
    successful.forEach((item) => {
      const title = item.data?.title || item.title || 'Unknown';
      console.log(`  - ${title}`);
      console.log(`    Images: ${item.migration.imagesCount}`);
      console.log(`    Matched with: ${item.migration.matchedWith}`);
      Object.entries(item.migration.newUrls).forEach(([field, url]) => {
        console.log(`    ${field}: ${url.substring(0, 60)}...`);
      });
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED MIGRATIONS:');
    failed.forEach((item) => {
      const title = item.data?.title || item.title || 'Unknown';
      console.log(`  - ${title}: ${item.migration.reason}`);
    });
  }

  if (skipped.length > 0) {
    console.log('\n⚠️  SKIPPED PROGRAMMES:');
    skipped.forEach((item) => {
      const title = item.data?.title || item.title || 'Unknown';
      console.log(`  - ${title}: ${item.migration.reason}`);
    });
  }

  console.log('\n✨ Migration completed!');
  console.log('='.repeat(70));
}

async function main() {
  if (!process.env.PRIVATE_GCL) {
    console.error('❌ Error: PRIVATE_GCL environment variable is required');
    console.error('   Make sure your Google Cloud credentials are set up');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting programme images migration...');
    console.log(`☁️  Target bucket: ${CONFIG.BUCKET_NAME}`);
    console.log(`🌐 CDN base URL: ${CONFIG.CDN_BASE_URL}`);
    console.log(`⚡ Concurrency limit: ${CONFIG.CONCURRENCY_LIMIT}`);

    // Fetch data from both APIs
    console.log('\n📥 Fetching data from APIs...');

    console.log('  📊 Fetching Mnemo programmes...');
    const mnemoResponse = await fetchData(
      `${CONFIG.MNEMO_API_BASE}/collection-items`
    );
    const mnemoData = mnemoResponse.collectionItems || [];
    const mnemoProgrammes = mnemoData.filter(
      (item) => item.type === 'programme'
    );

    console.log('  🌐 Fetching Community Jameel programmes...');
    const cjProgrammes = await fetchData(`${CONFIG.CJ_API_BASE}/programmes`);

    console.log(`\n📊 Data loaded:`);
    console.log(`  - Mnemo programmes: ${mnemoProgrammes.length}`);
    console.log(
      `  - CJ programmes: ${Array.isArray(cjProgrammes) ? cjProgrammes.length : 'Invalid format'}`
    );

    if (!Array.isArray(cjProgrammes)) {
      throw new Error('Community Jameel API returned invalid format');
    }

    // Filter out programmes that already have images
    const programmesNeedingImages = mnemoProgrammes.filter((prog) => {
      const hasImages =
        prog.data?.heroImage?.url ||
        prog.data?.thumbnail?.url ||
        prog.data?.heroSquare?.url ||
        prog.data?.heroWide?.url;
      return !hasImages;
    });

    console.log(
      `  - Programmes needing images: ${programmesNeedingImages.length}`
    );

    if (programmesNeedingImages.length === 0) {
      console.log('🎉 All programmes already have images!');
      return;
    }

    // Process in batches
    const results = await processInBatches(
      programmesNeedingImages,
      CONFIG.CONCURRENCY_LIMIT,
      processProgramme,
      cjProgrammes
    );

    // Generate report
    generateMigrationReport(results);

    // Save detailed report
    const reportFile = './programme_migration_report.json';
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
    console.log(`📊 Detailed report saved: ${reportFile}`);

    const summary = {
      total: results.length,
      successful: results.filter((r) => r.migration?.status === 'success')
        .length,
      failed: results.filter((r) => r.migration?.status === 'failed').length,
      skipped: results.filter((r) => r.migration?.status === 'skipped').length,
      timestamp: new Date().toISOString()
    };

    const summaryFile = './programme_migration_summary.json';
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📋 Summary saved: ${summaryFile}`);
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
