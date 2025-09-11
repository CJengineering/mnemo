#!/usr/bin/env node

/**
 * Test GCS with the EXACT syntax requested:
 * private_key = `-----BEGIN PRIVATE KEY-----\n${private_key}\n-----END PRIVATE KEY-----\n`;
 */

require('dotenv').config({ path: '.env.local' });
const { Storage } = require('@google-cloud/storage');

const projectId = process.env.GCP_PROJECT_ID || 'cj-tech-381914';
const bucketName = process.env.GCS_BUCKET || 'mnemo';

async function testExactPEMSyntax() {
  console.log('🧪 Testing EXACT PEM Syntax');
  console.log('============================\n');

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
    // EXACT syntax as requested - note the variable name confusion is intentional
    // This is testing: private_key = `-----BEGIN PRIVATE KEY-----\n${private_key}\n-----END PRIVATE KEY-----\n`;
    // Where the first private_key is the result, and the ${private_key} is the raw key
    let private_key = `-----BEGIN PRIVATE KEY-----\n${rawKey}\n-----END PRIVATE KEY-----\n`;

    console.log('🔧 Testing EXACT requested syntax...');
    console.log(
      'private_key = `-----BEGIN PRIVATE KEY-----\\n${private_key}\\n-----END PRIVATE KEY-----\\n`;'
    );
    console.log('');
    console.log(`- Constructed key length: ${private_key.length}`);
    console.log(
      `- Has BEGIN header: ${private_key.includes('-----BEGIN PRIVATE KEY-----')}`
    );
    console.log(
      `- Has END footer: ${private_key.includes('-----END PRIVATE KEY-----')}`
    );
    console.log(`- First 50 chars: ${private_key.substring(0, 50)}...`);
    console.log(
      `- Last 50 chars: ...${private_key.substring(private_key.length - 50)}`
    );

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
    const testFile = `_test/exact-pem-syntax-test-${Date.now()}.txt`;
    const file = bucket.file(testFile);

    console.log('- Testing file upload...');
    await file.save('Hello from EXACT PEM syntax test!', {
      contentType: 'text/plain'
    });
    console.log('  ✅ File uploaded successfully');

    console.log('- Testing file download...');
    const [content] = await file.download();
    console.log(`  ✅ File content: "${content.toString()}"`);

    console.log('- Testing file delete...');
    await file.delete();
    console.log('  ✅ File deleted successfully');

    console.log('\n🎉 EXACT PEM Syntax test PASSED!');
    console.log(
      '✅ The syntax works: private_key = `-----BEGIN PRIVATE KEY-----\\n${private_key}\\n-----END PRIVATE KEY-----\\n`;'
    );
    console.log(
      '💡 This constructs the PEM headers around the raw key content'
    );
    return true;
  } catch (error) {
    console.error('❌ EXACT PEM syntax test failed:', error.message);
    if (error.code) console.error('   Error Code:', error.code);
    if (error.stack) console.error('   Stack:', error.stack.split('\n')[0]);
    return false;
  }
}

// Run the test
testExactPEMSyntax()
  .then((success) => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
