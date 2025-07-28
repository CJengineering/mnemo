#!/usr/bin/env node

/**
 * Sync Programme Images Script
 *
 * This script compares programmes between Community Jameel API and Mnemo API
 * and syncs missing images from Community Jameel to Mnemo
 *
 * Usage: node sync-programme-images.js [--dry-run]
 */

const { Storage } = require('@google-cloud/storage');
const https = require('https');
const http = require('http');
const path = require('path');
const url = require('url');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONFIG = {
  GOOGLE_CLOUD_PROJECT_ID: 'cj-tech-381914',
  BUCKET_NAME: 'mnemo',
  CDN_BASE_URL: 'https://cdn.communityjameel.io',
  CONCURRENCY_LIMIT: 3,
  TIMEOUT: 30000,
  CJ_API_URL: 'https://www.communityjameel.org/api/programmes',
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

// Check if this is a dry run
const isDryRun = process.argv.includes('--dry-run');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

// Download image from URL
function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;

    const timeout = setTimeout(() => {
      reject(new Error(`Download timeout after ${CONFIG.TIMEOUT}ms`));
    }, CONFIG.TIMEOUT);

    protocol
      .get(imageUrl, (res) => {
        clearTimeout(timeout);

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

// Upload image to Google Cloud Storage
async function uploadImageToGCS(imageBuffer, fileName) {
  const file = bucket.file(fileName);

  await file.save(imageBuffer, {
    metadata: {
      contentType: getContentType(fileName),
      cacheControl: 'public, max-age=31536000' // 1 year cache
    }
  });

  return `${CONFIG.CDN_BASE_URL}/${fileName}`;
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

// Generate filename from original URL
function generateFileName(originalUrl, programmeSlug, imageType) {
  const ext = path.extname(new URL(originalUrl).pathname) || '.jpg';
  return `website/collection/programme/${programmeSlug}/${imageType}${ext}`;
}

// Match programmes by slug or name
function findMatchingProgramme(mnemoProgramme, cjProgrammes) {
  const mnemoSlug = mnemoProgramme.slug;
  const mnemoName = mnemoProgramme.title;

  if (!mnemoSlug && !mnemoName) return null;

  // First try exact slug match
  if (mnemoSlug) {
    const exactMatch = cjProgrammes.find(
      (cj) => cj.slug === mnemoSlug || cj.field_data?.slug === mnemoSlug
    );
    if (exactMatch) return exactMatch;
  }

  // Then try name matching (case insensitive)
  if (mnemoName) {
    const nameMatch = cjProgrammes.find((cj) => {
      const cjName = cj.field_data?.name || cj.name;
      return cjName && cjName.toLowerCase() === mnemoName.toLowerCase();
    });
    if (nameMatch) return nameMatch;
  }

  // Finally try partial matching
  if (mnemoName) {
    const partialMatch = cjProgrammes.find((cj) => {
      const cjName = cj.field_data?.name || cj.name;
      return (
        cjName &&
        (cjName.toLowerCase().includes(mnemoName.toLowerCase()) ||
          mnemoName.toLowerCase().includes(cjName.toLowerCase()))
      );
    });
    if (partialMatch) return partialMatch;
  }

  return null;
}

// Update programme in Mnemo API
async function updateMnemoProgramme(programmeId, updateData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(updateData);
    const options = {
      hostname: 'mnemo-app-e4f6j5kdsq-ew.a.run.app',
      port: 443,
      path: `/api/collection-items/${programmeId}`,
      method: 'PUT', // Use PUT as expected by the API
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
            resolve(JSON.parse(responseData));
          } catch (parseError) {
            resolve({ success: true }); // Some APIs return non-JSON success responses
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

// Process a single programme
async function processProgramme(mnemoProgramme, cjProgramme) {
  const programmeName = mnemoProgramme.title || 'Unknown';
  const programmeSlug = mnemoProgramme.slug || 'unknown';

  console.log(`\n🔄 Processing: ${programmeName}`);
  console.log(`   Mnemo ID: ${mnemoProgramme.id}`);
  console.log(`   CJ Slug: ${cjProgramme.slug}`);

  // Map Community Jameel image fields to Mnemo image fields
  const imageMapping = {
    heroSquare: cjProgramme.field_data?.card, // card maps to heroSquare
    heroWide: cjProgramme.field_data?.hero, // hero maps to heroWide
    heroImage: cjProgramme.field_data?.hero, // hero also maps to heroImage
    thumbnail: cjProgramme.field_data?.card // card also maps to thumbnail
  };

  const updates = {};
  let hasUpdates = false;

  for (const [mnemoImageType, cjImage] of Object.entries(imageMapping)) {
    const mnemoImage = mnemoProgramme.data?.[mnemoImageType];

    // Check if Mnemo is missing this image type but CJ has it
    if (!mnemoImage?.url && cjImage?.url) {
      console.log(`   📸 Missing ${mnemoImageType}, will sync from CJ`);

      if (!isDryRun) {
        try {
          // Download image from CJ
          console.log(`      ⬇️  Downloading ${mnemoImageType}...`);
          const imageBuffer = await downloadImage(cjImage.url);

          // Upload to GCS
          const fileName = generateFileName(
            cjImage.url,
            programmeSlug,
            mnemoImageType
          );
          console.log(`      ⬆️  Uploading to: ${fileName}`);
          const newUrl = await uploadImageToGCS(imageBuffer, fileName);

          // Prepare update
          updates[mnemoImageType] = {
            url: newUrl,
            alt: cjImage.alt || `${programmeName} ${mnemoImageType}`,
            width: cjImage.width || null,
            height: cjImage.height || null
          };

          hasUpdates = true;
          console.log(`      ✅ Synced ${mnemoImageType}: ${newUrl}`);

          // Small delay to avoid overwhelming servers
          await sleep(1000);
        } catch (error) {
          console.log(
            `      ❌ Failed to sync ${mnemoImageType}: ${error.message}`
          );
        }
      } else {
        console.log(
          `      🔍 [DRY RUN] Would sync ${mnemoImageType} from: ${cjImage.url}`
        );
        hasUpdates = true;
      }
    } else if (mnemoImage?.url) {
      console.log(`   ✅ Already has ${mnemoImageType}`);
    }
  }

  // Update Mnemo if we have changes
  if (hasUpdates && !isDryRun) {
    try {
      console.log(`   📝 Updating Mnemo programme...`);

      // Create a full update payload as expected by the API
      const updatePayload = {
        type: mnemoProgramme.type,
        status: mnemoProgramme.status || 'published',
        slug: mnemoProgramme.slug,
        title: mnemoProgramme.title,
        data: {
          ...mnemoProgramme.data, // Preserve all existing data
          ...updates // Add the new image fields
        }
      };

      await updateMnemoProgramme(mnemoProgramme.id, updatePayload);
      console.log(`   ✅ Successfully updated programme`);
    } catch (error) {
      console.log(`   ❌ Failed to update programme: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  return {
    success: true,
    updatedImages: Object.keys(updates),
    programmeName,
    programmeId: mnemoProgramme.id
  };
}

// Main function
async function main() {
  console.log('🚀 Starting programme images sync...');
  console.log(`📊 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
  console.log(`🌐 CJ API: ${CONFIG.CJ_API_URL}`);
  console.log(`📡 Mnemo API: ${CONFIG.MNEMO_API_URL}`);

  try {
    // Fetch data from both APIs
    console.log('\n📥 Fetching data from APIs...');

    console.log('  🌐 Fetching Community Jameel programmes...');
    const cjData = await fetchData(CONFIG.CJ_API_URL);
    const cjProgrammes = cjData.rows || [];

    console.log('  📡 Fetching Mnemo programmes...');
    const mnemoResponse = await fetchData(CONFIG.MNEMO_API_URL);
    const mnemoData = mnemoResponse.collectionItems || [];
    const mnemoProgrammes = mnemoData.filter(
      (item) => item.type === 'programme'
    );

    console.log(`\n📊 Data loaded:`);
    console.log(`  - Community Jameel programmes: ${cjProgrammes.length}`);
    console.log(`  - Mnemo programmes: ${mnemoProgrammes.length}`);

    if (cjProgrammes.length === 0) {
      console.log('❌ No programmes found in Community Jameel API');
      return;
    }

    // Find programmes that need image sync
    const programmesToSync = [];

    console.log('\n🔍 Matching programmes and checking for missing images...');

    for (const mnemoProgramme of mnemoProgrammes) {
      const matchingCJ = findMatchingProgramme(mnemoProgramme, cjProgrammes);

      if (matchingCJ) {
        // Check if any images are missing in Mnemo but present in CJ
        const imageMapping = {
          heroSquare: matchingCJ.field_data?.card,
          heroWide: matchingCJ.field_data?.hero,
          heroImage: matchingCJ.field_data?.hero,
          thumbnail: matchingCJ.field_data?.card
        };

        const hasMissingImages = Object.entries(imageMapping).some(
          ([mnemoType, cjImage]) =>
            !mnemoProgramme.data?.[mnemoType]?.url && cjImage?.url
        );

        if (hasMissingImages) {
          programmesToSync.push({ mnemo: mnemoProgramme, cj: matchingCJ });
        }
      } else {
        console.log(
          `⚠️  No match found for: ${mnemoProgramme.title || 'Unknown'}`
        );
      }
    }

    console.log(
      `\n📊 Found ${programmesToSync.length} programmes that need image sync`
    );

    if (programmesToSync.length === 0) {
      console.log('🎉 All programmes already have their images synced!');
      return;
    }

    // Process programmes
    const results = [];
    for (let i = 0; i < programmesToSync.length; i++) {
      const { mnemo, cj } = programmesToSync[i];
      console.log(`\n📊 Progress: ${i + 1}/${programmesToSync.length}`);

      const result = await processProgramme(mnemo, cj);
      results.push(result);

      // Delay between programmes to avoid overwhelming APIs
      if (i < programmesToSync.length - 1) {
        await sleep(2000);
      }
    }

    // Summary
    console.log('\n📊 SYNC SUMMARY');
    console.log('===============');

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(`✅ Successfully processed: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (successful.length > 0) {
      console.log('\n✅ Successfully synced programmes:');
      successful.forEach((result) => {
        console.log(
          `  - ${result.programmeName}: ${result.updatedImages?.join(', ') || 'no updates'}`
        );
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed programmes:');
      failed.forEach((result) => {
        console.log(`  - ${result.programmeName}: ${result.error}`);
      });
    }

    if (isDryRun) {
      console.log(
        '\n🔍 This was a DRY RUN. Run without --dry-run to perform actual sync.'
      );
    } else {
      console.log('\n🎉 Sync completed!');
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
