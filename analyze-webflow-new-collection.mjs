#!/usr/bin/env node

/**
 * Webflow New Collection Analysis Script
 *
 * This script analyzes the structure of the new Webflow collection
 * Collection ID: 61ee828a15a3185c99bde543
 */

import https from 'https';
import fs from 'fs/promises';

// Configuration
const CONFIG = {
  WEBFLOW_API_BASE: 'https://api.webflow.com/v2',
  WEBFLOW_SITE_ID: process.env.WEBFLOW_SITE_ID || '612cede33b271d1b5bac6200',
  WEBFLOW_NEW_COLLECTION_ID:
    process.env.WEBFLOW_NEW_COLLECTION_ID || '61ee828a15a3185c99bde543',
  WEBFLOW_API_TOKEN:
    process.env.WEBFLOW_API_TOKEN ||
    'd2eac7bfcd8cc230db56e0dd9f9c7c7f4652db6195ad674c0b7939bb438fb33c'
};

/**
 * Make HTTP request helper
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Get collection metadata
 */
async function getCollectionInfo() {
  console.log('📋 Getting collection metadata...');

  const url = `${CONFIG.WEBFLOW_API_BASE}/collections/${CONFIG.WEBFLOW_NEW_COLLECTION_ID}`;

  try {
    const data = await makeRequest(url, {
      headers: {
        Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Collection Name: ${data.displayName}`);
    console.log(`   Collection Slug: ${data.slug}`);
    console.log(`   Collection ID: ${data.id}`);

    return data;
  } catch (error) {
    console.error('❌ Error getting collection info:', error.message);
    return null;
  }
}

/**
 * Get total count of items in collection
 */
async function getCollectionItemsCount() {
  console.log('📊 Getting total items count...');

  const url = `${CONFIG.WEBFLOW_API_BASE}/collections/${CONFIG.WEBFLOW_NEW_COLLECTION_ID}/items?limit=1`;

  try {
    const data = await makeRequest(url, {
      headers: {
        Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json'
      }
    });

    const totalItems = data.pagination?.total || 0;
    console.log(`   Total items: ${totalItems}`);
    return totalItems;
  } catch (error) {
    console.error('❌ Error getting items count:', error.message);
    return 0;
  }
}

/**
 * Fetch sample items from collection
 */
async function fetchSampleItems(limit = 10) {
  console.log(`📥 Fetching sample items (limit: ${limit})...`);

  const url = `${CONFIG.WEBFLOW_API_BASE}/collections/${CONFIG.WEBFLOW_NEW_COLLECTION_ID}/items?limit=${limit}`;

  try {
    const data = await makeRequest(url, {
      headers: {
        Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json'
      }
    });

    console.log(`   ✅ Fetched ${data.items?.length || 0} sample items`);
    return data.items || [];
  } catch (error) {
    console.error('❌ Error fetching sample items:', error.message);
    return [];
  }
}

/**
 * Analyze field structure
 */
function analyzeFieldStructure(items) {
  console.log('🔍 Analyzing field structure...');

  if (!items || items.length === 0) {
    console.log('   ⚠️ No items to analyze');
    return { fields: [], fieldTypes: {}, uniqueValues: {} };
  }

  const fields = new Set();
  const fieldTypes = {};
  const uniqueValues = {};

  items.forEach((item, index) => {
    if (item.fieldData) {
      Object.keys(item.fieldData).forEach((field) => {
        fields.add(field);

        const value = item.fieldData[field];
        const type = Array.isArray(value) ? 'array' : typeof value;

        if (!fieldTypes[field]) {
          fieldTypes[field] = new Set();
        }
        fieldTypes[field].add(type);

        // Collect unique values for small sets
        if (!uniqueValues[field]) {
          uniqueValues[field] = new Set();
        }
        if (uniqueValues[field].size < 10) {
          if (type === 'object' && value !== null) {
            uniqueValues[field].add(JSON.stringify(value));
          } else if (type !== 'object') {
            uniqueValues[field].add(value);
          }
        }
      });
    }
  });

  // Convert Sets to Arrays for JSON serialization
  const result = {
    fields: Array.from(fields).sort(),
    fieldTypes: {},
    uniqueValues: {}
  };

  Object.keys(fieldTypes).forEach((field) => {
    result.fieldTypes[field] = Array.from(fieldTypes[field]);
  });

  Object.keys(uniqueValues).forEach((field) => {
    result.uniqueValues[field] = Array.from(uniqueValues[field]);
  });

  console.log(`   ✅ Found ${result.fields.length} unique fields`);
  console.log(
    `   📋 Fields: ${result.fields.slice(0, 10).join(', ')}${result.fields.length > 10 ? '...' : ''}`
  );

  return result;
}

/**
 * Generate TypeScript interface
 */
function generateTypeScriptInterface(fieldAnalysis, collectionName) {
  console.log('📝 Generating TypeScript interface...');

  const interfaceName = `Webflow${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}`;

  let interfaceCode = `// Generated ${collectionName} Interface from Webflow API analysis\n`;
  interfaceCode += `export interface ${interfaceName} {\n`;
  interfaceCode += `  id: string;\n`;
  interfaceCode += `  cmsLocaleId: string | null;\n`;
  interfaceCode += `  lastPublished: string;\n`;
  interfaceCode += `  lastUpdated: string;\n`;
  interfaceCode += `  createdOn: string;\n`;
  interfaceCode += `  isArchived: boolean;\n`;
  interfaceCode += `  isDraft: boolean;\n`;
  interfaceCode += `  fieldData: {\n`;

  fieldAnalysis.fields.forEach((field) => {
    const types = fieldAnalysis.fieldTypes[field] || ['any'];
    let tsType = 'any';

    if (types.includes('string')) {
      tsType = 'string';
    } else if (types.includes('boolean')) {
      tsType = 'boolean';
    } else if (types.includes('number')) {
      tsType = 'number';
    } else if (types.includes('array')) {
      tsType = 'string[]';
    } else if (types.includes('object')) {
      // Check if it's an image object
      if (field.includes('image') || field.includes('thumbnail')) {
        tsType = `{
      fileId: string;
      url: string;
      alt: string | null;
    }`;
      } else {
        tsType = 'any';
      }
    }

    interfaceCode += `    '${field}'?: ${tsType};\n`;
  });

  interfaceCode += `  };\n`;
  interfaceCode += `}\n`;

  return interfaceCode;
}

/**
 * Main analysis function
 */
async function analyzeNewCollection() {
  console.log('🔍 WEBFLOW NEW COLLECTION ANALYSIS');
  console.log('='.repeat(70));
  console.log(`Collection ID: ${CONFIG.WEBFLOW_NEW_COLLECTION_ID}`);
  console.log(`Started: ${new Date().toLocaleString()}\n`);

  try {
    // Step 1: Get collection metadata
    const collectionInfo = await getCollectionInfo();
    if (!collectionInfo) {
      console.log('❌ Failed to get collection info. Exiting.');
      return;
    }

    // Step 2: Get total count
    const totalItems = await getCollectionItemsCount();

    // Step 3: Fetch sample items
    const sampleLimit = Math.min(totalItems, 10);
    const sampleItems = await fetchSampleItems(sampleLimit);

    // Step 4: Analyze field structure
    const fieldAnalysis = analyzeFieldStructure(sampleItems);

    // Step 5: Generate TypeScript interface
    const tsInterface = generateTypeScriptInterface(
      fieldAnalysis,
      collectionInfo.slug || 'Item'
    );

    // Step 6: Create analysis report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `webflow-${collectionInfo.slug || 'new-collection'}-analysis-${timestamp}.json`;
    const interfacePath = `webflow-${collectionInfo.slug || 'new-collection'}-interface-${timestamp}.ts`;

    const report = {
      timestamp: new Date().toISOString(),
      collectionId: CONFIG.WEBFLOW_NEW_COLLECTION_ID,
      collectionInfo,
      totalItems,
      sampleSize: sampleItems.length,
      totalFields: fieldAnalysis.fields.length,
      fields: fieldAnalysis.fields,
      fieldTypes: fieldAnalysis.fieldTypes,
      uniqueValues: fieldAnalysis.uniqueValues,
      sampleItems: sampleItems.slice(0, 3) // Include first 3 items as examples
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    await fs.writeFile(interfacePath, tsInterface);

    // Step 7: Final summary
    console.log('\n📊 ANALYSIS COMPLETE!');
    console.log('='.repeat(50));
    console.log(
      `📁 Collection: ${collectionInfo.displayName} (${collectionInfo.slug})`
    );
    console.log(`📊 Total items: ${totalItems}`);
    console.log(`🔍 Unique fields: ${fieldAnalysis.fields.length}`);
    console.log(`📄 Report saved: ${reportPath}`);
    console.log(`📝 Interface saved: ${interfacePath}`);

    console.log('\n🔄 Next Steps:');
    console.log('1. Review the analysis report for field structure');
    console.log('2. Create a migration script based on the field mappings');
    console.log('3. Run the migration to import all items to Mnemo');

    return report;
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeNewCollection();
