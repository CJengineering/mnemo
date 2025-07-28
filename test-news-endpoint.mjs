#!/usr/bin/env node

/**
 * Simple script to test the Mnemo API endpoint and check news item structure
 */

import https from 'https';

const MNEMO_API_BASE = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';

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
    req.end();
  });
}

async function testNewsEndpoint() {
  console.log('🔍 Testing Mnemo API endpoint for news items...\n');

  try {
    // First, get all collection items to find a news item
    console.log('1. Fetching all collection items...');
    const allItems = await makeRequest(
      `${MNEMO_API_BASE}/api/collection-items`
    );

    if (allItems.status !== 200) {
      console.log('❌ Failed to fetch collection items:', allItems);
      return;
    }

    console.log(`✅ Found ${allItems.items?.length || 0} total items`);

    // Find a news item
    const newsItems =
      allItems.items?.filter((item) => item.type === 'news') || [];
    console.log(`📰 Found ${newsItems.length} news items`);

    if (newsItems.length === 0) {
      console.log('❌ No news items found');
      return;
    }

    // Get the first news item details
    const firstNewsItem = newsItems[0];
    console.log(`\n2. Fetching details for news item: ${firstNewsItem.title}`);
    console.log(`   ID: ${firstNewsItem.id}`);
    console.log(`   Slug: ${firstNewsItem.slug}`);

    const itemDetails = await makeRequest(
      `${MNEMO_API_BASE}/api/collection-items/${firstNewsItem.id}`
    );

    if (itemDetails.status !== 200) {
      console.log('❌ Failed to fetch item details:', itemDetails);
      return;
    }

    console.log('\n📊 NEWS ITEM STRUCTURE:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(itemDetails, null, 2));

    // Check specifically for summary field
    console.log('\n🔍 SUMMARY FIELD ANALYSIS:');
    console.log('='.repeat(30));

    if (itemDetails.data?.summary) {
      console.log('✅ Summary found in data.summary:');
      console.log(`   Type: ${typeof itemDetails.data.summary}`);
      console.log(
        `   Content: ${JSON.stringify(itemDetails.data.summary, null, 2)}`
      );
    } else {
      console.log('❌ No summary found in data.summary');
    }

    if (itemDetails.summary) {
      console.log('✅ Summary found in root level:');
      console.log(`   Type: ${typeof itemDetails.summary}`);
      console.log(
        `   Content: ${JSON.stringify(itemDetails.summary, null, 2)}`
      );
    } else {
      console.log('❌ No summary found in root level');
    }

    // Check all fields in data object
    console.log('\n📋 ALL DATA FIELDS:');
    console.log('='.repeat(20));
    if (itemDetails.data) {
      Object.keys(itemDetails.data).forEach((key) => {
        const value = itemDetails.data[key];
        console.log(
          `   ${key}: ${typeof value} ${Array.isArray(value) ? `(array of ${value.length})` : ''}`
        );

        // If it's the summary field, show more details
        if (key === 'summary' && value) {
          console.log(
            `      Content preview: ${JSON.stringify(value).substring(0, 200)}...`
          );
        }
      });
    } else {
      console.log('   No data object found');
    }
  } catch (error) {
    console.log('❌ Error testing endpoint:', error.message);
  }
}

testNewsEndpoint();
