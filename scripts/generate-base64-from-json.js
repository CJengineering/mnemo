#!/usr/bin/env node

/**
 * Generate base64 credentials from a JSON key file
 * Usage: node scripts/generate-base64-from-json.js /path/to/your/key.json
 */

const fs = require('fs');
const path = require('path');

function generateBase64FromJson() {
  const keyFilePath = process.argv[2];

  if (!keyFilePath) {
    console.error('❌ Please provide the path to your JSON key file');
    console.error(
      'Usage: node scripts/generate-base64-from-json.js /path/to/your/key.json'
    );
    process.exit(1);
  }

  if (!fs.existsSync(keyFilePath)) {
    console.error(`❌ Key file not found: ${keyFilePath}`);
    process.exit(1);
  }

  try {
    // Read the JSON key file
    const keyFileContent = fs.readFileSync(keyFilePath, 'utf8');
    const credentials = JSON.parse(keyFileContent);

    console.log('🔧 Processing JSON key file...');
    console.log(`- Project ID: ${credentials.project_id}`);
    console.log(`- Client Email: ${credentials.client_email}`);
    console.log(`- Private Key ID: ${credentials.private_key_id}`);

    // Convert to base64
    const base64String = Buffer.from(keyFileContent).toString('base64');

    console.log('\n✅ Generated base64 credentials successfully!');
    console.log('\n📋 Add this to your Vercel environment variables:');
    console.log('Variable name: GOOGLE_CREDENTIALS_BASE64');
    console.log('Variable value:');
    console.log(base64String);

    console.log(
      '\n🔧 You can also test locally by adding this to your .env.local:'
    );
    console.log(`GOOGLE_CREDENTIALS_BASE64=${base64String}`);

    // Save to a file for easy copying
    const outputFile = path.join(__dirname, 'new-gcs-credentials-base64.txt');
    fs.writeFileSync(outputFile, base64String);
    console.log(`\n💾 Saved to: ${outputFile}`);

    // Verify it can be decoded
    try {
      const decoded = JSON.parse(
        Buffer.from(base64String, 'base64').toString()
      );
      console.log('\n✅ Verification: Successfully decoded base64 credentials');
      console.log('- Project ID:', decoded.project_id);
      console.log('- Client Email:', decoded.client_email);
      console.log('- Private Key Length:', decoded.private_key.length);
    } catch (error) {
      console.error('\n❌ Verification failed:', error.message);
    }
  } catch (error) {
    console.error('❌ Failed to process key file:', error.message);
    process.exit(1);
  }
}

generateBase64FromJson();
