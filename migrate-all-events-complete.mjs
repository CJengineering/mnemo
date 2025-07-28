#!/usr/bin/env node

/**
 * COMPLETE WEBFLOW EVENTS TO MNEMO MIGRATION SCRIPT
 *
 * This script performs a complete migration of all events from Webflow to Mnemo database.
 * Based on the successful posts migration but adapted for events collection.
 *
 * Features:
 * - Fetches all events from Webflow API with pagination
 * - Maps event fields using JavaScript version of TypeScript mapper
 * - Creates events in Mnemo database via API
 * - Handles duplicate detection and error reporting
 * - Preserves all images at Webflow URLs (Phase 1 approach)
 * - Generates detailed migration report
 *
 * Event-specific fields handled:
 * - Event dates and times
 * - Location information (address, city)
 * - Event organizers and partners
 * - Media content (hero images, galleries, videos)
 * - Event metadata and SEO
 *
 * Usage:
 *   node migrate-all-events-complete.mjs
 *
 * Prerequisites:
 * - WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID, WEBFLOW_EVENTS_COLLECTION_ID in .env.local
 * - Mnemo API running on localhost:3000
 * - Internet connection for Webflow API access
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import https from 'https';
import http from 'http';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

// Configuration
const CONFIG = {
  WEBFLOW_API_TOKEN: process.env.WEBFLOW_API_TOKEN,
  WEBFLOW_SITE_ID: process.env.WEBFLOW_SITE_ID,
  WEBFLOW_EVENTS_COLLECTION_ID: process.env.WEBFLOW_EVENTS_COLLECTION_ID,
  WEBFLOW_API_BASE: 'https://api.webflow.com/v2',
  MNEMO_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app',
  BATCH_SIZE: 100,
  REQUEST_DELAY: 500, // ms between requests
  MAX_RETRIES: 3
};

// Validate configuration
function validateConfig() {
  const required = [
    'WEBFLOW_API_TOKEN',
    'WEBFLOW_SITE_ID',
    'WEBFLOW_EVENTS_COLLECTION_ID'
  ];

  const missing = required.filter((key) => !CONFIG[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nPlease check your .env.local file');
    process.exit(1);
  }

  console.log('✅ Configuration validated');
  console.log(
    `   Webflow API Token: ${CONFIG.WEBFLOW_API_TOKEN.substring(0, 20)}...`
  );
  console.log(`   Site ID: ${CONFIG.WEBFLOW_SITE_ID}`);
  console.log(
    `   Events Collection ID: ${CONFIG.WEBFLOW_EVENTS_COLLECTION_ID}`
  );
}

/**
 * Event mapper: Convert Webflow event to Mnemo format
 * Based on events API analysis results
 */
