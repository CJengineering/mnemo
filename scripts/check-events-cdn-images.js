#!/usr/bin/env node

/**
 * Check CDN images for events in external API endpoint
 * Reports missing images or broken CDN links and saves results to JSON
 */

import fs from 'fs';
import path from 'path';

// Configuration
const API_BASE_URL = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';

/**
 * Check if an image URL is accessible
 */
async function checkImageUrl(url) {
  if (!url) return { accessible: false, reason: 'no_url' };

  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      accessible: response.ok,
      status: response.status,
      reason: response.ok ? 'success' : `http_${response.status}`
    };
  } catch (error) {
    return {
      accessible: false,
      reason: 'fetch_error',
      error: error.message
    };
  }
}

/**
 * Extract image URLs from event data
 */
function extractImageUrls(eventData) {
  const images = {};

  // Common image fields to check
  const imageFields = [
    'heroImage',
    'thumbnail',
    'featuredImage',
    'image',
    'coverImage',
    'openGraphImage'
  ];

  imageFields.forEach((field) => {
    if (eventData[field]) {
      if (typeof eventData[field] === 'string') {
        images[field] = eventData[field];
      } else if (eventData[field]?.url) {
        images[field] = eventData[field].url;
      } else if (eventData[field]?.src) {
        images[field] = eventData[field].src;
      }
    }
  });

  return images;
}

/**
 * Fetch all events from the API
 */
async function fetchAllEvents() {
  try {
    console.log('📡 Fetching events from API...');

    const response = await fetch(
      `${API_BASE_URL}/api/collection-items?type=event`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data?.length || 0} events from API`);
    return data || [];
  } catch (error) {
    console.error('❌ Failed to fetch events:', error);
    return [];
  }
}

/**
 * Check a single event for image issues
 */
async function checkEventImages(event) {
  if (!event.slug) {
    return {
      slug: 'unknown',
      title: event.title || 'Untitled',
      issues: ['missing_slug'],
      images: {}
    };
  }

  console.log(`🔍 Checking event: ${event.title} (${event.slug})`);

  const images = extractImageUrls(event.data || {});
  const issues = [];
  const imageResults = {};

  // Check if event has any images at all
  if (Object.keys(images).length === 0) {
    issues.push('no_images_found');
  }

  // Check each image URL
  for (const [field, url] of Object.entries(images)) {
    console.log(`   📸 Checking ${field}: ${url}`);
    const result = await checkImageUrl(url);

    imageResults[field] = {
      url,
      accessible: result.accessible,
      status: result.status,
      reason: result.reason
    };

    if (!result.accessible) {
      issues.push(`${field}_broken`);
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    slug: event.slug,
    title: event.title,
    id: event.id,
    issues,
    images: imageResults,
    hasIssues: issues.length > 0
  };
}

/**
 * Main function
 */
async function checkEventsCdnImages() {
  console.log('🚀 Starting CDN image check for events...\n');

  const startTime = Date.now();

  try {
    // Fetch all events
    const events = await fetchAllEvents();

    if (events.length === 0) {
      console.log('⚠️  No events found, exiting...');
      return;
    }

    console.log(`\n📈 Checking ${events.length} events for image issues...\n`);

    const results = [];
    const summary = {
      totalEvents: events.length,
      eventsWithIssues: 0,
      eventsWithoutImages: 0,
      eventsBrokenCdn: 0,
      eventsHealthy: 0,
      issueTypes: {}
    };

    // Check each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`[${i + 1}/${events.length}]`);

      const result = await checkEventImages(event);
      results.push(result);

      // Update summary
      if (result.hasIssues) {
        summary.eventsWithIssues++;

        if (result.issues.includes('no_images_found')) {
          summary.eventsWithoutImages++;
        }

        if (result.issues.some((issue) => issue.includes('_broken'))) {
          summary.eventsBrokenCdn++;
        }

        // Count issue types
        result.issues.forEach((issue) => {
          summary.issueTypes[issue] = (summary.issueTypes[issue] || 0) + 1;
        });
      } else {
        summary.eventsHealthy++;
      }

      // Rate limiting between events
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Filter events with issues
    const eventsWithIssues = results.filter((r) => r.hasIssues);

    // Prepare final report
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      eventsWithIssues: eventsWithIssues.map((event) => ({
        slug: event.slug,
        title: event.title,
        id: event.id,
        issues: event.issues,
        brokenImages: Object.entries(event.images)
          .filter(([_, img]) => !img.accessible)
          .map(([field, img]) => ({
            field,
            url: img.url,
            reason: img.reason,
            status: img.status
          }))
      })),
      allResults: results
    };

    // Save to JSON file
    const outputPath = path.join(process.cwd(), 'events-cdn-image-check.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    // Display summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('📊 EVENTS CDN IMAGE CHECK SUMMARY');
    console.log('='.repeat(60));
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📊 Total events checked: ${summary.totalEvents}`);
    console.log(`✅ Events with healthy images: ${summary.eventsHealthy}`);
    console.log(`⚠️  Events with issues: ${summary.eventsWithIssues}`);
    console.log(`🚫 Events without images: ${summary.eventsWithoutImages}`);
    console.log(`💥 Events with broken CDN: ${summary.eventsBrokenCdn}`);

    if (Object.keys(summary.issueTypes).length > 0) {
      console.log('\n📋 Issue breakdown:');
      Object.entries(summary.issueTypes).forEach(([issue, count]) => {
        console.log(`   • ${issue}: ${count} events`);
      });
    }

    console.log(`\n💾 Detailed report saved to: ${outputPath}`);

    if (eventsWithIssues.length > 0) {
      console.log('\n🔍 Events with issues:');
      eventsWithIssues.slice(0, 10).forEach((event) => {
        console.log(`   • ${event.slug} - ${event.issues.join(', ')}`);
      });

      if (eventsWithIssues.length > 10) {
        console.log(
          `   ... and ${eventsWithIssues.length - 10} more (see JSON file)`
        );
      }
    }

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
