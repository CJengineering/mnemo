#!/usr/bin/env node

/**
 * Test Image Migration Script
 * Tests the image migration functionality with a single image
 */

const https = require('https');
const http = require('http');

// Configuration
const BUCKET_UPLOAD_URL =
  'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/upload-image';

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
    const urlPath = new URL(url).pathname;
    return urlPath.split('/').pop() || 'image.jpg';
  } catch (error) {
    return 'image.jpg';
  }
}

/**
 * Download image from URL
 */
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client
      .get(url, (response) => {
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
      })
      .on('error', reject);
  });
}

/**
 * Upload image to bucket
 */
async function uploadImageToBucket(imageBuffer, slug, filename) {
  try {
    console.log(`📤 Uploading ${filename} to bucket under /${slug}/`);

    // Create FormData for multipart upload matching the existing API
    const formData = new FormData();
    const blob = new Blob([imageBuffer]);
    formData.append('file', blob, filename);
    formData.append('fileName', filename);
    formData.append('folder', slug); // This will create the /[slug]/ folder structure

    const response = await fetch(BUCKET_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();
    const newUrl = result.url;

    console.log(`✅ Uploaded ${filename} -> ${newUrl}`);
    return newUrl;
  } catch (error) {
    console.error(`❌ Failed to upload ${filename}:`, error.message);
    return null;
  }
}

/**
 * Test image migration
 */
async function testImageMigration() {
  console.log('🧪 Testing image migration...\n');

  // Test image from Webflow CDN
  const testUrl =
    'https://cdn.prod.website-files.com/612cede33b271d1b5bac6200/66f426d7b5bbb4111caa5a53_ANKUR_DSC01907%201-2.jpg';
  const testSlug = 'test-programme';

  try {
    console.log(`📥 Downloading test image: ${testUrl}`);
    const imageBuffer = await downloadImage(testUrl);
    console.log(`✅ Downloaded ${imageBuffer.length} bytes`);

    const filename = getFilenameFromUrl(testUrl);
    console.log(`📁 Extracted filename: ${filename}`);

    const newUrl = await uploadImageToBucket(imageBuffer, testSlug, filename);

    if (newUrl) {
      console.log(`\n🎉 Image migration test successful!`);
      console.log(`Original: ${testUrl}`);
      console.log(`New URL: ${newUrl}`);
    } else {
      console.log(`\n❌ Image migration test failed!`);
    }
  } catch (error) {
    console.error(`\n💥 Test failed:`, error.message);
  }
}

// Run the test
testImageMigration();
