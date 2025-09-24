// Test script to verify update detection logic
// Run this with: node test-update-detection.js

function testUpdateDetection() {
  console.log('🧪 Testing Update Detection Logic\n');

  // Mock original item (what's currently in the database)
  const originalItem = {
    title: 'Original Title',
    slug: 'original-slug',
    status: 'draft',
    data: {
      description: 'Original description',
      category: 'tech'
    }
  };

  // Test scenarios
  const scenarios = [
    {
      name: 'Title Only Change',
      formData: {
        title: 'Chanel Asia', // Changed
        slug: 'original-slug',
        status: 'draft',
        description: 'Original description',
        category: 'tech'
      }
    },
    {
      name: 'Status Only Change',
      formData: {
        title: 'Original Title',
        slug: 'original-slug',
        status: 'published', // Changed
        description: 'Original description',
        category: 'tech'
      }
    },
    {
      name: 'Title and Description Change',
      formData: {
        title: 'New Title', // Changed
        slug: 'original-slug',
        status: 'draft',
        description: 'New description', // Changed
        category: 'tech'
      }
    }
  ];

  scenarios.forEach((scenario) => {
    console.log(`\n📝 Testing: ${scenario.name}`);
    console.log('Original:', originalItem);
    console.log('New Form Data:', scenario.formData);

    // Apply the same logic as the form
    const titleChanged = scenario.formData.title !== originalItem.title;
    const slugChanged = scenario.formData.slug !== originalItem.slug;
    const statusChanged =
      JSON.stringify(scenario.formData.status) !==
      JSON.stringify(originalItem.status);

    // Get the data fields (excluding title, slug, status)
    const currentDataFields = Object.fromEntries(
      Object.entries(scenario.formData).filter(
        ([key]) => !['title', 'slug', 'status'].includes(key)
      )
    );
    const originalDataFields = originalItem.data || {};
    const dataFieldsChanged =
      JSON.stringify(currentDataFields) !== JSON.stringify(originalDataFields);

    // Status-only update: only status changed, nothing else
    const isStatusOnlyUpdate =
      statusChanged && !titleChanged && !slugChanged && !dataFieldsChanged;

    // Minimal update: only title, slug, or status changed (but not data fields)
    const isMinimalUpdate =
      (titleChanged || slugChanged || statusChanged) && !dataFieldsChanged;

    console.log('🔍 Detection Results:', {
      titleChanged,
      slugChanged,
      statusChanged,
      dataFieldsChanged,
      isStatusOnlyUpdate,
      isMinimalUpdate
    });

    // Expected API payload
    let expectedPayload;
    if (isStatusOnlyUpdate) {
      expectedPayload = { status: scenario.formData.status };
    } else if (isMinimalUpdate) {
      expectedPayload = {};
      if (titleChanged) expectedPayload.title = scenario.formData.title;
      if (slugChanged) expectedPayload.slug = scenario.formData.slug;
      if (statusChanged) expectedPayload.status = scenario.formData.status;
    } else {
      expectedPayload = {
        title: scenario.formData.title,
        slug: scenario.formData.slug,
        status: scenario.formData.status,
        data: currentDataFields
      };
    }

    console.log('📤 Expected API Payload:', expectedPayload);
    console.log(
      '✅ Should match your curl:',
      scenario.name === 'Title Only Change'
        ? '{"title": "Chanel Asia"}'
        : 'Different payload expected'
    );
  });
}

testUpdateDetection();
