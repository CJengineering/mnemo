import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export const runtime = 'nodejs';

const projectId = process.env.GCP_PROJECT_ID || 'cj-tech-381914';
const bucketName = process.env.GCS_BUCKET || 'mnemo';
const cdnBaseUrl = process.env.CDN_BASE_URL || 'https://cdn.communityjameel.io';

// Normalize private key and allow ADC fallback
function createStorage() {
  // Approach 1: Base64 encoded JSON credentials (most reliable for serverless)
  const base64Creds = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (base64Creds) {
    try {
      console.log('🔐 GCS auth: using base64 JSON credentials');
      const credentials = JSON.parse(
        Buffer.from(base64Creds, 'base64').toString()
      );
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
      console.error(
        '❌ Explicit credentials failed, falling back to ADC:',
        error.message
      );
    }
  }

  console.warn(
    '⚠️ GCS auth: using Application Default Credentials (no env creds found)'
  );
  return new Storage({ projectId });
}

const storage = createStorage();
const bucket = storage.bucket(bucketName);

export async function POST(req: NextRequest) {
  try {
    const { path, contentType } = await req.json();

    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "path"' },
        { status: 400 }
      );
    }

    const ct =
      typeof contentType === 'string' && contentType.length > 0
        ? contentType
        : 'application/octet-stream';

    const file = bucket.file(path);

    const origin = req.headers.get('origin') || undefined;

    const [uploadUrl] = await file.createResumableUpload({
      origin, // helps with CORS
      metadata: {
        contentType: ct,
        cacheControl: 'public, max-age=31536000'
      }
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      cdnUrl: `${cdnBaseUrl}/${path}`
    });
  } catch (error) {
    console.error('🔴 Error starting resumable upload session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start resumable upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
