#!/usr/bin/env node

/**
 * Programme Collection Seed Script
 *
 * This script populates the programmes collection with live data from the Community Jameel API
 * It maps the programme data structure to the expected webflow programme form API format
 * and handles image migration from Webflow CDN to your bucket with /[slug] path structure
 *
 * Usage:
 *   node scripts/seed-programmes.js              # Run the seeding process
 *   node scripts/seed-programmes.js --preview    # Preview data transformation
 *   node scripts/seed-programmes.js --help       # Show help
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const FormData = require('form-data'); // Use form-data package for Node.js

// Configuration
const API_URL =
  'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/collection-items';
const LIVE_PROGRAMMES_API = 'https://www.communityjameel.org/api/programmes';
const BUCKET_UPLOAD_URL = 'http://localhost:3001/api/upload-image'; // Local bucket upload endpoint

/**
 * Fetch programme data from live Community Jameel API
 */
async function loadProgrammeData() {
  try {
    console.log('📡 Fetching live programme data from:', LIVE_PROGRAMMES_API);

    const response = await fetch(LIVE_PROGRAMMES_API);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const programmeData = data.rows || [];

    console.log(`✅ Loaded ${programmeData.length} programmes from live API`);
    return programmeData;
  } catch (error) {
    console.error('❌ Failed to fetch programme data:', error.message);
    throw error;
  }
}

/**
 * Check if URL is a Webflow CDN URL
 */
function isWebflowCDN(url) {
  return url && url.includes('cdn.prod.website-files.com');
}

/**
 * Extract filename from URL
 */
function getFilenameFromUrl(url) {
  try {
    const urlParts = new URL(url);
    const pathname = urlParts.pathname;
    return pathname.split('/').pop() || 'image.jpg';
  } catch {
    return 'image.jpg';
  }
}

/**
 * Download image from URL
 */
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;

    client
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      })
      .on('error', reject);
  });
}

/**
 * Upload image to your bucket with website/programmes/[slug]/ path structure
 */
async function uploadImageToBucket(imageBuffer, slug, filename) {
  try {
    console.log(
      `📤 Uploading ${filename} to bucket under website/programmes/${slug}/`
    );

    // Create FormData for multipart upload using form-data package
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: filename,
      contentType: 'application/octet-stream'
    });
    formData.append('fileName', filename);
    formData.append('folder', slug); // This will create the website/programmes/[slug]/ folder structure
    formData.append('preserveFormat', 'true'); // Preserve original format (svg, jpg, png, etc.)

    // Use the form-data package's built-in submit method for Node.js
    return new Promise((resolve, reject) => {
      formData.submit(BUCKET_UPLOAD_URL, (err, res) => {
        if (err) {
          console.error(`❌ Failed to upload ${filename}:`, err.message);
          resolve(null);
          return;
        }

        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              console.error(
                `❌ Upload failed with status ${res.statusCode}: ${responseBody}`
              );
              resolve(null);
              return;
            }

            const result = JSON.parse(responseBody);
            const newUrl = result.url;

            console.log(`✅ Uploaded ${filename} -> ${newUrl}`);
            resolve(newUrl);
          } catch (parseError) {
            console.error(
              `❌ Failed to parse response for ${filename}:`,
              parseError.message
            );
            resolve(null);
          }
        });

        res.on('error', (error) => {
          console.error(`❌ Response error for ${filename}:`, error.message);
          resolve(null);
        });
      });
    });
  } catch (error) {
    console.error(`❌ Failed to upload ${filename}:`, error.message);
    return null;
  }
}

/**
 * Migrate image from Webflow CDN to your bucket
 */
