#!/usr/bin/env node

/**
 * PHASE 1: Database Population Script
 *
 * This script populates the Mnemo database with posts from Webflow
 * WITHOUT uploading images to CDN. Images remain at their original Webflow URLs.
 *
 * Usage: node phase1-populate-database.mjs
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
  LIMIT: 50, // Number of posts to migrate
  COLLECTION_NAME: 'posts'
};

/**
 * Fetch posts from Webflow API with pagination
 */
async function fetchWebflowPosts(limit = 50, offset = 0) {
  console.log(
    `📡 Fetching ${limit} posts from Webflow API (offset: ${offset})...`
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
  console.log(
    `✅ Successfully fetched ${data.items?.length || 0} posts from Webflow`
  );

  return {
    items: data.items || [],
    pagination: data.pagination || {}
  };
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
  console.log(
    `✅ Successfully created item in Mnemo with ID: ${result.id || result.data?.id || 'unknown'}`
  );

  return result;
}

/**
 * Check if item already exists in Mnemo by slug
 */
async function checkItemExists(slug) {
  const url = `${CONFIG.MNEMO_API_BASE}/api/collection-items?slug=${encodeURIComponent(slug)}`;

  const headers = {};
  if (CONFIG.MNEMO_API_KEY) {
    headers['Authorization'] = `Bearer ${CONFIG.MNEMO_API_KEY}`;
  }

  try {
    const response = await fetch(url, { headers });
    if (response.ok) {
      const data = await response.json();
      return data.items?.length > 0;
    }
  } catch (error) {
    // If check fails, assume item doesn't exist and try to create
    console.log(`⚠️  Could not check if item exists: ${error.message}`);
  }

  return false;
}

/**
 * Process a single post through the database population pipeline
 */
async function processPost(webflowPost, index, total) {
  const postTitle = webflowPost.fieldData?.name || `Post ${index + 1}`;
  console.log(`\n🔄 Processing [${index + 1}/${total}]: "${postTitle}"`);
  console.log(`   Webflow ID: ${webflowPost.id}`);
  console.log(`   Slug: ${webflowPost.fieldData?.slug || 'no-slug'}`);
  console.log(`   Status: ${webflowPost.isDraft ? 'draft' : 'published'}`);

  try {
    // Step 1: Check if item already exists
    const slug = webflowPost.fieldData?.slug;
    if (slug) {
      const exists = await checkItemExists(slug);
      if (exists) {
        console.log(
          `   ⏭️  Item with slug "${slug}" already exists, skipping...`
        );
        return {
          success: true,
          skipped: true,
          webflowId: webflowPost.id,
          title: postTitle,
          slug: slug,
          reason: 'Already exists'
        };
      }
    }

    // Step 2: Map Webflow data to Mnemo format WITHOUT CDN upload
    console.log(`   📋 Mapping data (keeping original Webflow image URLs)...`);

    const mappedData = await postWebflowMapperToMnemoData(
      webflowPost,
      false, // NO CDN upload in Phase 1
      CONFIG.COLLECTION_NAME
    );

    // Step 3: Create in Mnemo database
    const mnemoResult = await createMnemoItem(mappedData);

    // Step 4: Collect image information for reporting
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
      skipped: false,
      webflowId: webflowPost.id,
      mnemoId: mnemoResult.id || mnemoResult.data?.id || null,
      title: postTitle,
      slug: mappedData.slug,
      status: mappedData.status,
      imageInfo,
      totalImages,
      phase: 'database-population'
    };
  } catch (error) {
    console.error(`   ❌ Failed to process "${postTitle}": ${error.message}`);

    // Check if it's a duplicate slug error
    const isDuplicateSlug =
      error.message.includes('already exists') ||
      error.message.includes('duplicate') ||
      error.message.includes('unique constraint');

    return {
      success: false,
      skipped: isDuplicateSlug,
      webflowId: webflowPost.id,
      title: postTitle,
      slug: webflowPost.fieldData?.slug,
      error: error.message,
      isDuplicateSlug,
      phase: 'database-population'
    };
  }
}

/**
 * Generate migration report
 */
