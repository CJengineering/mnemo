#!/usr/bin/env node

/**
 * Local GCS Authentication Test
 * This script tests GCS authentication using credentials from .env.local
 * Run with: node scripts/test-local-gcs.js
 */

require('dotenv').config({ path: '.env.local' });
const { Storage } = require('@google-cloud/storage');

const projectId = process.env.GCP_PROJECT_ID || 'cj-tech-381914';
const bucketName = process.env.GCS_BUCKET || 'mnemo';

async function testLocalGCS() {
  console.log('🧪 Testing GCS Authentication Locally');
  console.log('=====================================\n');

  // Read credentials from environment (you can uncomment them in .env.local)
  const rawKey = process.env.PRIVATE_GCL || '';
  const clientEmail = process.env.GCP_CLIENT_EMAIL || '';

  console.log('📋 Environment check:');
  console.log(`- Project ID: ${projectId}`);
  console.log(`- Bucket Name: ${bucketName}`);
  console.log(`- Client Email: ${clientEmail || '❌ Not set'}`);
  console.log(`- Private Key Length: ${rawKey.length || '❌ Not set'}`);
  console.log('');

  if (!rawKey || !clientEmail) {
    console.log(
      '⚠️  To test explicit credentials, uncomment these lines in .env.local:'
    );
    console.log(
      '   GCP_CLIENT_EMAIL=todo-test@cj-tech-381914.iam.gserviceaccount.com'
    );
    console.log('   PRIVATE_GCL="-----BEGIN PRIVATE KEY-----\\n...');
    console.log('');
    console.log('🔄 Falling back to Application Default Credentials...');
    return testWithADC();
  }

  // Test with explicit credentials
  return testWithExplicitCredentials(rawKey, clientEmail);
}

async function testWithADC() {
  console.log('🔧 Testing with Application Default Credentials (ADC)');

  try {
    const storage = new Storage({ projectId });
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
    const testFile = `_test/local-test-${Date.now()}.txt`;
    const file = bucket.file(testFile);

    console.log('- Testing file upload...');
    await file.save('Hello from local test!', { contentType: 'text/plain' });
    console.log('  ✅ File uploaded successfully');

    console.log('- Testing file exists...');
    const [fileExists] = await file.exists();
    console.log(`  ✅ File exists: ${fileExists}`);

    console.log('- Testing file download...');
    const [content] = await file.download();
    console.log(`  ✅ File content: "${content.toString()}"`);

    console.log('- Testing file delete...');
    await file.delete();
    console.log('  ✅ File deleted successfully');

    console.log('\n🎉 ADC Authentication test PASSED!');
    return true;
  } catch (error) {
    console.error('❌ ADC test failed:', error.message);
    if (error.code) console.error('   Error Code:', error.code);
    return false;
  }
}

async function testWithExplicitCredentials(rawKey, clientEmail) {
  console.log('🔧 Testing with Explicit Credentials');

  try {
    // Clean up the private key
    let privateKey = rawKey.replace(/\\n/g, '\n');

    console.log('🔍 Private Key Analysis:');
    console.log(`- Raw length: ${rawKey.length}`);
    console.log(`- After \\n replacement: ${privateKey.length}`);
    console.log(
      `- Has BEGIN header: ${privateKey.includes('-----BEGIN PRIVATE KEY-----')}`
    );
    console.log(
      `- Has END footer: ${privateKey.includes('-----END PRIVATE KEY-----')}`
    );
    console.log(`- Line count: ${privateKey.split('\n').length}`);

    // Ensure proper PEM format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.log('⚠️  Adding PEM headers...');
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    }

    console.log('\n🔧 Creating Storage client with explicit credentials...');
    const storage = new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey
      }
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
    const testFile = `_test/explicit-test-${Date.now()}.txt`;
    const file = bucket.file(testFile);

    console.log('- Testing file upload...');
    await file.save('Hello from explicit credentials test!', {
      contentType: 'text/plain'
    });
    console.log('  ✅ File uploaded successfully');

    console.log('- Testing file exists...');
    const [fileExists] = await file.exists();
    console.log(`  ✅ File exists: ${fileExists}`);

    console.log('- Testing file download...');
    const [content] = await file.download();
    console.log(`  ✅ File content: "${content.toString()}"`);

    console.log('- Testing file delete...');
    await file.delete();
    console.log('  ✅ File deleted successfully');

    console.log('\n🎉 Explicit Credentials test PASSED!');
    return true;
  } catch (error) {
    console.error('❌ Explicit credentials test failed:', error.message);
    if (error.code) console.error('   Error Code:', error.code);
    if (error.stack) console.error('   Stack:', error.stack.split('\n')[0]);
    return false;
  }
}

// Run the test
testLocalGCS()
  .then((success) => {
    if (success) {
      console.log('\n✅ Local GCS test completed successfully!');
    } else {
      console.log('\n❌ Local GCS test failed!');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
