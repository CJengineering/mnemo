// Test script for column generation
const testData = [
  {
    id: '1',
    title: 'Sample Event',
    type: 'event',
    slug: 'sample-event',
    status: 'published',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    data: {
      eventDate: '2024-06-15T18:00:00Z',
      endDate: '2024-06-15T20:00:00Z',
      city: 'London',
      address: '123 Main Street',
      attendanceType: 'hybrid',
      shortDescription: 'A sample event for testing',
      arabicTitle: 'عنوان عربي',
      rsvpLink: 'https://example.com/rsvp',
      featured: true,
      heroImage: {
        url: 'https://example.com/image.jpg',
        alt: 'Hero image'
      },
      tags: [
        { id: '1', slug: 'tech' },
        { id: '2', slug: 'innovation' }
      ]
    }
  },
  {
    id: '2',
    title: 'Team Member',
    type: 'team',
    slug: 'john-doe',
    status: 'published',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    data: {
      name: 'John Doe',
      position: 'Senior Developer',
      filter: 'technology',
      role: 'Developer',
      nameArabic: 'جون دو',
      positionArabic: 'مطور أول',
      biography: 'John is a senior developer with 10 years of experience...',
      profilePicture: {
        url: 'https://example.com/john.jpg',
        alt: 'John Doe profile picture'
      },
      linkedinLink: 'https://linkedin.com/in/johndoe',
      twitterLink: 'https://twitter.com/johndoe',
      researchArea: 'Machine Learning'
    }
  }
];

// Mock the column generation function
function generateColumnsFromData(items, collectionId) {
  console.log('🔍 generateColumnsFromData called:', {
    collectionId,
    itemsLength: items?.length || 0,
    firstItem: items?.[0] || null
  });

  if (!items || items.length === 0) {
    console.log('❌ No items provided, returning empty columns');
    return [];
  }

  // Collect all unique field names from all items
  const allFields = new Set();
  const fieldExamples = {};

  items.forEach((item) => {
    if (item && typeof item === 'object') {
      // Add top-level fields
      Object.keys(item).forEach((key) => {
        allFields.add(key);
        if (
          fieldExamples[key] === undefined &&
          item[key] !== null &&
          item[key] !== undefined &&
          item[key] !== ''
        ) {
          fieldExamples[key] = item[key];
        }
      });

      // Add nested fields from data object
      if (item.data && typeof item.data === 'object') {
        Object.keys(item.data).forEach((dataKey) => {
          const fieldName = `data.${dataKey}`;
          allFields.add(fieldName);
          if (
            fieldExamples[fieldName] === undefined &&
            item.data[dataKey] !== null &&
            item.data[dataKey] !== undefined &&
            item.data[dataKey] !== ''
          ) {
            fieldExamples[fieldName] = item.data[dataKey];
          }
        });
      }
    }
  });

  console.log('🔍 Column generation debug:', {
    collectionId,
    itemsCount: items.length,
    allFields: Array.from(allFields),
    fieldExamples: Object.keys(fieldExamples)
  });

  return Array.from(allFields).map((fieldName) => ({
    id: fieldName,
    label: fieldName.startsWith('data.') ? fieldName.slice(5) : fieldName,
    defaultVisible: ['title', 'status', 'data.eventDate', 'data.city'].includes(
      fieldName
    )
  }));
}

// Test with events data
console.log('\n=== Testing Events Collection ===');
const eventColumns = generateColumnsFromData([testData[0]], 'events');
console.log('Generated columns for events:', eventColumns);

// Test with team data
console.log('\n=== Testing Team Collection ===');
const teamColumns = generateColumnsFromData([testData[1]], 'team');
console.log('Generated columns for team:', teamColumns);

// Test with both
console.log('\n=== Testing Mixed Data ===');
const mixedColumns = generateColumnsFromData(testData, 'mixed');
console.log('Generated columns for mixed:', mixedColumns);
