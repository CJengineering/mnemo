#!/usr/bin/env node

import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID;
const MNEMO_API_BASE = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';

// List of failed items that need modified slugs
const FAILED_ITEMS = {
  // Posts that failed (add -post suffix)
  posts: [
    {
      id: '6870e7527eb371f27aec0e61',
      originalSlug:
        'underwater-video-systems-empower-a-new-generation-of-ocean-champions-in-monaco'
    },
    {
      id: '686fe58669daeaf5bcfdd8d1',
      originalSlug:
        'noha-magdy-explains-the-career-impact-of-the-mena-scholars-fellowship-at-j-pal-mena-5th-anniversary'
    },
    {
      id: '686b69c87111cae2985c825f',
      originalSlug: 'j-pal-mena-marks-5th-anniversary'
    },
    {
      id: '686530ec3e19111feef62a28',
      originalSlug:
        'community-jameel-and-jameel-motors-italia-present-andrea-bocelli-live-in-pompeii'
    },
    {
      id: '686270e505d9e67ccb2bc5bf',
      originalSlug:
        'summer-craft-workshops-to-delight-al-darb-al-ahmar-children-and-families'
    }
  ],
  // Events that failed (add -event suffix)
  events: [
    {
      id: '6226107ef58d7bf6bf5c3e62',
      originalSlug: 'ark-re-imagined-the-expeditionary-pavilion'
    }
  ],
  // News that failed (add -news suffix)
  news: [
    {
      id: '65fc5914ed4f7f91e494ba1c',
      originalSlug:
        'j-pal-africa-the-city-of-cape-town-and-community-jameel-launch-new-water-air-and-energy-lab'
    },
    {
      id: '65f8324d3b5af7f9dec2b886',
      originalSlug:
        'imperial-opens-major-new-building-for-school-of-public-health'
    },
    {
      id: '65c9e4aa36c6ba62b5c8bce4',
      originalSlug:
        'paramedics-and-first-responders-in-egypt-receive-specialist-training-to-care-for-mothers-and-babies-evacuated-from-gaza'
    },
    {
      id: '65a400d4b4c70a2da59fee52',
      originalSlug:
        'j-pal-announces-new-multi-year-training-partnership-in-cote-divoire-to-increase-use-of-rigorous-evidence-in-national-policies-and-programmes'
    },
    { id: '658811d55c0051e82dbab505', originalSlug: 'climavore-assembly' },
    {
      id: '65829c03557887ff4d7a75f7',
      originalSlug:
        'mit-jameel-clinic-hosts-first-conference-in-the-kingdom-to-drive-the-use-of-artificial-intelligence-in-healthcare'
    },
    {
      id: '6579b88a88feb40aaf92a143',
      originalSlug:
        'university-of-edinburgh-and-the-international-livestock-research-institute-renew-partnership'
    },
    {
      id: '65659abe8e0f991929ff339c',
      originalSlug:
        'pregnant-mothers-and-newborn-babies-evacuated-from-gaza-with-urgent-medical-needs-will-receive-life-saving-healthcare-and-support-from-save-the-children-and-partners-in-egypt-in-an-initiative-funded-by-community-jameel'
    },
    {
      id: '65118a7a165f4836fb31bbf2',
      originalSlug:
        'j-pal-mena-at-auc-to-co-host-a-regional-conference-on-climate-adaptation-in-arab-states'
    },
    {
      id: '64988c4522f0976c82699806',
      originalSlug:
        'young-researchers-pursue-nobel-prize-winning-approach-to-alleviating-poverty-in-middle-east-and-north-africa-with-support-from-new-fellowship'
    },
    {
      id: '64986de99d67d71b541f49ed',
      originalSlug:
        'j-pal-hosts-colloquium-in-paris-in-celebration-of-20-years-of-fighting-against-poverty'
    },
    {
      id: '64288d914fa7010dc3b72f69',
      originalSlug:
        'royal-college-of-art-and-community-jameel-announce-climavore-partnership-with-turner-prize-nominees-cooking-sections'
    },
    {
      id: '63107df76a18aa5250d80f77',
      originalSlug:
        'breakthrough-in-detecting-parkinsons-using-ai-and-breathing-patterns'
    },
    {
      id: '62caffae9749a00e88957673',
      originalSlug:
        'arts-and-minds-healing-post-conflict-trauma-in-the-middle-east'
    },
    {
      id: '62b03751c8cf57b21d45ca2a',
      originalSlug:
        'anticipatory-action-to-mitigate-drought-induced-crises-learning-from-kenya-and-somalia'
    },
    {
      id: '629f5aca3d1735cc6e84f033',
      originalSlug:
        'islamic-development-bank-community-jameel-and-abdul-latif-jameel-poverty-action-lab-ready-to-join-forces-on-embedding-evidence-based-policy-labs-with-governments'
    },
    {
      id: '6284ff1b0c117a0e76ba8cc6',
      originalSlug: 'dangerous-delay-2-the-cost-of-inaction'
    },
    {
      id: '625018b76b6436394cbe5a83',
      originalSlug:
        'monaco-alexandria-the-great-detour-world-capitals-and-cosmopolitan-surrealism'
    },
    {
      id: '6200db52873d78066d272f1e',
      originalSlug:
        'jameel-toyota-scholarship-at-mit-celebrates-its-25th-anniversary-with-the-launch-of-a-new-network-for-scholars'
    }
  ]
};

