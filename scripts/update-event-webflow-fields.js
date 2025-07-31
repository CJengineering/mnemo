#!/usr/bin/env node

/**
 * Update existing events with Webflow field mappings
 * Updates by slug, maps short-description-2 → shortDescription
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const WEBFLOW_API_TOKEN =
  'd2eac7bfcd8cc230db56e0dd9f9c7c7f4652db6195ad674c0b7939bb438fb33c';
const WEBFLOW_EVENTS_COLLECTION_ID =
  process.env.WEBFLOW_EVENTS_COLLECTION_ID || '6225fe8b1f52b40001a99d66';
const API_BASE_URL = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';

/**
 * Fetch all events from Webflow API with pagination
 */
async function fetchAllWebflowEvents() {
  try {
    console.log('📡 Fetching events from Webflow API...');

    let allEvents = [];
    let offset = 0;
    const limit = 100; // Webflow API limit
    let hasMore = true;

    while (hasMore) {
      console.log(
        `   📄 Fetching page ${Math.floor(offset / limit) + 1} (offset: ${offset})...`
      );

      const response = await fetch(
        `https://api.webflow.com/v2/collections/${WEBFLOW_EVENTS_COLLECTION_ID}/items?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
            'accept-version': '1.0.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Webflow API error: ${response.status}`);
      }

      const data = await response.json();
      const items = data.items || [];

      allEvents = [...allEvents, ...items];

      console.log(
        `   ✅ Fetched ${items.length} events from page ${Math.floor(offset / limit) + 1}`
      );

      // Check if we have more items to fetch
      hasMore = items.length === limit;
      offset += limit;

      // Rate limiting between pages
      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(`✅ Total fetched: ${allEvents.length} events from Webflow`);
    return allEvents;
  } catch (error) {
    console.error('❌ Failed to fetch Webflow events:', error);
    return [];
  }
}

/**
 * Find Mnemo event by slug using production API (new slug endpoint)
 */
async function findMnemoEventBySlug(slug) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/collection-items/slug/${slug}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`   ℹ️  Event not found with slug: ${slug}`);
        return null;
      }
      console.error(
        `❌ Failed to fetch event with slug ${slug}: ${response.status}`
      );
      return null;
    }

    const response_data = await response.json();
    const event = response_data?.collectionItem || response_data;
    return event || null;
  } catch (error) {
    console.error(`❌ Error finding event with slug ${slug}:`, error);
    return null;
  }
}

/**
 * Update event using PUT API (can use either ID or slug)
 */
async function updateEventViaPutAPI(event, updatedData) {
  try {
    // Try to use slug-based endpoint first if available, fallback to ID
    const endpoint = event.slug
      ? `${API_BASE_URL}/api/collection-items/slug/${event.slug}`
      : `${API_BASE_URL}/api/collection-items/${event.id}`;

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`PUT API error ${response.status}: ${errorData}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('❌ PUT API request failed:', error);
    return false;
  }
}

/**
 * Process a single event mapping
 */
async function processEventMapping(webflowEvent) {
  const { fieldData } = webflowEvent;
  const slug = fieldData.slug;

  if (!slug) {
    console.log('⚠️  Webflow event missing slug, skipping...');
    return { success: false, reason: 'no_slug' };
  }

  console.log(
    `\n🔄 Processing event: ${fieldData.name || 'Untitled'} (slug: ${slug})`
  );

  // Find corresponding Mnemo event by slug
  const mnemoEvent = await findMnemoEventBySlug(slug);

  if (!mnemoEvent) {
    console.log(`⚠️  No Mnemo event found with slug: ${slug}, skipping...`);
    return { success: false, reason: 'not_found' };
  }

  // Extract the field mappings from Webflow
  const shortDescriptionFromWebflow = fieldData['short-description-2'];

  console.log(`   📋 Webflow fields:`);
  console.log(
    `      - short-description-2: ${shortDescriptionFromWebflow ? '✓ Present' : '✗ Missing'}`
  );

  // Prepare updated data - preserve everything, only update mapped fields
  const updatedData = {
    type: mnemoEvent.type,
    status: mnemoEvent.status,
    slug: mnemoEvent.slug,
    title: mnemoEvent.title,
    data: {
      ...mnemoEvent.data, // Preserve ALL existing data
      // Update only the mapped fields
      shortDescription:
        shortDescriptionFromWebflow || mnemoEvent.data.shortDescription
    }
  };

  console.log(`   🔄 Updating fields:`);
  console.log(
    `      - shortDescription: ${shortDescriptionFromWebflow ? 'Updated' : 'No change'}`
  );

  // Update via PUT API
  const success = await updateEventViaPutAPI(mnemoEvent, updatedData);

  if (success) {
    console.log(`   ✅ Successfully updated event: ${mnemoEvent.title}`);
    return { success: true };
  } else {
    console.log(`   ❌ Failed to update event: ${mnemoEvent.title}`);
    return { success: false, reason: 'api_error' };
  }
}

/**
 * Main function
 */
async function updateEventWebflowFields(testLimit = null) {
  console.log('🚀 Starting Webflow → Mnemo event field mapping update...\n');

  if (testLimit) {
    console.log(`🧪 TEST MODE: Processing only first ${testLimit} events\n`);
  }

  // Validate environment variables
  if (!WEBFLOW_API_TOKEN) {
    console.error('❌ WEBFLOW_API_TOKEN environment variable is required');
    process.exit(1);
  }

  console.log(`📊 Configuration:`);
  console.log(`   - Webflow Collection ID: ${WEBFLOW_EVENTS_COLLECTION_ID}`);
  console.log(`   - API Base URL: ${API_BASE_URL}`);
  console.log(`   - Field Mappings:`);
  console.log(
    `     • Webflow "short-description-2" → Mnemo "shortDescription"`
  );
  console.log();

  try {
    // Fetch all events from Webflow
    const webflowEvents = await fetchAllWebflowEvents();

    if (webflowEvents.length === 0) {
      console.log('⚠️  No events found in Webflow, exiting...');
      return;
    }

    console.log(`\n📈 Processing ${webflowEvents.length} Webflow events...\n`);

    // Counters for summary
    let updated = 0;
    let notFound = 0;
    let noSlug = 0;
    let apiErrors = 0;

    // Process events (limited in test mode)
    const eventsToProcess = testLimit
      ? webflowEvents.slice(0, testLimit)
      : webflowEvents;

    for (let i = 0; i < eventsToProcess.length; i++) {
      const webflowEvent = eventsToProcess[i];

      console.log(`[${i + 1}/${eventsToProcess.length}]`);

      const result = await processEventMapping(webflowEvent);

      if (result.success) {
        updated++;
      } else {
        switch (result.reason) {
          case 'not_found':
            notFound++;
            break;
          case 'no_slug':
            noSlug++;
            break;
          case 'api_error':
            apiErrors++;
            break;
        }
      }

      // Rate limiting - be respectful to APIs
      if (i < eventsToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    // Summary report
    console.log('\n' + '='.repeat(50));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully updated: ${updated} events`);
    console.log(`⚠️  Not found in Mnemo: ${notFound} events`);
    console.log(`⚠️  Missing slug: ${noSlug} events`);
    console.log(`❌ API errors: ${apiErrors} events`);
    console.log(`📊 Total processed: ${eventsToProcess.length} events`);
    if (testLimit && webflowEvents.length > testLimit) {
      console.log(
        `🧪 Test mode: ${webflowEvents.length - testLimit} events skipped`
      );
    }
    console.log('\n🎉 Field mapping update completed!');
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  // Full migration: process all events
  updateEventWebflowFields()
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export { updateEventWebflowFields };
