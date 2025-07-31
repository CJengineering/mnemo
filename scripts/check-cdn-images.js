#!/usr/bin/env node

/**
 * Check CDN images in external API endpoints
 * Identifies items with missing images or CDN issues
 */

import fs from 'fs';
import path from 'path';

// Configuration
const API_BASE_URL = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';
const OUTPUT_FILE = 'cdn-image-issues-report.json';

// Collection types to check
const COLLECTION_TYPES = [
  'events',
  'news',
  'team',
  'publications',
  'awards',
  'programmes',
  'innovations',
  'prizes',
  'partners',
  'sources'
];

// Image fields to check (common field names)
const IMAGE_FIELDS = [
  'heroImage',
  'thumbnail',
  'image',
  'profileImage',
  'coverImage',
  'featuredImage',
  'avatar',
  'photo',
  'banner'
];

/**
 * Fetch all items from a collection endpoint
 */
async function fetchCollectionItems(collectionType) {
  try {
    console.log(`📡 Fetching ${collectionType} items...`);

    const response = await fetch(
      `${API_BASE_URL}/api/collection-items?type=${collectionType}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`   ℹ️  No ${collectionType} collection found (404)`);
        return [];
      }
      console.error(`❌ Failed to fetch ${collectionType}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const items = data.items || data.collectionItems || data || [];
    console.log(`   ✅ Found ${items.length} ${collectionType} items`);
    return items;
  } catch (error) {
    console.error(`❌ Error fetching ${collectionType}:`, error.message);
    return [];
  }
}

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
      reason: response.ok ? 'ok' : `http_${response.status}`
    };
  } catch (error) {
    return {
      accessible: false,
      reason: 'network_error',
      error: error.message
    };
  }
}

/**
 * Extract image URLs from item data
 */
function extractImageUrls(item) {
  const images = {};
  const data = item.data || item;

  // Check common image fields
  for (const field of IMAGE_FIELDS) {
    const value = data[field];
    if (value) {
      if (typeof value === 'string') {
        images[field] = value;
      } else if (value.url) {
        images[field] = value.url;
      } else if (value.src) {
        images[field] = value.src;
      }
    }
  }

  // Check for nested image objects in any field
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value && typeof value === 'object') {
      if (
        value.url &&
        (key.toLowerCase().includes('image') ||
          key.toLowerCase().includes('photo'))
      ) {
        images[key] = value.url;
      }
    }
  });

  return images;
}

/**
 * Check a single item for image issues
 */
