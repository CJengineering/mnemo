#!/usr/bin/env node

/**
 * Simple migration script for the 25 failed items
 * Just copies the working migration logic but filters for specific items
 */

import https from 'https';
import fs from 'fs';

// Configuration - hardcoded tokens as requested
const CONFIG = {
  WEBFLOW_API_BASE: 'https://api.webflow.com/v2',
  WEBFLOW_SITE_ID: '612cede33b271d1b5bac6200',
  WEBFLOW_POSTS_COLLECTION_ID: '61ee828a15a3183262bde542',
  WEBFLOW_EVENTS_COLLECTION_ID: '6225fe8b1f52b40001a99d66',
  WEBFLOW_NEWS_COLLECTION_ID: '61ee828a15a3185c99bde543',
  WEBFLOW_API_TOKEN:
    'd2eac7bfcd8cc230db56e0dd9f9c7c7f4652db6195ad674c0b7939bb438fb33c',
  MNEMO_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app',
  DELAY_BETWEEN_REQUESTS: 1000
};

// The 25 specific failed items - organized by collection
const FAILED_ITEMS = {
  posts: [
    '6870e7527eb371f27aec0e61', // Underwater video systems empower a new generation of ocean champions in Monaco
    '686fe58669daeaf5bcfdd8d1', // Noha Magdy explains the impact of the MENA Scholars Fellowship
    '686b69c87111cae2985c825f', // J-PAL MENA celebrates five years
    '686530ec3e19111feef62a28', // Andrea Bocelli performs live in Pompeii
    '686270e505d9e67ccb2bc5bf' // Summer craft workshops to delight Al-Darb Al-Ahmar children
  ],
  events: [
    '6226107ef58d7bf6bf5c3e62' // Ark Re-imagined: the Expeditionary Pavilion
  ],
  news: [
    '65fc5914ed4f7f91e494ba1c', // J-PAL Africa, the City of Cape Town and Community Jameel launch new Water, Air and Energy Lab
    '65f8324d3b5af7f9dec2b886', // Imperial opens major new building for School of Public Health
    '65c9e4aa36c6ba62b5c8bce4', // Paramedics and first responders in Egypt receive specialist training
    '65a400d4b4c70a2da59fee52', // J-PAL announces new, multi-year training partnership in Côte d'Ivoire
    '658811d55c0051e82dbab505', // CLIMAVORE Assembly - announcements
    '65829c03557887ff4d7a75f7', // MIT Jameel Clinic hosts first conference in the Kingdom
    '6579b88a88feb40aaf92a143', // University of Edinburgh and the International Livestock Research Institute
    '65659abe8e0f991929ff339c', // Pregnant mothers and newborn babies evacuated from Gaza
    '65118a7a165f4836fb31bbf2', // J-PAL MENA at AUC to co-host a regional conference on climate adaptation
    '64988c4522f0976c82699806', // Young researchers pursue Nobel Prize-winning approach
    '64986de99d67d71b541f49ed', // J-PAL hosts colloquium in Paris in celebration of 20 years
    '64288d914fa7010dc3b72f69', // Royal College of Art and Community Jameel announce CLIMAVORE partnership
    '63107df76a18aa5250d80f77', // Breakthrough in detecting Parkinson's using AI and breathing patterns
    '62caffae9749a00e88957673', // Arts and minds: Healing-post conflict trauma in the Middle East
    '62b03751c8cf57b21d45ca2a', // Anticipatory action to mitigate drought-induced crises
    '629f5aca3d1735cc6e84f033', // Islamic Development Bank, Community Jameel, and Abdul Latif Jameel Poverty Action Lab
    '6284ff1b0c117a0e76ba8cc6', // Dangerous Delay 2: The Cost of Inaction
    '625018b76b6436394cbe5a83', // Monaco - Alexandria, The Great Detour
    '6200db52873d78066d272f1e' // Jameel-Toyota Scholarship at MIT celebrates its 25th anniversary
  ]
};

/**
 * Make HTTP request using built-in https module
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ ...parsed, status: res.statusCode });
        } catch (e) {
          resolve({ data, status: res.statusCode });
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
 * News mapper function (copy from working script)
 */