async function migrateImage(url, slug) {
  if (!isWebflowCDN(url)) {
    console.log(`⏭️ Skipping non-Webflow URL: ${url}`);
    return url; // Return original URL if not Webflow CDN
  }

  try {
    console.log(`🔄 Migrating Webflow CDN image: ${url}`);

    const filename = getFilenameFromUrl(url);
    console.log(`📁 Extracted filename: ${filename}`);

    const imageBuffer = await downloadImage(url);
    console.log(`⬇️ Downloaded ${filename} (${imageBuffer.length} bytes)`);

    const newUrl = await uploadImageToBucket(imageBuffer, slug, filename);

    if (newUrl && newUrl !== url) {
      console.log(`🔄 URL migrated: ${url} -> ${newUrl}`);
      return newUrl;
    } else {
      console.log(`⚠️ Upload failed, using original URL: ${url}`);
      return url;
    }
  } catch (error) {
    console.error(`❌ Failed to migrate image ${url}:`, error.message);
    return url; // Return original URL on failure
  }
}

/**
 * Migrate all images in an image object
 */
async function migrateImageObject(imageObj, slug) {
  if (!imageObj || !imageObj.url) return imageObj;

  const migratedUrl = await migrateImage(imageObj.url, slug);
  return {
    ...imageObj,
    url: migratedUrl
  };
}

/**
 * Transform programme data from live API format to webflow API format
 */