async function checkItemImages(item, collectionType) {
  const slug = item.slug || item.data?.slug || `no-slug-${item.id}`;
  const title = item.title || item.data?.title || item.data?.name || 'Untitled';

  const images = extractImageUrls(item);
  const imageKeys = Object.keys(images);

  const result = {
    slug,
    title,
    collection: collectionType,
    id: item.id,
    totalImages: imageKeys.length,
    issues: []
  };

  if (imageKeys.length === 0) {
    result.issues.push({
      type: 'no_images',
      message: 'No image fields found in item data'
    });
    return result;
  }

  // Check each image URL
  for (const [field, url] of Object.entries(images)) {
    console.log(`     🔍 Checking ${field}: ${url.substring(0, 60)}...`);

    const check = await checkImageUrl(url);

    if (!check.accessible) {
      result.issues.push({
        type: 'image_not_accessible',
        field,
        url,
        reason: check.reason,
        status: check.status,
        error: check.error
      });
    }

    // Add small delay to avoid overwhelming servers
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return result;
}

/**
 * Main function to check all collections
 */
async function checkAllCdnImages() {
  console.log('🚀 Starting CDN image check across all collections...\n');

  const report = {
    timestamp: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    collectionsChecked: [],
    summary: {
      totalCollections: 0,
      totalItems: 0,
      itemsWithIssues: 0,
      itemsWithoutImages: 0,
      totalImageIssues: 0
    },
    itemsWithIssues: []
  };

  for (const collectionType of COLLECTION_TYPES) {
    console.log(`\n📂 Processing ${collectionType} collection...`);

    const items = await fetchCollectionItems(collectionType);

    const collectionSummary = {
      type: collectionType,
      totalItems: items.length,
      itemsChecked: 0,
      itemsWithIssues: 0,
      imageIssues: 0
    };

    if (items.length === 0) {
      report.collectionsChecked.push(collectionSummary);
      continue;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(
        `  [${i + 1}/${items.length}] Checking: ${item.title || item.data?.title || item.slug || 'Unknown'}`
      );

      const result = await checkItemImages(item, collectionType);
      collectionSummary.itemsChecked++;

      if (result.issues.length > 0) {
        report.itemsWithIssues.push(result);
        collectionSummary.itemsWithIssues++;
        collectionSummary.imageIssues += result.issues.length;

        console.log(`    ⚠️  Found ${result.issues.length} issue(s)`);
        result.issues.forEach((issue) => {
          console.log(
            `       - ${issue.type}: ${issue.message || issue.reason}`
          );
        });
      } else {
        console.log(`    ✅ All images accessible`);
      }

      // Rate limiting between items
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    report.collectionsChecked.push(collectionSummary);
    console.log(
      `📊 ${collectionType} summary: ${collectionSummary.itemsWithIssues}/${collectionSummary.totalItems} items with issues`
    );
  }

  // Calculate final summary
  report.summary.totalCollections = report.collectionsChecked.length;
  report.summary.totalItems = report.collectionsChecked.reduce(
    (sum, col) => sum + col.totalItems,
    0
  );
  report.summary.itemsWithIssues = report.itemsWithIssues.length;
  report.summary.itemsWithoutImages = report.itemsWithIssues.filter((item) =>
    item.issues.some((issue) => issue.type === 'no_images')
  ).length;
  report.summary.totalImageIssues = report.collectionsChecked.reduce(
    (sum, col) => sum + col.imageIssues,
    0
  );

  return report;
}

/**
 * Generate summary report files
 */
async function generateReports(report) {
  // Main detailed report
  const reportPath = path.resolve(OUTPUT_FILE);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);

  // Slugs-only report for quick reference
  const slugsOnlyReport = {
    timestamp: report.timestamp,
    summary: report.summary,
    slugsWithIssues: report.itemsWithIssues.map((item) => ({
      slug: item.slug,
      collection: item.collection,
      title: item.title,
      issueCount: item.issues.length,
      issueTypes: [...new Set(item.issues.map((issue) => issue.type))]
    }))
  };

  const slugsPath = path.resolve('cdn-image-issues-slugs-only.json');
  fs.writeFileSync(slugsPath, JSON.stringify(slugsOnlyReport, null, 2));
  console.log(`📄 Slugs-only report saved to: ${slugsPath}`);

  // Items with no images at all
  const noImagesReport = {
    timestamp: report.timestamp,
    itemsWithNoImages: report.itemsWithIssues
      .filter((item) => item.issues.some((issue) => issue.type === 'no_images'))
      .map((item) => ({
        slug: item.slug,
        collection: item.collection,
        title: item.title
      }))
  };

  const noImagesPath = path.resolve('items-with-no-images.json');
  fs.writeFileSync(noImagesPath, JSON.stringify(noImagesReport, null, 2));
  console.log(`📄 No-images report saved to: ${noImagesPath}`);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAllCdnImages()
    .then(async (report) => {
      console.log('\n' + '='.repeat(60));
      console.log('📊 CDN IMAGE CHECK SUMMARY');
      console.log('='.repeat(60));
      console.log(`🔍 Collections checked: ${report.summary.totalCollections}`);
      console.log(`📦 Total items checked: ${report.summary.totalItems}`);
      console.log(`⚠️  Items with issues: ${report.summary.itemsWithIssues}`);
      console.log(
        `🖼️  Items without images: ${report.summary.itemsWithoutImages}`
      );
      console.log(`❌ Total image issues: ${report.summary.totalImageIssues}`);

      await generateReports(report);

      console.log('\n🎉 CDN image check completed!');
      console.log('📄 Check the generated JSON files for detailed results.');

      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export { checkAllCdnImages };
