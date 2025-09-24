#!/usr/bin/env node

/**
 * Test script to verify the form's payload detection logic
 * This simulates the same logic used in dynamic-collection-form.tsx
 */

console.log('🧪 Testing Payload Detection Logic\n');

// Mock data representing an existing item
const mockExistingItem = {
  id: '829ff46d-6691-4e6c-9015-8d4458361ae8',
  title: 'Chanel',
  slug: 'chanel-partner',
  status: 'draft',
  data: {
    description: 'Fashion brand partnership',
    website: 'https://chanel.com',
    partnerType: 'Corporate'
  }
};

// Test scenarios
const testScenarios = [
  {
    name: 'Title Only Change',
    formData: {
      title: 'Chanel Asia',
      slug: 'chanel-partner',
      status: 'draft',
      description: 'Fashion brand partnership',
      website: 'https://chanel.com',
      partnerType: 'Corporate'
    },
    expectedPayload: { title: 'Chanel Asia' },
    expectedType: 'Minimal update (core fields only)'
  },
  {
    name: 'Status Only Change',
    formData: {
      title: 'Chanel',
      slug: 'chanel-partner',
      status: 'published',
      description: 'Fashion brand partnership',
      website: 'https://chanel.com',
      partnerType: 'Corporate'
    },
    expectedPayload: { status: 'published' },
    expectedType: 'Status-only (minimal payload)'
  },
  {
    name: 'Title and Slug Change',
    formData: {
      title: 'Chanel Asia',
      slug: 'chanel-asia-partner',
      status: 'draft',
      description: 'Fashion brand partnership',
      website: 'https://chanel.com',
      partnerType: 'Corporate'
    },
    expectedPayload: { title: 'Chanel Asia', slug: 'chanel-asia-partner' },
    expectedType: 'Minimal update (core fields only)'
  },
  {
    name: 'Data Field Change',
    formData: {
      title: 'Chanel',
      slug: 'chanel-partner',
      status: 'draft',
      description: 'Updated fashion brand partnership',
      website: 'https://chanel.com',
      partnerType: 'Corporate'
    },
    expectedPayload: {
      title: 'Chanel',
      slug: 'chanel-partner',
      status: 'draft',
      type: 'partner',
      data: {
        description: 'Updated fashion brand partnership',
        website: 'https://chanel.com',
        partnerType: 'Corporate'
      }
    },
    expectedType: 'Full update'
  }
];

// Simulate the form's detection logic
function detectChangeType(formData, existingItem) {
  const titleChanged = formData.title !== existingItem.title;
  const slugChanged = formData.slug !== existingItem.slug;
  const statusChanged =
    JSON.stringify(formData.status) !== JSON.stringify(existingItem.status);

  // Get the data fields (excluding title, slug, status)
  const currentDataFields = Object.fromEntries(
    Object.entries(formData).filter(
      ([key]) => !['title', 'slug', 'status'].includes(key)
    )
  );
  const originalDataFields = existingItem.data || {};
  const dataFieldsChanged =
    JSON.stringify(currentDataFields) !== JSON.stringify(originalDataFields);

  // Status-only update: only status changed, nothing else
  const isStatusOnlyUpdate =
    statusChanged && !titleChanged && !slugChanged && !dataFieldsChanged;

  // Minimal update: only title, slug, or status changed (but not data fields)
  const isMinimalUpdate =
    (titleChanged || slugChanged || statusChanged) && !dataFieldsChanged;

  return {
    titleChanged,
    slugChanged,
    statusChanged,
    dataFieldsChanged,
    isStatusOnlyUpdate,
    isMinimalUpdate
  };
}

// Simulate payload creation
function createPayload(formData, existingItem, detection) {
  const finalStatus = formData.status || 'draft';

  if (detection.isStatusOnlyUpdate) {
    return { status: finalStatus };
  } else if (detection.isMinimalUpdate) {
    const payload = {};
    if (detection.titleChanged) payload.title = formData.title;
    if (detection.slugChanged) payload.slug = formData.slug;
    if (detection.statusChanged) payload.status = finalStatus;
    return payload;
  } else {
    // Full update
    return {
      title: formData.title,
      slug: formData.slug,
      status: finalStatus,
      type: 'partner',
      data: Object.fromEntries(
        Object.entries(formData).filter(
          ([key]) => !['title', 'slug', 'status'].includes(key)
        )
      )
    };
  }
}

// Run tests
testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. Testing: ${scenario.name}`);
  console.log('='.repeat(50));

  const detection = detectChangeType(scenario.formData, mockExistingItem);
  const actualPayload = createPayload(
    scenario.formData,
    mockExistingItem,
    detection
  );

  console.log('Detection:', {
    titleChanged: detection.titleChanged,
    slugChanged: detection.slugChanged,
    statusChanged: detection.statusChanged,
    dataFieldsChanged: detection.dataFieldsChanged,
    isStatusOnlyUpdate: detection.isStatusOnlyUpdate,
    isMinimalUpdate: detection.isMinimalUpdate
  });

  console.log(
    '\nExpected Payload:',
    JSON.stringify(scenario.expectedPayload, null, 2)
  );
  console.log('Actual Payload:', JSON.stringify(actualPayload, null, 2));

  const payloadMatches =
    JSON.stringify(actualPayload) === JSON.stringify(scenario.expectedPayload);
  const typeMatches = detection.isStatusOnlyUpdate
    ? scenario.expectedType === 'Status-only (minimal payload)'
    : detection.isMinimalUpdate
      ? scenario.expectedType === 'Minimal update (core fields only)'
      : scenario.expectedType === 'Full update';

  console.log(`\n✅ Payload Match: ${payloadMatches ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Type Match: ${typeMatches ? 'PASS' : 'FAIL'}`);

  if (!payloadMatches) {
    console.log('❌ PAYLOAD MISMATCH!');
  }
  if (!typeMatches) {
    console.log('❌ TYPE MISMATCH!');
  }
});

console.log('\n🎯 Summary:');
console.log(
  'The form should now send minimal payloads exactly like your curl command:'
);
console.log(
  'curl -d \'{"title": "Chanel Asia"}\' -> { "title": "Chanel Asia" }'
);
console.log('curl -d \'{"status": "published"}\' -> { "status": "published" }');