function generateReport(results) {
  const successful = results.filter((r) => r.success && !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const failed = results.filter((r) => !r.success);

  console.log('\n' + '='.repeat(70));
  console.log('📊 PHASE 1: DATABASE POPULATION REPORT');
  console.log('='.repeat(70));
  console.log(`Total processed: ${results.length}`);
  console.log(`✅ Successfully created: ${successful.length}`);
  console.log(`⏭️  Skipped (already exist): ${skipped.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📸 Images kept at Webflow URLs (Phase 2 will migrate to CDN)`);

  if (successful.length > 0) {
    console.log('\n✅ SUCCESSFULLY CREATED:');
    successful.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}"`);
      console.log(`      Webflow ID: ${item.webflowId}`);
      console.log(`      Mnemo ID: ${item.mnemoId || 'unknown'}`);
      console.log(`      Slug: ${item.slug}`);
      console.log(`      Status: ${item.status}`);
      console.log(`      Images: ${item.totalImages} (at Webflow URLs)`);
      console.log('');
    });
  }

  if (skipped.length > 0) {
    console.log('\n⏭️  SKIPPED (ALREADY EXIST):');
    skipped.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}"`);
      console.log(`      Slug: ${item.slug}`);
      console.log(`      Reason: ${item.reason}`);
      console.log('');
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED:');
    failed.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}"`);
      console.log(`      Webflow ID: ${item.webflowId}`);
      console.log(`      Error: ${item.error}`);
      if (item.isDuplicateSlug) {
        console.log(`      💡 Tip: This looks like a duplicate slug error`);
      }
      console.log('');
    });
  }

  const totalImages = successful.reduce(
    (sum, item) => sum + item.totalImages,
    0
  );
  console.log(`📸 Image Summary:`);
  console.log(`   Total images preserved: ${totalImages}`);
  console.log(`   Images location: Original Webflow URLs`);
  console.log(`   Next step: Run Phase 2 to migrate images to CDN`);

  console.log('\n🎉 Phase 1 completed!');
  console.log('📋 Next steps:');
  console.log('   1. Verify created posts in Mnemo database');
  console.log('   2. Run phase2-migrate-images.mjs to upload images to CDN');
  console.log('   3. Update posts with new CDN URLs');
  console.log('='.repeat(70));

  return {
    total: results.length,
    successful: successful.length,
    skipped: skipped.length,
    failed: failed.length,
    totalImages,
    phase: 'database-population',
    results
  };
}

/**
 * Save detailed report to file
 */
async function saveReport(report) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = `phase1-database-population-report-${timestamp}.json`;

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
  console.log('🚀 PHASE 1: WEBFLOW TO MNEMO DATABASE POPULATION');
  console.log('='.repeat(70));
  console.log(`📋 Configuration:`);
  console.log(`   Webflow Collection: ${CONFIG.WEBFLOW_COLLECTION_ID}`);
  console.log(`   Mnemo API: ${CONFIG.MNEMO_API_BASE}`);
  console.log(`   Posts to migrate: ${CONFIG.LIMIT}`);
  console.log(`   CDN Upload: DISABLED (Phase 1 - Database only)`);
  console.log(`   Collection name: ${CONFIG.COLLECTION_NAME}`);
  console.log('');

  try {
    // Step 1: Validate configuration
    validateConfig();

    // Step 2: Fetch posts from Webflow
    const webflowData = await fetchWebflowPosts(CONFIG.LIMIT);

    if (webflowData.items.length === 0) {
      console.log('⚠️  No posts found in Webflow collection');
      return;
    }

    // Step 3: Process each post
    console.log(`\n🔄 Processing ${webflowData.items.length} posts...`);
    console.log(
      '📝 Phase 1: Creating database entries with Webflow image URLs'
    );

    const results = [];

    for (let i = 0; i < webflowData.items.length; i++) {
      const result = await processPost(
        webflowData.items[i],
        i,
        webflowData.items.length
      );
      results.push(result);

      // Small delay between posts to be respectful to APIs
      if (i < webflowData.items.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Step 4: Generate and save report
    const report = generateReport(results);
    await saveReport(report);

    console.log('\n🎯 PHASE 1 SUMMARY:');
    console.log(`✅ Database populated with ${report.successful} new posts`);
    console.log(`⏭️  Skipped ${report.skipped} existing posts`);
    console.log(`❌ Failed to create ${report.failed} posts`);
    console.log(`📸 ${report.totalImages} images preserved at original URLs`);

    if (report.successful > 0) {
      console.log('\n🚀 Ready for Phase 2!');
      console.log('💡 Run: node phase2-migrate-images.mjs');
    }

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
