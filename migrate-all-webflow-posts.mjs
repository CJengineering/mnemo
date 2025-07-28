#!/usr/bin/env node

/**
 * Complete Webflow Posts Migration Script
 *
 * This script migrates ALL posts from Webflow to Mnemo database.
 * It skips posts that already exist (based on slug) and only migrates new ones.
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
  MNEMO_API_KEY: process.env.MNEMO_API_KEY,
  ENABLE_CDN_UPLOAD: false, // Phase 1: No CDN upload, just database population
  COLLECTION_NAME: 'posts',
  BATCH_SIZE: 100, // Webflow API pagination limit
  DELAY_BETWEEN_REQUESTS: 1000 // 1 second delay between API calls
};

/**
 * Get total count of posts in Webflow collection
 */
async function getWebflowPostsCount() {
  console.log('📊 Getting total posts count from Webflow...');

  const url = `https://api.webflow.com/v2/collections/${CONFIG.WEBFLOW_COLLECTION_ID}/items?limit=1`;

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
  return data.pagination?.total || 0;
}

/**
 * Fetch all posts from Webflow API with pagination
 */
async function fetchAllWebflowPosts() {
  console.log('📡 Fetching all posts from Webflow API...');

  const totalPosts = await getWebflowPostsCount();
  console.log(`   Total posts in Webflow: ${totalPosts}`);

  let allPosts = [];
  let offset = 0;
  const limit = CONFIG.BATCH_SIZE;

  while (offset < totalPosts) {
    console.log(
      `   Fetching batch: ${offset + 1}-${Math.min(offset + limit, totalPosts)} of ${totalPosts}`
    );

    const url = `https://api.webflow.com/v2/collections/${CONFIG.WEBFLOW_COLLECTION_ID}/items?limit=${limit}&offset=${offset}`;

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
    const batchPosts = data.items || [];
    allPosts = allPosts.concat(batchPosts);

    console.log(`   ✅ Fetched ${batchPosts.length} posts from this batch`);

    offset += limit;

    // Add delay to be respectful to Webflow API
    if (offset < totalPosts) {
      console.log(
        `   ⏳ Waiting ${CONFIG.DELAY_BETWEEN_REQUESTS}ms before next request...`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, CONFIG.DELAY_BETWEEN_REQUESTS)
      );
    }
  }

  console.log(
    `✅ Successfully fetched all ${allPosts.length} posts from Webflow`
  );
  return allPosts;
}

/**
 * Get existing posts from Mnemo database to avoid duplicates
 */
async function getExistingMnemoPosts() {
  console.log('📋 Checking existing posts in Mnemo database...');

  const url = `${CONFIG.MNEMO_API_BASE}/api/collection-items?type=post`;

  const headers = {
    'Content-Type': 'application/json'
  };

  if (CONFIG.MNEMO_API_KEY) {
    headers['Authorization'] = `Bearer ${CONFIG.MNEMO_API_KEY}`;
  }

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.log(
        `   ⚠️ Could not fetch existing posts (${response.status}), will attempt to create all`
      );
      return new Set();
    }

    const data = await response.json();
    const existingSlugs = new Set();

    if (data.items) {
      data.items.forEach((item) => {
        if (item.slug) {
          existingSlugs.add(item.slug);
        }
      });
    }

    console.log(
      `   Found ${existingSlugs.size} existing posts in Mnemo database`
    );
    return existingSlugs;
  } catch (error) {
    console.log(`   ⚠️ Error checking existing posts: ${error.message}`);
    console.log(
      `   Will attempt to create all posts (may get duplicate errors)`
    );
    return new Set();
  }
}

/**
 * Create item in Mnemo database via API
 */
async function createMnemoItem(mappedData) {
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
  return result;
}

/**
 * Process a single post through the complete pipeline
 */
async function processPost(webflowPost, index, total, existingSlugs) {
  const postTitle = webflowPost.fieldData?.name || `Post ${index + 1}`;
  const postSlug = webflowPost.fieldData?.slug || `post-${index + 1}`;

  console.log(`\n🔄 Processing [${index + 1}/${total}]: "${postTitle}"`);
  console.log(`   Webflow ID: ${webflowPost.id}`);
  console.log(`   Slug: ${postSlug}`);
  console.log(`   Status: ${webflowPost.isDraft ? 'draft' : 'published'}`);

  // Check if post already exists
  if (existingSlugs.has(postSlug)) {
    console.log(`   ⏭️ Skipping - post already exists in Mnemo database`);
    return {
      success: true,
      skipped: true,
      webflowId: webflowPost.id,
      title: postTitle,
      slug: postSlug,
      reason: 'Already exists in database'
    };
  }

  try {
    // Step 1: Map Webflow data to Mnemo format (no CDN upload in Phase 1)
    console.log(`   📋 Mapping data (preserving Webflow image URLs)...`);

    const mappedData = await postWebflowMapperToMnemoData(
      webflowPost,
      CONFIG.ENABLE_CDN_UPLOAD,
      CONFIG.COLLECTION_NAME
    );

    // Step 2: Create in Mnemo database
    console.log(`   📤 Creating in Mnemo database...`);
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

    console.log(
      `   ✅ Successfully created with ID: ${mnemoResult.id || 'unknown'}`
    );
    console.log(`   📸 Images preserved: ${totalImages} total`);

    return {
      success: true,
      skipped: false,
      webflowId: webflowPost.id,
      mnemoId: mnemoResult.id,
      title: postTitle,
      slug: postSlug,
      status: mappedData.status,
      imageInfo,
      totalImages
    };
  } catch (error) {
    console.error(`   ❌ Failed to process "${postTitle}": ${error.message}`);

    // Check if it's a duplicate slug error
    const isDuplicateError =
      error.message.toLowerCase().includes('slug') &&
      error.message.toLowerCase().includes('exists');

    return {
      success: false,
      skipped: isDuplicateError,
      webflowId: webflowPost.id,
      title: postTitle,
      slug: postSlug,
      error: error.message,
      isDuplicate: isDuplicateError
    };
  }
}

