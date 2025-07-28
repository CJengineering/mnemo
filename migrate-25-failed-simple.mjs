#!/usr/bin/env node

// Simple script to migrate the 25 failed items with -2 suffix
const WEBFLOW_API_TOKEN =
  'd2eac7bfcd8cc230db56e0dd9f9c7c7f4652db6195ad674c0b7939bb438fb33c';
const WEBFLOW_SITE_ID = '612cede33b271d1b5bac6200';
const MNEMO_API_URL = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';

// The 25 failed items with their collection info
const FAILED_ITEMS = [
  // Posts (5 items)
  {
    webflowId: '6870e7527eb371f27aec0e61',
    collection: 'posts',
    collectionId: '61ee828a15a3183262bde542',
    type: 'post'
  },
  {
    webflowId: '686fe58669daeaf5bcfdd8d1',
    collection: 'posts',
    collectionId: '61ee828a15a3183262bde542',
    type: 'post'
  },
  {
    webflowId: '686b69c87111cae2985c825f',
    collection: 'posts',
    collectionId: '61ee828a15a3183262bde542',
    type: 'post'
  },
  {
    webflowId: '686530ec3e19111feef62a28',
    collection: 'posts',
    collectionId: '61ee828a15a3183262bde542',
    type: 'post'
  },
  {
    webflowId: '686270e505d9e67ccb2bc5bf',
    collection: 'posts',
    collectionId: '61ee828a15a3183262bde542',
    type: 'post'
  },

  // Events (1 item)
  {
    webflowId: '6226107ef58d7bf6bf5c3e62',
    collection: 'events',
    collectionId: '6225fe8b1f52b40001a99d66',
    type: 'event'
  },

  // News (19 items)
  {
    webflowId: '65fc5914ed4f7f91e494ba1c',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '65f8324d3b5af7f9dec2b886',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '65c9e4aa36c6ba62b5c8bce4',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '65a400d4b4c70a2da59fee52',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '658811d55c0051e82dbab505',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '65829c03557887ff4d7a75f7',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '6579b88a88feb40aaf92a143',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '65659abe8e0f991929ff339c',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '65118a7a165f4836fb31bbf2',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '64988c4522f0976c82699806',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '64986de99d67d71b541f49ed',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '64288d914fa7010dc3b72f69',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '63107df76a18aa5250d80f77',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '62caffae9749a00e88957673',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '62b03751c8cf57b21d45ca2a',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '629f5aca3d1735cc6e84f033',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '6284ff1b0c117a0e76ba8cc6',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '625018b76b6436394cbe5a83',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  },
  {
    webflowId: '6200db52873d78066d272f1e',
    collection: 'news',
    collectionId: '61ee828a15a3185c99bde543',
    type: 'news'
  }
];

// Simple mappers for each type
function mapPostWebflowToMnemo(webflowItem, modifiedSlug) {
  return {
    type: 'post',
    title: webflowItem.fieldData.name || 'Untitled',
    slug: modifiedSlug,
    data: {
      seoTitle:
        webflowItem.fieldData['seo-title'] || webflowItem.fieldData.name,
      seoDescription: webflowItem.fieldData['seo-description'] || '',
      metaDescription: webflowItem.fieldData['meta-description'] || '',
      date: webflowItem.fieldData.date || new Date().toISOString(),
      featured: webflowItem.fieldData.featured || false,
      pushToGR: webflowItem.fieldData['push-to-gr'] || false,
      heroImage: webflowItem.fieldData['hero-image'] || null,
      content: webflowItem.fieldData.content || '',
      gallery: webflowItem.fieldData.gallery || [],
      programme: webflowItem.fieldData.programme || [],
      people: webflowItem.fieldData.people || [],
      tags: webflowItem.fieldData.tags || []
    }
  };
}

function mapEventWebflowToMnemo(webflowItem, modifiedSlug) {
  return {
    type: 'event',
    title: webflowItem.fieldData.name || 'Untitled',
    slug: modifiedSlug,
    data: {
      seoTitle:
        webflowItem.fieldData['seo-title'] || webflowItem.fieldData.name,
      seoDescription: webflowItem.fieldData['seo-description'] || '',
      eventDate:
        webflowItem.fieldData['event-date'] || new Date().toISOString(),
      endDate: webflowItem.fieldData['end-date'] || null,
      city: webflowItem.fieldData.city || '',
      address: webflowItem.fieldData.address || '',
      rsvpLink: webflowItem.fieldData['rsvp-link'] || '',
      featured: webflowItem.fieldData.featured || false,
      pushToGR: webflowItem.fieldData['push-to-gr'] || false,
      heroImage: webflowItem.fieldData['hero-image'] || null,
      content: webflowItem.fieldData.content || '',
      gallery: webflowItem.fieldData.gallery || [],
      programme: webflowItem.fieldData.programme || [],
      people: webflowItem.fieldData.people || [],
      organisers: webflowItem.fieldData.organisers || [],
      tags: webflowItem.fieldData.tags || []
    }
  };
}

