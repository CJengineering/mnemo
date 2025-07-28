#!/usr/bin/env node

import 'dotenv/config';

console.log('🔄 MIGRATING 25 FAILED ITEMS WITH -2 SUFFIX\n');

// Environment variables
const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID;
const WEBFLOW_POSTS_COLLECTION_ID = process.env.WEBFLOW_POSTS_COLLECTION_ID;
const WEBFLOW_EVENTS_COLLECTION_ID = process.env.WEBFLOW_EVENTS_COLLECTION_ID;
const WEBFLOW_NEWS_COLLECTION_ID = process.env.WEBFLOW_NEW_COLLECTION_ID;

const MNEMO_API_URL = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';

// The 25 specific items that failed due to duplicate slugs
const failedItems = [
  // POSTS (5 items)
  {
    id: '6870e7527eb371f27aec0e61',
    type: 'posts',
    collectionId: WEBFLOW_POSTS_COLLECTION_ID
  },
  {
    id: '686fe58669daeaf5bcfdd8d1',
    type: 'posts',
    collectionId: WEBFLOW_POSTS_COLLECTION_ID
  },
  {
    id: '686b69c87111cae2985c825f',
    type: 'posts',
    collectionId: WEBFLOW_POSTS_COLLECTION_ID
  },
  {
    id: '686530ec3e19111feef62a28',
    type: 'posts',
    collectionId: WEBFLOW_POSTS_COLLECTION_ID
  },
  {
    id: '686270e505d9e67ccb2bc5bf',
    type: 'posts',
    collectionId: WEBFLOW_POSTS_COLLECTION_ID
  },

  // EVENTS (1 item)
  {
    id: '6226107ef58d7bf6bf5c3e62',
    type: 'events',
    collectionId: WEBFLOW_EVENTS_COLLECTION_ID
  },

  // NEWS (19 items)
  {
    id: '65fc5914ed4f7f91e494ba1c',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '65f8324d3b5af7f9dec2b886',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '65c9e4aa36c6ba62b5c8bce4',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '65a400d4b4c70a2da59fee52',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '658811d55c0051e82dbab505',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '65829c03557887ff4d7a75f7',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '6579b88a88feb40aaf92a143',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '65659abe8e0f991929ff339c',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '65118a7a165f4836fb31bbf2',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '64988c4522f0976c82699806',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '64986de99d67d71b541f49ed',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '64288d914fa7010dc3b72f69',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '63107df76a18aa5250d80f77',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '62caffae9749a00e88957673',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '62b03751c8cf57b21d45ca2a',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '629f5aca3d1735cc6e84f033',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '6284ff1b0c117a0e76ba8cc6',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '625018b76b6436394cbe5a83',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  },
  {
    id: '6200db52873d78066d272f1e',
    type: 'news',
    collectionId: WEBFLOW_NEWS_COLLECTION_ID
  }
];

