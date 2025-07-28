#!/usr/bin/env node

/**
 * Test the updated imageUploader with actual Google Cloud Storage integration
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

import {
  imageUploaderToCDN,
  batchImageUploaderToCDN
} from './lib/utils/imageUploader.ts';

async function testSingleImageUpload() {
  console.log('\n🧪 Testing single image upload...');

  const testImageUrl =
    'https://uploads-ssl.webflow.com/65f7a982e5106dc8e07af7b8/66baf0e5d1c4b8ba04b73cb3_image-14.jpg';
  const collectionName = 'posts';
  const slug = 'test-migration';

  try {
    const result = await imageUploaderToCDN(
      testImageUrl,
      collectionName,
      slug,
      'test-image.jpg',
      {
        compressToWebP: true,
        quality: 85
      }
    );

    console.log('\n📋 Upload Result:');
    console.log('Original URL:', result.originalUrl);
    console.log('New URL:', result.newUrl);
    console.log('Success:', result.success);
    if (result.error) {
      console.log('Error:', result.error);
    }

    return result.success;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testBatchImageUpload() {
  console.log('\n🧪 Testing batch image upload...');

  const testImageUrls = [
    'https://uploads-ssl.webflow.com/65f7a982e5106dc8e07af7b8/66baf0e5d1c4b8ba04b73cb3_image-14.jpg',
    'https://uploads-ssl.webflow.com/65f7a982e5106dc8e07af7b8/66ba5dc5bb43a30e6cc64166_image-09.jpg'
  ];

  const collectionName = 'posts';
  const slug = 'test-batch-migration';

  try {
    const results = await batchImageUploaderToCDN(
      testImageUrls,
      collectionName,
      slug,
      {
        compressToWebP: true,
        quality: 80
      },
      2 // Process 2 at a time
    );

    console.log('\n📋 Batch Upload Results:');
    results.forEach((result, index) => {
      console.log(`\nImage ${index + 1}:`);
      console.log('Original URL:', result.originalUrl);
      console.log('New URL:', result.newUrl);
      console.log('Success:', result.success);
      if (result.error) {
        console.log('Error:', result.error);
      }
    });

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `\n✅ Batch completed: ${successCount}/${results.length} successful`
    );

    return successCount === results.length;
  } catch (error) {
    console.error('❌ Batch test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Google Cloud Storage Image Uploader Tests...');

  if (!process.env.PRIVATE_GCL) {
    console.error('❌ Error: PRIVATE_GCL environment variable is required');
    console.error('   Make sure your Google Cloud credentials are set up');
    process.exit(1);
  }

  let allTestsPassed = true;

  // Test single image upload
  const singleTestPassed = await testSingleImageUpload();
  allTestsPassed = allTestsPassed && singleTestPassed;

  // Test batch image upload
  const batchTestPassed = await testBatchImageUpload();
  allTestsPassed = allTestsPassed && batchTestPassed;

  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log(
      '🎉 All tests passed! The CDN integration is working correctly.'
    );
    console.log(
      '✅ Images are now being uploaded to https://cdn.communityjameel.io'
    );
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);
