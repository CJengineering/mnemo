/**
 * Test script to verify GCS authentication approaches
 * Run with: node scripts/test-gcs-auth.js
 */

const { Storage } = require('@google-cloud/storage');

const projectId = process.env.GCP_PROJECT_ID || 'mnemo-442308';

function testCredentialApproaches() {
  console.log('🧪 Testing GCS Authentication Approaches');
  console.log('=========================================');

  const rawKey = process.env.PRIVATE_GCL || '';
  const client_email = process.env.GCP_CLIENT_EMAIL || '';

  console.log('📋 Environment check:');
  console.log(`- PRIVATE_GCL length: ${rawKey.length}`);
  console.log(`- GCP_CLIENT_EMAIL: ${client_email ? '✅ Set' : '❌ Missing'}`);
  console.log(`- GCP_PROJECT_ID: ${projectId}`);
  console.log('');

  if (rawKey && client_email) {
    // Test approach 1: Direct PEM format
    try {
      console.log('🔧 Test 1: Direct PEM credential format');
      let private_key = rawKey.replace(/\\n/g, '\n');

      if (!private_key.includes('BEGIN PRIVATE KEY')) {
        private_key = `-----BEGIN PRIVATE KEY-----\n${private_key}\n-----END PRIVATE KEY-----\n`;
      }

      const storage1 = new Storage({
        projectId,
        credentials: { client_email, private_key }
      });

      console.log('✅ Storage instance created successfully');

      // Try to access bucket to test auth
      return storage1
        .bucket('mnemo-bucket')
        .getMetadata()
        .then(() => console.log('✅ Bucket access successful'))
        .catch((err) => console.log(`❌ Bucket access failed: ${err.message}`));
    } catch (error) {
      console.log(`❌ Direct PEM failed: ${error.message}`);
    }

    // Test approach 2: JSON credential object
    try {
      console.log('\n🔧 Test 2: JSON credential object format');
      const credentials = {
        type: 'service_account',
        project_id: projectId,
        private_key_id: 'placeholder',
        private_key: rawKey.replace(/\\n/g, '\n'),
        client_email,
        client_id: 'placeholder',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url:
          'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(client_email)}`
      };

      const storage2 = new Storage({
        projectId,
        credentials
      });

      console.log('✅ Storage instance created successfully');

      return storage2
        .bucket('mnemo-bucket')
        .getMetadata()
        .then(() => console.log('✅ Bucket access successful'))
        .catch((err) => console.log(`❌ Bucket access failed: ${err.message}`));
    } catch (error) {
      console.log(`❌ JSON credentials failed: ${error.message}`);
    }
  }

  // Test approach 3: Application Default Credentials
  try {
    console.log('\n🔧 Test 3: Application Default Credentials');
    const storage3 = new Storage({ projectId });

    console.log('✅ Storage instance created successfully');

    return storage3
      .bucket('mnemo-bucket')
      .getMetadata()
      .then(() => console.log('✅ Bucket access successful'))
      .catch((err) => console.log(`❌ Bucket access failed: ${err.message}`));
  } catch (error) {
    console.log(`❌ ADC failed: ${error.message}`);
  }
}

// Run the test
testCredentialApproaches()
  .then(() => console.log('\n🏁 Test completed'))
  .catch((err) => console.error('\n💥 Test failed:', err));
