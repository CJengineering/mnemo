#!/usr/bin/env node

/**
 * Complete Webflow News Migration Script
 *
 * This script migrates ALL news items from Webflow to Mnemo database.
 * Collection ID: 61ee828a15a3185c99bde543 (News)
 * Total Items: 1,293
 *
 * Uses the cloud database endpoint and skips items that already exist.
 * Phase 1: Preserves Webflow URLs for images (no CDN upload).
 */

import https from 'https';
import fs from 'fs';

// Configuration
const CONFIG = {
  WEBFLOW_API_BASE: 'https://api.webflow.com/v2',
  WEBFLOW_SITE_ID: process.env.WEBFLOW_SITE_ID || '612cede33b271d1b5bac6200',
  WEBFLOW_NEWS_COLLECTION_ID:
    process.env.WEBFLOW_NEW_COLLECTION_ID || '61ee828a15a3185c99bde543',
  WEBFLOW_API_TOKEN:
    process.env.WEBFLOW_API_TOKEN ||
    'd2eac7bfcd8cc230db56e0dd9f9c7c7f4652db6195ad674c0b7939bb438fb33c',
  MNEMO_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app',
  ENABLE_CDN_UPLOAD: false, // Phase 1: No CDN upload
  BATCH_SIZE: 50, // Reduced batch size to avoid rate limits
  DELAY_BETWEEN_REQUESTS: 2000, // Increased delay
  DELAY_BETWEEN_BATCHES: 5000 // Additional delay between API batches
};

/**
 * JavaScript implementation of the news mapper function
 */
function createNewsMapper() {
  return async function newsWebflowMapperToMnemoData(
    webflowNews,
    uploadImages = false
  ) {
    const { fieldData } = webflowNews;

    // Transform status
    const status = webflowNews.isDraft ? 'draft' : 'published';

    // Build the mapped collection item
    const mnemoItem = {
      id: webflowNews.id,
      title: fieldData.name || 'Untitled News',
      type: 'news',
      slug: fieldData.slug || webflowNews.id,
      status: status,

      data: {
        // Basic news info
        title: fieldData.name || 'Untitled News',
        slug: fieldData.slug || webflowNews.id,
        status: status,
        summary: fieldData.summary || '',

        // Bilingual content
        arabicTitle: fieldData['arabic-title'],

        // Publication details
        datePublished: fieldData['date-published'],
        externalLink: fieldData['external-link'],

        // Media fields (with Webflow URLs preserved)
        heroImage: fieldData['hero-image']
          ? {
              url: fieldData['hero-image'].url,
              alt: fieldData['hero-image'].alt || ''
            }
          : undefined,
        thumbnail: fieldData.thumbnail
          ? {
              url: fieldData.thumbnail.url,
              alt: fieldData.thumbnail.alt || ''
            }
          : undefined,

        // Programme relationships (convert to Mnemo format)
        programmeLabel: fieldData.programme
          ? {
              id: fieldData.programme,
              slug: fieldData.programme
            }
          : undefined,
        relatedProgrammes:
          fieldData['programme-s']?.map((progId) => ({
            id: progId,
            slug: progId
          })) || [],

        // People relationships
        people:
          fieldData.people?.map((personId) => ({
            id: personId,
            slug: personId
          })) || [],

        // Sources and external content
        sources: fieldData.sources || '',

        // Marketing flags
        featured: fieldData.featured || false,
        pushToGR: fieldData['push-to-gr'] || false,
        removeFromNewsGrid: fieldData['remove-from-news-grid'] || false,

        // Webflow-specific metadata (for reference/debugging)
        webflowMeta: {
          webflowId: webflowNews.id,
          cmsLocaleId: webflowNews.cmsLocaleId,
          lastPublished: webflowNews.lastPublished,
          lastUpdated: webflowNews.lastUpdated,
          createdOn: webflowNews.createdOn,
          isArchived: webflowNews.isArchived,
          fileIds: {
            heroImage: fieldData['hero-image']?.fileId,
            thumbnail: fieldData.thumbnail?.fileId
          }
        }
      }
    };

    return mnemoItem;
  };
}

/**
 * Make HTTP request helper with retry logic
 */
function makeRequest(url, options = {}, retries = 3) {
  return new Promise((resolve, reject) => {
    const attemptRequest = (attempt) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve(data);
            }
          } else if (res.statusCode === 429 && attempt < retries) {
            // Rate limit hit, wait and retry with exponential backoff
            const delay = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s
            console.log(
              `   ⏳ Rate limit hit, retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${retries})`
            );
            setTimeout(() => attemptRequest(attempt + 1), delay);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    };

    attemptRequest(0);
  });
}

/**
 * Get total count of news items in Webflow collection
 */
