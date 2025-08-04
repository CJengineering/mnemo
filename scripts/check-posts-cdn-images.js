#!/usr/bin/env node

/**
 * Check CDN images specifically in the posts collection
 * Tests which posts are missing images or have broken CDN links
 * Outputs results to a JSON file similar to programmes
 */

import fs from 'fs';
import path from 'path';

// Configuration
const API_BASE_URL = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';
const OUTPUT_FILE = 'posts-image-issues-report.json';

// Post-specific image fields based on WebflowPostForm schema
const POST_IMAGE_FIELDS = [
  'thumbnail',
  'heroImage',
  'mainImage',
  'openGraphImage',
  'imageCarousel' // Array of images
];

// CDN base URL to check for CDN-uploaded images
const CDN_BASE_URL = 'https://cdn.communityjameel.io';

/**
 * Test API connectivity and discover available collections
 */
async function testApiConnectivity() {
  console.log(`🔍 Testing API connectivity...`);
  console.log(`   🔗 Base URL: ${API_BASE_URL}`);

  try {
    // Test base API endpoint
    const response = await fetch(`${API_BASE_URL}/api/collection-items`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`   📡 API Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ API is accessible`);
      console.log(`   📊 Response structure:`, Object.keys(data));

      if (Array.isArray(data)) {
        console.log(`   📋 Found ${data.length} total items`);
        const posts = data.filter((item) => item.type === 'posts');
        console.log(`   📰 Found ${posts.length} posts`);
        return posts;
      } else if (data.items && Array.isArray(data.items)) {
        console.log(`   📋 Found ${data.items.length} total items`);
        const posts = data.items.filter((item) => item.type === 'posts');
        console.log(`   📰 Found ${posts.length} posts`);
        return posts;
      } else if (data.collectionItems && Array.isArray(data.collectionItems)) {
        console.log(`   📋 Found ${data.collectionItems.length} total items`);

        // Debug: check what types are available
        const types = {};
        data.collectionItems.forEach((item) => {
          types[item.type] = (types[item.type] || 0) + 1;
        });
        console.log(`   🔍 Available types:`, types);

        const posts = data.collectionItems.filter(
          (item) =>
            item.type === 'posts' ||
            item.type === 'post' ||
            item.type === 'blog' ||
            item.type === 'blogs' ||
            item.type === 'news' ||
            item.type === 'article' ||
            item.type === 'articles'
        );
        console.log(`   📰 Found ${posts.length} posts`);
        return posts;
      } else if (data.success && data.collectionItems) {
        console.log(`   📋 Found ${data.collectionItems.length} total items`);

        // Debug: check what types are available
        const types = {};
        data.collectionItems.forEach((item) => {
          types[item.type] = (types[item.type] || 0) + 1;
        });
        console.log(`   🔍 Available types:`, types);

        const posts = data.collectionItems.filter(
          (item) =>
            item.type === 'posts' ||
            item.type === 'post' ||
            item.type === 'blog' ||
            item.type === 'blogs' ||
            item.type === 'news' ||
            item.type === 'article' ||
            item.type === 'articles'
        );
        console.log(`   📰 Found ${posts.length} posts`);
        return posts;
      }
    } else {
      // Log response body for debugging
      const errorText = await response.text();
      console.log(
        `   ❌ API failed: ${response.status} - ${errorText.substring(0, 200)}`
      );
    }
  } catch (error) {
    console.log(`   ❌ Error connecting to API:`, error.message);
  }

  return [];
}

/**
 * Fetch posts using the corrected API endpoint format
 */
