#!/usr/bin/env node

/**
 * Test Script: Webflow API to Mnemo Database Migration
 *
 * This script fetches the first 5 posts from Webflow API and creates them
 * in the Mnemo database using the integrated mapper with CDN upload.
 *
 * Usage: node test-webflow-to-mnemo-api.mjs
 */

import dotenv from 'dotenv';
import { postWebflowMapperToMnemoData } from './lib/mappers/postWebflowMapperToMnemoData.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const CONFIG = {
  WEBFLOW_API_TOKEN: process.env.WEBFLOW_API_TOKEN,
  WEBFLOW_SITE_ID: process.env.WEBFLOW_SITE_ID,
  WEBFLOW_COLLECTION_ID: process.env.WEBFLOW_POSTS_COLLECTION_ID,
  MNEMO_API_BASE:
    process.env.NEXT_PUBLIC_API_URL ||
    'https://mnemo-app-e4f6j5kdsq-ew.a.run.app',
  MNEMO_API_KEY: process.env.MNEMO_API_KEY, // If needed for auth
  LIMIT: 5, // Number of posts to migrate
  ENABLE_CDN_UPLOAD: true, // Enable actual CDN upload
  COLLECTION_NAME: 'posts' // For CDN folder structure
};

/**
 * Fetch posts from Webflow API
 */
async function fetchWebflowPosts(limit = 5) {
  console.log(`📡 Fetching ${limit} posts from Webflow API...`);

  const url = `https://api.webflow.com/v2/collections/${CONFIG.WEBFLOW_COLLECTION_ID}/items?limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
      'accept-version': '1.0.0',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Webflow API error: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  const data = await response.json();
  console.log(
    `✅ Successfully fetched ${data.items?.length || 0} posts from Webflow`
  );

  return data.items || [];
}

/**
 * Create item in Mnemo database via API
 */
async function createMnemoItem(mappedData) {
  console.log(`📤 Creating item in Mnemo: "${mappedData.title}"`);

  const url = `${CONFIG.MNEMO_API_BASE}/api/collection-items`;

  const payload = {
    type: 'post',
    status: mappedData.status,
    slug: mappedData.slug,
    title: mappedData.title,
    data: mappedData.data
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  // Add API key if configured
  if (CONFIG.MNEMO_API_KEY) {
    headers['Authorization'] = `Bearer ${CONFIG.MNEMO_API_KEY}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Mnemo API error: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  const result = await response.json();
  console.log(`✅ Successfully created item in Mnemo with ID: ${result.id}`);

  return result;
}

/**
 * Process a single post through the complete pipeline
 */
async function processPost(webflowPost, index, total) {
  const postTitle = webflowPost.fieldData?.name || `Post ${index + 1}`;
  console.log(`\n🔄 Processing [${index + 1}/${total}]: "${postTitle}"`);
  console.log(`   Webflow ID: ${webflowPost.id}`);
  console.log(`   Status: ${webflowPost.isDraft ? 'draft' : 'published'}`);

  try {
    // Step 1: Map Webflow data to Mnemo format with CDN upload
    console.log(
      `   📋 Mapping data and ${CONFIG.ENABLE_CDN_UPLOAD ? 'uploading images to CDN' : 'preserving image URLs'}...`
    );

    const mappedData = await postWebflowMapperToMnemoData(
      webflowPost,
      CONFIG.ENABLE_CDN_UPLOAD, // Enable/disable CDN upload
      CONFIG.COLLECTION_NAME,
      {
        compressToWebP: true,
        quality: 80
      }
    );

    // Step 2: Create in Mnemo database
    const mnemoResult = await createMnemoItem(mappedData);

    // Step 3: Collect image information for reporting
    const imageInfo = {
      mainImage: mappedData.data.mainImage?.url || null,
      thumbnail: mappedData.data.thumbnail?.url || null,
      openGraphImage: mappedData.data.openGraphImage?.url || null,
      imageCarousel: mappedData.data.imageCarousel?.map((img) => img.url) || []
    };

    const totalImages = [
      imageInfo.mainImage,
      imageInfo.thumbnail,
      imageInfo.openGraphImage,
      ...imageInfo.imageCarousel
    ].filter(Boolean).length;

    return {
      success: true,
      webflowId: webflowPost.id,
      mnemoId: mnemoResult.id,
      title: postTitle,
      slug: mappedData.slug,
      status: mappedData.status,
      imageInfo,
      totalImages,
      cdnUploadEnabled: CONFIG.ENABLE_CDN_UPLOAD
    };
  } catch (error) {
    console.error(`   ❌ Failed to process "${postTitle}": ${error.message}`);
    return {
      success: false,
      webflowId: webflowPost.id,
      title: postTitle,
      error: error.message,
      cdnUploadEnabled: CONFIG.ENABLE_CDN_UPLOAD
    };
  }
}