async function getWebflowNewsCount() {
  console.log('📊 Getting total news count from Webflow...');

  const url = `${CONFIG.WEBFLOW_API_BASE}/collections/${CONFIG.WEBFLOW_NEWS_COLLECTION_ID}/items?limit=1`;

  const data = await makeRequest(url, {
    headers: {
      Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
      'accept-version': '1.0.0',
      'Content-Type': 'application/json'
    }
  });

  return data.pagination?.total || 0;
}

/**
 * Fetch all news from Webflow API with pagination
 */
async function fetchAllWebflowNews() {
  console.log('📡 Fetching all news from Webflow API...');

  const totalNews = await getWebflowNewsCount();
  console.log(`   Total news in Webflow: ${totalNews}`);

  let allNews = [];
  let offset = 0;
  const limit = CONFIG.BATCH_SIZE;

  while (offset < totalNews) {
    console.log(
      `   Fetching batch: ${offset + 1}-${Math.min(offset + limit, totalNews)} of ${totalNews}`
    );

    const url = `${CONFIG.WEBFLOW_API_BASE}/collections/${CONFIG.WEBFLOW_NEWS_COLLECTION_ID}/items?limit=${limit}&offset=${offset}`;

    const data = await makeRequest(url, {
      headers: {
        Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json'
      }
    });

    if (data.items && data.items.length > 0) {
      allNews = allNews.concat(data.items);
      console.log(`   ✅ Fetched ${data.items.length} news items`);
    }

    offset += limit;

    // Add delay between requests to be respectful to API
    if (offset < totalNews) {
      console.log(
        `   ⏳ Waiting ${CONFIG.DELAY_BETWEEN_BATCHES / 1000}s before next batch...`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES)
      );
    }
  }

  console.log(`📦 Total news fetched: ${allNews.length}`);
  return allNews;
}

/**
 * Check existing news in Mnemo database
 */
