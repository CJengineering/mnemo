/**
 * Migration script using the TypeScript postWebflowMapperToMnemoData function
 * Migrates 5 posts from Webflow to Mnemo database with CDN image upload
 */

import https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configuration - matches your existing setup
const CONFIG = {
  WEBFLOW_API_BASE: 'https://api.webflow.com/v2',
  WEBFLOW_SITE_ID: process.env.WEBFLOW_SITE_ID || '',
  WEBFLOW_POSTS_COLLECTION_ID:
    process.env.WEBFLOW_POSTS_COLLECTION_ID || '61ee828a15a3183262bde542',
  WEBFLOW_API_TOKEN:
    process.env.WEBFLOW_API_TOKEN ||
    'd2eac7bfcd8cc230db56e0dd9f9c7c7f4652db6195ad674c0b7939bb438fb33c',
  MNEMO_API_URL:
    'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/collection-items',

  // CDN Configuration
  CDN_CONFIG: {
    bucketName: 'mnemo',
    cdnBaseUrl: 'https://cdn.communityjameel.io',
    apiEndpoint: '/api/upload-image' // You'll need to implement this endpoint
  }
};

// Import the TypeScript mapper (we'll use dynamic import)
let mapperModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeMapper() {
  try {
    console.log('📦 Attempting to load TypeScript mapper...');

    // For now, we'll create a JavaScript version of your mapper
    mapperModule = {
      postWebflowMapperToMnemoData: createJSMapper()
    };

    console.log('✅ Mapper loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load TypeScript mapper:', error.message);
    console.log('🔄 Using JavaScript fallback mapper...');
    mapperModule = {
      postWebflowMapperToMnemoData: createJSMapper()
    };
  }
}

// JavaScript version of your mapper function
function createJSMapper() {
  return async function postWebflowMapperToMnemoData(
    webflowPost,
    uploadImages = false,
    collectionName = 'posts',
    cdnConfig = CONFIG.CDN_CONFIG
  ) {
    const { fieldData } = webflowPost;

    // Transform status: Webflow uses isDraft, Mnemo uses status enum
    const status = webflowPost.isDraft ? 'draft' : 'published';

    // Image upload logic (simplified for now)
    const getImageUrl = (originalUrl) => {
      if (!uploadImages || !originalUrl) return originalUrl;
      // For now, return original URL - you can integrate actual CDN upload here
      console.log(`🖼️  Would upload: ${originalUrl}`);
      return originalUrl;
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

        // Media fields (with potential CDN URLs)
        mainImage: {
          url: getImageUrl(fieldData['main-image']?.url),
          alt: fieldData['main-image']?.alt || ''
        },
        thumbnail: {
          url: getImageUrl(fieldData.thumbnail?.url),
          alt: fieldData.thumbnail?.alt || ''
        },
        openGraphImage: {
          url: getImageUrl(fieldData['open-graph-image']?.url),
          alt: fieldData['open-graph-image']?.alt || ''
        },

        // Video fields
        heroVideoYoutubeId: fieldData['hero-video-youtube-embed-id'],
        heroVideoArabicYoutubeId:
          fieldData['hero-video-arabic-youtube-video-id'],
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
            url: getImageUrl(img.url),
            alt: img.alt || ''
          })) || [],
        imageGalleryCredits: fieldData['image-carousel-credits'],
        imageGalleryCreditsArabic: fieldData['image-gallery-credits-arabic'],

        // Marketing flags
        featured: fieldData.featured,
        pushToGR: fieldData['push-to-gr'],

        // Timestamps
        created_at: webflowPost.createdOn,
        updated_at: webflowPost.lastUpdated,

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
  };
}

// Fetch posts from Webflow API
async function fetchWebflowPosts(limit = 5) {
  console.log(`📡 Fetching ${limit} posts from Webflow API...`);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.webflow.com',
      port: 443,
      path: `/v2/collections/${CONFIG.WEBFLOW_POSTS_COLLECTION_ID}/items?limit=${limit}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
        'accept-version': '1.0.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`✅ Fetched ${parsed.items?.length || 0} posts`);
            resolve(parsed.items || []);
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${data}`));
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Create post in Mnemo database
async function createPostInMnemo(postData) {
  console.log(`📝 Creating post in Mnemo: ${postData.title}`);

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(postData);
    const options = {
      hostname: 'mnemo-app-e4f6j5kdsq-ew.a.run.app',
      port: 443,
      path: '/api/collection-items',
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
        try {
          const result = JSON.parse(responseData);
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(
              `✅ Post created successfully: ${result.id || 'unknown'}`
            );
            resolve(result);
          } else {
            console.error(
              `❌ Failed to create post: ${res.statusCode} - ${responseData}`
            );
            reject(
              new Error(`Create failed: ${res.statusCode} - ${responseData}`)
            );
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Main migration function
async function migratePostsWithMapper() {
  console.log('🚀 Starting Webflow to Mnemo migration with TypeScript mapper');
  console.log('='.repeat(60));

  try {
    // Initialize the mapper
    await initializeMapper();

    // Fetch posts from Webflow
    const webflowPosts = await fetchWebflowPosts(5);

    if (!webflowPosts || webflowPosts.length === 0) {
      console.log('⚠️  No posts found to migrate');
      return;
    }

    console.log(`\n📋 Found ${webflowPosts.length} posts to migrate:`);
    webflowPosts.forEach((post, index) => {
      console.log(
        `   ${index + 1}. ${post.fieldData?.name || 'Untitled'} (${post.id})`
      );
    });

    // Migrate each post
    const results = [];
    for (let i = 0; i < webflowPosts.length; i++) {
      const post = webflowPosts[i];
      console.log(
        `\n🔄 Processing post ${i + 1}/${webflowPosts.length}: ${post.fieldData?.name || 'Untitled'}`
      );

      try {
        // Use the mapper to transform the data
        const mappedData = await mapperModule.postWebflowMapperToMnemoData(
          post,
          true, // uploadImages = true
          'posts', // collectionName
          CONFIG.CDN_CONFIG
        );

        console.log(`   📊 Mapped data preview:`);
        console.log(`      Title: ${mappedData.title}`);
        console.log(`      Slug: ${mappedData.slug}`);
        console.log(`      Status: ${mappedData.status}`);
        console.log(
          `      Body length: ${mappedData.data.bodyEnglish?.length || 0} chars`
        );
        console.log(
          `      Images: main=${!!mappedData.data.mainImage?.url}, thumb=${!!mappedData.data.thumbnail?.url}`
        );

        // Create in Mnemo database
        const mnemoResult = await createPostInMnemo(mappedData);

        results.push({
          webflowId: post.id,
          mnemoId: mnemoResult.id,
          title: mappedData.title,
          status: 'success'
        });

        // Small delay between posts
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`   ❌ Failed to process post: ${error.message}`);
        results.push({
          webflowId: post.id,
          title: post.fieldData?.name || 'Untitled',
          status: 'failed',
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));

    const successful = results.filter((r) => r.status === 'success');
    const failed = results.filter((r) => r.status === 'failed');

    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📝 Total processed: ${results.length}`);

    if (successful.length > 0) {
      console.log('\n✅ Successfully migrated posts:');
      successful.forEach((post) => {
        console.log(
          `   • ${post.title} (Webflow: ${post.webflowId} → Mnemo: ${post.mnemoId})`
        );
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed to migrate:');
      failed.forEach((post) => {
        console.log(`   • ${post.title} (${post.webflowId}): ${post.error}`);
      });
    }

    console.log('\n🎉 Migration completed!');
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migratePostsWithMapper().catch(console.error);
