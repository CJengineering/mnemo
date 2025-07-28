#!/usr/bin/env node

/**
 * Check Post Image Fields
 *
 * This script examines the structure of posts to see where images are stored
 */

const CONFIG = {
  MNEMO_API_BASE: 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app'
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPostsFromAPI() {
  console.log('📡 Fetching posts from external Mnemo API...');

  const response = await fetch(
    `${CONFIG.MNEMO_API_BASE}/api/collection-items?type=post`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch posts: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log(
    `✅ Fetched ${data.collectionItems?.length || 0} posts from external API`
  );

  return data.collectionItems || [];
}

async function analyzePostImageFields() {
  console.log('🔍 Post Image Fields Analysis');
  console.log('=============================');

  try {
    const posts = await fetchPostsFromAPI();

    if (posts.length === 0) {
      console.log('❌ No posts found');
      return;
    }

    // Analyze first 3 posts to see their structure
    console.log(`📋 Analyzing first 3 posts structure...\n`);

    posts.slice(0, 3).forEach((post, index) => {
      console.log(`📝 Post ${index + 1}: "${post.title}" (${post.id})`);
      console.log(`   📎 Slug: ${post.slug}`);
      console.log(`   📊 Data keys:`, Object.keys(post.data || {}));

      // Check for image-related fields
      const data = post.data || {};
      const imageFields = [];

      Object.keys(data).forEach((key) => {
        const value = data[key];
        const lowerKey = key.toLowerCase();

        // Check if field might contain image URLs
        if (
          lowerKey.includes('image') ||
          lowerKey.includes('photo') ||
          lowerKey.includes('picture') ||
          lowerKey.includes('thumbnail') ||
          lowerKey.includes('hero') ||
          lowerKey.includes('featured') ||
          lowerKey.includes('opengraph') ||
          lowerKey.includes('og')
        ) {
          if (
            typeof value === 'string' &&
            (value.includes('http') || value.includes('cdn'))
          ) {
            imageFields.push({ key, value: value.substring(0, 100) + '...' });
          } else if (typeof value === 'object' && value !== null) {
            if (value.url) {
              imageFields.push({
                key,
                value: `{url: "${value.url.substring(0, 50)}..."}`
              });
            } else {
              imageFields.push({
                key,
                value: `{object with keys: ${Object.keys(value).join(', ')}}`
              });
            }
          } else {
            imageFields.push({ key, value: String(value) });
          }
        }
      });

      if (imageFields.length > 0) {
        console.log(`   🖼️  Image fields found:`);
        imageFields.forEach((field) => {
          console.log(`      ${field.key}: ${field.value}`);
        });
      } else {
        console.log(`   ⚠️  No image fields found`);
      }

      console.log('');
    });

    // Count posts with potential images
    let postsWithImages = 0;
    const imageFieldStats = {};

    posts.forEach((post) => {
      const data = post.data || {};
      let hasImages = false;

      Object.keys(data).forEach((key) => {
        const value = data[key];
        const lowerKey = key.toLowerCase();

        if (
          lowerKey.includes('image') ||
          lowerKey.includes('photo') ||
          lowerKey.includes('thumbnail') ||
          lowerKey.includes('hero') ||
          lowerKey.includes('featured') ||
          lowerKey.includes('opengraph')
        ) {
          if (
            typeof value === 'string' &&
            (value.includes('http') || value.includes('cdn'))
          ) {
            hasImages = true;
            imageFieldStats[key] = (imageFieldStats[key] || 0) + 1;
          } else if (typeof value === 'object' && value !== null && value.url) {
            hasImages = true;
            imageFieldStats[key] = (imageFieldStats[key] || 0) + 1;
          }
        }
      });

      if (hasImages) postsWithImages++;
    });

    console.log(`📊 Summary:`);
    console.log(`   📝 Total posts: ${posts.length}`);
    console.log(`   🖼️  Posts with images: ${postsWithImages}`);
    console.log(`   📈 Image field usage:`);

    Object.entries(imageFieldStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([field, count]) => {
        console.log(`      ${field}: ${count} posts`);
      });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the analysis
analyzePostImageFields().catch(console.error);