async function getExistingNewsInMnemo() {
  console.log('🔍 Checking existing news in Mnemo...');

  try {
    const response = await makeRequest(
      `${CONFIG.MNEMO_API_BASE}/api/collection-items?type=news&limit=2000`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const existingNews = Array.isArray(response)
      ? response
      : response.items || [];
    console.log(`   Found ${existingNews.length} existing news items`);

    // Create a Set of existing slugs for fast lookup
    const existingSlugs = new Set();
    existingNews.forEach((newsItem) => {
      if (newsItem.slug) existingSlugs.add(newsItem.slug);
      if (newsItem.data?.webflowMeta?.webflowId) {
        existingSlugs.add(newsItem.data.webflowMeta.webflowId);
      }
    });

    return existingSlugs;
  } catch (error) {
    console.log(`   ⚠️ Error fetching existing news: ${error.message}`);
    return new Set();
  }
}

/**
 * Create news item in Mnemo database
 */
async function createNewsInMnemo(mappedNews, newsTitle) {
  try {
    const response = await makeRequest(
      `${CONFIG.MNEMO_API_BASE}/api/collection-items`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mappedNews)
      }
    );

    return {
      success: true,
      data: response
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process single news item
 */
async function processNewsItem(webflowNews, existingSlugs, mapper) {
  const newsTitle = webflowNews.fieldData?.name || webflowNews.id;
  const newsSlug = webflowNews.fieldData?.slug || webflowNews.id;

  // Check if news already exists
  if (existingSlugs.has(newsSlug) || existingSlugs.has(webflowNews.id)) {
    return {
      status: 'skipped',
      webflowId: webflowNews.id,
      title: newsTitle,
      slug: newsSlug,
      reason: 'Already exists'
    };
  }

  console.log(`   🔄 Mapping news data...`);
  const mappedNews = await mapper(webflowNews, CONFIG.ENABLE_CDN_UPLOAD);

  console.log(`   🚀 Creating news in Mnemo...`);
  const result = await createNewsInMnemo(mappedNews, newsTitle);

  if (result.success) {
    console.log(`   ✅ Successfully created news`);
    return {
      status: 'created',
      webflowId: webflowNews.id,
      mnemoId: result.data.id || 'unknown',
      title: newsTitle,
      slug: newsSlug,
      data: result.data
    };
  } else {
    console.log(`   ❌ Failed to create news: ${result.error}`);
    return {
      status: 'failed',
      webflowId: webflowNews.id,
      title: newsTitle,
      slug: newsSlug,
      error: result.error
    };
  }
}

/**
 * Main migration function
 */
async function migrateAllNews() {
  console.log('🎯 WEBFLOW NEWS TO MNEMO MIGRATION');
  console.log(
    '======================================================================'
  );
  console.log('Phase 1: Preserve Webflow URLs (no CDN upload)');
  console.log('Collection: News');
  console.log(`Started: ${new Date().toLocaleString()}\n`);

  const startTime = Date.now();
  const results = {
    total: 0,
    processed: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    news: [],
    errors: []
  };

  try {
    // Validate configuration
    if (!CONFIG.WEBFLOW_API_TOKEN || !CONFIG.WEBFLOW_NEWS_COLLECTION_ID) {
      throw new Error('Missing required Webflow configuration');
    }

    console.log('✅ Configuration validated');
    console.log(
      `   Webflow API Token: ${CONFIG.WEBFLOW_API_TOKEN.substring(0, 20)}...`
    );
    console.log(`   Site ID: ${CONFIG.WEBFLOW_SITE_ID}`);
    console.log(`   News Collection ID: ${CONFIG.WEBFLOW_NEWS_COLLECTION_ID}`);

    // Step 1: Fetch all news from Webflow
    const webflowNews = await fetchAllWebflowNews();
    results.total = webflowNews.length;

    if (webflowNews.length === 0) {
      console.log('❗ No news found in Webflow collection');
      return;
    }

    // Step 2: Check existing news in Mnemo
    const existingSlugs = await getExistingNewsInMnemo();

    // Step 3: Create mapper
    const mapper = createNewsMapper();

    // Step 4: Process each news item
    console.log('🔄 Processing news migration...\n');

    for (let i = 0; i < webflowNews.length; i++) {
      const newsItem = webflowNews[i];
      results.processed++;

      console.log(
        `📰 Processing news ${i + 1}/${webflowNews.length}: "${newsItem.fieldData?.name || newsItem.id}"`
      );

      const result = await processNewsItem(newsItem, existingSlugs, mapper);
      results.news.push(result);

      if (result.status === 'created') {
        results.created++;
      } else if (result.status === 'skipped') {
        results.skipped++;
      } else if (result.status === 'failed') {
        results.failed++;
        results.errors.push({
          webflowId: result.webflowId,
          title: result.title,
          slug: result.slug,
          error: result.error
        });
      }

      // Add delay between requests
      if (i < webflowNews.length - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.DELAY_BETWEEN_REQUESTS)
        );
      }
    }

    // Step 5: Generate migration report
    const endTime = Date.now();
    const processingTime = Math.round((endTime - startTime) / 1000);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `complete-webflow-news-migration-report-${timestamp}.json`;

    const report = {
      timestamp: new Date().toISOString(),
      migrationInfo: {
        type: 'Webflow News to Mnemo Migration',
        scriptVersion: '1.0.0',
        phase: 'Phase 1 - Preserve Webflow URLs'
      },
      summary: {
        totalNews: results.total,
        processed: results.processed,
        created: results.created,
        skipped: results.skipped,
        failed: results.failed,
        successRate: `${((results.created / results.total) * 100).toFixed(1)}%`,
        processingTime: `${processingTime} seconds`
      },
      webflowAPI: {
        token: `${CONFIG.WEBFLOW_API_TOKEN.substring(0, 20)}...`,
        siteId: CONFIG.WEBFLOW_SITE_ID,
        collectionId: CONFIG.WEBFLOW_NEWS_COLLECTION_ID,
        endpoint: CONFIG.WEBFLOW_API_BASE
      },
      mnemoAPI: {
        endpoint: CONFIG.MNEMO_API_BASE,
        collectionType: 'news'
      },
      imageStrategy: {
        phase: 1,
        approach: 'Preserve Webflow URLs',
        description: 'Images remain at Webflow URLs, not uploaded to CDN'
      },
      news: results.news,
      errors: results.errors,
      fieldMappings: {
        name: 'title',
        slug: 'slug',
        'date-published': 'datePublished',
        'external-link': 'externalLink',
        summary: 'summary',
        'arabic-title': 'arabicTitle',
        'hero-image': 'heroImage',
        thumbnail: 'thumbnail',
        programme: 'programmeLabel',
        'programme-s': 'relatedProgrammes',
        people: 'people',
        sources: 'sources',
        featured: 'featured',
        'push-to-gr': 'pushToGR',
        'remove-from-news-grid': 'removeFromNewsGrid'
      }
    };

    await fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Step 6: Final summary
    console.log(`📄 Migration report saved: ${reportPath}\n`);

    console.log('🎉 NEWS MIGRATION COMPLETE!');
    console.log('==================================================');
    console.log(
      `✅ Total news processed: ${results.processed}/${results.total}`
    );
    console.log(`🆕 Successfully created: ${results.created}`);
    console.log(`⏭️ Skipped (already exist): ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(
      `📊 Success rate: ${((results.created / results.total) * 100).toFixed(1)}%`
    );
    console.log(`⏱️ Processing time: ${processingTime} seconds`);

    console.log(
      `\n🔗 View migrated news at: ${CONFIG.MNEMO_API_BASE}/collections`
    );

    if (results.failed > 0) {
      console.log(
        `\n⚠️ ${results.failed} news items failed to migrate. Check the report for details.`
      );
    }

    console.log(`\n📄 Detailed report: ${reportPath}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateAllNews();