// Collection IDs
const COLLECTION_IDS = {
  posts: '61ee828a15a3183262bde542',
  events: '6225fe8b1f52b40001a99d66',
  news: '61ee828a15a3185c99bde543'
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  return response.json();
}

function mapPostWebflowToMnemo(webflowItem, modifiedSlug) {
  const data = webflowItem.fieldData;

  return {
    title: data.name || '',
    slug: modifiedSlug,
    type: 'post',
    data: {
      excerpt: data.excerpt || '',
      content: data.content || '',
      publishedAt: data['published-date']
        ? new Date(data['published-date']).toISOString()
        : new Date().toISOString(),
      featured: data.featured || false,
      pushToGR: data['push-to-gr'] || false,
      seoTitle: data['seo-title'] || data.name || '',
      seoDescription: data['seo-description'] || data.excerpt || '',
      heroImage: data['hero-image']
        ? {
            url: data['hero-image'].url,
            alt: data['hero-image'].alt || data.name || ''
          }
        : null,
      programme:
        data.programme && data.programme.length > 0
          ? data.programme.map((prog) => ({ id: prog, slug: prog }))
          : [],
      people:
        data.people && data.people.length > 0
          ? data.people.map((person) => ({ id: person, slug: person }))
          : [],
      partners:
        data.partners && data.partners.length > 0
          ? data.partners.map((partner) => ({ id: partner, slug: partner }))
          : [],
      tags: []
    }
  };
}

function mapEventWebflowToMnemo(webflowItem, modifiedSlug) {
  const data = webflowItem.fieldData;

  return {
    title: data.name || '',
    slug: modifiedSlug,
    type: 'event',
    data: {
      city: data.city || '',
      address: data.address || '',
      featured: data.featured || false,
      pushToGR: data['push-to-gr'] || false,
      seoTitle: data['seo-title'] || data.name || '',
      eventDate: data['event-date']
        ? new Date(data['event-date']).toISOString()
        : new Date().toISOString(),
      heroImage: data['hero-image']
        ? {
            url: data['hero-image'].url,
            alt: data['hero-image'].alt || data.name || ''
          }
        : null,
      excerpt: data.excerpt || '',
      content: data.content || '',
      programme:
        data.programme && data.programme.length > 0
          ? data.programme.map((prog) => ({ id: prog, slug: prog }))
          : [],
      people:
        data.people && data.people.length > 0
          ? data.people.map((person) => ({ id: person, slug: person }))
          : [],
      partners:
        data.partners && data.partners.length > 0
          ? data.partners.map((partner) => ({ id: partner, slug: partner }))
          : [],
      tags: []
    }
  };
}