async function transformProgrammeData(programmeData) {
  const transformedData = [];

  for (const [index, programme] of programmeData.entries()) {
    const fieldData = programme.field_data;
    const programmeName = fieldData.name || `Programme ${index + 1}`;
    const programmeSlug = fieldData.slug || `programme-${index + 1}`;

    console.log(
      `🔄 Processing programme ${index + 1}/${programmeData.length}: ${programmeName}`
    );

    // Migrate all image fields from Webflow CDN
    const migratedCard = await migrateImageObject(
      fieldData.card,
      programmeSlug
    );
    const migratedHero = await migrateImageObject(
      fieldData.hero,
      programmeSlug
    );
    const migratedOpenGraph = await migrateImageObject(
      fieldData.openGraph,
      programmeSlug
    );
    const migratedLogoSvgDark = await migrateImageObject(
      fieldData.logoSvgDark,
      programmeSlug
    );
    const migratedLogoSvgOriginalRatio = await migrateImageObject(
      fieldData.logoSvgOriginalRatio,
      programmeSlug
    );
    const migratedLogoSvgSquareOverlay = await migrateImageObject(
      fieldData.logoSvgSquareOverlay,
      programmeSlug
    );
    const migratedLogoSvgLightOriginalRatio = await migrateImageObject(
      fieldData.logoSvgLightOriginalRatio,
      programmeSlug
    );

    // Create the transformed data structure matching IncomingProgrammeData interface
    const transformedProgramme = {
      // Core fields required by API
      type: 'programme',
      status: 'published',
      slug: programmeSlug,
      title: programmeName,

      // Data object containing all programme-specific fields
      data: {
        // Basic info
        title: programmeName,
        slug: programmeSlug,
        status: 'published',
        description: fieldData.byline || '',
        nameArabic: fieldData.nameArabic || '',
        shortNameEnglish: fieldData.shortname || '',
        shortNameArabic: fieldData.shortNameArabic || '',

        // Mission and summary content
        missionEnglish: fieldData.text || '',
        missionArabic: fieldData.bylineArabic || '',
        summaryEnglish: fieldData.summaryLongEnglish || '',
        summaryArabic: fieldData.summaryLongArabic || '',

        // Research fields
        researchEnglish: fieldData.fieldEnglishResearch || '',
        researchArabic: fieldData.fieldArabicResearch || '',

        // Timeline
        yearEstablished: fieldData.yearEstablished || null,
        yearClosed: fieldData.yearClosed
          ? parseInt(fieldData.yearClosed)
          : null,

        // Location
        headquartersEnglish: fieldData.headquartersEnglish || '',
        headquartersArabic: fieldData.headquartersArabic || '',
        longitude: fieldData.longitude || '',
        latitude: fieldData.latitude || '',

        // Images (migrated from Webflow CDN)
        logoSvgDark: migratedLogoSvgDark,
        logoSvgLight: migratedLogoSvgLightOriginalRatio,
        heroSquare: migratedCard,
        heroWide: migratedHero,

        // Social links
        website: fieldData.website || '',
        linkedin: fieldData.linkedin || '',
        instagram: fieldData.instagram || '',
        twitter: fieldData.twitter || '',
        facebook: fieldData.facebook || '',
        youtube: fieldData.youtube || '',

        // Relations (transform arrays to reference format expected by API)
        partners:
          fieldData.partners?.map((partner) => ({
            id: partner.slug || partner.name,
            slug:
              partner.slug || partner.name.toLowerCase().replace(/\s+/g, '-')
          })) || [],
        leadership:
          fieldData.leadership?.map((leader) => ({
            id: leader.slug || leader.name,
            slug: leader.slug || leader.name.toLowerCase().replace(/\s+/g, '-')
          })) || [],
        relatedProgrammes:
          fieldData.relatedProgrammes?.map((rel) => ({
            id: rel.slug || rel.name,
            slug: rel.slug || rel.name.toLowerCase().replace(/\s+/g, '-')
          })) || [],

        // Impact metrics (map impact01-06 fields)
        impact01: fieldData.impact01 || '',
        impact02: fieldData.impact02 || '',
        impact03: fieldData.impact03 || '',
        impact04: fieldData.impact04 || '',
        impact05: fieldData.impact05 || '',
        impact06: fieldData.impact06 || '',
        impact01Title: fieldData.impact01Title || '',
        impact02Title: fieldData.impact02Title || '',
        impact03Title: fieldData.impact03Title || '',
        impact04Title: fieldData.impact04Title || '',
        impact05Title: fieldData.impact05Title || '',
        impact06Title: fieldData.impact06Title || '',
        impact01TitleArabic: fieldData.impact01TitleArabic || '',
        impact02TitleArabic: fieldData.impact02TitleArabic || '',
        impact03TitleArabic: fieldData.impact03TitleArabic || '',
        impact04TitleArabic: fieldData.impact04TitleArabic || '',
        impact05TitleArabic: fieldData.impact05TitleArabic || '',
        impact06TitleArabic: fieldData.impact06TitleArabic || '',

        // Flags
        lab: fieldData.type === 'Lab',
        pushToGR: fieldData.pushToGr === 'true' || fieldData.pushToGr === true,
        order: fieldData.order ? parseInt(fieldData.order) : index + 1,

        // Additional metadata
        buttonText: fieldData.buttonText || '',
        linkToPage: fieldData.linkToPage || '',
        colour: fieldData.colour || '',
        features: fieldData.features || []
      }
    };

    transformedData.push(transformedProgramme);

    // Small delay to avoid overwhelming the image migration
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return transformedData;
}

/**
 * Send a single programme to the API
 */
async function createProgramme(programmeData) {
  try {
    console.log(`📤 Creating programme: ${programmeData.data.title}`);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(programmeData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`
      );
    }

    const result = await response.json();
    console.log(
      `✅ Successfully created: ${programmeData.data.title} (ID: ${result.collectionItem?.id})`
    );

    return result;
  } catch (error) {
    console.error(
      `❌ Failed to create ${programmeData.data.title}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Check if programme already exists by slug
 */
async function checkIfExists(slug) {
  try {
    const response = await fetch(`${API_URL}?type=programme`);
    if (!response.ok) return false;

    const data = await response.json();
    const existingItems = data.collectionItems || [];

    return existingItems.some((item) => item.slug === slug);
  } catch (error) {
    console.warn(`⚠️ Could not check if ${slug} exists:`, error.message);
    return false;
  }
}

/**
 * Main seeding function
 */
async function seedProgrammes() {
  console.log(
    '🌱 Starting programme collection seeding with image migration (TESTING: first 5 programmes only)...\n'
  );

  try {
    // Load programme data from live API
    const rawProgrammeData = await loadProgrammeData();

    // TEST MODE: Only process first 5 programmes
    const testData = rawProgrammeData.slice(0, 5);
    console.log(
      `🧪 TEST MODE: Processing only ${testData.length} programmes instead of ${rawProgrammeData.length}`
    );

    // Transform data (includes image migration)
    console.log(
      '🔄 Transforming programme data to API format and migrating images...'
    );
    const transformedData = await transformProgrammeData(testData);

    console.log('📊 Sample transformed data structure:');
    console.log(JSON.stringify(transformedData[0], null, 2));
    console.log('\n');

    // Seed each programme
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const programmeData of transformedData) {
      try {
        // Check if already exists
        const exists = await checkIfExists(programmeData.slug);
        if (exists) {
          console.log(
            `⏭️ Skipping ${programmeData.data.title} (already exists)`
          );
          skipped++;
          continue;
        }

        // Create new programme
        await createProgramme(programmeData);
        created++;

        // Small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(
          `💥 Error processing ${programmeData.data.title}:`,
          error.message
        );
        failed++;
      }
    }

    // Summary
    console.log('\n📈 Seeding Summary:');
    console.log(`✅ Created: ${created}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total processed: ${created + skipped + failed}`);

    if (failed > 0) {
      console.log(
        '\n⚠️ Some programmes failed to be created. Check the errors above.'
      );
      process.exit(1);
    } else {
      console.log('\n🎉 Programme collection seeding completed successfully!');
    }
  } catch (error) {
    console.error('💥 Fatal error during seeding:', error.message);
    process.exit(1);
  }
}

/**
 * Utility function to preview data transformation without actually seeding
 */
async function previewTransformation() {
  console.log(
    '👁️ Preview Mode: Showing data transformation and image migration...\n'
  );

  const rawProgrammeData = await loadProgrammeData();
  const firstTwo = rawProgrammeData.slice(0, 2);

  console.log('📋 Raw data (first entry):');
  console.log(JSON.stringify(rawProgrammeData[0], null, 2));

  console.log(
    '\n🔄 Transforming first 2 entries (with simulated image migration)...'
  );
  const transformedData = await transformProgrammeData(firstTwo);

  console.log('\n📊 Transformed data (first entry):');
  console.log(JSON.stringify(transformedData[0], null, 2));

  console.log(`\n📊 Total entries to be processed: ${rawProgrammeData.length}`);

  // Count Webflow CDN images
  let webflowImageCount = 0;
  rawProgrammeData.forEach((programme) => {
    const fieldData = programme.field_data;
    [
      'card',
      'hero',
      'openGraph',
      'logoSvgDark',
      'logoSvgOriginalRatio',
      'logoSvgSquareOverlay',
      'logoSvgLightOriginalRatio'
    ].forEach((field) => {
      if (fieldData[field]?.url && isWebflowCDN(fieldData[field].url)) {
        webflowImageCount++;
      }
    });
  });

  console.log(`🖼️ Images to migrate from Webflow CDN: ${webflowImageCount}`);
}

// Command line handling
const args = process.argv.slice(2);

if (args.includes('--preview') || args.includes('-p')) {
  previewTransformation().catch((error) => {
    console.error('❌ Preview failed:', error.message);
    process.exit(1);
  });
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Programme Collection Seed Script

This script:
1. Loads programme data from live Community Jameel API (${LIVE_PROGRAMMES_API})
2. Migrates images from Webflow CDN to your bucket with /{slug}/ path structure  
3. Transforms data to match the programme collection API format
4. Seeds the programmes collection via external API

Usage:
  node scripts/seed-programmes.js              # Run the seeding process
  node scripts/seed-programmes.js --preview    # Preview data transformation
  node scripts/seed-programmes.js --help       # Show this help

Options:
  -p, --preview    Preview the data transformation and image migration
  -h, --help       Show this help message

Configuration:
  API URL: ${API_URL}
  Live programmes API: ${LIVE_PROGRAMMES_API}
  Bucket upload: ${BUCKET_UPLOAD_URL}

Image Migration:
  - Detects Webflow CDN URLs (cdn.prod.website-files.com)
  - Downloads images and uploads to your bucket
  - Uses path structure: /{slug}/{filename}
  - Updates URLs in the data to point to your bucket
  `);
} else {
  // Run the seeding process
  seedProgrammes().catch((error) => {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  });
}