async function fetchAllPosts() {
  console.log('📡 Fetching posts from API...');

  try {
    console.log(`   🔄 Using corrected API endpoint format: ?=posts`);

    const response = await fetch(
      `${API_BASE_URL}/api/collection-items?=posts`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`   📡 Response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   📊 Response structure:`, Object.keys(data));

      let posts = [];

      // Handle different response structures
      if (Array.isArray(data)) {
        posts = data;
      } else if (data.collectionItems && Array.isArray(data.collectionItems)) {
        posts = data.collectionItems;
      } else if (data.items && Array.isArray(data.items)) {
        posts = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        posts = data.data;
      }

      console.log(`   📈 Found ${posts.length} posts`);

      if (posts.length > 0) {
        console.log(
          `   ✅ Successfully fetched posts using corrected endpoint`
        );
        console.log(`   📄 Sample post fields:`, Object.keys(posts[0] || {}));
        return posts;
      } else {
        console.log(`   ⚠️  No posts found in response`);
      }
    } else {
      // Log response body for debugging
      const errorText = await response.text();
      console.log(
        `   ❌ API failed: ${response.status} - ${errorText.substring(0, 200)}`
      );
    }
  } catch (error) {
    console.log(`   ❌ Error fetching posts:`, error.message);
  }

  // Fallback: try the general API endpoint
  console.log(`   🔄 Fallback: trying general API endpoint`);
  const posts = await testApiConnectivity();
  if (posts.length > 0) {
    return posts;
  }

  console.error(`❌ Failed to fetch posts with any endpoint`);
  return [];
}

/**
 * Check if an image URL is accessible
 */
async function checkImageUrl(url) {
  if (!url) return { accessible: false, reason: 'no_url' };

  try {
    console.log(`     🔍 Checking: ${url.substring(0, 80)}...`);
    const response = await fetch(url, {
      method: 'HEAD',
      timeout: 10000 // 10 second timeout
    });

    const result = {
      accessible: response.ok,
      status: response.status,
      reason: response.ok ? 'ok' : `http_${response.status}`,
      url: url
    };

    if (response.ok) {
      console.log(`       ✅ OK (${response.status})`);
    } else {
      console.log(`       ❌ Failed (${response.status})`);
    }

    return result;
  } catch (error) {
    console.log(`       ❌ Network error: ${error.message}`);
    return {
      accessible: false,
      reason: 'network_error',
      error: error.message,
      url: url
    };
  }
}

/**
 * Extract image URLs from post data
 */
function extractImageUrls(post) {
  const images = {};
  const data = post.data || post;

  console.log(`   📋 Post structure:`, {
    id: post.id,
    slug: data.slug,
    title: data.title,
    dataKeys: Object.keys(data),
    hasImages: POST_IMAGE_FIELDS.some((field) => data[field])
  });

  // Check each expected image field
  POST_IMAGE_FIELDS.forEach((fieldName) => {
    const fieldValue = data[fieldName];

    if (fieldName === 'imageCarousel') {
      // Handle image carousel (array of images)
      if (Array.isArray(fieldValue) && fieldValue.length > 0) {
        images[fieldName] = fieldValue.map((img, index) => ({
          url: typeof img === 'string' ? img : img?.url || '',
          alt: typeof img === 'object' ? img?.alt || '' : '',
          index: index
        }));
      } else {
        images[fieldName] = [];
      }
    } else {
      // Handle single image fields (thumbnail, heroImage, mainImage, openGraphImage)
      if (fieldValue) {
        if (typeof fieldValue === 'string') {
          images[fieldName] = { url: fieldValue, alt: '' };
        } else if (typeof fieldValue === 'object' && fieldValue.url) {
          images[fieldName] = {
            url: fieldValue.url,
            alt: fieldValue.alt || ''
          };
        } else {
          images[fieldName] = { url: '', alt: '' };
        }
      } else {
        images[fieldName] = { url: '', alt: '' };
      }
    }
  });

  return images;
}

/**
 * Check all image URLs for a post
 */
