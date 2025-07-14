#!/usr/bin/env node

/**
 * Team Images Migration Script
 *
 * This script downloads team images from Webflow CDN and uploads them to Google Cloud Storage
 * Usage: node migrate-team-images.js [path-to-team-data.json]
 *
 * Example: node migrate-team-images.js ./rawDataTeams.json
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
  CONCURRENCY_LIMIT: 5, // Process 5 images at a time
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
      // Remove public: true since uniform bucket-level access is enabled
      // Files will be accessible via CDN if bucket is configured for public access
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

async function processTeamMember(member, index, total) {
  const memberName = member.fieldData?.name || member.name || `member-${index}`;
  const originalSlug = member.fieldData?.slug;
  const slug = originalSlug || generateSlug(memberName);

  console.log(`\n🔄 Processing [${index + 1}/${total}]: ${memberName}`);

  // Check for image URL in the correct field path
  const originalUrl =
    member.fieldData?.photo?.url ||
    member.fieldData?.image_url ||
    member.imageUrl;

  if (!originalUrl) {
    console.log(`⚠️  No image URL found for ${memberName}`);
    return {
      ...member,
      migration: {
        status: 'skipped',
        reason: 'No image URL',
        originalUrl: null,
        newUrl: null
      }
    };
  }

  const originalFilename = getOriginalFilename(originalUrl);

  if (!originalFilename) {
    console.log(`⚠️  Could not extract filename from URL: ${originalUrl}`);
    return {
      ...member,
      migration: {
        status: 'failed',
        reason: 'Invalid URL format',
        originalUrl,
        newUrl: null
      }
    };
  }

  const gcsPath = `website/collection/team/${slug}/${originalFilename}`;
  const newUrl = `${CONFIG.CDN_BASE_URL}/${gcsPath}`;

  try {
    console.log(`  📥 Downloading: ${originalUrl}`);
    const imageBuffer = await downloadImage(originalUrl);
    console.log(`  📤 Uploading to: ${gcsPath}`);
    await uploadToGCS(imageBuffer, originalFilename, gcsPath);
    console.log(`  ✅ Success: ${newUrl}`);

    // Update the correct field path based on the original structure
    const updatedMember = { ...member };
    if (member.fieldData?.photo?.url) {
      updatedMember.fieldData = {
        ...member.fieldData,
        photo: {
          ...member.fieldData.photo,
          url: newUrl
        }
      };
    } else if (member.fieldData?.image_url) {
      updatedMember.fieldData = {
        ...member.fieldData,
        image_url: newUrl
      };
    } else if (member.imageUrl) {
      // Handle v2 format with direct imageUrl field
      updatedMember.imageUrl = newUrl;
    }

    return {
      ...updatedMember,
      migration: {
        status: 'success',
        originalUrl,
        newUrl,
        gcsPath,
        fileSize: imageBuffer.length
      }
    };
  } catch (error) {
    console.error(`  ❌ Failed for ${memberName}: ${error.message}`);
    return {
      ...member,
      migration: {
        status: 'failed',
        reason: error.message,
        originalUrl,
        newUrl: null
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
      await sleep(1000);
    }
  }

  return results;
}

function generateMigrationReport(results) {
  const successful = results.filter((r) => r.migration?.status === 'success');
  const failed = results.filter((r) => r.migration?.status === 'failed');
  const skipped = results.filter((r) => r.migration?.status === 'skipped');

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION REPORT');
  console.log('='.repeat(60));
  console.log(`Total processed: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⚠️  Skipped: ${skipped.length}`);

  if (failed.length > 0) {
    console.log('\n❌ FAILED MIGRATIONS:');
    failed.forEach((item) => {
      const name = item.fieldData?.name || item.name || 'Unknown';
      console.log(`  - ${name}: ${item.migration.reason}`);
      if (item.migration.originalUrl) {
        console.log(`    Original: ${item.migration.originalUrl}`);
      }
    });
  }

  if (skipped.length > 0) {
    console.log('\n⚠️  SKIPPED ITEMS:');
    skipped.forEach((item) => {
      const name = item.fieldData?.name || item.name || 'Unknown';
      console.log(`  - ${name}: ${item.migration.reason}`);
    });
  }

  console.log('\n✨ Migration completed!');
  console.log('='.repeat(60));
}

async function loadTeamData(inputFile) {
  const fileExtension = path.extname(inputFile).toLowerCase();

  if (fileExtension === '.json') {
    // Handle JSON files
    const content = fs.readFileSync(inputFile, 'utf8');
    return JSON.parse(content);
  } else if (fileExtension === '.ts' || fileExtension === '.js') {
    // Handle TypeScript/JavaScript files with exported constants
    const content = fs.readFileSync(inputFile, 'utf8');

    // Extract the array from export const rawDataTeams = [...]
    const exportMatch = content.match(
      /export\s+const\s+\w+\s*=\s*(\[[\s\S]*?\]);?\s*$/m
    );
    if (exportMatch) {
      // Use eval to parse the array (be careful with this in production)
      // For safety, we could use a more sophisticated parser, but for this script it's acceptable
      const arrayString = exportMatch[1];
      return eval(arrayString);
    } else {
      throw new Error(
        'Could not find exported array in TypeScript/JavaScript file'
      );
    }
  } else {
    throw new Error(
      'Unsupported file format. Please use .json, .ts, or .js files'
    );
  }
}

async function main() {
  const inputFile = process.argv[2];

  if (!inputFile) {
    console.error('❌ Usage: node migrate-team-images.js <path-to-team-data>');
    console.error(
      '   Example: node migrate-team-images.js ./rawDataTeams.json'
    );
    console.error(
      '   Example: node migrate-team-images.js ./test/database/fake_team_for_test.ts'
    );
    process.exit(1);
  }

  if (!process.env.PRIVATE_GCL) {
    console.error('❌ Error: PRIVATE_GCL environment variable is required');
    console.error('   Make sure your Google Cloud credentials are set up');
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    console.log('🚀 Starting team images migration...');
    console.log(`📂 Input file: ${inputFile}`);
    console.log(`☁️  Target bucket: ${CONFIG.BUCKET_NAME}`);
    console.log(`🌐 CDN base URL: ${CONFIG.CDN_BASE_URL}`);
    console.log(`⚡ Concurrency limit: ${CONFIG.CONCURRENCY_LIMIT}`);

    // Load team data (supports both JSON and TS/JS files)
    const teamData = await loadTeamData(inputFile);
    console.log(`📋 Loaded ${teamData.length} team members`);

    // Process in batches
    const results = await processInBatches(
      teamData,
      CONFIG.CONCURRENCY_LIMIT,
      processTeamMember
    );

    // Generate report
    generateMigrationReport(results);

    // Save updated data
    const outputFile = inputFile.replace(/\.(json|ts|js)$/, '_migrated.json');
    const backupFile = inputFile.replace(/\.(json|ts|js)$/, '_backup$1');

    // Create backup
    fs.copyFileSync(inputFile, backupFile);
    console.log(`💾 Backup created: ${backupFile}`);

    // Save migrated data (clean version without migration metadata)
    const cleanResults = results.map(({ migration, ...item }) => item);
    fs.writeFileSync(outputFile, JSON.stringify(cleanResults, null, 2));
    console.log(`📝 Migrated data saved: ${outputFile}`);

    // Save detailed report
    const reportFile = inputFile.replace(
      /\.(json|ts|js)$/,
      '_migration_report.json'
    );
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
    console.log(`📊 Detailed report saved: ${reportFile}`);
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
