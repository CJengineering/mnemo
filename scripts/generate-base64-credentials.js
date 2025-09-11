#!/usr/bin/env node

/**
 * Script to generate a base64 encoded GCS service account JSON
 * from individual environment variables.
 *
 * Usage: node scripts/generate-base64-credentials.js
 *
 * This script reads the existing GCS environment variables and creates
 * a base64 encoded JSON credential string that can be used with
 * GOOGLE_CREDENTIALS_BASE64 environment variable.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  });
}

function generateBase64Credentials() {
  const projectId = process.env.GCP_PROJECT_ID;
  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  const privateKey = process.env.PRIVATE_GCL;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Missing required environment variables:');
    console.error('- GCP_PROJECT_ID:', projectId ? '✅' : '❌');
    console.error('- GCP_CLIENT_EMAIL:', clientEmail ? '✅' : '❌');
    console.error('- PRIVATE_GCL:', privateKey ? '✅' : '❌');
    process.exit(1);
  }

  // Clean up the private key
  let cleanPrivateKey = privateKey.replace(/\\n/g, '\n');
  if (!cleanPrivateKey.includes('BEGIN PRIVATE KEY')) {
    cleanPrivateKey = `-----BEGIN PRIVATE KEY-----\n${cleanPrivateKey}\n-----END PRIVATE KEY-----\n`;
  }

  // Create the service account JSON
  const serviceAccount = {
    type: 'service_account',
    project_id: projectId,
    private_key_id: 'generated-from-env',
    private_key: cleanPrivateKey,
    client_email: clientEmail,
    client_id: '',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`
  };

  // Convert to base64
  const jsonString = JSON.stringify(serviceAccount);
  const base64String = Buffer.from(jsonString).toString('base64');

  console.log('✅ Generated base64 credentials successfully!');
  console.log('\n📋 Add this to your Vercel environment variables:');
  console.log('Variable name: GOOGLE_CREDENTIALS_BASE64');
  console.log('Variable value:');
  console.log(base64String);

  console.log(
    '\n🔧 You can also test locally by adding this to your .env.local:'
  );
  console.log(`GOOGLE_CREDENTIALS_BASE64=${base64String}`);

  // Also save to a file for easy copying
  const outputFile = path.join(__dirname, 'gcs-credentials-base64.txt');
  fs.writeFileSync(outputFile, base64String);
  console.log(`\n💾 Saved to: ${outputFile}`);

  // Verify it can be decoded
  try {
    const decoded = JSON.parse(Buffer.from(base64String, 'base64').toString());
    console.log('\n✅ Verification: Successfully decoded base64 credentials');
    console.log('- Project ID:', decoded.project_id);
    console.log('- Client Email:', decoded.client_email);
    console.log('- Private Key Length:', decoded.private_key.length);
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
  }
}

generateBase64Credentials();