/**
 * Generate comprehensive migration report
 */
function generateReport(results, startTime) {
  const endTime = new Date();
  const duration = Math.round((endTime - startTime) / 1000);

  const successful = results.filter((r) => r.success && !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const failed = results.filter((r) => !r.success);
  const duplicates = results.filter((r) => r.isDuplicate);

  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPLETE WEBFLOW POSTS MIGRATION REPORT');
  console.log('='.repeat(80));
  console.log(`⏱️  Duration: ${duration} seconds`);
  console.log(`📊 Total processed: ${results.length}`);
  console.log(`✅ Successfully migrated: ${successful.length}`);
  console.log(`⏭️  Skipped (already exist): ${skipped.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`🔄 Duplicate slug errors: ${duplicates.length}`);
  console.log(
    `🌐 CDN Upload: ${CONFIG.ENABLE_CDN_UPLOAD ? 'Enabled' : 'Disabled (Phase 1)'}`
  );

  if (successful.length > 0) {
    console.log('\n✅ NEWLY MIGRATED POSTS:');
    successful.slice(0, 10).forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}"`);
      console.log(`      Webflow ID: ${item.webflowId}`);
      console.log(`      Mnemo ID: ${item.mnemoId || 'unknown'}`);
      console.log(`      Slug: ${item.slug}`);
      console.log(`      Status: ${item.status}`);
      console.log(`      Images: ${item.totalImages} preserved`);
      console.log('');
    });

    if (successful.length > 10) {
      console.log(
        `   ... and ${successful.length - 10} more successfully migrated posts`
      );
    }
  }

  if (skipped.length > 0) {
    console.log('\n⏭️ SKIPPED POSTS (ALREADY EXIST):');
    skipped.slice(0, 5).forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}" (${item.slug})`);
    });

    if (skipped.length > 5) {
      console.log(`   ... and ${skipped.length - 5} more skipped posts`);
    }
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED MIGRATIONS:');
    failed.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}"`);
      console.log(`      Webflow ID: ${item.webflowId}`);
      console.log(`      Slug: ${item.slug}`);
      console.log(`      Error: ${item.error}`);
      console.log('');
    });
  }

  const totalImages = successful.reduce(
    (sum, item) => sum + (item.totalImages || 0),
    0
  );
  console.log(`📸 Image Summary:`);
  console.log(`   Total images preserved: ${totalImages}`);
  console.log(`   Images remain at Webflow URLs (Phase 1)`);
  console.log(`   Next: Run Phase 2 script to migrate images to CDN`);

  console.log('\n🎉 Migration Phase 1 completed!');
  console.log('📋 Next Steps:');
  console.log('   1. Review this report for any failed migrations');
  console.log(
    '   2. Run: node phase2-migrate-images.mjs (to upload images to CDN)'
  );
  console.log('   3. Verify migrated posts in Mnemo admin interface');
  console.log('='.repeat(80));

  return {
    duration,
    total: results.length,
    successful: successful.length,
    skipped: skipped.length,
    failed: failed.length,
    duplicates: duplicates.length,
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
  const reportFile = `complete-webflow-migration-report-${timestamp}.json`;

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
    'WEBFLOW_POSTS_COLLECTION_ID'
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
  const startTime = new Date();

  console.log('🚀 COMPLETE WEBFLOW POSTS MIGRATION - PHASE 1');
  console.log('='.repeat(80));
  console.log(`📋 Configuration:`);
  console.log(`   Webflow Collection: ${CONFIG.WEBFLOW_COLLECTION_ID}`);
  console.log(`   Mnemo API: ${CONFIG.MNEMO_API_BASE}`);
  console.log(
    `   CDN Upload: ${CONFIG.ENABLE_CDN_UPLOAD ? 'Enabled' : 'Disabled (Phase 1)'}`
  );
  console.log(`   Batch Size: ${CONFIG.BATCH_SIZE}`);
  console.log(`   API Delay: ${CONFIG.DELAY_BETWEEN_REQUESTS}ms`);
  console.log('');

  try {
    // Step 1: Validate configuration
    validateConfig();

    // Step 2: Get existing posts to avoid duplicates
    const existingSlugs = await getExistingMnemoPosts();

    // Step 3: Fetch all posts from Webflow
    const webflowPosts = await fetchAllWebflowPosts();

    if (webflowPosts.length === 0) {
      console.log('⚠️  No posts found in Webflow collection');
      return;
    }

    // Step 4: Process each post
    console.log(`\n🔄 Processing ${webflowPosts.length} posts...`);
    const results = [];

    for (let i = 0; i < webflowPosts.length; i++) {
      const result = await processPost(
        webflowPosts[i],
        i,
        webflowPosts.length,
        existingSlugs
      );
      results.push(result);

      // Add existing slugs if successfully created
      if (result.success && !result.skipped && result.slug) {
        existingSlugs.add(result.slug);
      }

      // Delay between posts to be respectful to APIs
      if (i < webflowPosts.length - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.DELAY_BETWEEN_REQUESTS)
        );
      }
    }

    // Step 5: Generate and save report
    const report = generateReport(results, startTime);
    await saveReport(report);

    // Step 6: Exit with appropriate code
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

// Run the complete migration
main();
