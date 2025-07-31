#!/usr/bin/env node

/**
 * Check CDN images for news items
 * Tests which news items are missing images or have broken CDN links
 * Outputs results to a JSON file
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
    const response = await fetch(url, {
      method: 'HEAD',
      timeout: 10000 // 10 second timeout
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const isImage = contentType && contentType.startsWith('image/');
      return {
        accessible: true,
        status: response.status,
        contentType,
        isImage
      };
    } else {
      return {
        accessible: false,
        reason: 'http_error',
        status: response.status
      };
    }
  } catch (error) {
    return {
      accessible: false,
      reason: 'network_error',
      error: error.message
    };
  }
}

/**
 * Fetch all news items from the API
 */
async function fetchAllNewsItems() {
  try {
    console.log('📡 Fetching news items from API...');

    // First, get all collection items and filter for news
    const response = await fetch(`${API_BASE_URL}/api/collection-items`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📋 API Response structure:', {
      keys: Object.keys(data),
      hasItems: !!data.items,
      isArray: Array.isArray(data),
      sample: Array.isArray(data) ? data[0] : data.items?.[0]
    });

    let allItems = [];
    if (Array.isArray(data)) {
      allItems = data;
    } else if (data.items && Array.isArray(data.items)) {
      allItems = data.items;
    } else {
      console.error('❌ Unexpected API response structure:', data);
      return [];
    }

    // Filter for news items (type = 'news')
    const newsItems = allItems.filter((item) => item.type === 'news');

    console.log(`✅ Found ${newsItems.length} news items`);
    return newsItems;
  } catch (error) {
    console.error('❌ Failed to fetch news items:', error);
    return [];
  }
}

/**
 * Extract image URLs from a news item
 */
function extractImageUrls(newsItem) {
  const images = [];
  const data = newsItem.data || {};

  // Common image fields in news items
  const imageFields = [
    'heroImage',
    'thumbnailImage',
    'featuredImage',
    'image',
    'coverImage',
    'mainImage'
  ];

  imageFields.forEach((field) => {
    if (data[field]) {
      if (typeof data[field] === 'string') {
        images.push({ field, url: data[field] });
      } else if (data[field].url) {
        images.push({ field, url: data[field].url });
      }
    }
  });

  return images;
}

/**
 * Check images for a single news item
 */
async function checkNewsItemImages(newsItem) {
  const images = extractImageUrls(newsItem);
  const results = [];

  if (images.length === 0) {
    return {
      slug: newsItem.slug,
      title: newsItem.title,
      hasImages: false,
      issues: ['no_images_found'],
      imageResults: []
    };
  }

  console.log(`   📋 Checking ${images.length} images for: ${newsItem.title}`);

  for (const image of images) {
    const checkResult = await checkImageUrl(image.url);
    results.push({
      field: image.field,
      url: image.url,
      ...checkResult
    });

    // Rate limiting between image checks
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const issues = [];
  const brokenImages = results.filter((r) => !r.accessible);
  const nonImageContent = results.filter((r) => r.accessible && !r.isImage);

  if (brokenImages.length > 0) {
    issues.push('broken_cdn_links');
  }
  if (nonImageContent.length > 0) {
    issues.push('non_image_content');
  }

  return {
    slug: newsItem.slug,
    title: newsItem.title,
    hasImages: true,
    issues,
    imageResults: results,
    summary: {
      total: results.length,
      accessible: results.filter((r) => r.accessible).length,
      broken: brokenImages.length,
      nonImage: nonImageContent.length
    }
  };
}

/**
 * Main function
 */
async function checkNewsCdnImages(testLimit = null) {
  console.log('🚀 Starting news CDN image check...\n');

  if (testLimit) {
    console.log(`🧪 TEST MODE: Checking only first ${testLimit} news items\n`);
  }

  console.log(`📊 Configuration:`);
  console.log(`   - API Base URL: ${API_BASE_URL}`);
  console.log(`   - Target Type: news`);
  console.log();

  try {
    // Fetch all news items
    const newsItems = await fetchAllNewsItems();

    if (newsItems.length === 0) {
      console.log('⚠️  No news items found, exiting...');
      return;
    }

    console.log(`\n📈 Checking ${newsItems.length} news items...\n`);

    // Process news items (limited in test mode)
    const itemsToProcess = testLimit
      ? newsItems.slice(0, testLimit)
      : newsItems;

    const results = [];
    const issues = {
      noImages: [],
      brokenCdnLinks: [],
      nonImageContent: [],
      allGood: []
    };

    for (let i = 0; i < itemsToProcess.length; i++) {
      const newsItem = itemsToProcess[i];

      console.log(
        `[${i + 1}/${itemsToProcess.length}] ${newsItem.title || newsItem.slug}`
      );

      const result = await checkNewsItemImages(newsItem);
      results.push(result);

      // Categorize issues
      if (!result.hasImages) {
        issues.noImages.push(result.slug);
      } else if (result.issues.includes('broken_cdn_links')) {
        issues.brokenCdnLinks.push(result.slug);
      } else if (result.issues.includes('non_image_content')) {
        issues.nonImageContent.push(result.slug);
      } else if (result.issues.length === 0) {
        issues.allGood.push(result.slug);
      }

      // Rate limiting between items
      if (i < itemsToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecked: itemsToProcess.length,
        noImages: issues.noImages.length,
        brokenCdnLinks: issues.brokenCdnLinks.length,
        nonImageContent: issues.nonImageContent.length,
        allGood: issues.allGood.length
      },
      issues,
      detailedResults: results.filter(
        (r) => r.issues.length > 0 || !r.hasImages
      )
    };

    // Save to JSON file
    const outputPath = path.join(process.cwd(), 'news-cdn-image-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 NEWS CDN IMAGE CHECK SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ All images working: ${issues.allGood.length} news items`);
    console.log(`⚠️  No images found: ${issues.noImages.length} news items`);
    console.log(
      `❌ Broken CDN links: ${issues.brokenCdnLinks.length} news items`
    );
    console.log(
      `⚠️  Non-image content: ${issues.nonImageContent.length} news items`
    );
    console.log(`📊 Total checked: ${itemsToProcess.length} news items`);

    if (testLimit && newsItems.length > testLimit) {
      console.log(
        `🧪 Test mode: ${newsItems.length - testLimit} news items skipped`
      );
    }

    console.log(`\n📄 Detailed report saved to: ${outputPath}`);
    console.log('\n🎉 CDN image check completed!');

    // Show problematic items
    if (issues.brokenCdnLinks.length > 0) {
      console.log('\n❌ News items with broken CDN links:');
      issues.brokenCdnLinks.forEach((slug) => console.log(`   - ${slug}`));
    }

    if (issues.noImages.length > 0) {
      console.log('\n⚠️  News items with no images:');
      issues.noImages.forEach((slug) => console.log(`   - ${slug}`));
    }
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  // Test mode: check only first 10 news items for testing
  checkNewsCdnImages(10)
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export { checkNewsCdnImages };