function mapNewsWebflowToMnemo(webflowItem, modifiedSlug) {
  const data = webflowItem.fieldData;

  return {
    title: data.name || '',
    slug: modifiedSlug,
    type: 'news',
    data: {
      publishedAt: data['published-date']
        ? new Date(data['published-date']).toISOString()
        : new Date().toISOString(),
      featured: data.featured || false,
      pushToGR: data['push-to-gr'] || false,
      seoTitle: data['seo-title'] || data.name || '',
      seoDescription: data['seo-description'] || '',
      heroImage: data['hero-image']
        ? {
            url: data['hero-image'].url,
            alt: data['hero-image'].alt || data.name || ''
          }
        : null,
      excerpt: data.excerpt || '',
      content: data.content || '',
      externalURL: data['external-url'] || '',
      programme:
        data.programme && data.programme.length > 0
          ? data.programme.map((prog) => ({ id: prog, slug: prog }))
          : [],
      people:
        data.people && data.people.length > 0
          ? data.people.map((person) => ({ id: person, slug: person }))
          : [],
      partners:
        data.partners && data.partners.length > 0
          ? data.partners.map((partner) => ({ id: partner, slug: partner }))
          : [],
      tags: []
    }
  };
}

async function createMnemoItem(itemData) {
  console.log(`    Sending to Mnemo API:`, JSON.stringify(itemData, null, 2));

  const response = await fetch(`${MNEMO_API_BASE}/api/collection-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(itemData)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
  }

  return result;
}

async function migrateFailedItems() {
  console.log('🔄 MIGRATING FAILED ITEMS WITH MODIFIED SLUGS');
  console.log('================================================\n');

  // Verify environment variables
  if (!WEBFLOW_API_TOKEN) {
    console.error('❌ WEBFLOW_API_TOKEN not found in environment variables');
    process.exit(1);
  }

  if (!WEBFLOW_SITE_ID) {
    console.error('❌ WEBFLOW_SITE_ID not found in environment variables');
    process.exit(1);
  }

  console.log(`✅ Environment variables loaded successfully`);
  console.log(`   Token length: ${WEBFLOW_API_TOKEN.length}`);
  console.log(`   Site ID: ${WEBFLOW_SITE_ID}\n`);

  const report = {
    timestamp: new Date().toISOString(),
    migrationInfo: {
      type: 'Failed Items Migration with Modified Slugs',
      phase: 'Phase 1 - Preserve Webflow URLs'
    },
    summary: {
      totalItems: 0,
      processed: 0,
      created: 0,
      failed: 0
    },
    results: []
  };

  // Count total items
  report.summary.totalItems =
    FAILED_ITEMS.posts.length +
    FAILED_ITEMS.events.length +
    FAILED_ITEMS.news.length;

  console.log(`📊 Total failed items to migrate: ${report.summary.totalItems}`);
  console.log(`   - Posts: ${FAILED_ITEMS.posts.length}`);
  console.log(`   - Events: ${FAILED_ITEMS.events.length}`);
  console.log(`   - News: ${FAILED_ITEMS.news.length}\n`);

  // Migrate Posts
  console.log('📝 MIGRATING FAILED POSTS');
  console.log('-'.repeat(30));

  for (const item of FAILED_ITEMS.posts) {
    try {
      console.log(`Fetching post: ${item.id}`);
      const webflowItem = await fetchWebflowItem(COLLECTION_IDS.posts, item.id);
      console.log(
        `    Webflow data:`,
        JSON.stringify(webflowItem.fieldData, null, 2)
      );

      const modifiedSlug = `${item.originalSlug}-post`;

      console.log(`  Original slug: ${item.originalSlug}`);
      console.log(`  Modified slug: ${modifiedSlug}`);

      const mnemoData = mapPostWebflowToMnemo(webflowItem, modifiedSlug);
      const result = await createMnemoItem(mnemoData);

      report.results.push({
        status: 'created',
        collection: 'posts',
        webflowId: item.id,
        title: mnemoData.title,
        originalSlug: item.originalSlug,
        modifiedSlug: modifiedSlug,
        mnemoId: result.collectionItem?.id
      });

      report.summary.created++;
      console.log(`  ✅ Created successfully\n`);
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}\n`);
      report.results.push({
        status: 'failed',
        collection: 'posts',
        webflowId: item.id,
        originalSlug: item.originalSlug,
        error: error.message
      });
      report.summary.failed++;
    }

    report.summary.processed++;
    await sleep(1000); // Rate limiting
  }

  // Migrate Events
  console.log('📅 MIGRATING FAILED EVENTS');
  console.log('-'.repeat(30));

  for (const item of FAILED_ITEMS.events) {
    try {
      console.log(`Fetching event: ${item.id}`);
      const webflowItem = await fetchWebflowItem(
        COLLECTION_IDS.events,
        item.id
      );
      const modifiedSlug = `${item.originalSlug}-event`;

      console.log(`  Original slug: ${item.originalSlug}`);
      console.log(`  Modified slug: ${modifiedSlug}`);

      const mnemoData = mapEventWebflowToMnemo(webflowItem, modifiedSlug);
      const result = await createMnemoItem(mnemoData);

      report.results.push({
        status: 'created',
        collection: 'events',
        webflowId: item.id,
        title: mnemoData.title,
        originalSlug: item.originalSlug,
        modifiedSlug: modifiedSlug,
        mnemoId: result.collectionItem?.id
      });

      report.summary.created++;
      console.log(`  ✅ Created successfully\n`);
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}\n`);
      report.results.push({
        status: 'failed',
        collection: 'events',
        webflowId: item.id,
        originalSlug: item.originalSlug,
        error: error.message
      });
      report.summary.failed++;
    }

    report.summary.processed++;
    await sleep(1000); // Rate limiting
  }

  // Migrate News
  console.log('📰 MIGRATING FAILED NEWS');
  console.log('-'.repeat(30));

  for (const item of FAILED_ITEMS.news) {
    try {
      console.log(`Fetching news: ${item.id}`);
      const webflowItem = await fetchWebflowItem(COLLECTION_IDS.news, item.id);
      const modifiedSlug = `${item.originalSlug}-news`;

      console.log(`  Original slug: ${item.originalSlug}`);
      console.log(`  Modified slug: ${modifiedSlug}`);

      const mnemoData = mapNewsWebflowToMnemo(webflowItem, modifiedSlug);
      const result = await createMnemoItem(mnemoData);

      report.results.push({
        status: 'created',
        collection: 'news',
        webflowId: item.id,
        title: mnemoData.title,
        originalSlug: item.originalSlug,
        modifiedSlug: modifiedSlug,
        mnemoId: result.collectionItem?.id
      });

      report.summary.created++;
      console.log(`  ✅ Created successfully\n`);
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}\n`);
      report.results.push({
        status: 'failed',
        collection: 'news',
        webflowId: item.id,
        originalSlug: item.originalSlug,
        error: error.message
      });
      report.summary.failed++;
    }

    report.summary.processed++;
    await sleep(1000); // Rate limiting
  }

  // Final report
  const successRate = (
    (report.summary.created / report.summary.totalItems) *
    100
  ).toFixed(1);

  console.log('📊 FINAL RESULTS');
  console.log('================');
  console.log(`Total items: ${report.summary.totalItems}`);
  console.log(`Processed: ${report.summary.processed}`);
  console.log(`Created: ${report.summary.created}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Success rate: ${successRate}%`);

  // Save report
  const reportFilename = `failed-items-migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const fs = await import('fs');
  fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved to: ${reportFilename}`);

  return report;
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateFailedItems().catch(console.error);
}
