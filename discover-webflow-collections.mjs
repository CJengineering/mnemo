#!/usr/bin/env node

/**
 * Webflow Discovery Script
 *
 * This script helps you discover your Webflow site ID and collection IDs
 * using the Webflow API token.
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;

if (!WEBFLOW_API_TOKEN) {
  console.error('❌ WEBFLOW_API_TOKEN not found in .env.local');
  process.exit(1);
}

/**
 * Get sites from Webflow API
 */
async function getWebflowSites() {
  console.log('🔍 Discovering Webflow sites...\n');

  const response = await fetch('https://api.webflow.com/v2/sites', {
    headers: {
      Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
      'accept-version': '1.0.0',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Webflow API error: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  const data = await response.json();
  return data.sites || [];
}

/**
 * Get collections for a specific site
 */
async function getWebflowCollections(siteId) {
  console.log(`📚 Getting collections for site ${siteId}...\n`);

  const response = await fetch(
    `https://api.webflow.com/v2/sites/${siteId}/collections`,
    {
      headers: {
        Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Webflow API error: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  const data = await response.json();
  return data.collections || [];
}

/**
 * Get a sample item from a collection to understand structure
 */
async function getSampleCollectionItem(collectionId) {
  const response = await fetch(
    `https://api.webflow.com/v2/collections/${collectionId}/items?limit=1`,
    {
      headers: {
        Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.items?.[0] || null;
}

/**
 * Main discovery function
 */
async function discoverWebflow() {
  try {
    console.log('🚀 WEBFLOW DISCOVERY SCRIPT');
    console.log('='.repeat(50));

    // Get sites
    const sites = await getWebflowSites();

    if (sites.length === 0) {
      console.log('⚠️ No sites found for this API token');
      return;
    }

    console.log(`✅ Found ${sites.length} site(s):\n`);

    for (const site of sites) {
      console.log(`🌐 Site: ${site.displayName}`);
      console.log(`   Site ID: ${site.id}`);
      console.log(
        `   Custom Domains: ${site.customDomains?.join(', ') || 'None'}`
      );
      console.log(`   Default Domain: ${site.shortName}.webflow.io`);
      console.log('');

      // Get collections for this site
      try {
        const collections = await getWebflowCollections(site.id);

        if (collections.length === 0) {
          console.log('   📚 No collections found\n');
          continue;
        }

        console.log(`   📚 Collections (${collections.length}):`);

        for (const collection of collections) {
          console.log(`      • ${collection.displayName}`);
          console.log(`        Collection ID: ${collection.id}`);
          console.log(`        Slug: ${collection.slug}`);

          // Try to get a sample item to understand structure
          const sampleItem = await getSampleCollectionItem(collection.id);
          if (sampleItem) {
            const fieldNames = Object.keys(sampleItem.fieldData || {});
            console.log(
              `        Sample Fields: ${fieldNames.slice(0, 5).join(', ')}${fieldNames.length > 5 ? '...' : ''}`
            );

            // Check if this looks like a posts collection
            const hasPostFields = fieldNames.some((field) =>
              ['name', 'title', 'slug', 'body', 'content'].includes(
                field.toLowerCase()
              )
            );

            if (hasPostFields) {
              console.log(
                `        🎯 LIKELY POSTS COLLECTION - Use this ID for WEBFLOW_POSTS_COLLECTION_ID`
              );
            }
          }
          console.log('');
        }

        console.log(`   📋 Suggested .env.local configuration:`);
        console.log(`   WEBFLOW_SITE_ID=${site.id}`);

        // Find the most likely posts collection
        const postsCollection = collections.find(
          (c) =>
            c.slug?.toLowerCase().includes('post') ||
            c.displayName?.toLowerCase().includes('post') ||
            c.slug?.toLowerCase().includes('blog') ||
            c.displayName?.toLowerCase().includes('blog')
        );

        if (postsCollection) {
          console.log(
            `   WEBFLOW_POSTS_COLLECTION_ID=${postsCollection.id}  # ${postsCollection.displayName}`
          );
        } else if (collections.length > 0) {
          console.log(
            `   WEBFLOW_POSTS_COLLECTION_ID=${collections[0].id}  # ${collections[0].displayName} (guessed)`
          );
        }

        console.log('');
        console.log('-'.repeat(50));
        console.log('');
      } catch (error) {
        console.error(`   ❌ Error getting collections: ${error.message}\n`);
      }
    }

    console.log('🎉 Discovery completed!');
    console.log('\n📝 Next steps:');
    console.log(
      '1. Copy the suggested WEBFLOW_SITE_ID and WEBFLOW_POSTS_COLLECTION_ID to your .env.local file'
    );
    console.log('2. Run: node test-webflow-to-mnemo-api.mjs');
  } catch (error) {
    console.error(`💥 Discovery failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run discovery
discoverWebflow();
