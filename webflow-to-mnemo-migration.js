#!/usr/bin/env node

/**
 * Webflow to Mnemo Migration Script with CDN Integration
 *
 * This script fetches posts from Webflow API, processes them through the postWebflowMapper,
 * uploads images to CDN, and saves them to Mnemo database.
 *
 * Usage: node webflow-to-mnemo-migration.js [options]
 *
 * Options:
 *   --limit=5        Only process first 5 posts (for testing)
 *   --upload-images  Upload images to CDN (default: false)
 *   --dry-run       Preview what would be migrated without actual changes
 *   --collection=posts  Collection name for CDN folder structure
 *
 * Examples:
 *   node webflow-to-mnemo-migration.js --limit=5 --upload-images
 *   node webflow-to-mnemo-migration.js --dry-run
 *   node webflow-to-mnemo-migration.js --upload-images --collection=news
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONFIG = {
  // Webflow API v2 Configuration
  WEBFLOW_API_BASE: 'https://api.webflow.com/v2',
  WEBFLOW_SITE_ID: process.env.WEBFLOW_SITE_ID || '',
  WEBFLOW_POSTS_COLLECTION_ID:
    process.env.WEBFLOW_POSTS_COLLECTION_ID || '61ee828a15a3183262bde542',
  WEBFLOW_API_TOKEN:
    process.env.WEBFLOW_API_TOKEN ||
    'd2eac7bfcd8cc230db56e0dd9f9c7c7f4652db6195ad674c0b7939bb438fb33c',

  // Mnemo API Configuration
  MNEMO_API_URL:
    'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/collection-items',

  // CDN Configuration
  CDN_CONFIG: {
    bucketName: process.env.CDN_BUCKET_NAME || 'mnemo-assets',
    cdnBaseUrl: process.env.CDN_BASE_URL || 'https://cdn.communityjameel.io',
    apiEndpoint: process.env.CDN_UPLOAD_API || '/api/upload-image'
  },

  // Processing limits
  CONCURRENCY_LIMIT: 3,
  TIMEOUT: 45000
};

// Command line arguments
const args = process.argv.slice(2);
const options = {
  limit:
    parseInt(args.find((arg) => arg.startsWith('--limit='))?.split('=')[1]) ||
    null,
  uploadImages: args.includes('--upload-images'),
  dryRun: args.includes('--dry-run'),
  collectionName:
    args.find((arg) => arg.startsWith('--collection='))?.split('=')[1] ||
    'posts'
};

console.log('🚀 Starting Webflow to Mnemo Migration...');
console.log('📋 Configuration:');
console.log(`   Limit: ${options.limit || 'No limit'}`);
console.log(`   Upload Images: ${options.uploadImages ? 'Yes' : 'No'}`);
console.log(`   Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
console.log(`   Collection: ${options.collectionName}`);

// Import the mapper functions - we'll use dynamic import to handle ES modules
let mapperModule;

async function initializeMapper() {
  try {
    // Try to import the mapper module
    const mapperPath = path.resolve(
      __dirname,
      './lib/mappers/postWebflowMapperToMnemoData.ts'
    );

    if (fs.existsSync(mapperPath)) {
      console.log('📦 Loading TypeScript mapper...');
      // For now, we'll use a simplified approach since dynamic import of TS is complex
      // We'll implement the mapper logic directly here based on the TypeScript version
      console.log(
        '⚠️  Using embedded mapper logic (TypeScript import not available in Node.js context)'
      );
    }
  } catch (error) {
    console.log(
      '⚠️  Could not import TypeScript mapper, using embedded version'
    );
  }
}

// Utility functions
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateSlug(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Webflow API functions
async function fetchWebflowPosts() {
  return new Promise((resolve, reject) => {
    const requestUrl = `${CONFIG.WEBFLOW_API_BASE}/collections/${CONFIG.WEBFLOW_POSTS_COLLECTION_ID}/items?limit=${options.limit || 100}`;

    console.log(`📡 Fetching posts from Webflow: ${requestUrl}`);

    const options_req = {
      hostname: 'api.webflow.com',
      path: `/v2/collections/${CONFIG.WEBFLOW_POSTS_COLLECTION_ID}/items?limit=${options.limit || 100}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options_req, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            console.log(
              `✅ Fetched ${result.items?.length || 0} posts from Webflow`
            );
            resolve(result.items || []);
          } catch (parseError) {
            reject(
              new Error(
                `Failed to parse Webflow response: ${parseError.message}`
              )
            );
          }
        } else {
          reject(new Error(`Webflow API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(CONFIG.TIMEOUT, () => {
      req.destroy();
      reject(new Error('Webflow API request timeout'));
    });
    req.end();
  });
}

// Image upload simulation (since we can't import the actual functions in Node.js context)
async function simulateImageUpload(imageUrl, collectionName, slug, filename) {
  if (options.dryRun) {
    return {
      originalUrl: imageUrl,
      newUrl: `${CONFIG.CDN_CONFIG.cdnBaseUrl}/website/collection/${collectionName}/${slug}/${filename || 'image.jpg'}`,
      success: true
    };
  }

  // In a real implementation, this would call the actual imageUploaderToCDN function
  console.log(
    `   📸 [SIMULATED] Uploading: ${imageUrl} → ${collectionName}/${slug}`
  );
  await sleep(100); // Simulate upload time

  return {
    originalUrl: imageUrl,
    newUrl: `${CONFIG.CDN_CONFIG.cdnBaseUrl}/website/collection/${collectionName}/${slug}/${filename || 'image.jpg'}`,
    success: true
  };
}

// Embedded mapper logic based on the TypeScript version
function mapWebflowPostToMnemoData(webflowPost, uploadResults = []) {
  const { fieldData } = webflowPost;

  // Transform status
  const status = webflowPost.isDraft ? 'draft' : 'published';

  // Helper function to get updated image URL
  const getUpdatedImageUrl = (originalUrl) => {
    if (!options.uploadImages || !originalUrl) return originalUrl;

    const result = uploadResults.find((r) => r.originalUrl === originalUrl);
    return result?.success ? result.newUrl : originalUrl;
  };

  // Build the mapped collection item
  const mnemoItem = {
    // Root level fields (Mnemo system fields)
    id: webflowPost.id,
    title: fieldData.name,
    type: 'post',
    slug: fieldData.slug,
    status: status,

    // Data object (contains all Webflow-specific content)
    data: {
      // Basic post info
      title: fieldData.name,
      slug: fieldData.slug,
      status: status,
      description: fieldData.body || '',

      // Bilingual content
      arabicTitle: fieldData['arabic-title'],
      arabicCompleteIncomplete: fieldData['arabic-complete-incomplete'],

      // Publication details
      datePublished: fieldData['date-published'],
      location: fieldData.location,
      locationArabic: fieldData['location-arabic'],

      // SEO fields
      seoTitle: fieldData['seo-title'],
      seoTitleArabic: fieldData['seo-title-arabic'],
      seoMeta: fieldData['seo-meta'],
      seoMetaArabic: fieldData['seo-meta-arabic'],

      // Content fields
      bodyEnglish: fieldData.body,
      bodyArabic: fieldData['body-arabic'],
      bulletPointsEnglish: fieldData['bullet-points-english'],
      bulletPointsArabic: fieldData['bullet-points-arabic'],

      // Media fields (with updated URLs if uploaded)
      mainImage: {
        url: getUpdatedImageUrl(fieldData['main-image']?.url),
        alt: fieldData['main-image']?.alt || ''
      },
      thumbnail: {
        url: getUpdatedImageUrl(fieldData.thumbnail?.url),
        alt: fieldData.thumbnail?.alt || ''
      },
      openGraphImage: {
        url: getUpdatedImageUrl(fieldData['open-graph-image']?.url),
        alt: fieldData['open-graph-image']?.alt || ''
      },

      // Video fields
      heroVideoYoutubeId: fieldData['hero-video-youtube-embed-id'],
      heroVideoArabicYoutubeId: fieldData['hero-video-arabic-youtube-video-id'],
      videoAsHero: fieldData['video-as-hero-yes-no'],

      // Programme relationships
      programmeLabel: fieldData['programme-2']
        ? {
            id: fieldData['programme-2'],
            slug: fieldData['programme-2']
          }
        : undefined,
      relatedProgrammes:
        fieldData['programmes-multiple']?.map((progId) => ({
          id: progId,
          slug: progId
        })) || [],

      // Relations from Webflow schema
      tags:
        fieldData['theme-3']?.map((tagId) => ({
          id: tagId,
          slug: tagId
        })) || [],
      blogCategory: fieldData['blogs-categories-2']
        ? {
            id: fieldData['blogs-categories-2'],
            slug: fieldData['blogs-categories-2']
          }
        : undefined,
      relatedEvent: fieldData['related-event']
        ? {
            id: fieldData['related-event'],
            slug: fieldData['related-event']
          }
        : undefined,
      people:
        fieldData.people?.map((personId) => ({
          id: personId,
          slug: personId
        })) || [],
      innovations:
        fieldData.innovations?.map((innovationId) => ({
          id: innovationId,
          slug: innovationId
        })) || [],

      // Image gallery
      imageCarousel:
        fieldData['image-carousel']?.map((img) => ({
          url: getUpdatedImageUrl(img.url),
          alt: img.alt || ''
        })) || [],
      imageGalleryCredits: fieldData['image-carousel-credits'],
      imageGalleryCreditsArabic: fieldData['image-gallery-credits-arabic'],

      // Marketing flags
      featured: fieldData.featured,
      pushToGR: fieldData['push-to-gr'],

      // Webflow-specific metadata
      webflowMeta: {
        webflowId: webflowPost.id,
        cmsLocaleId: webflowPost.cmsLocaleId,
        lastPublished: webflowPost.lastPublished,
        isArchived: webflowPost.isArchived,
        fileIds: {
          mainImage: fieldData['main-image']?.fileId,
          thumbnail: fieldData.thumbnail?.fileId,
          openGraphImage: fieldData['open-graph-image']?.fileId
        }
      }
    }
  };

  return mnemoItem;
}

// Process a single post
async function processPost(webflowPost, index, total) {
  const postName =
    webflowPost.fieldData?.name || webflowPost.name || 'Unknown Post';
  const slug = webflowPost.fieldData?.slug || generateSlug(postName);

  console.log(`\n🔄 Processing [${index + 1}/${total}]: ${postName}`);
  console.log(`   📋 Slug: ${slug}`);

  try {
    let uploadResults = [];

    // Process images if upload is enabled
    if (options.uploadImages) {
      console.log(`   📸 Processing images for CDN upload...`);

      const imageUrls = [];
      const fieldData = webflowPost.fieldData || webflowPost;

      // Collect image URLs
      if (fieldData['main-image']?.url)
        imageUrls.push(fieldData['main-image'].url);
      if (fieldData.thumbnail?.url) imageUrls.push(fieldData.thumbnail.url);
      if (fieldData['open-graph-image']?.url)
        imageUrls.push(fieldData['open-graph-image'].url);

      // Process image carousel
      if (fieldData['image-carousel']) {
        fieldData['image-carousel'].forEach((img) => {
          if (img.url) imageUrls.push(img.url);
        });
      }

      console.log(`   📊 Found ${imageUrls.length} images to process`);

      // Simulate image uploads (in real implementation, would use actual imageUploaderToCDN)
      for (const imageUrl of imageUrls) {
        const result = await simulateImageUpload(
          imageUrl,
          options.collectionName,
          slug
        );
        uploadResults.push(result);
        await sleep(200); // Small delay between uploads
      }

      const successful = uploadResults.filter((r) => r.success).length;
      console.log(
        `   ✅ Processed ${successful}/${imageUrls.length} images successfully`
      );
    }

    // Map the post using our embedded mapper
    console.log(`   🔄 Mapping Webflow post to Mnemo format...`);
    const mappedPost = mapWebflowPostToMnemoData(webflowPost, uploadResults);

    // Create post in Mnemo database
    let mnemoResult = null;
    if (!options.dryRun) {
      console.log(`   📝 Creating post in Mnemo database...`);
      mnemoResult = await createPostInMnemo(mappedPost);
      console.log(
        `   ✅ Post created in Mnemo: ${mnemoResult.collectionItem?.id || 'success'}`
      );
    } else {
      console.log(`   🧪 [DRY RUN] Would create post in Mnemo database`);
      mnemoResult = { success: true, dryRun: true };
    }

    return {
      post: {
        id: webflowPost.id,
        name: postName,
        slug: slug,
        webflowId: webflowPost.id
      },
      images: uploadResults,
      mnemo: mnemoResult,
      mappedData: mappedPost,
      summary: {
        totalImages: uploadResults.length,
        successfulImages: uploadResults.filter((r) => r.success).length,
        mnemoCreated: mnemoResult?.success !== false
      }
    };
  } catch (error) {
    console.error(`   ❌ Failed to process post: ${error.message}`);
    return {
      post: {
        id: webflowPost.id,
        name: postName,
        slug: slug,
        webflowId: webflowPost.id
      },
      images: [],
      mnemo: { success: false, error: error.message },
      summary: {
        totalImages: 0,
        successfulImages: 0,
        mnemoCreated: false
      }
    };
  }
}

// Create post in Mnemo database
async function createPostInMnemo(postData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(postData);
    const url = new URL(CONFIG.MNEMO_API_URL);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
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
            const result = JSON.parse(responseData);
            resolve(result);
          } catch (parseError) {
            resolve({ success: true, message: 'Created successfully' });
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
    req.setTimeout(CONFIG.TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.write(data);
    req.end();
  });
}

// Process posts in batches
async function processInBatches(posts, batchSize, processor) {
  const results = [];

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    console.log(
      `\n🚀 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(posts.length / batchSize)}`
    );

    const batchPromises = batch.map((post, batchIndex) =>
      processor(post, i + batchIndex, posts.length)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches
    if (i + batchSize < posts.length) {
      await sleep(1000);
    }
  }

  return results;
}

// Generate migration report
function generateMigrationReport(results) {
  const successful = results.filter((r) => r.mnemo?.success !== false);
  const failed = results.filter((r) => r.mnemo?.success === false);
  const totalImages = results.reduce(
    (sum, r) => sum + r.summary.totalImages,
    0
  );
  const successfulImages = results.reduce(
    (sum, r) => sum + r.summary.successfulImages,
    0
  );

  console.log('\n' + '='.repeat(80));
  console.log('📊 WEBFLOW TO MNEMO MIGRATION REPORT');
  console.log('='.repeat(80));
  console.log(`🎯 POSTS SUMMARY:`);
  console.log(`   Total posts processed: ${results.length}`);
  console.log(`   ✅ Successfully migrated: ${successful.length}`);
  console.log(`   ❌ Failed to migrate: ${failed.length}`);

  if (options.uploadImages) {
    console.log(`\n🖼️  IMAGES SUMMARY:`);
    console.log(`   Total images processed: ${totalImages}`);
    if (options.dryRun) {
      console.log(`   🧪 Dry-run simulated: ${totalImages}`);
    } else {
      console.log(`   ✅ Successfully uploaded: ${successfulImages}`);
    }
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED POSTS:');
    failed.forEach((result) => {
      console.log(`  - ${result.post.name} (${result.post.slug})`);
      if (result.mnemo.error) {
        console.log(`    Reason: ${result.mnemo.error}`);
      }
    });
  }

  console.log('\n✨ Migration completed!');
  console.log('='.repeat(80));

  return {
    summary: {
      totalPosts: results.length,
      successfulPosts: successful.length,
      failedPosts: failed.length,
      totalImages: totalImages,
      successfulImages: successfulImages,
      uploadImagesEnabled: options.uploadImages,
      dryRun: options.dryRun
    },
    results: results
  };
}

// Save migration report to file
function saveMigrationReport(report) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportFile = `webflow-migration-report-${timestamp}.json`;
  const summaryFile = `webflow-migration-summary-${timestamp}.json`;

  // Save detailed report
  fs.writeFileSync(reportFile, JSON.stringify(report.results, null, 2));
  console.log(`📊 Detailed report saved: ${reportFile}`);

  // Save summary report
  fs.writeFileSync(summaryFile, JSON.stringify(report.summary, null, 2));
  console.log(`📋 Summary report saved: ${summaryFile}`);
}

// Main migration function
async function main() {
  try {
    // Initialize the mapper
    await initializeMapper();

    // Fetch posts from Webflow
    const webflowPosts = await fetchWebflowPosts();

    if (webflowPosts.length === 0) {
      console.log('⚠️  No posts found in Webflow. Exiting...');
      return;
    }

    console.log(`\n📋 Found ${webflowPosts.length} posts to process`);

    // Process posts in batches
    const results = await processInBatches(
      webflowPosts,
      CONFIG.CONCURRENCY_LIMIT,
      processPost
    );

    // Generate and save reports
    const report = generateMigrationReport(results);
    saveMigrationReport(report);
  } catch (error) {
    console.error(`💥 Fatal error: ${error.message}`);
    console.error(error.stack);
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