function mapNewsWebflowToMnemo(webflowItem, modifiedSlug) {
  return {
    type: 'news',
    title: webflowItem.fieldData.name || 'Untitled',
    slug: modifiedSlug,
    data: {
      seoTitle:
        webflowItem.fieldData['seo-title'] || webflowItem.fieldData.name,
      seoDescription: webflowItem.fieldData['seo-description'] || '',
      metaDescription: webflowItem.fieldData['meta-description'] || '',
      publishDate:
        webflowItem.fieldData['publish-date'] || new Date().toISOString(),
      featured: webflowItem.fieldData.featured || false,
      pushToGR: webflowItem.fieldData['push-to-gr'] || false,
      heroImage: webflowItem.fieldData['hero-image'] || null,
      content: webflowItem.fieldData.content || '',
      summary: webflowItem.fieldData.summary || '',
      externalLink: webflowItem.fieldData['external-link'] || '',
      gallery: webflowItem.fieldData.gallery || [],
      programme: webflowItem.fieldData.programme || [],
      people: webflowItem.fieldData.people || [],
      tags: webflowItem.fieldData.tags || []
    }
  };
}

async function fetchFromWebflow(webflowId, collectionId) {
  const url = `https://api.webflow.com/v2/collections/${collectionId}/items/${webflowId}`;

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

  return response.json();
}

async function createInMnemo(mappedData) {
  const response = await fetch(`${MNEMO_API_URL}/api/collection-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(mappedData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mnemo API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function migrateItem(item) {
  try {
    console.log(`🔄 Migrating ${item.collection} item: ${item.webflowId}`);

    // Fetch from Webflow
    const webflowData = await fetchFromWebflow(
      item.webflowId,
      item.collectionId
    );

    // Get original slug and add -2 suffix
    const originalSlug = webflowData.fieldData.slug;
    const modifiedSlug = `${originalSlug}-2`;

    // Map to Mnemo format based on type
    let mappedData;
    if (item.type === 'post') {
      mappedData = mapPostWebflowToMnemo(webflowData, modifiedSlug);
    } else if (item.type === 'event') {
      mappedData = mapEventWebflowToMnemo(webflowData, modifiedSlug);
    } else if (item.type === 'news') {
      mappedData = mapNewsWebflowToMnemo(webflowData, modifiedSlug);
    }

    // Create in Mnemo
    const result = await createInMnemo(mappedData);

    console.log(`✅ Success: ${mappedData.title}`);
    console.log(`   Original slug: ${originalSlug}`);
    console.log(`   New slug: ${modifiedSlug}`);
    console.log(`   Mnemo ID: ${result.collectionItem?.id}`);

    return {
      success: true,
      webflowId: item.webflowId,
      title: mappedData.title,
      originalSlug,
      newSlug: modifiedSlug,
      mnemoId: result.collectionItem?.id,
      type: item.type
    };
  } catch (error) {
    console.log(`❌ Failed: ${item.webflowId} - ${error.message}`);
    return {
      success: false,
      webflowId: item.webflowId,
      error: error.message,
      type: item.type
    };
  }
}

async function main() {
  console.log('🚀 MIGRATING 25 FAILED ITEMS WITH -2 SLUG SUFFIX');
  console.log('='.repeat(60));

  const results = [];
  let successful = 0;
  let failed = 0;

  for (const item of FAILED_ITEMS) {
    const result = await migrateItem(item);
    results.push(result);

    if (result.success) {
      successful++;
    } else {
      failed++;
    }

    // Small delay to be nice to APIs
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n📊 MIGRATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total items: ${FAILED_ITEMS.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(
    `Success rate: ${((successful / FAILED_ITEMS.length) * 100).toFixed(1)}%`
  );

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: FAILED_ITEMS.length,
      successful,
      failed,
      successRate: `${((successful / FAILED_ITEMS.length) * 100).toFixed(1)}%`
    },
    results
  };

  const reportFile = `failed-items-migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  await import('fs').then((fs) => {
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved: ${reportFile}`);
  });
}

main().catch(console.error);
