#!/usr/bin/env node

/**
 * Test GCS with explicit credentials using PEM header construction
 * This tests the exact syntax: private_key = `-----BEGIN PRIVATE KEY-----\n${private_key}\n-----END PRIVATE KEY-----\n`;
 */

require('dotenv').config({ path: '.env.local' });
const { Storage } = require('@google-cloud/storage');

const projectId = process.env.GCP_PROJECT_ID || 'cj-tech-381914';
const bucketName = process.env.GCS_BUCKET || 'mnemo';

async function testPEMConstruction() {
  console.log('🧪 Testing PEM Header Construction');
  console.log('==================================\n');

  const rawKey = process.env.PRIVATE_GCL || '';
  const client_email = process.env.GCP_CLIENT_EMAIL || '';

  console.log('📋 Environment check:');
  console.log(`- Project ID: ${projectId}`);
  console.log(`- Bucket Name: ${bucketName}`);
  console.log(`- Client Email: ${client_email || '❌ Not set'}`);
  console.log(`- Raw Key Length: ${rawKey.length || '❌ Not set'}`);
  console.log('');

  if (!rawKey || !client_email) {
    console.log('❌ Missing required environment variables');
    process.exit(1);
  }

  try {
    // Use the exact syntax you want to test
    let private_key = rawKey.replace(/\\n/g, '\n');
    if (!private_key.includes('BEGIN PRIVATE KEY')) {
      private_key = `-----BEGIN PRIVATE KEY-----\n${private_key}\n-----END PRIVATE KEY-----\n`;
    }

    console.log('🔧 Testing explicit credentials with PEM construction...');
    console.log(`- Constructed key length: ${private_key.length}`);
    console.log(`- Has BEGIN header: ${private_key.includes('-----BEGIN PRIVATE KEY-----')}`);
    console.log(`- Has END footer: ${private_key.includes('-----END PRIVATE KEY-----')}`);

    const storage = new Storage({
      projectId,
      credentials: { client_email, private_key }
    });

    console.log('✅ Storage client created successfully');

    const bucket = storage.bucket(bucketName);

    // Test bucket access
    console.log('- Checking bucket exists...');
    const [exists] = await bucket.exists();
    console.log(`  ✅ Bucket exists: ${exists}`);

    if (!exists) {
      console.log('  ❌ Bucket not found or no access');
      return false;
    }

    // Test file operations
    const testFile = `_test/pem-construction-test-${Date.now()}.txt`;
    const file = bucket.file(testFile);

    console.log('- Testing file upload...');
    await file.save('Hello from PEM construction test!', { contentType: 'text/plain' });
    console.log('  ✅ File uploaded successfully');

    console.log('- Testing file download...');
    const [content] = await file.download();
    console.log(`  ✅ File content: "${content.toString()}"`);

    console.log('- Testing file delete...');
    await file.delete();
    console.log('  ✅ File deleted successfully');

    console.log('\n🎉 PEM Construction test PASSED!');
    console.log('✅ The syntax works: private_key = `-----BEGIN PRIVATE KEY-----\\n${private_key}\\n-----END PRIVATE KEY-----\\n`;');
    return true;

  } catch (error) {
    console.error('❌ PEM construction test failed:', error.message);
    if (error.code) console.error('   Error Code:', error.code);
    if (error.stack) console.error('   Stack:', error.stack.split('\n')[0]);
    return false;
  }
}

// Run the test
testPEMConstruction()
  .then((success) => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