async function checkPostImages(post) {
  const data = post.data || post;
  const slug = data.slug || `post-${post.id}`;
  const title = data.title || 'Untitled Post';

  console.log(`\n📰 Checking post: "${title}" (${slug})`);

  const extractedImages = extractImageUrls(post);
  const results = {
    slug,
    title,
    type: post.type || 'Unknown',
    totalImages: 0,
    cdnImages: 0,
    accessibleImages: 0,
    brokenImages: 0,
    missingImages: 0,
    images: {}
  };

  // Check single image fields
  for (const fieldName of [
    'thumbnail',
    'heroImage',
    'mainImage',
    'openGraphImage'
  ]) {
    const imageData = extractedImages[fieldName];

    if (imageData && imageData.url) {
      console.log(`   🖼️  Checking ${fieldName}...`);
      const checkResult = await checkImageUrl(imageData.url);

      results.images[fieldName] = {
        url: imageData.url,
        alt: imageData.alt,
        ...checkResult
      };

      results.totalImages++;
      if (imageData.url.includes(CDN_BASE_URL)) results.cdnImages++;
      if (checkResult.accessible) {
        results.accessibleImages++;
      } else {
        results.brokenImages++;
      }
    } else {
      console.log(`   ⚠️  Missing ${fieldName}`);
      results.images[fieldName] = {
        url: '',
        accessible: false,
        reason: 'missing'
      };
      results.missingImages++;
    }
  }

  // Check image carousel
  const carouselImages = extractedImages.imageCarousel || [];
  if (carouselImages.length > 0) {
    console.log(
      `   🎠 Checking image carousel (${carouselImages.length} images)...`
    );
    results.images.imageCarousel = [];

    for (let i = 0; i < carouselImages.length; i++) {
      const img = carouselImages[i];
      if (img.url) {
        const checkResult = await checkImageUrl(img.url);

        results.images.imageCarousel.push({
          index: i,
          url: img.url,
          alt: img.alt,
          ...checkResult
        });

        results.totalImages++;
        if (img.url.includes(CDN_BASE_URL)) results.cdnImages++;
        if (checkResult.accessible) {
          results.accessibleImages++;
        } else {
          results.brokenImages++;
        }
      } else {
        results.images.imageCarousel.push({
          index: i,
          url: '',
          accessible: false,
          reason: 'missing'
        });
        results.missingImages++;
      }
    }
  } else {
    console.log(`   ⚠️  No image carousel`);
    results.images.imageCarousel = [];
  }

  // Summary for this post
  console.log(
    `   📊 Summary: ${results.accessibleImages}/${results.totalImages} images accessible, ${results.cdnImages} on CDN, ${results.brokenImages} broken, ${results.missingImages} missing`
  );

  return results;
}

/**
 * Generate summary statistics
 */