function createEventMapper() {
  return function mapWebflowEventToMnemoData(webflowEvent) {
    const { fieldData } = webflowEvent;

    // Transform status: Webflow uses isDraft, Mnemo uses status enum
    const status = webflowEvent.isDraft ? 'draft' : 'published';

    // Build the mapped collection item
    const mnemoItem = {
      // Root level fields (Mnemo system fields)
      id: webflowEvent.id,
      title: fieldData.name || 'Untitled Event',
      type: 'event',
      slug: fieldData.slug || webflowEvent.id,
      status: status,

      // Data object (contains all Webflow-specific content)
      data: {
        // Basic event info
        title: fieldData.name || 'Untitled Event',
        slug: fieldData.slug || webflowEvent.id,
        status: status,
        description: fieldData['short-description-2'] || '',

        // Event-specific dates and times
        eventDate: fieldData['event-date'],
        endDate: fieldData['end-date'],
        eventTime: fieldData.time,

        // Location information
        address: fieldData.address,
        city: fieldData.city,

        // Event organization
        organisers: fieldData.organisers || [],
        partners: fieldData.partners || [],
        programmeLabel: fieldData['programme-label'],

        // SEO fields
        seoTitle: fieldData['seo-title'],
        seoMetaDescription: fieldData['seo-meta-description'],

        // Media fields (preserve Webflow URLs - Phase 1)
        heroImage: fieldData['hero-image']
          ? {
              url: fieldData['hero-image'].url,
              alt: fieldData['hero-image'].alt || '',
              caption: fieldData['hero-image-caption']
            }
          : undefined,

        thumbnail: fieldData.thumbnail
          ? {
              url: fieldData.thumbnail.url,
              alt: fieldData.thumbnail.alt || ''
            }
          : undefined,

        openGraphImage: fieldData['open-graph-image']
          ? {
              url: fieldData['open-graph-image'].url,
              alt: fieldData['open-graph-image'].alt || ''
            }
          : undefined,

        // Image gallery
        imageGallery: fieldData['image-gallery'] || [],

        // Video content
        videoAsHero: fieldData['video-as-hero-on-off'],
        trailerVideoLink: fieldData['trailer-livestream-highlights-video-link'],

        // Event content
        relatedPeopleRichText: fieldData['related-people-rich-text'],

        // Relations
        relatedProgrammes:
          fieldData['related-programme-s']?.map((progId) => ({
            id: progId,
            slug: progId
          })) || [],

        // Event flags
        featured: fieldData.featured,
        pushToGR: fieldData['push-to-gr'],
        newsOnOff: fieldData['news-on-off'],
        inTheMediaOnOff: fieldData['in-the-media-on-off'],
        moreDetailsOnOff: fieldData['more-details-on-off'],

        // Webflow metadata
        webflowMeta: {
          webflowId: webflowEvent.id,
          cmsLocaleId: webflowEvent.cmsLocaleId,
          lastPublished: webflowEvent.lastPublished,
          lastUpdated: webflowEvent.lastUpdated,
          createdOn: webflowEvent.createdOn,
          isArchived: webflowEvent.isArchived,
          fileIds: {
            heroImage: fieldData['hero-image']?.fileId,
            thumbnail: fieldData.thumbnail?.fileId,
            openGraphImage: fieldData['open-graph-image']?.fileId
          }
        }
      }
    };

    return mnemoItem;
  };
}

/**
 * Make HTTP request helper
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    // Choose appropriate module based on protocol
    const isHttps = url.startsWith('https://');
    const requestModule = isHttps ? https : http;

    const req = requestModule.request(url, options, (res) => {
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
 * Get total count of events in Webflow collection
 */
async function getWebflowEventsCount() {
  console.log('📊 Getting total events count from Webflow...');

  const url = `${CONFIG.WEBFLOW_API_BASE}/collections/${CONFIG.WEBFLOW_EVENTS_COLLECTION_ID}/items?limit=1`;

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
 * Fetch all events from Webflow API with pagination
 */
async function fetchAllWebflowEvents() {
  console.log('📡 Fetching all events from Webflow API...');

  const totalEvents = await getWebflowEventsCount();
  console.log(`   Total events in Webflow: ${totalEvents}`);

  if (totalEvents === 0) {
    console.log('   No events found in collection');
    return [];
  }

  let allEvents = [];
  let offset = 0;
  const limit = CONFIG.BATCH_SIZE;

  while (offset < totalEvents) {
    console.log(
      `   Fetching batch: ${offset + 1}-${Math.min(offset + limit, totalEvents)} of ${totalEvents}`
    );

    const url = `${CONFIG.WEBFLOW_API_BASE}/collections/${CONFIG.WEBFLOW_EVENTS_COLLECTION_ID}/items?limit=${limit}&offset=${offset}`;

    const data = await makeRequest(url, {
      headers: {
        Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json'
      }
    });

    if (data.items && data.items.length > 0) {
      allEvents = allEvents.concat(data.items);
      console.log(`   ✅ Fetched ${data.items.length} events`);
    }

    offset += limit;

    // Rate limiting - be respectful to Webflow API
    if (offset < totalEvents) {
      await new Promise((resolve) => setTimeout(resolve, CONFIG.REQUEST_DELAY));
    }
  }

  console.log(`📦 Total events fetched: ${allEvents.length}`);
  return allEvents;
}

/**
 * Check if event already exists in Mnemo by slug
 */
async function checkEventExists(slug) {
  const url = `${CONFIG.MNEMO_API_BASE}/api/collection-items?slug=${encodeURIComponent(slug)}`;

  try {
    const response = await makeRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response && response.length > 0;
  } catch (error) {
    console.warn(
      `   ⚠️ Error checking event existence for slug "${slug}": ${error.message}`
    );
    return false;
  }
}

/**
 * Get all existing events in Mnemo
 */
async function getExistingMnemoEvents() {
  console.log('🔍 Checking existing events in Mnemo...');

  const url = `${CONFIG.MNEMO_API_BASE}/api/collection-items?type=event`;

  try {
    const existingEvents = await makeRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const existingSlugs = existingEvents.map((event) => event.slug);
    console.log(`   Found ${existingEvents.length} existing events`);
    return existingSlugs;
  } catch (error) {
    console.warn(`   ⚠️ Error fetching existing events: ${error.message}`);
    return [];
  }
}

/**
 * Create event in Mnemo database
 */
async function createEventInMnemo(mnemoEvent) {
  const url = `${CONFIG.MNEMO_API_BASE}/api/collection-items`;

  try {
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mnemoEvent)
    });

    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Process events migration with error handling and retry logic
 */