/**
 * Generate migration report
 */
function generateReport(results) {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log('\n' + '='.repeat(70));
  console.log('📊 MIGRATION REPORT');
  console.log('='.repeat(70));
  console.log(`Total processed: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(
    `🌐 CDN Upload: ${CONFIG.ENABLE_CDN_UPLOAD ? 'Enabled' : 'Disabled'}`
  );

  if (successful.length > 0) {
    console.log('\n✅ SUCCESSFUL MIGRATIONS:');
    successful.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}"`);
      console.log(`      Webflow ID: ${item.webflowId}`);
      console.log(`      Mnemo ID: ${item.mnemoId}`);
      console.log(`      Slug: ${item.slug}`);
      console.log(`      Status: ${item.status}`);
      console.log(`      Images: ${item.totalImages} total`);
      if (item.totalImages > 0 && CONFIG.ENABLE_CDN_UPLOAD) {
        console.log(`      CDN URLs:`);
        if (item.imageInfo.mainImage)
          console.log(`        Main: ${item.imageInfo.mainImage}`);
        if (item.imageInfo.thumbnail)
          console.log(`        Thumb: ${item.imageInfo.thumbnail}`);
        if (item.imageInfo.openGraphImage)
          console.log(`        OG: ${item.imageInfo.openGraphImage}`);
        if (item.imageInfo.imageCarousel.length > 0) {
          console.log(
            `        Gallery: ${item.imageInfo.imageCarousel.length} images`
          );
        }
      }
      console.log('');
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED MIGRATIONS:');
    failed.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}"`);
      console.log(`      Webflow ID: ${item.webflowId}`);
      console.log(`      Error: ${item.error}`);
      console.log('');
    });
  }

  const totalImages = successful.reduce(
    (sum, item) => sum + item.totalImages,
    0
  );
  console.log(`📸 Image Summary:`);
  console.log(`   Total images processed: ${totalImages}`);
  if (CONFIG.ENABLE_CDN_UPLOAD) {
    console.log(
      `   Uploaded to: https://cdn.communityjameel.io/website/collection/${CONFIG.COLLECTION_NAME}/`
    );
  } else {
    console.log(`   Images kept at original Webflow URLs`);
  }

  console.log('\n🎉 Migration completed!');
  console.log('='.repeat(70));

  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    totalImages,
    cdnUploadEnabled: CONFIG.ENABLE_CDN_UPLOAD,
    results
  };
}

/**
 * Save detailed report to file
 */
async function saveReport(report) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = `webflow-to-mnemo-test-report-${timestamp}.json`;

  const fs = await import('fs');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`💾 Detailed report saved: ${reportFile}`);
}

/**
 * Validate environment configuration
 */
function validateConfig() {
  const requiredEnvVars = [
    'WEBFLOW_API_TOKEN',
    'WEBFLOW_SITE_ID',
    'WEBFLOW_POSTS_COLLECTION_ID',
    'PRIVATE_GCL' // For GCS uploads
  ];

  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error('\nPlease set these in your .env.local file');
    process.exit(1);
  }

  console.log('✅ Environment configuration validated');
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 WEBFLOW TO MNEMO API MIGRATION TEST');
  console.log('='.repeat(70));
  console.log(`📋 Configuration:`);
  console.log(`   Webflow Collection: ${CONFIG.WEBFLOW_COLLECTION_ID}`);
  console.log(`   Mnemo API: ${CONFIG.MNEMO_API_BASE}`);
  console.log(`   Posts to migrate: ${CONFIG.LIMIT}`);
  console.log(
    `   CDN Upload: ${CONFIG.ENABLE_CDN_UPLOAD ? 'Enabled' : 'Disabled'}`
  );
  console.log(`   Collection name: ${CONFIG.COLLECTION_NAME}`);
  console.log('');

  try {
    // Step 1: Validate configuration
    validateConfig();

    // Step 2: Fetch posts from Webflow
    const webflowPosts = await fetchWebflowPosts(CONFIG.LIMIT);

    if (webflowPosts.length === 0) {
      console.log('⚠️  No posts found in Webflow collection');
      return;
    }

    // Step 3: Process each post
    console.log(`\n🔄 Processing ${webflowPosts.length} posts...`);
    const results = [];

    for (let i = 0; i < webflowPosts.length; i++) {
      const result = await processPost(webflowPosts[i], i, webflowPosts.length);
      results.push(result);

      // Small delay between posts to be respectful to APIs
      if (i < webflowPosts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Step 4: Generate and save report
    const report = generateReport(results);
    await saveReport(report);

    // Step 5: Exit with appropriate code
    process.exit(report.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`💥 Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle process errors gracefully
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
