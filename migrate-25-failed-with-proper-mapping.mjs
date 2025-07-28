#!/usr/bin/env node

import https from 'https';
import fs from 'fs';

// Hardcoded configuration
const CONFIG = {
  WEBFLOW_API_TOKEN:
    'd2eac7bfcd8cc230db56e0dd9f9c7c7f4652db6195ad674c0b7939bb438fb33c',
  WEBFLOW_SITE_ID: '612cede33b271d1b5bac6200',
  WEBFLOW_POSTS_COLLECTION_ID: '61ee828a15a3183262bde542',
  WEBFLOW_EVENTS_COLLECTION_ID: '6225fe8b1f52b40001a99d66',
  WEBFLOW_NEWS_COLLECTION_ID: '61ee828a15a3185c99bde543',
  WEBFLOW_API_BASE: 'https://api.webflow.com/v2',
  MNEMO_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app'
};

// List of 25 failed items with their collection types
const FAILED_ITEMS = [
  // Posts (5 items)
  { webflowId: '6870e7527eb371f27aec0e61', collection: 'posts', type: 'post' },
  { webflowId: '686fe58669daeaf5bcfdd8d1', collection: 'posts', type: 'post' },
  { webflowId: '686b69c87111cae2985c825f', collection: 'posts', type: 'post' },
  { webflowId: '686530ec3e19111feef62a28', collection: 'posts', type: 'post' },
  { webflowId: '686270e505d9e67ccb2bc5bf', collection: 'posts', type: 'post' },

  // Events (1 item)
  {
    webflowId: '6226107ef58d7bf6bf5c3e62',
    collection: 'events',
    type: 'event'
  },

  // News (19 items)
  { webflowId: '65fc5914ed4f7f91e494ba1c', collection: 'news', type: 'news' },
  { webflowId: '65f8324d3b5af7f9dec2b886', collection: 'news', type: 'news' },
  { webflowId: '65c9e4aa36c6ba62b5c8bce4', collection: 'news', type: 'news' },
  { webflowId: '65a400d4b4c70a2da59fee52', collection: 'news', type: 'news' },
  { webflowId: '658811d55c0051e82dbab505', collection: 'news', type: 'news' },
  { webflowId: '65829c03557887ff4d7a75f7', collection: 'news', type: 'news' },
  { webflowId: '6579b88a88feb40aaf92a143', collection: 'news', type: 'news' },
  { webflowId: '65659abe8e0f991929ff339c', collection: 'news', type: 'news' },
  { webflowId: '65118a7a165f4836fb31bbf2', collection: 'news', type: 'news' },
  { webflowId: '64988c4522f0976c82699806', collection: 'news', type: 'news' },
  { webflowId: '64986de99d67d71b541f49ed', collection: 'news', type: 'news' },
  { webflowId: '64288d914fa7010dc3b72f69', collection: 'news', type: 'news' },
  { webflowId: '63107df76a18aa5250d80f77', collection: 'news', type: 'news' },
  { webflowId: '62caffae9749a00e88957673', collection: 'news', type: 'news' },
  { webflowId: '62b03751c8cf57b21d45ca2a', collection: 'news', type: 'news' },
  { webflowId: '629f5aca3d1735cc6e84f033', collection: 'news', type: 'news' },
  { webflowId: '6284ff1b0c117a0e76ba8cc6', collection: 'news', type: 'news' },
  { webflowId: '625018b76b6436394cbe5a83', collection: 'news', type: 'news' },
  { webflowId: '6200db52873d78066d272f1e', collection: 'news', type: 'news' }
];

/**
 * POST Mapper - Webflow to Mnemo
 */
