#!/usr/bin/env node

/**
 * Test script to check API and find news items
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
          resolve({ data, status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function testAPI() {
  console.log('🔍 Testing Mnemo API...\n');

  try {
    // Test different endpoints
    const endpoints = [
      '/api/collection-items',
      '/api/collection-items?type=news',
      '/api/collection-items?limit=5'
    ];

    for (const endpoint of endpoints) {
      console.log(`Testing: ${MNEMO_API_BASE}${endpoint}`);
      const response = await makeRequest(`${MNEMO_API_BASE}${endpoint}`);

      console.log(`Status: ${response.status}`);
      console.log(`Response type: ${typeof response.data || response.items}`);

      if (response.items) {
        console.log(`Items found: ${response.items.length}`);
        if (response.items.length > 0) {
          console.log(`First item type: ${response.items[0].type}`);
          console.log(`First item title: ${response.items[0].title}`);
        }
      } else if (response.data) {
        console.log(
          `Raw response: ${JSON.stringify(response).substring(0, 500)}...`
        );
      }
      console.log('---');
    }

    // Try to find a specific news item by searching the database directly
    console.log('\n🔍 Searching for news items with summary...');

    // Let's try to get items and filter
    const allResponse = await makeRequest(
      `${MNEMO_API_BASE}/api/collection-items`
    );
    console.log(`\nFull API response structure:`);
    console.log(`Status: ${allResponse.status}`);
    console.log(`Keys: ${Object.keys(allResponse)}`);

    if (allResponse.success !== undefined) {
      console.log(`Success: ${allResponse.success}`);
    }

    if (allResponse.collectionItems) {
      console.log(
        `Collection items found: ${allResponse.collectionItems.length}`
      );
      const newsItems = allResponse.collectionItems.filter(
        (item) => item.type === 'news'
      );
      console.log(`News items: ${newsItems.length}`);

      if (newsItems.length > 0) {
        const firstNews = newsItems[0];
        console.log(`\nFirst news item structure:`);
        console.log(`ID: ${firstNews.id}`);
        console.log(`Title: ${firstNews.title}`);
        console.log(`Data keys: ${Object.keys(firstNews.data || {})}`);

        if (firstNews.data?.summary) {
          console.log(`✅ Summary found: ${typeof firstNews.data.summary}`);
          console.log(
            `Summary content: ${JSON.stringify(firstNews.data.summary, null, 2)}`
          );
        } else {
          console.log(`❌ No summary in data object`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testAPI();
