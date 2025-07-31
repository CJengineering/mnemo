#!/usr/bin/env node

/**
 * Check CDN images for EVENTS collection items
 * Tests which events are missing images or have broken CDN links
 * Outputs results to a JSON file with slugs of problematic events
 */

import fs from 'fs';
import path from 'path';

// Configuration
const API_BASE_URL = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';

/**
 * Test if an image URL is accessible
 */
async function testImageUrl(url) {
  if (!url) return { accessible: false, reason: 'No URL provided' };

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      timeout: 10000 // 10 second timeout
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const isImage = contentType && contentType.startsWith('image/');

      return {
        accessible: true,
        isImage,
        contentType,
        status: response.status
      };
    } else {
      return {
        accessible: false,
        reason: `HTTP ${response.status}`,
        status: response.status
      };
    }
  } catch (error) {
    return {
      accessible: false,
      reason: error.message,
      error: error.name
    };
  }
}

/**
 * Fetch all events from the external API
 */
async function fetchAllEvents() {
  try {
    console.log('📡 Fetching events from external API...');

    const response = await fetch(
      `${API_BASE_URL}/api/collection-items?type=event`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const events = data.collectionItems || [];

    console.log(`✅ Fetched ${events.length} events from API`);
    return events;
  } catch (error) {
    console.error('❌ Failed to fetch events:', error);
    return [];
  }
}

/**
 * Extract image URLs from event data
 */
function extractImageUrls(event) {
  const imageFields = [];
  const data = event.data || event;

  // Common image field names in your API structure
  const possibleImageFields = [
    'heroImage',
    'hero_image',
    'hero-image',
    'thumbnail',
    'image',
    'featuredImage',
    'featured_image',
    'featured-image',
    'coverImage',
    'cover_image',
    'cover-image',
    'openGraphImage',
    'open_graph_image',
    'open-graph-image',
    'photo',
    'picture',
    'banner',
    'poster'
  ];

  possibleImageFields.forEach((field) => {
    const value = data[field];
    if (value) {
      if (typeof value === 'string' && value.startsWith('http')) {
        imageFields.push({ field, url: value, type: 'direct_url' });
      } else if (typeof value === 'object' && value.url) {
        imageFields.push({ field, url: value.url, type: 'object_url' });
      } else if (typeof value === 'object' && value.src) {
        imageFields.push({ field, url: value.src, type: 'object_src' });
      }
    }
  });

  return imageFields;
}

/**
 * Process a single event for CDN image checks
 */
async function processEvent(event) {
  const slug = event.slug;
  const title = event.title || event.name || 'Untitled';

  console.log(`\n🔄 Checking event: ${title} (slug: ${slug})`);

  const imageFields = extractImageUrls(event);

  if (imageFields.length === 0) {
    console.log('   ⚠️  No image fields found');
    return {
      slug,
      title,
      issue: 'no_images',
      images: [],
      hasIssues: true
    };
  }

  const imageResults = [];
  let hasIssues = false;

  for (const imageField of imageFields) {
    console.log(`   🖼️  Testing ${imageField.field}: ${imageField.url}`);

    const result = await testImageUrl(imageField.url);

    if (!result.accessible) {
      console.log(`   ❌ ${imageField.field}: ${result.reason}`);
      hasIssues = true;
    } else if (!result.isImage) {
      console.log(
        `   ⚠️  ${imageField.field}: Not an image (${result.contentType})`
      );
      hasIssues = true;
    } else {
      console.log(`   ✅ ${imageField.field}: OK`);
    }

    imageResults.push({
      field: imageField.field,
      url: imageField.url,
      type: imageField.type,
      accessible: result.accessible,
      isImage: result.isImage,
      contentType: result.contentType,
      status: result.status,
      reason: result.reason,
      error: result.error
    });

    // Rate limiting between image checks
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  if (!hasIssues) {
    console.log('   ✅ All images OK');
  }

  return {
    slug,
    title,
    issue: hasIssues ? 'cdn_issues' : 'no_issues',
    images: imageResults,
    hasIssues
  };
}

/**
 * Main function
 */
async function checkEventsCdnImages() {
  console.log('🚀 Starting CDN image check for EVENTS...\n');

  const startTime = Date.now();

  try {
    // Fetch all events
    const events = await fetchAllEvents();

    if (events.length === 0) {
      console.log('⚠️  No events found, exiting...');
      return;
    }

    console.log(`\n🔍 Checking CDN images for ${events.length} events...\n`);

    const results = [];
    const problematicEvents = [];

    // Process each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const result = await processEvent(event);

      results.push(result);

      if (result.hasIssues) {
        problematicEvents.push({
          slug: result.slug,
          title: result.title,
          issue: result.issue,
          imageIssues: result.images.filter(
            (img) => !img.accessible || !img.isImage
          )
        });
      }

      console.log(`[${i + 1}/${events.length}] Processed: ${result.title}`);

      // Rate limiting between events
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      totalEvents: events.length,
      eventsWithIssues: problematicEvents.length,
      eventsOK: events.length - problematicEvents.length,
      processingTimeMs: Date.now() - startTime,
      summary: {
        noImages: results.filter((r) => r.issue === 'no_images').length,
        cdnIssues: results.filter((r) => r.issue === 'cdn_issues').length,
        allOK: results.filter((r) => r.issue === 'no_issues').length
      },
      problematicEventsSlugs: problematicEvents.map((e) => e.slug),
      problematicEvents,
      allResults: results
    };

    // Save to JSON file
    const outputFile = path.join(process.cwd(), 'events-cdn-image-check.json');
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));

    // Summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 CDN IMAGE CHECK SUMMARY - EVENTS');
    console.log('='.repeat(60));
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`📊 Total events checked: ${report.totalEvents}`);
    console.log(`❌ Events with issues: ${report.eventsWithIssues}`);
    console.log(`✅ Events OK: ${report.eventsOK}`);
    console.log(
      `⏱️  Processing time: ${Math.round(report.processingTimeMs / 1000)}s`
    );
    console.log('\nIssue breakdown:');
    console.log(`   🚫 No images: ${report.summary.noImages}`);
    console.log(`   💥 CDN issues: ${report.summary.cdnIssues}`);
    console.log(`   ✅ All OK: ${report.summary.allOK}`);

    if (problematicEvents.length > 0) {
      console.log('\n🚨 Events with issues (slugs):');
      problematicEvents.slice(0, 10).forEach((event) => {
        console.log(`   • ${event.slug} - ${event.issue}`);
      });
      if (problematicEvents.length > 10) {
        console.log(`   ... and ${problematicEvents.length - 10} more`);
      }
    }

    console.log(`\n📄 Full report saved to: ${outputFile}`);
    console.log('\n🎉 CDN image check completed!');
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  checkEventsCdnImages()
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export { checkEventsCdnImages };
