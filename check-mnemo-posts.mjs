#!/usr/bin/env node

/**
 * Quick test to check if posts exist in Mnemo database
 * This will help us understand if the migration is actually working
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MNEMO_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';

/**
 * Fetch posts from Mnemo API
 */
async function checkMnemoPosts() {
  console.log('🔍 Checking posts in Mnemo database...\n');

  const response = await fetch(
    `${MNEMO_API_BASE}/api/collection-items?type=post&limit=10`,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Mnemo API error: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  const data = await response.json();
  return data;
}

async function main() {
  try {
    console.log('🚀 MNEMO DATABASE CHECK');
    console.log('='.repeat(50));

    const posts = await checkMnemoPosts();

    console.log(`✅ Found ${posts.length} posts in Mnemo database:\n`);

    // Recent Webflow post IDs we just migrated
    const recentWebflowIds = [
      '6870e7527eb371f27aec0e61',
      '686fe58669daeaf5bcfdd8d1',
      '686b69c87111cae2985c825f',
      '686530ec3e19111feef62a28',
      '686270e505d9e67ccb2bc5bf'
    ];

    posts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}"`);
      console.log(`   ID: ${post.id}`);
      console.log(`   Slug: ${post.slug}`);
      console.log(`   Status: ${post.status}`);
      console.log(`   Created: ${post.createdAt || 'Unknown'}`);

      // Check if this is one of our recent migrations
      const webflowId = post.data?.webflowMeta?.webflowId;
      if (webflowId && recentWebflowIds.includes(webflowId)) {
        console.log(`   🎯 RECENTLY MIGRATED (Webflow ID: ${webflowId})`);
      }

      console.log('');
    });

    // Check for recent migrations
    const recentMigrations = posts.filter((post) => {
      const webflowId = post.data?.webflowMeta?.webflowId;
      return webflowId && recentWebflowIds.includes(webflowId);
    });

    console.log(`🔄 Recent migrations found: ${recentMigrations.length}/5`);

    if (recentMigrations.length > 0) {
      console.log('✅ Migration is working! Posts are being created in Mnemo.');

      // Check image URLs to see if CDN migration is working
      const postWithImages = recentMigrations.find(
        (p) => p.data?.mainImage?.url || p.data?.thumbnail?.url
      );

      if (postWithImages) {
        console.log('\n📸 Image URL check:');
        if (postWithImages.data.mainImage?.url) {
          const isCDN = postWithImages.data.mainImage.url.includes(
            'cdn.communityjameel.io'
          );
          console.log(
            `   Main image: ${isCDN ? '✅ CDN' : '❌ Original Webflow'}`
          );
          console.log(`   URL: ${postWithImages.data.mainImage.url}`);
        }
        if (postWithImages.data.thumbnail?.url) {
          const isCDN = postWithImages.data.thumbnail.url.includes(
            'cdn.communityjameel.io'
          );
          console.log(
            `   Thumbnail: ${isCDN ? '✅ CDN' : '❌ Original Webflow'}`
          );
          console.log(`   URL: ${postWithImages.data.thumbnail.url}`);
        }
      }
    } else {
      console.log(
        '⚠️ No recent migrations found. Check if API is working correctly.'
      );
    }
  } catch (error) {
    console.error(`💥 Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