async function processEventsMigration(webflowEvents, existingSlugs) {
  console.log('🔄 Processing events migration...');

  const eventMapper = createEventMapper();
  const results = {
    total: webflowEvents.length,
    processed: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    events: [],
    errors: []
  };

  for (let i = 0; i < webflowEvents.length; i++) {
    const webflowEvent = webflowEvents[i];
    const eventNumber = i + 1;
    const eventTitle = webflowEvent.fieldData?.name || webflowEvent.id;
    const eventSlug = webflowEvent.fieldData?.slug || webflowEvent.id;

    console.log(
      `\n📅 Processing event ${eventNumber}/${webflowEvents.length}: "${eventTitle}"`
    );

    try {
      // Check if event already exists
      if (existingSlugs.includes(eventSlug)) {
        console.log(`   ⏭️ Event already exists, skipping`);
        results.skipped++;
        results.events.push({
          webflowId: webflowEvent.id,
          title: eventTitle,
          slug: eventSlug,
          status: 'skipped',
          reason: 'Already exists'
        });
        continue;
      }

      // Map Webflow event to Mnemo format
      console.log(`   🔄 Mapping event data...`);
      const mnemoEvent = eventMapper(webflowEvent);

      // Create event in Mnemo
      console.log(`   🚀 Creating event in Mnemo...`);
      const createResult = await createEventInMnemo(mnemoEvent);

      if (createResult.success) {
        console.log(`   ✅ Successfully created event`);
        results.created++;
        results.events.push({
          webflowId: webflowEvent.id,
          mnemoId: createResult.data.id,
          title: eventTitle,
          slug: eventSlug,
          status: 'created',
          data: createResult.data
        });
      } else {
        throw new Error(createResult.error);
      }
    } catch (error) {
      console.error(`   ❌ Error processing event: ${error.message}`);
      results.failed++;
      results.errors.push({
        webflowId: webflowEvent.id,
        title: eventTitle,
        slug: eventSlug,
        error: error.message
      });
      results.events.push({
        webflowId: webflowEvent.id,
        title: eventTitle,
        slug: eventSlug,
        status: 'failed',
        error: error.message
      });
    }

    results.processed++;

    // Rate limiting between requests
    if (eventNumber < webflowEvents.length) {
      await new Promise((resolve) => setTimeout(resolve, CONFIG.REQUEST_DELAY));
    }
  }

  return results;
}

/**
 * Generate and save migration report
 */
