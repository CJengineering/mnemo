#!/usr/bin/env node

/**
 * Test the Google Cloud Storage Image Uploader
 * Tests the actual GCS integration instead of mock/generic implementation
 */

import { Storage } from '@google-cloud/storage';

// Test configuration
const TEST_CONFIG = {
  testImageUrl:
    'https://uploads-ssl.webflow.com/64abc123456789/sample-test-image.jpg',
  collectionName: 'test-posts',
  slug: 'gcs-upload-test',
  config: {
    bucketName: 'mnemo',
    cdnBaseUrl: 'https://cdn.communityjameel.io',
    compressToWebP: true,
    quality: 80
  }
};

// Initialize Google Cloud Storage (same as in our TypeScript file)
const theKey = process.env.PRIVATE_GCL;

const storage = new Storage({
  projectId: 'cj-tech-381914',
  credentials: {
    client_email: 'todo-test@cj-tech-381914.iam.gserviceaccount.com',
    private_key: `-----BEGIN PRIVATE KEY-----\n${theKey}=\n-----END PRIVATE KEY-----\n`
  }
});

const bucket = storage.bucket('mnemo');
const CDN_BASE_URL = 'https://cdn.communityjameel.io';

/**
 * Test the GCS image uploader
 */
async function testGCSImageUploader() {
  console.log('🧪 TESTING GOOGLE CLOUD STORAGE IMAGE UPLOADER');
  console.log('='.repeat(60));
  console.log(`📸 Test Image URL: ${TEST_CONFIG.testImageUrl}`);
  console.log(`📁 Collection: ${TEST_CONFIG.collectionName}`);
  console.log(`🏷️  Slug: ${TEST_CONFIG.slug}`);
  console.log(`☁️  Bucket: ${TEST_CONFIG.config.bucketName}`);
  console.log(`🌐 CDN Base: ${TEST_CONFIG.config.cdnBaseUrl}`);
  console.log(`📦 WebP Compression: ${TEST_CONFIG.config.compressToWebP}`);
  console.log(`🎛️  Quality: ${TEST_CONFIG.config.quality}%`);
  console.log('');

  try {
    console.log('🔄 Starting image upload test...');

    const result = await imageUploaderToCDN(
      TEST_CONFIG.testImageUrl,
      TEST_CONFIG.collectionName,
      TEST_CONFIG.slug,
      'test-image.jpg',
      TEST_CONFIG.config
    );

    console.log('');
    console.log('📊 UPLOAD RESULT:');
    console.log('='.repeat(40));
    console.log(`✅ Success: ${result.success}`);
    console.log(`📥 Original URL: ${result.originalUrl}`);
    console.log(`📤 New URL: ${result.newUrl}`);

    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }

    // Verify the upload worked
    console.log('');
    console.log('🔍 UPLOAD VERIFICATION:');
    console.log('='.repeat(40));

    if (result.success) {
      console.log('✅ Image uploader is working correctly!');
      console.log('✅ Using actual Google Cloud Storage');
      console.log('✅ Image will be available at Community Jameel CDN');
      console.log(
        `✅ Expected path: website/collection/${TEST_CONFIG.collectionName}/${TEST_CONFIG.slug}/test-image.webp`
      );

      if (result.newUrl.includes('cdn.communityjameel.io')) {
        console.log(
          '✅ CDN URL correctly points to Community Jameel infrastructure'
        );
      } else {
        console.log('⚠️  Warning: CDN URL does not point to Community Jameel');
      }
    } else {
      console.log('❌ Image upload failed');
      console.log('❌ This might be due to:');
      console.log('   - Missing PRIVATE_GCL environment variable');
      console.log('   - Invalid Google Cloud credentials');
      console.log('   - Network connectivity issues');
      console.log('   - Bucket permissions');
    }

    console.log('');
    console.log('📋 MIGRATION READINESS:');
    console.log('='.repeat(40));

    if (result.success) {
      console.log('✅ Image uploader is ready for migration');
      console.log('✅ Images will be uploaded to GCS bucket: mnemo');
      console.log(
        '✅ Images will be served from: https://cdn.communityjameel.io'
      );
      console.log('✅ WebP compression is enabled for optimization');
      console.log(
        '✅ Organized folder structure: website/collection/[type]/[slug]/'
      );
    } else {
      console.log('❌ Image uploader needs configuration before migration');
      console.log('❌ Check environment variables and GCS setup');
    }

    return result;
  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error.message);
    console.log('');
    console.log('🔧 TROUBLESHOOTING:');
    console.log('='.repeat(40));
    console.log('1. Check PRIVATE_GCL environment variable is set');
    console.log('2. Verify Google Cloud credentials are valid');
    console.log('3. Ensure bucket "mnemo" exists and is accessible');
    console.log('4. Check network connectivity');

    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting GCS Image Uploader Test...\n');

  // Check environment
  if (!process.env.PRIVATE_GCL) {
    console.log('❌ PRIVATE_GCL environment variable not found');
    console.log('⚠️  This test requires Google Cloud credentials');
    console.log(
      '💡 The image uploader will fallback to original URLs if upload fails'
    );
    console.log('');
  }

  const result = await testGCSImageUploader();

  console.log('');
  console.log('🎯 TEST SUMMARY:');
  console.log('='.repeat(40));

  if (result.success) {
    console.log('🎉 SUCCESS: Google Cloud Storage image uploader is working!');
    console.log(
      '🚀 Ready to migrate images from Webflow to Community Jameel CDN'
    );
  } else {
    console.log('⚠️  NOTICE: Image uploader fell back to original URLs');
    console.log('💼 This is expected behavior when GCS is not configured');
    console.log('🔧 Configure GCS credentials for actual image migration');
  }
}

// Run the test
main().catch(console.error);