function newsWebflowMapperToMnemoData(webflowNews, uploadImages = false) {
  const { fieldData } = webflowNews;
  const status = webflowNews.isDraft ? 'draft' : 'published';

  const mnemoItem = {
    id: webflowNews.id,
    title: fieldData.name || 'Untitled News',
    type: 'news',
    slug: (fieldData.slug || webflowNews.id) + '-2', // Add -2 suffix
    status: status,
    data: {
      title: fieldData.name || 'Untitled News',
      slug: (fieldData.slug || webflowNews.id) + '-2', // Add -2 suffix
      featured: fieldData.featured || false,
      pushToGR: fieldData['push-to-gr'] || false,
      seoTitle: fieldData['seo-title'] || null,
      seoDescription: fieldData['seo-description'] || null,
      publishDate:
        fieldData['publish-date'] ||
        fieldData['created-on'] ||
        new Date().toISOString(),
      summary: fieldData.summary || null,
      heroImage: fieldData['hero-image']
        ? {
            url: fieldData['hero-image'].url,
            alt: fieldData['hero-image'].alt || null
          }
        : null,
      externalLink: fieldData['external-link'] || null,
      people: fieldData.people
        ? fieldData.people.map((p) => ({
            id: p.id || p,
            slug: p.slug || p.id || p
          }))
        : [],
      publications: fieldData.publications
        ? fieldData.publications.map((p) => ({
            id: p.id || p,
            slug: p.slug || p.id || p
          }))
        : [],
      programmes: fieldData.programmes
        ? fieldData.programmes.map((p) => ({
            id: p.id || p,
            slug: p.slug || p.id || p
          }))
        : [],
      partners: fieldData.partners
        ? fieldData.partners.map((p) => ({
            id: p.id || p,
            slug: p.slug || p.id || p
          }))
        : [],
      innovations: fieldData.innovations
        ? fieldData.innovations.map((i) => ({
            id: i.id || i,
            slug: i.slug || i.id || i
          }))
        : [],
      tags: fieldData.tags || []
    }
  };

  return mnemoItem;
}

/**
 * Event mapper function
 */
function eventWebflowMapperToMnemoData(webflowEvent, uploadImages = false) {
  const { fieldData } = webflowEvent;
  const status = webflowEvent.isDraft ? 'draft' : 'published';

  const mnemoItem = {
    id: webflowEvent.id,
    title: fieldData.name || 'Untitled Event',
    type: 'event',
    slug: (fieldData.slug || webflowEvent.id) + '-2', // Add -2 suffix
    status: status,
    data: {
      title: fieldData.name || 'Untitled Event',
      slug: (fieldData.slug || webflowEvent.id) + '-2', // Add -2 suffix
      featured: fieldData.featured || false,
      pushToGR: fieldData['push-to-gr'] || false,
      seoTitle: fieldData['seo-title'] || null,
      eventDate: fieldData['event-date'] || null,
      endDate: fieldData['end-date'] || null,
      heroImage: fieldData['hero-image']
        ? {
            url: fieldData['hero-image'].url,
            alt: fieldData['hero-image'].alt || null
          }
        : null,
      description: fieldData.description || null,
      summary: fieldData.summary || null,
      location: fieldData.location || null,
      city: fieldData.city || null,
      address: fieldData.address || null,
      organisers: fieldData.organisers || null,
      rsvpLink: fieldData['rsvp-link'] || null,
      people: fieldData.people
        ? fieldData.people.map((p) => ({
            id: p.id || p,
            slug: p.slug || p.id || p
          }))
        : [],
      programmes: fieldData.programmes
        ? fieldData.programmes.map((p) => ({
            id: p.id || p,
            slug: p.slug || p.id || p
          }))
        : [],
      tags: fieldData.tags || []
    }
  };

  return mnemoItem;
}

/**
 * Post mapper function
 */