function mapPostWebflowToMnemo(webflowPost) {
  const fieldData = webflowPost.fieldData || {};
  const title = fieldData.name || fieldData.title || 'Untitled';
  const slug = (fieldData.slug || '').toLowerCase() + '-2'; // Add -2 suffix

  const mnemoItem = {
    id: webflowPost.id,
    title: title,
    type: 'post',
    slug: slug,
    status: webflowPost.isDraft ? 'draft' : 'published',
    data: {
      // Required fields
      title: title,
      slug: slug,
      status: webflowPost.isDraft ? 'draft' : 'published',

      // Content
      summary: fieldData.summary || '',
      body: fieldData.body || '',

      // Images
      heroImage: fieldData['hero-image'] || null,
      thumbnail: fieldData.thumbnail || null,

      // SEO
      seoTitle: fieldData['seo-title'] || fieldData.name || '',
      seoDescription: fieldData['seo-description'] || fieldData.summary || '',

      // Dates
      publishDate: fieldData['publish-date'] || new Date().toISOString(),

      // Marketing flags
      featured: fieldData.featured || false,
      pushToGR: fieldData['push-to-gr'] || false,

      // Relationships (will be populated later)
      people: fieldData.people || [],
      programmes: fieldData.programmes || [],

      // Webflow metadata
      webflowMeta: {
        webflowId: webflowPost.id,
        lastUpdated: webflowPost.lastUpdated,
        createdOn: webflowPost.createdOn
      }
    }
  };

  return mnemoItem;
}

/**
 * EVENT Mapper - Webflow to Mnemo
 */
function mapEventWebflowToMnemo(webflowEvent) {
  const fieldData = webflowEvent.fieldData || {};
  const title = fieldData.name || 'Untitled Event';
  const slug = (fieldData.slug || '').toLowerCase() + '-2'; // Add -2 suffix

  const mnemoItem = {
    id: webflowEvent.id,
    title: title,
    type: 'event',
    slug: slug,
    status: webflowEvent.isDraft ? 'draft' : 'published',
    data: {
      // Required fields
      title: title,
      slug: slug,
      status: webflowEvent.isDraft ? 'draft' : 'published',

      // Content
      summary: fieldData.summary || '',
      body: fieldData.description || '',

      // Event specific
      eventDate: fieldData['event-date'] || new Date().toISOString(),
      endDate: fieldData['end-date'] || null,
      location: fieldData.location || '',
      city: fieldData.city || '',
      address: fieldData.address || '',

      // Images
      heroImage: fieldData['hero-image'] || null,

      // SEO
      seoTitle: fieldData['seo-title'] || fieldData.name || '',

      // Marketing flags
      featured: fieldData.featured || false,
      pushToGR: fieldData['push-to-gr'] || false,

      // Relationships
      people: fieldData.people || [],
      programmes: fieldData.programmes || [],

      // Webflow metadata
      webflowMeta: {
        webflowId: webflowEvent.id,
        lastUpdated: webflowEvent.lastUpdated,
        createdOn: webflowEvent.createdOn
      }
    }
  };

  return mnemoItem;
}

/**
 * NEWS Mapper - Webflow to Mnemo
 */
function mapNewsWebflowToMnemo(webflowNews) {
  const fieldData = webflowNews.fieldData || {};

  const mnemoItem = {
    type: 'news',
    title: fieldData.name || 'Untitled News',
    slug: (fieldData.slug || '').toLowerCase() + '-2', // Add -2 suffix
    data: {
      // Content
      summary: fieldData.summary || '',
      body: fieldData.body || '',

      // News specific
      publishDate: fieldData['publish-date'] || new Date().toISOString(),
      author: fieldData.author || '',
      category: fieldData.category || '',

      // External links
      externalLink: fieldData['external-link'] || '',

      // Images
      heroImage: fieldData['hero-image'] || null,
      thumbnail: fieldData.thumbnail || null,

      // SEO
      seoTitle: fieldData['seo-title'] || fieldData.name || '',
      seoDescription: fieldData['seo-description'] || fieldData.summary || '',

      // Marketing flags
      featured: fieldData.featured || false,
      pushToGR: fieldData['push-to-gr'] || false,
      removeFromNewsGrid: fieldData['remove-from-news-grid'] || false,

      // Relationships
      people: fieldData.people || [],
      programmes: fieldData.programmes || [],

      // Sources
      sources: fieldData.sources || '',

      // Webflow metadata
      webflowMeta: {
        webflowId: webflowNews.id,
        lastUpdated: webflowNews.lastUpdated,
        createdOn: webflowNews.createdOn
      }
    }
  };

  return mnemoItem;
}