function generateSummary(results) {
  const summary = {
    totalPosts: results.length,
    postsWithAllImagesWorking: 0,
    postsWithSomeIssues: 0,
    postsWithNoImages: 0,
    totalImages: 0,
    totalCdnImages: 0,
    totalAccessibleImages: 0,
    totalBrokenImages: 0,
    totalMissingImages: 0,
    imageFieldStats: {},
    commonIssues: []
  };

  // Initialize image field stats
  POST_IMAGE_FIELDS.forEach((field) => {
    summary.imageFieldStats[field] = {
      total: 0,
      accessible: 0,
      broken: 0,
      missing: 0,
      cdnHosted: 0
    };
  });

  results.forEach((post) => {
    summary.totalImages += post.totalImages;
    summary.totalCdnImages += post.cdnImages;
    summary.totalAccessibleImages += post.accessibleImages;
    summary.totalBrokenImages += post.brokenImages;
    summary.totalMissingImages += post.missingImages;

    // Categorize posts
    if (post.totalImages === 0) {
      summary.postsWithNoImages++;
    } else if (post.brokenImages === 0 && post.missingImages === 0) {
      summary.postsWithAllImagesWorking++;
    } else {
      summary.postsWithSomeIssues++;
    }

    // Count field-specific stats
    Object.keys(post.images).forEach((fieldName) => {
      if (fieldName === 'imageCarousel') {
        const carouselImages = post.images[fieldName] || [];
        carouselImages.forEach((img) => {
          summary.imageFieldStats[fieldName].total++;
          if (img.accessible) summary.imageFieldStats[fieldName].accessible++;
          else if (img.reason === 'missing')
            summary.imageFieldStats[fieldName].missing++;
          else summary.imageFieldStats[fieldName].broken++;
          if (img.url && img.url.includes(CDN_BASE_URL))
            summary.imageFieldStats[fieldName].cdnHosted++;
        });
      } else {
        const img = post.images[fieldName];
        summary.imageFieldStats[fieldName].total++;
        if (img.accessible) summary.imageFieldStats[fieldName].accessible++;
        else if (img.reason === 'missing')
          summary.imageFieldStats[fieldName].missing++;
        else summary.imageFieldStats[fieldName].broken++;
        if (img.url && img.url.includes(CDN_BASE_URL))
          summary.imageFieldStats[fieldName].cdnHosted++;
      }
    });
  });

  return summary;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting posts CDN image checker...');
  console.log(`📁 Output file: ${OUTPUT_FILE}`);
  console.log(`🌐 CDN Base URL: ${CDN_BASE_URL}`);

  try {
    // Fetch all posts
    const posts = await fetchAllPosts();

    if (posts.length === 0) {
      console.log('❌ No posts found. Exiting.');
      return;
    }

    console.log(`\n📰 Found ${posts.length} posts to check`);

    // Check images for each post
    const results = [];
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n[${i + 1}/${posts.length}]`);

      try {
        const postResult = await checkPostImages(post);
        results.push(postResult);
      } catch (error) {
        console.error(`❌ Error checking post ${post.id}:`, error.message);
        results.push({
          slug: post.data?.slug || `post-${post.id}`,
          title: post.data?.title || 'Error',
          type: 'Error',
          error: error.message,
          totalImages: 0,
          cdnImages: 0,
          accessibleImages: 0,
          brokenImages: 0,
          missingImages: 0,
          images: {}
        });
      }

      // Add small delay to avoid overwhelming the servers
      if (i < posts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Generate summary
    const summary = generateSummary(results);

    // Prepare final report
    const report = {
      generatedAt: new Date().toISOString(),
      apiBaseUrl: API_BASE_URL,
      cdnBaseUrl: CDN_BASE_URL,
      summary,
      posts: results
    };

    // Write results to file
    const outputPath = path.resolve(OUTPUT_FILE);
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    // Display summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 POSTS CDN IMAGE CHECK SUMMARY');
    console.log('='.repeat(80));
    console.log(`📰 Total Posts: ${summary.totalPosts}`);
    console.log(
      `✅ Posts with all images working: ${summary.postsWithAllImagesWorking}`
    );
    console.log(`⚠️  Posts with some issues: ${summary.postsWithSomeIssues}`);
    console.log(`❌ Posts with no images: ${summary.postsWithNoImages}`);
    console.log('');
    console.log(`🖼️  Total Images: ${summary.totalImages}`);
    console.log(`🌐 CDN-hosted images: ${summary.totalCdnImages}`);
    console.log(`✅ Accessible images: ${summary.totalAccessibleImages}`);
    console.log(`❌ Broken images: ${summary.totalBrokenImages}`);
    console.log(`⚠️  Missing images: ${summary.totalMissingImages}`);
    console.log('');
    console.log('📋 Image Field Breakdown:');
    Object.entries(summary.imageFieldStats).forEach(([field, stats]) => {
      console.log(
        `   ${field}: ${stats.accessible}/${stats.total} accessible (${stats.cdnHosted} on CDN, ${stats.broken} broken, ${stats.missing} missing)`
      );
    });
    console.log('');
    console.log(`📄 Detailed report saved to: ${outputPath}`);
    console.log('='.repeat(80));
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