function postWebflowMapperToMnemoData(webflowPost, uploadImages = false) {
  const { fieldData } = webflowPost;
  const status = webflowPost.isDraft ? 'draft' : 'published';

  const mnemoItem = {
    id: webflowPost.id,
    title: fieldData.name || 'Untitled Post',
    type: 'post',
    slug: (fieldData.slug || webflowPost.id) + '-2', // Add -2 suffix
    status: status,
    data: {
      title: fieldData.name || 'Untitled Post',
      slug: (fieldData.slug || webflowPost.id) + '-2', // Add -2 suffix
      featured: fieldData.featured || false,
      pushToGR: fieldData['push-to-gr'] || false,
      seoTitle: fieldData['seo-title'] || null,
      seoDescription: fieldData['seo-description'] || null,
      publishDate:
        fieldData['publish-date'] ||
        fieldData['created-on'] ||
        new Date().toISOString(),
      summary: fieldData.summary || null,
      heroImage: fieldData['hero-image']
        ? {
            url: fieldData['hero-image'].url,
            alt: fieldData['hero-image'].alt || null
          }
        : null,
      content: fieldData.content || null,
      people: fieldData.people
        ? fieldData.people.map((p) => ({
            id: p.id || p,
            slug: p.slug || p.id || p
          }))
        : [],
      programmes: fieldData.programmes
        ? fieldData.programmes.map((p) => ({
            id: p.id || p,
            slug: p.slug || p.id || p
          }))
        : [],
      tags: fieldData.tags || []
    }
  };

  return mnemoItem;
}

/**
 * Fetch item from Webflow
 */
async function fetchWebflowItem(collectionId, itemId) {
  const url = `${CONFIG.WEBFLOW_API_BASE}/collections/${collectionId}/items/${itemId}`;

  const response = await makeRequest(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
      Accept: 'application/json'
    }
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch item ${itemId}: ${response.message}`);
  }

  return response;
}

/**
 * Create item in Mnemo
 */
async function createMnemoItem(mappedItem) {
  const url = `${CONFIG.MNEMO_API_BASE}/api/collection-items`;

  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(mappedItem)
  });

  return response;
}

/**
 * Process a single failed item
 */
async function processFailedItem(collectionType, itemId) {
  try {
    console.log(`\n📦 Processing ${collectionType} item: ${itemId}`);

    // Get collection ID
    let collectionId;
    let mapper;

    if (collectionType === 'posts') {
      collectionId = CONFIG.WEBFLOW_POSTS_COLLECTION_ID;
      mapper = postWebflowMapperToMnemoData;
    } else if (collectionType === 'events') {
      collectionId = CONFIG.WEBFLOW_EVENTS_COLLECTION_ID;
      mapper = eventWebflowMapperToMnemoData;
    } else if (collectionType === 'news') {
      collectionId = CONFIG.WEBFLOW_NEWS_COLLECTION_ID;
      mapper = newsWebflowMapperToMnemoData;
    }

    // Fetch from Webflow
    const webflowData = await fetchWebflowItem(collectionId, itemId);
    console.log(
      `✅ Fetched from Webflow: ${webflowData.fieldData?.name || 'Unknown'}`
    );

    // Map the data
    const mappedItem = mapper(webflowData);
    console.log(`✅ Mapped with slug: ${mappedItem.slug}`);

    // Create in Mnemo
    const mnemoResponse = await createMnemoItem(mappedItem);

    if (mnemoResponse.success) {
      console.log(`✅ Created in Mnemo: ${mnemoResponse.collectionItem.id}`);
      return { success: true, item: mappedItem };
    } else {
      console.log(`❌ Failed to create in Mnemo: ${mnemoResponse.error}`);
      return { success: false, error: mnemoResponse.error, item: mappedItem };
    }
  } catch (error) {
    console.log(`❌ Error processing ${itemId}: ${error.message}`);
    return { success: false, error: error.message, itemId };
  }
}

/**
 * Main migration function
 */
async function migrateFailedItems() {
  console.log('🚀 Starting migration of 25 failed items with -2 suffix...\n');

  const results = {
    successful: 0,
    failed: 0,
    details: []
  };

  // Process each collection type
  for (const [collectionType, itemIds] of Object.entries(FAILED_ITEMS)) {
    console.log(`\n📋 Processing ${itemIds.length} ${collectionType} items...`);

    for (const itemId of itemIds) {
      const result = await processFailedItem(collectionType, itemId);

      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
      }

      results.details.push(result);

      // Delay between requests
      await new Promise((resolve) =>
        setTimeout(resolve, CONFIG.DELAY_BETWEEN_REQUESTS)
      );
    }
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: results,
    totalProcessed: results.successful + results.failed,
    successRate: `${((results.successful / (results.successful + results.failed)) * 100).toFixed(1)}%`
  };

  fs.writeFileSync(
    `failed-items-migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    JSON.stringify(report, null, 2)
  );

  console.log('\n📊 MIGRATION COMPLETE!');
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${report.successRate}`);
}

// Run the migration
migrateFailedItems().catch(console.error);