// Helper function to delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch item from Webflow
async function fetchWebflowItem(collectionId, itemId) {
  const url = `https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(
      `Webflow API error: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Map data based on type
function mapToMnemoData(webflowItem, type) {
  const fieldData = webflowItem.fieldData;

  // Add -2 suffix to slug to avoid conflicts
  const originalSlug = fieldData.slug || '';
  const modifiedSlug = originalSlug + '-2';

  if (type === 'posts') {
    return {
      type: 'post',
      title: fieldData.name || fieldData.title || '',
      slug: modifiedSlug,
      data: {
        summary: fieldData.summary || '',
        content: fieldData.content || '',
        featured: fieldData.featured || false,
        pushToGR: fieldData['push-to-gr'] || false,
        seoTitle: fieldData['seo-title'] || '',
        seoDescription: fieldData['seo-description'] || '',
        heroImage: fieldData['hero-image'],
        publishedDate: fieldData['published-date'] || fieldData.createdOn,
        programme: fieldData.programme
          ? [{ id: fieldData.programme, slug: fieldData.programme }]
          : [],
        people: fieldData.people
          ? [{ id: fieldData.people, slug: fieldData.people }]
          : [],
        tags: fieldData.tags || []
      }
    };
  }

  if (type === 'events') {
    return {
      type: 'event',
      title: fieldData.name || fieldData.title || '',
      slug: modifiedSlug,
      data: {
        city: fieldData.city || '',
        address: fieldData.address || '',
        featured: fieldData.featured || false,
        pushToGR: fieldData['push-to-gr'] || false,
        seoTitle: fieldData['seo-title'] || '',
        eventDate: fieldData['event-date'],
        heroImage: fieldData['hero-image'],
        summary: fieldData.summary || '',
        content: fieldData.content || '',
        organiser: fieldData.organiser
          ? [{ id: fieldData.organiser, slug: fieldData.organiser }]
          : [],
        programme: fieldData.programme
          ? [{ id: fieldData.programme, slug: fieldData.programme }]
          : [],
        people: fieldData.people
          ? [{ id: fieldData.people, slug: fieldData.people }]
          : [],
        tags: fieldData.tags || []
      }
    };
  }

  if (type === 'news') {
    return {
      type: 'news',
      title: fieldData.name || fieldData.title || '',
      slug: modifiedSlug,
      data: {
        summary: fieldData.summary || '',
        externalLink: fieldData['external-link'] || '',
        featured: fieldData.featured || false,
        pushToGR: fieldData['push-to-gr'] || false,
        seoTitle: fieldData['seo-title'] || '',
        seoDescription: fieldData['seo-description'] || '',
        heroImage: fieldData['hero-image'],
        publishedDate: fieldData['published-date'] || fieldData.createdOn,
        programme: fieldData.programme
          ? [{ id: fieldData.programme, slug: fieldData.programme }]
          : [],
        people: fieldData.people
          ? [{ id: fieldData.people, slug: fieldData.people }]
          : [],
        tags: fieldData.tags || []
      }
    };
  }
}

// Create item in Mnemo
async function createMnemoItem(data) {
  const response = await fetch(`${MNEMO_API_URL}/api/collection-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

// Main migration function
async function migrateFailed25Items() {
  const results = [];
  let successful = 0;
  let failed = 0;

  console.log(`Starting migration of ${failedItems.length} failed items...\n`);

  for (let i = 0; i < failedItems.length; i++) {
    const item = failedItems[i];

    try {
      console.log(
        `📥 [${i + 1}/${failedItems.length}] Fetching ${item.type} item: ${item.id}`
      );

      // Fetch from Webflow
      const webflowData = await fetchWebflowItem(item.collectionId, item.id);

      // Map to Mnemo format with -2 suffix
      const mnemoData = mapToMnemoData(webflowData, item.type);

      console.log(`   Original slug: ${webflowData.fieldData.slug}`);
      console.log(`   Modified slug: ${mnemoData.slug}`);
      console.log(`   Title: ${mnemoData.title}`);

      // Create in Mnemo
      const result = await createMnemoItem(mnemoData);

      console.log(`   ✅ Successfully created: ${result.collectionItem.id}`);
      successful++;

      results.push({
        status: 'success',
        webflowId: item.id,
        type: item.type,
        title: mnemoData.title,
        originalSlug: webflowData.fieldData.slug,
        newSlug: mnemoData.slug,
        mnemoId: result.collectionItem.id
      });
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failed++;

      results.push({
        status: 'failed',
        webflowId: item.id,
        type: item.type,
        error: error.message
      });
    }

    // Rate limiting - wait between requests
    if (i < failedItems.length - 1) {
      await delay(500);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total items: ${failedItems.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(
    `Success rate: ${((successful / failedItems.length) * 100).toFixed(1)}%`
  );

  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: failedItems.length,
      successful,
      failed,
      successRate: `${((successful / failedItems.length) * 100).toFixed(1)}%`
    },
    results
  };

  const reportFile = `failed-items-migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

  await import('fs').then((fs) => {
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved: ${reportFile}`);
  });

  return report;
}

// Run the migration
migrateFailed25Items().catch(console.error);
