#!/usr/bin/env node

/**
 * Check CDN images specifically in the programmes collection
 * Focuses on programme-specific image fields
 */

import fs from 'fs';
import path from 'path';

// Configuration
const API_BASE_URL = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';
const OUTPUT_FILE = 'programmes-image-issues-report.json';

// Programme-specific image fields based on WebflowProgrammeForm
const PROGRAMME_IMAGE_FIELDS = [
  'logoSvgDark',
  'logoSvgLight',
  'heroSquare',
  'heroWide',
  'heroImage',
  'thumbnail',
  'image',
  'logo',
  'banner',
  'cover'
];

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

      // Try to identify available collections
      if (data.items || data.collectionItems) {
        const items = data.items || data.collectionItems;
        const types = [
          ...new Set(
            items.map((item) => item.type || item.data?.type).filter(Boolean)
          )
        ];
        console.log(`   📋 Available collection types: ${types.join(', ')}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ API Error: ${errorText.substring(0, 300)}`);
    }
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
  }
}

/**
 * Fetch all programmes from the API
 */
async function fetchProgrammes() {
  // Try different collection names (singular/plural)
  const collectionNames = ['programmes', 'programme', 'programs', 'program'];

  for (const collectionName of collectionNames) {
    try {
      console.log(`📡 Trying to fetch ${collectionName} from API...`);

      const url = `${API_BASE_URL}/api/collection-items?type=${collectionName}`;
      console.log(`   🔗 URL: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(
        `   📡 Response status: ${response.status} ${response.statusText}`
      );

      if (response.ok) {
        const data = await response.json();
        const items = data.items || data.collectionItems || data || [];
        console.log(`   ✅ Found ${items.length} ${collectionName} items`);
        return items;
      } else {
        // Log response body for debugging
        const errorText = await response.text();
        console.log(
          `   ❌ ${collectionName} failed: ${response.status} - ${errorText.substring(0, 200)}`
        );
      }
    } catch (error) {
      console.log(`   ❌ Error fetching ${collectionName}:`, error.message);
    }
  }

  console.error(`❌ Failed to fetch programmes with any collection name`);
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
 * Extract image URLs from programme data
 */
function extractProgrammeImageUrls(programme) {
  const images = {};
  const data = programme.data || programme;

  // Check programme-specific image fields
  for (const field of PROGRAMME_IMAGE_FIELDS) {
    const value = data[field];
    if (value) {
      if (typeof value === 'string' && value.trim()) {
        images[field] = value.trim();
      } else if (value.url && value.url.trim()) {
        images[field] = value.url.trim();
      } else if (value.src && value.src.trim()) {
        images[field] = value.src.trim();
      }
    }
  }

  // Check for any nested image objects
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value && typeof value === 'object') {
      if (
        value.url &&
        typeof value.url === 'string' &&
        value.url.trim() &&
        (key.toLowerCase().includes('image') ||
          key.toLowerCase().includes('logo') ||
          key.toLowerCase().includes('hero') ||
          key.toLowerCase().includes('photo'))
      ) {
        images[key] = value.url.trim();
      }
    }
  });

  return images;
}

/**
 * Check a single programme for image issues
 */
async function checkProgrammeImages(programme) {
  const slug =
    programme.slug || programme.data?.slug || `no-slug-${programme.id}`;
  const title =
    programme.title ||
    programme.data?.title ||
    programme.data?.name ||
    'Untitled';
  const type = programme.data?.type || 'Unknown';

  console.log(`\n📋 Checking programme: ${title} (${slug})`);
  console.log(`   Type: ${type}`);

  const data = programme.data || programme;

  // Log the actual programme data structure for analysis
  console.log('🔍 Raw programme data structure:');
  console.log('   📋 All data fields:', Object.keys(data).sort());
  console.log('   📊 Sample data (first few fields):');
  const sampleFields = Object.keys(data).slice(0, 10);
  sampleFields.forEach((field) => {
    const value = data[field];
    if (typeof value === 'string') {
      console.log(
        `      ${field}: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`
      );
    } else if (typeof value === 'object' && value !== null) {
      console.log(`      ${field}: {${Object.keys(value).join(', ')}}`);
    } else {
      console.log(`      ${field}: ${value}`);
    }
  });

  const images = extractProgrammeImageUrls(programme);
  const imageKeys = Object.keys(images);

  const result = {
    slug,
    title,
    type,
    id: programme.id,
    totalImages: imageKeys.length,
    workingImages: 0,
    brokenImages: 0,
    issues: [],
    imageDetails: {}
  };

  if (imageKeys.length === 0) {
    console.log(`   ⚠️  No image fields found`);
    result.issues.push({
      type: 'no_images',
      message: 'No image fields found in programme data'
    });
    return result;
  }

  console.log(
    `   🖼️  Found ${imageKeys.length} image field(s): ${imageKeys.join(', ')}`
  );

  // Check each image URL
  for (const [field, url] of Object.entries(images)) {
    const check = await checkImageUrl(url);

    result.imageDetails[field] = {
      url: url,
      accessible: check.accessible,
      status: check.status,
      reason: check.reason
    };

    if (check.accessible) {
      result.workingImages++;
    } else {
      result.brokenImages++;
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
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const statusEmoji = result.brokenImages === 0 ? '✅' : '❌';
  console.log(
    `   ${statusEmoji} Summary: ${result.workingImages} working, ${result.brokenImages} broken`
  );

  return result;
}

/**
 * Main function to check programmes
 */
async function checkProgrammesImages() {
  console.log('🚀 Starting programmes image check...\n');

  // First test API connectivity
  await testApiConnectivity();
  console.log('\n' + '-'.repeat(60) + '\n');

  const programmes = await fetchProgrammes();

  if (programmes.length === 0) {
    console.log('❌ No programmes found or failed to fetch data');
    return;
  }

  const report = {
    timestamp: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    collection: 'programmes',
    summary: {
      totalProgrammes: programmes.length,
      programmesWithIssues: 0,
      programmesWithoutImages: 0,
      totalWorkingImages: 0,
      totalBrokenImages: 0,
      totalImageIssues: 0
    },
    programmes: []
  };

  console.log(`\n📊 Processing ${programmes.length} programmes...\n`);

  for (let i = 0; i < programmes.length; i++) {
    const programme = programmes[i];
    console.log(
      `[${i + 1}/${programmes.length}] ========================================`
    );

    const result = await checkProgrammeImages(programme);
    report.programmes.push(result);

    if (result.issues.length > 0) {
      report.summary.programmesWithIssues++;
    }

    if (result.totalImages === 0) {
      report.summary.programmesWithoutImages++;
    }

    report.summary.totalWorkingImages += result.workingImages;
    report.summary.totalBrokenImages += result.brokenImages;
    report.summary.totalImageIssues += result.issues.length;

    // Rate limiting between programmes
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return report;
}

/**
 * Generate report files
 */
async function generateReports(report) {
  // Main detailed report
  const reportPath = path.resolve(OUTPUT_FILE);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);

  // Summary report
  const summaryReport = {
    timestamp: report.timestamp,
    summary: report.summary,
    programmesWithIssues: report.programmes
      .filter((p) => p.issues.length > 0)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        type: p.type,
        totalImages: p.totalImages,
        workingImages: p.workingImages,
        brokenImages: p.brokenImages,
        issues: p.issues.map((issue) => ({
          type: issue.type,
          field: issue.field,
          reason: issue.reason
        }))
      }))
  };

  const summaryPath = path.resolve('programmes-image-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));
  console.log(`📄 Summary report saved to: ${summaryPath}`);

  // Broken images list for quick reference
  const brokenImagesReport = {
    timestamp: report.timestamp,
    brokenImages: []
  };

  report.programmes.forEach((programme) => {
    programme.issues
      .filter((issue) => issue.type === 'image_not_accessible')
      .forEach((issue) => {
        brokenImagesReport.brokenImages.push({
          programme: programme.title,
          slug: programme.slug,
          field: issue.field,
          url: issue.url,
          reason: issue.reason,
          status: issue.status
        });
      });
  });

  const brokenPath = path.resolve('programmes-broken-images.json');
  fs.writeFileSync(brokenPath, JSON.stringify(brokenImagesReport, null, 2));
  console.log(`📄 Broken images list saved to: ${brokenPath}`);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  checkProgrammesImages()
    .then(async (report) => {
      if (!report) {
        process.exit(1);
        return;
      }

      console.log('\n' + '='.repeat(80));
      console.log('📊 PROGRAMMES IMAGE CHECK SUMMARY');
      console.log('='.repeat(80));
      console.log(
        `📦 Total programmes checked: ${report.summary.totalProgrammes}`
      );
      console.log(
        `⚠️  Programmes with issues: ${report.summary.programmesWithIssues}`
      );
      console.log(
        `🖼️  Programmes without images: ${report.summary.programmesWithoutImages}`
      );
      console.log(
        `✅ Total working images: ${report.summary.totalWorkingImages}`
      );
      console.log(
        `❌ Total broken images: ${report.summary.totalBrokenImages}`
      );
      console.log(`🔧 Total image issues: ${report.summary.totalImageIssues}`);

      await generateReports(report);

      console.log('\n🎉 Programmes image check completed!');
      console.log('📄 Check the generated JSON files for detailed results.');

      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export { checkProgrammesImages };
