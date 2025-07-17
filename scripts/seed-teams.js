#!/usr/bin/env node

/**
 * Team Collection Seed Script
 *
 * This script populates the teams collection with data from tem-data.ts
 * It maps the team data structure to the expected webflow team form API format
 *
 * Usage: node scripts/seed-teams.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_URL =
  'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/collection-items';
const DATA_FILE = path.join(
  __dirname,
  '../app/(dashboard)/collections/tem-data.ts'
);

// Filter mapping - convert filter IDs to readable values
const FILTER_MAPPING = {
  fe9cb4ecfb6b2b3673fb682e3ae1b662: 'Team',
  e8c50df05a5d6400ebdebb14e61040fa: 'Leadership',
  '2e13032295d06cb32ab76c38a07299fc': 'Advisory Committee',
  '46583d5fdb2735afcf445f3f9f725e45': 'Alumnus',
  d24453a5e50034f288a04ccc4fb09148: 'COP27 Youth Delegate'
};

/**
 * Load team data from tem-data.ts file
 */
function loadTeamData() {
  try {
    console.log('📂 Loading team data from:', DATA_FILE);

    const fileContent = fs.readFileSync(DATA_FILE, 'utf8');

    // Extract the exported teamsData array using regex
    const exportMatch = fileContent.match(
      /export\s+const\s+teamsData\s*=\s*(\[[\s\S]*?\]);?\s*$/m
    );

    if (!exportMatch) {
      throw new Error('Could not find exported teamsData array in file');
    }

    // Use eval to parse the array (safe in this context as we control the source)
    const arrayString = exportMatch[1];
    const teamsData = eval(arrayString);

    console.log(`✅ Loaded ${teamsData.length} team members from tem-data.ts`);
    return teamsData;
  } catch (error) {
    console.error('❌ Error loading team data:', error.message);
    process.exit(1);
  }
}

/**
 * Transform team data from tem-data.ts format to webflow API format
 */
function transformTeamData(teamData) {
  return teamData.map((member, index) => {
    // Map filter ID to readable value
    const filterValue = member.filter
      ? FILTER_MAPPING[member.filter] || 'Team'
      : 'Team';

    // Create the transformed data structure matching IncomingTeamData interface
    const transformedData = {
      // Core fields required by API
      type: 'team',
      status: 'published', // Default to published, can be changed later
      slug: member.slug,
      title: member.name, // title maps to name in webflow form

      // Data object containing all team-specific fields
      data: {
        // Basic info
        title: member.name, // Ensure title is in data object too
        slug: member.slug,
        name: member.name,
        nameArabic: member.nameArabic || '',
        position: member.position || '',
        positionArabic: member.positionArabic || '',

        // Images
        photo: {
          url: member.imageUrl || '',
          alt: member.altTextImage || member.name
        },
        photoHires: member.photoHiRes || '',
        altTextImage: member.altTextImage || '',
        altTextImageArabic: member.altTextImageArabic || '',

        // Biography content
        paragraphDescription: member.paragraphDescription || '',
        biographyArabic: member.biographyArabic || '',

        // Meta information
        metaDescription: member.metaDescription || '',
        metaDescriptionArabic: member.metaDescriptionArabic || '',

        // Categorization
        filter: filterValue,
        order: member.order || index + 1,

        // Settings
        newsOnOff: member.newsOnOff || false,
        tags: member.tags || [],

        // Status
        status: 'published'
      }
    };

    return transformedData;
  });
}

/**
 * Send a single team member to the API
 */
async function createTeamMember(memberData) {
  try {
    console.log(`📤 Creating team member: ${memberData.data.name}`);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(memberData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`
      );
    }

    const result = await response.json();
    console.log(
      `✅ Successfully created: ${memberData.data.name} (ID: ${result.collectionItem?.id})`
    );

    return result;
  } catch (error) {
    console.error(
      `❌ Failed to create ${memberData.data.name}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Check if team member already exists by slug
 */
async function checkIfExists(slug) {
  try {
    const response = await fetch(`${API_URL}?type=team`);
    if (!response.ok) return false;

    const data = await response.json();
    const existingItems = data.collectionItems || [];

    return existingItems.some((item) => item.slug === slug);
  } catch (error) {
    console.warn(`⚠️ Could not check if ${slug} exists:`, error.message);
    return false;
  }
}

/**
 * Main seeding function
 */
async function seedTeams() {
  console.log('🌱 Starting team collection seeding...\n');

  try {
    // Load team data
    const rawTeamData = loadTeamData();

    // Transform data
    console.log('🔄 Transforming team data to API format...');
    const transformedData = transformTeamData(rawTeamData);

    console.log('📊 Sample transformed data structure:');
    console.log(JSON.stringify(transformedData[0], null, 2));
    console.log('\n');

    // Seed each team member
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const memberData of transformedData) {
      try {
        // Check if already exists
        const exists = await checkIfExists(memberData.slug);
        if (exists) {
          console.log(`⏭️ Skipping ${memberData.data.name} (already exists)`);
          skipped++;
          continue;
        }

        // Create new team member
        await createTeamMember(memberData);
        created++;

        // Small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(
          `💥 Error processing ${memberData.data.name}:`,
          error.message
        );
        failed++;
      }
    }

    // Summary
    console.log('\n📈 Seeding Summary:');
    console.log(`✅ Created: ${created}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total processed: ${created + skipped + failed}`);

    if (failed > 0) {
      console.log(
        '\n⚠️ Some team members failed to be created. Check the errors above.'
      );
      process.exit(1);
    } else {
      console.log('\n🎉 Team collection seeding completed successfully!');
    }
  } catch (error) {
    console.error('💥 Fatal error during seeding:', error.message);
    process.exit(1);
  }
}

/**
 * Utility function to preview data transformation without actually seeding
 */
async function previewTransformation() {
  console.log('👁️ Preview Mode: Showing data transformation...\n');

  const rawTeamData = loadTeamData();
  const transformedData = transformTeamData(rawTeamData.slice(0, 2)); // Show first 2 entries

  console.log('📋 Raw data (first entry):');
  console.log(JSON.stringify(rawTeamData[0], null, 2));

  console.log('\n🔄 Transformed data (first entry):');
  console.log(JSON.stringify(transformedData[0], null, 2));

  console.log(`\n📊 Total entries to be processed: ${rawTeamData.length}`);
}

// Command line handling
const args = process.argv.slice(2);

if (args.includes('--preview') || args.includes('-p')) {
  previewTransformation();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Team Collection Seed Script

Usage:
  node scripts/seed-teams.js              # Run the seeding process
  node scripts/seed-teams.js --preview    # Preview data transformation
  node scripts/seed-teams.js --help       # Show this help

Options:
  -p, --preview    Preview the data transformation without seeding
  -h, --help       Show this help message

Configuration:
  API URL: ${API_URL}
  Data file: ${DATA_FILE}
  `);
} else {
  // Run the seeding process
  seedTeams();
}

// Make script executable
if (require.main === module) {
  // Script is being run directly
}