function generateMigrationReport(results, webflowEvents) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `complete-webflow-events-migration-report-${timestamp}.json`;

  const report = {
    timestamp: new Date().toISOString(),
    migrationInfo: {
      type: 'Webflow Events to Mnemo Migration',
      scriptVersion: '1.0.0',
      phase: 'Phase 1 - Preserve Webflow URLs'
    },
    summary: {
      totalEvents: results.total,
      processed: results.processed,
      created: results.created,
      skipped: results.skipped,
      failed: results.failed,
      successRate: `${((results.created / results.total) * 100).toFixed(1)}%`,
      processingTime: 'N/A' // Will be updated in main function
    },
    webflowAPI: {
      token: `${CONFIG.WEBFLOW_API_TOKEN.substring(0, 20)}...`,
      siteId: CONFIG.WEBFLOW_SITE_ID,
      collectionId: CONFIG.WEBFLOW_EVENTS_COLLECTION_ID,
      endpoint: CONFIG.WEBFLOW_API_BASE
    },
    mnemoAPI: {
      endpoint: CONFIG.MNEMO_API_BASE,
      collectionType: 'event'
    },
    imageStrategy: {
      phase: 1,
      approach: 'Preserve Webflow URLs',
      description: 'Images remain at Webflow URLs, not uploaded to CDN'
    },
    events: results.events,
    errors: results.errors,
    fieldMappings: {
      name: 'title',
      slug: 'slug',
      'event-date': 'eventDate',
      'end-date': 'endDate',
      time: 'eventTime',
      address: 'address',
      city: 'city',
      organisers: 'organisers',
      partners: 'partners',
      'programme-label': 'programmeLabel',
      'short-description-2': 'description',
      'hero-image': 'heroImage',
      thumbnail: 'thumbnail',
      'image-gallery': 'imageGallery',
      'video-as-hero-on-off': 'videoAsHero',
      featured: 'featured',
      'related-programme-s': 'relatedProgrammes'
    }
  };

  try {
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Migration report saved: ${reportPath}`);
    return reportPath;
  } catch (error) {
    console.error(`❌ Error saving report: ${error.message}`);
    return null;
  }
}

/**
 * Main migration function
 */
async function main() {
  const startTime = Date.now();

  console.log('🎯 WEBFLOW EVENTS TO MNEMO MIGRATION');
  console.log('='.repeat(70));
  console.log('Phase 1: Preserve Webflow URLs (no CDN upload)');
  console.log('Collection: Events');
  console.log(`Started: ${new Date().toLocaleString()}\n`);

  try {
    // 1. Validate configuration
    validateConfig();

    // 2. Fetch events from Webflow
    const webflowEvents = await fetchAllWebflowEvents();

    if (webflowEvents.length === 0) {
      console.log('⚠️ No events found in Webflow collection. Exiting.');
      return;
    }

    // 3. Check existing events in Mnemo
    const existingSlugs = await getExistingMnemoEvents();

    // 4. Process migration
    const results = await processEventsMigration(webflowEvents, existingSlugs);

    // 5. Calculate processing time
    const processingTime = Math.round((Date.now() - startTime) / 1000);

    // 6. Generate report
    const reportPath = generateMigrationReport(results, webflowEvents);

    // 7. Update report with processing time
    if (reportPath) {
      try {
        const report = JSON.parse(readFileSync(reportPath, 'utf8'));
        report.summary.processingTime = `${processingTime} seconds`;
        writeFileSync(reportPath, JSON.stringify(report, null, 2));
      } catch (error) {
        console.warn('Could not update processing time in report');
      }
    }

    // 8. Final summary
    console.log('\n🎉 EVENTS MIGRATION COMPLETE!');
    console.log('='.repeat(50));
    console.log(
      `✅ Total events processed: ${results.processed}/${results.total}`
    );
    console.log(`🆕 Successfully created: ${results.created}`);
    console.log(`⏭️ Skipped (already exist): ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(
      `📊 Success rate: ${((results.created / results.total) * 100).toFixed(1)}%`
    );
    console.log(`⏱️ Processing time: ${processingTime} seconds`);

    if (results.created > 0) {
      console.log(
        `\n🔗 View migrated events at: ${CONFIG.MNEMO_API_BASE}/collections`
      );
    }

    if (results.failed > 0) {
      console.log(
        `\n⚠️ ${results.failed} events failed to migrate. Check the report for details.`
      );
    }

    console.log(`\n📄 Detailed report: ${reportPath}`);
  } catch (error) {
    console.error('\n💥 MIGRATION FAILED!');
    console.error(`Error: ${error.message}`);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run migration if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
