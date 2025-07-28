#!/usr/bin/env node

/**
 * Simple script to migrate the final 2 items that failed with -3 suffix
 */

import https from 'https';
import fs from 'fs';

// Configuration - hardcoded tokens
const CONFIG = {
  WEBFLOW_API_BASE: 'https://api.webflow.com/v2',
  WEBFLOW_SITE_ID: '612cede33b271d1b5bac6200',
  WEBFLOW_NEWS_COLLECTION_ID: '61ee828a15a3185c99bde543',
  WEBFLOW_API_TOKEN:
    'd2eac7bfcd8cc230db56e0dd9f9c7c7f4652db6195ad674c0b7939bb438fb33c',
  MNEMO_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app',
  DELAY_BETWEEN_REQUESTS: 1000
};

// The 2 specific failed items that need -3 suffix
const FAILED_ITEMS = [
  '65c9e4aa36c6ba62b5c8bce4', // Paramedics and first responders in Egypt receive specialist training
  '65659abe8e0f991929ff339c' // Pregnant mothers and newborn babies evacuated from Gaza
];

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
 * News mapper function with -3 suffix
 */
function newsWebflowMapperToMnemoData(webflowNews) {
  const { fieldData } = webflowNews;
  const status = webflowNews.isDraft ? 'draft' : 'published';

  const mnemoItem = {
    id: webflowNews.id,
    title: fieldData.name || 'Untitled News',
    type: 'news',
    slug: (fieldData.slug || webflowNews.id) + '-3', // Add -3 suffix
    status: status,
    data: {
      title: fieldData.name || 'Untitled News',
      slug: (fieldData.slug || webflowNews.id) + '-3', // Add -3 suffix
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
 * Fetch item from Webflow
 */
async function fetchWebflowItem(itemId) {
  const url = `${CONFIG.WEBFLOW_API_BASE}/collections/${CONFIG.WEBFLOW_NEWS_COLLECTION_ID}/items/${itemId}`;

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
 * Process a single item
 */
async function processItem(itemId) {
  try {
    console.log(`\n📦 Processing news item: ${itemId}`);

    // Fetch from Webflow
    const webflowData = await fetchWebflowItem(itemId);
    console.log(
      `✅ Fetched from Webflow: ${webflowData.fieldData?.name || 'Unknown'}`
    );

    // Map the data
    const mappedItem = newsWebflowMapperToMnemoData(webflowData);
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
async function migrateFinal2Items() {
  console.log('🚀 Starting migration of final 2 items with -3 suffix...\n');

  const results = {
    successful: 0,
    failed: 0,
    details: []
  };

  for (const itemId of FAILED_ITEMS) {
    const result = await processItem(itemId);

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

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: results,
    totalProcessed: results.successful + results.failed,
    successRate: `${((results.successful / (results.successful + results.failed)) * 100).toFixed(1)}%`
  };

  fs.writeFileSync(
    `final-2-items-migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    JSON.stringify(report, null, 2)
  );

  console.log('\n📊 FINAL MIGRATION COMPLETE!');
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${report.successRate}`);

  if (results.successful === 2) {
    console.log('\n🎉 ALL 1,698 ITEMS NOW SUCCESSFULLY MIGRATED! 🎉');
    console.log('Migration is 100% complete!');
  }
}

// Run the migration
migrateFinal2Items().catch(console.error);