/**
 * HTTP Request helper
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
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
  });
}

/**
 * Fetch single item from Webflow
 */
async function fetchWebflowItem(itemId, collectionId) {
  const url = `${CONFIG.WEBFLOW_API_BASE}/collections/${collectionId}/items/${itemId}`;

  return makeRequest(url, {
    headers: {
      Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
      'accept-version': '1.0.0',
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Create item in Mnemo
 */
async function createMnemoItem(mappedItem) {
  return makeRequest(`${CONFIG.MNEMO_API_BASE}/api/collection-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(mappedItem)
  });
}

/**
 * Get collection ID for collection type
 */
function getCollectionId(collection) {
  switch (collection) {
    case 'posts':
      return CONFIG.WEBFLOW_POSTS_COLLECTION_ID;
    case 'events':
      return CONFIG.WEBFLOW_EVENTS_COLLECTION_ID;
    case 'news':
      return CONFIG.WEBFLOW_NEWS_COLLECTION_ID;
    default:
      throw new Error(`Unknown collection: ${collection}`);
  }
}

/**
 * Get mapper function for collection type
 */
function getMapper(collection) {
  switch (collection) {
    case 'posts':
      return mapPostWebflowToMnemo;
    case 'events':
      return mapEventWebflowToMnemo;
    case 'news':
      return mapNewsWebflowToMnemo;
    default:
      throw new Error(`No mapper for collection: ${collection}`);
  }
}

/**
 * Main migration function
 */
async function migrateFailedItems() {
  console.log('🚀 MIGRATING 25 FAILED ITEMS WITH -2 SUFFIX');
  console.log('='.repeat(60));

  const results = {
    timestamp: new Date().toISOString(),
    total: FAILED_ITEMS.length,
    successful: 0,
    failed: 0,
    items: []
  };

  for (let i = 0; i < FAILED_ITEMS.length; i++) {
    const item = FAILED_ITEMS[i];
    console.log(
      `\n📝 [${i + 1}/${FAILED_ITEMS.length}] Processing ${item.collection} item: ${item.webflowId}`
    );

    try {
      // 1. Fetch from Webflow
      console.log('   📥 Fetching from Webflow...');
      const collectionId = getCollectionId(item.collection);
      const webflowData = await fetchWebflowItem(item.webflowId, collectionId);

      // 2. Map to Mnemo format
      console.log('   🔄 Mapping data...');
      const mapper = getMapper(item.collection);
      const mappedData = mapper(webflowData);

      console.log(`   📋 Title: "${mappedData.title}"`);
      console.log(`   🔗 Slug: "${mappedData.slug}"`);
      console.log(`   📑 Type: "${mappedData.type}"`);

      // 3. Create in Mnemo
      console.log('   📤 Creating in Mnemo...');
      const mnemoResponse = await createMnemoItem(mappedData);

      console.log('   ✅ SUCCESS!');
      results.successful++;
      results.items.push({
        webflowId: item.webflowId,
        collection: item.collection,
        title: mappedData.title,
        slug: mappedData.slug,
        status: 'success',
        mnemoId: mnemoResponse.collectionItem?.id || 'unknown'
      });
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      results.failed++;
      results.items.push({
        webflowId: item.webflowId,
        collection: item.collection,
        status: 'failed',
        error: error.message
      });
    }

    // Small delay between items
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Save results
  const reportFile = `failed-items-migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION COMPLETE!');
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📄 Report saved: ${reportFile}`);
}

// Run the migration
migrateFailedItems().catch(console.error);
