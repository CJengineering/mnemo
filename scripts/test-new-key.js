#!/usr/bin/env node

/**
 * Test new GCS service account JSON key file
 * Usage: node scripts/test-new-key.js /path/to/your/new-key.json
 */

const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function testNewKey() {
  const keyFilePath = process.argv[2];

  if (!keyFilePath) {
    console.error('❌ Please provide the path to your JSON key file');
    console.error('Usage: node scripts/test-new-key.js /path/to/your/key.json');
    process.exit(1);
  }

  if (!fs.existsSync(keyFilePath)) {
    console.error(`❌ Key file not found: ${keyFilePath}`);
    process.exit(1);
  }

  console.log('🧪 Testing New GCS Service Account Key');
  console.log('====================================\n');

  try {
    // Read and parse the JSON key file
    const keyFileContent = fs.readFileSync(keyFilePath, 'utf8');
    const credentials = JSON.parse(keyFileContent);

    console.log('📋 Key Information:');
    console.log(`- Project ID: ${credentials.project_id}`);
    console.log(`- Client Email: ${credentials.client_email}`);
    console.log(`- Private Key ID: ${credentials.private_key_id}`);
    console.log(`- Private Key Length: ${credentials.private_key.length}`);
    console.log(`- Key Type: ${credentials.type}`);
    console.log('');

    // Test 1: Create Storage client with JSON credentials
    console.log('🔧 Test 1: Creating Storage client with JSON file...');
    const storage1 = new Storage({
      projectId: credentials.project_id,
      keyFilename: keyFilePath
    });
    console.log('✅ Storage client created successfully');

    // Test 2: Create Storage client with credentials object
    console.log(
      '🔧 Test 2: Creating Storage client with credentials object...'
    );
    const storage2 = new Storage({
      projectId: credentials.project_id,
      credentials: credentials
    });
    console.log('✅ Storage client created successfully');

    // Test bucket operations
    const bucketName = process.env.GCS_BUCKET || 'mnemo';
    const bucket = storage2.bucket(bucketName);

    console.log(`🔧 Test 3: Testing bucket operations (${bucketName})...`);

    // Check bucket exists
    const [exists] = await bucket.exists();
    console.log(`  ✅ Bucket exists: ${exists}`);

    if (!exists) {
      console.log('  ❌ Bucket not found or no access');
      return false;
    }

    // Test file operations
    const testFile = `_test/new-key-test-${Date.now()}.txt`;
    const file = bucket.file(testFile);

    console.log('  - Testing file upload...');
    await file.save('Hello from new key test!', { contentType: 'text/plain' });
    console.log('    ✅ File uploaded successfully');

    console.log('  - Testing file download...');
    const [content] = await file.download();
    console.log(`    ✅ File content: "${content.toString()}"`);

    console.log('  - Testing file delete...');
    await file.delete();
    console.log('    ✅ File deleted successfully');

    console.log('\n🎉 All tests PASSED!');
    console.log('\n📋 Next steps:');
    console.log('1. Generate base64 credentials for production:');
    console.log(
      `   node scripts/generate-base64-from-json.js "${keyFilePath}"`
    );
    console.log('2. Update your .env.local with the new credentials');
    console.log('3. Deploy to production with the base64 credentials');

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code) console.error('   Error Code:', error.code);
    if (error.stack) console.error('   Stack:', error.stack.split('\n')[0]);
    return false;
  }
}

// Run the test
testNewKey()
  .then((success) => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
