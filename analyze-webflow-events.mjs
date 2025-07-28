#!/usr/bin/env node

/**
 * Webflow Events API Analysis Script
 *
 * This script fetches events from Webflow API and analyzes their structure
 * to understand how to properly map them to Mnemo format.
 */

import https from 'https';
import fs from 'fs';

// Configuration
const CONFIG = {
  WEBFLOW_API_BASE: 'https://api.webflow.com/v2',
  WEBFLOW_SITE_ID: process.env.WEBFLOW_SITE_ID || '612cede33b271d1b5bac6200',
  WEBFLOW_EVENTS_COLLECTION_ID: '6225fe8b1f52b40001a99d66', // Event collection ID you provided
  WEBFLOW_API_TOKEN:
    process.env.WEBFLOW_API_TOKEN ||
    'd2eac7bfcd8cc230db56e0dd9f9c7c7f4652db6195ad674c0b7939bb438fb33c',
  SAMPLE_SIZE: 5 // Number of events to analyze
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
 * Fetch events from Webflow API
 */
async function fetchWebflowEvents(limit = 5) {
  console.log(`🔍 Fetching ${limit} events from Webflow API...`);
  console.log(`📋 Collection ID: ${CONFIG.WEBFLOW_EVENTS_COLLECTION_ID}`);

  const url = `${CONFIG.WEBFLOW_API_BASE}/collections/${CONFIG.WEBFLOW_EVENTS_COLLECTION_ID}/items?limit=${limit}`;

  const data = await makeRequest(url, {
    headers: {
      Authorization: `Bearer ${CONFIG.WEBFLOW_API_TOKEN}`,
      'accept-version': '1.0.0',
      'Content-Type': 'application/json'
    }
  });

  return data;
}

/**
 * Analyze field structure of events
 */
function analyzeEventStructure(events) {
  console.log('\n🔬 ANALYZING EVENT FIELD STRUCTURE');
  console.log('='.repeat(60));

  if (!events.items || events.items.length === 0) {
    console.log('❌ No events found');
    return;
  }

  const allFields = new Set();
  const fieldTypes = {};
  const fieldExamples = {};

  events.items.forEach((event, index) => {
    console.log(
      `\n📄 Event ${index + 1}: "${event.fieldData?.name || 'Unknown'}"`
    );
    console.log(`   ID: ${event.id}`);
    console.log(`   Status: ${event.isDraft ? 'draft' : 'published'}`);
    console.log(`   Last Updated: ${event.lastUpdated}`);

    if (event.fieldData) {
      Object.keys(event.fieldData).forEach((field) => {
        allFields.add(field);

        const value = event.fieldData[field];
        const type = Array.isArray(value) ? 'array' : typeof value;

        if (!fieldTypes[field]) {
          fieldTypes[field] = new Set();
        }
        fieldTypes[field].add(type);

        // Store examples (truncate long values)
        if (!fieldExamples[field] && value !== null && value !== undefined) {
          if (typeof value === 'string' && value.length > 100) {
            fieldExamples[field] = value.substring(0, 100) + '...';
          } else if (typeof value === 'object') {
            fieldExamples[field] = JSON.stringify(value, null, 2);
          } else {
            fieldExamples[field] = value;
          }
        }
      });
    }
  });

  console.log('\n📊 FIELD ANALYSIS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total unique fields found: ${allFields.size}`);

  const sortedFields = Array.from(allFields).sort();

  sortedFields.forEach((field) => {
    const types = Array.from(fieldTypes[field]).join(', ');
    const example = fieldExamples[field];

    console.log(`\n🔸 ${field}`);
    console.log(`   Type(s): ${types}`);
    if (example !== undefined) {
      if (typeof example === 'string' && example.includes('\n')) {
        console.log(`   Example: ${example.split('\n')[0]}...`);
      } else {
        console.log(`   Example: ${example}`);
      }
    }
  });

  return {
    totalFields: allFields.size,
    fields: sortedFields,
    fieldTypes,
    fieldExamples,
    sampleEvents: events.items
  };
}

/**
 * Generate TypeScript interface for events
 */
function generateEventInterface(analysis) {
  console.log('\n📝 GENERATED TYPESCRIPT INTERFACE');
  console.log('='.repeat(60));

  let interfaceCode = `// Generated Event Interface from Webflow API analysis
export interface WebflowEvent {
  id: string;
  cmsLocaleId: string | null;
  lastPublished: string;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: {
`;

  analysis.fields.forEach((field) => {
    const types = Array.from(analysis.fieldTypes[field]);
    let tsType = '';

    if (types.includes('object') && analysis.fieldExamples[field]) {
      // Try to determine if it's an image object
      const example = analysis.fieldExamples[field];
      if (
        typeof example === 'string' &&
        example.includes('fileId') &&
        example.includes('url')
      ) {
        tsType = `{
      fileId: string;
      url: string;
      alt: string | null;
    }`;
      } else if (types.includes('array')) {
        tsType = 'any[]';
      } else {
        tsType = 'any';
      }
    } else if (types.includes('array')) {
      tsType = 'string[]';
    } else if (types.includes('boolean')) {
      tsType = 'boolean';
    } else if (types.includes('string')) {
      tsType = 'string';
    } else {
      tsType = 'any';
    }

    // Make field optional if it might not exist
    const optional = '?';

    interfaceCode += `    '${field}'${optional}: ${tsType};\n`;
  });

  interfaceCode += `  };
}`;

  console.log(interfaceCode);

  return interfaceCode;
}

/**
 * Compare with existing post structure
 */
function compareWithPosts(eventAnalysis) {
  console.log('\n🔄 COMPARISON WITH POSTS STRUCTURE');
  console.log('='.repeat(60));

  // Common fields we know from posts
  const postFields = [
    'name',
    'slug',
    'body',
    'thumbnail',
    'main-image',
    'open-graph-image',
    'seo-title',
    'seo-meta',
    'date-published',
    'location',
    'featured',
    'arabic-title',
    'body-arabic',
    'location-arabic'
  ];

  const eventFields = eventAnalysis.fields;

  console.log('✅ Common fields (Events & Posts):');
  const commonFields = eventFields.filter((field) =>
    postFields.includes(field)
  );
  commonFields.forEach((field) => {
    console.log(`   - ${field}`);
  });

  console.log('\n🆕 Event-specific fields:');
  const eventSpecificFields = eventFields.filter(
    (field) => !postFields.includes(field)
  );
  eventSpecificFields.forEach((field) => {
    const example = eventAnalysis.fieldExamples[field];
    console.log(
      `   - ${field}: ${example ? (typeof example === 'string' && example.length > 50 ? example.substring(0, 50) + '...' : example) : 'null'}`
    );
  });

  console.log('\n📝 MAPPING RECOMMENDATIONS:');
  console.log('Based on the analysis, here are the mapping recommendations:');
  console.log('1. Use common fields the same way as posts');
  console.log(
    '2. Map event-specific fields to appropriate Mnemo event structure'
  );
  console.log('3. Handle date/time fields properly for events');
  console.log('4. Map location and venue information');
  console.log('5. Handle registration/RSVP links');
}

/**
 * Save analysis results
 */
function saveAnalysisResults(analysis, tsInterface) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const analysisFile = `webflow-events-analysis-${timestamp}.json`;
  const interfaceFile = `webflow-events-interface-${timestamp}.ts`;

  // Save JSON analysis
  const analysisData = {
    timestamp: new Date().toISOString(),
    collectionId: CONFIG.WEBFLOW_EVENTS_COLLECTION_ID,
    totalEvents: analysis.sampleEvents.length,
    totalFields: analysis.totalFields,
    fields: analysis.fields,
    fieldTypes: Object.fromEntries(
      Object.entries(analysis.fieldTypes).map(([key, value]) => [
        key,
        Array.from(value)
      ])
    ),
    fieldExamples: analysis.fieldExamples,
    sampleEvents: analysis.sampleEvents
  };

  fs.writeFileSync(analysisFile, JSON.stringify(analysisData, null, 2));
  console.log(`\n💾 Analysis saved: ${analysisFile}`);

  // Save TypeScript interface
  fs.writeFileSync(interfaceFile, tsInterface);
  console.log(`💾 Interface saved: ${interfaceFile}`);

  return { analysisFile, interfaceFile };
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 WEBFLOW EVENTS API ANALYSIS');
  console.log('='.repeat(60));
  console.log(`📋 Configuration:`);
  console.log(`   Site ID: ${CONFIG.WEBFLOW_SITE_ID}`);
  console.log(
    `   Events Collection ID: ${CONFIG.WEBFLOW_EVENTS_COLLECTION_ID}`
  );
  console.log(`   Sample Size: ${CONFIG.SAMPLE_SIZE}`);
  console.log('');

  try {
    // Step 1: Fetch events from Webflow
    const eventsData = await fetchWebflowEvents(CONFIG.SAMPLE_SIZE);

    if (!eventsData.items || eventsData.items.length === 0) {
      console.log('⚠️  No events found in Webflow collection');
      console.log('Please check:');
      console.log('1. Collection ID is correct');
      console.log('2. API token has proper permissions');
      console.log('3. Events exist in the collection');
      return;
    }

    console.log(`✅ Successfully fetched ${eventsData.items.length} events`);

    // Step 2: Analyze structure
    const analysis = analyzeEventStructure(eventsData);

    // Step 3: Generate TypeScript interface
    const tsInterface = generateEventInterface(analysis);

    // Step 4: Compare with posts
    compareWithPosts(analysis);

    // Step 5: Save results
    const files = saveAnalysisResults(analysis, tsInterface);

    console.log('\n🎉 ANALYSIS COMPLETED!');
    console.log('='.repeat(60));
    console.log('📋 Next Steps:');
    console.log('1. Review the generated TypeScript interface');
    console.log('2. Check the event-specific fields and their examples');
    console.log('3. Plan the mapping strategy for events to Mnemo format');
    console.log('4. Create the event migration script based on this analysis');
    console.log('');
    console.log(`📁 Files generated:`);
    console.log(`   - ${files.analysisFile}`);
    console.log(`   - ${files.interfaceFile}`);
  } catch (error) {
    console.error(`💥 Analysis failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle process errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Run the analysis
main();
