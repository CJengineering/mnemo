import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export const runtime = 'nodejs';

const projectId = process.env.GCP_PROJECT_ID || 'cj-tech-381914';
const bucketName = process.env.GCS_BUCKET || 'mnemo';
const cdnBaseUrl = process.env.CDN_BASE_URL || 'https://cdn.communityjameel.io';

function createStorage() {
  // Approach 1: Base64 encoded JSON credentials (most reliable for serverless)
  const base64Creds = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (base64Creds) {
    try {
      console.log('🔐 GCS auth: using base64 JSON credentials');
      const credentials = JSON.parse(Buffer.from(base64Creds, 'base64').toString());
      return new Storage({
        projectId,
        credentials
      });
    } catch (error: any) {
      console.error('❌ Base64 JSON credentials failed:', error.message);
    }
  }
  
  // Approach 2: Explicit credentials with PEM headers
  const rawKey = process.env.PRIVATE_GCL || '';
  const client_email = process.env.GCP_CLIENT_EMAIL || '';
  const hasKey = rawKey && rawKey.trim().length > 0;
  const hasEmail = client_email && client_email.trim().length > 0;
  
  if (hasKey && hasEmail) {
    try {
      let private_key = rawKey.replace(/\\n/g, '\n');
      if (!private_key.includes('BEGIN PRIVATE KEY')) {
        private_key = `-----BEGIN PRIVATE KEY-----\n${private_key}\n-----END PRIVATE KEY-----\n`;
      }
      console.log('🔐 GCS auth: using explicit service account credentials');
      return new Storage({
        projectId,
        credentials: { client_email, private_key }
      });
    } catch (error: any) {
      console.error('❌ Explicit credentials failed, falling back to ADC:', error.message);
    }
  }
  
  console.warn('⚠️ GCS auth: using Application Default Credentials (no env creds found)');
  return new Storage({ projectId });
}

const storage = createStorage();
const bucket = storage.bucket(bucketName);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prefix = (formData.get('prefix') as string) || '';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Sanitize filename: remove spaces, special chars, convert to lowercase
    const sanitizedFileName = file.name
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9.-]/g, '') // Remove special characters except dots and hyphens
      .toLowerCase(); // Convert to lowercase

    // Create the full path with prefix
    const fullPath = prefix
      ? `${prefix}${sanitizedFileName}`
      : sanitizedFileName;

    console.log(`📤 Uploading file to: ${fullPath}`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Google Cloud Storage
    const gcsFile = bucket.file(fullPath);

    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.type || 'application/octet-stream',
        cacheControl: 'public, max-age=31536000' // 1 year cache
      }
    });

    const fileUrl = `${cdnBaseUrl}/${fullPath}`;

    console.log(`✅ File uploaded successfully: ${fileUrl}`);

    return NextResponse.json({
      success: true,
      file: {
        name: fullPath,
        url: fileUrl,
        size: file.size,
        contentType: file.type,
        timeCreated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('🔴 Error uploading file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
