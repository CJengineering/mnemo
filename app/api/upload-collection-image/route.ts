export const runtime = 'nodejs';

import { Storage } from '@google-cloud/storage';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const projectId = process.env.GCP_PROJECT_ID || 'cj-tech-381914';
const bucketName = process.env.GCS_BUCKET || 'mnemo';
const CDN_BASE_URL =
  process.env.CDN_BASE_URL || 'https://cdn.communityjameel.io';

function resolveCredentials() {
  // 1) Prefer base64 JSON creds
  const b64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (b64 && b64.trim()) {
    try {
      const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      if (json.client_email && json.private_key) return json;
    } catch {}
  }
  // 2) Fallback to env pair
  const rawKey = process.env.PRIVATE_GCL || '';
  const client_email = process.env.GCP_CLIENT_EMAIL || '';
  if (rawKey && client_email) {
    let private_key = rawKey.replace(/\\n/g, '\n');
    if (!private_key.includes('BEGIN PRIVATE KEY')) {
      private_key = `-----BEGIN PRIVATE KEY-----\n${private_key}\n-----END PRIVATE KEY-----\n`;
    }
    return { client_email, private_key } as any;
  }
  // 3) ADC
  return null;
}

function createStorage() {
  const credentials = resolveCredentials();
  return credentials
    ? new Storage({ projectId, credentials })
    : new Storage({ projectId });
}

const storage = createStorage();
const bucket = storage.bucket(bucketName);

async function compressToWebP(fileBuffer: Buffer): Promise<Buffer> {
  return sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
}

async function saveToBucket(
  buffer: Buffer,
  destination: string,
  contentType: string
): Promise<string> {
  const file = bucket.file(destination);
  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable'
    }
  });
  return `${CDN_BASE_URL}/${destination}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const collectionType = formData.get('collectionType') as string;
    const slug = formData.get('slug') as string;
    const preserveFormat = formData.get('preserveFormat') as string;

    if (!file || !fileName || !collectionType || !slug) {
      return NextResponse.json(
        { error: 'File, fileName, collectionType, and slug are required' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const sanitizedFileName = fileName
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '')
      .toLowerCase();

    // New path standard
    const basePath = `website/collections/${collectionType}/${slug}/`;
    const originalPath = `${basePath}${sanitizedFileName}`;

    if (preserveFormat === 'true') {
      const url = await saveToBucket(
        fileBuffer,
        originalPath,
        file.type || 'application/octet-stream'
      );
      return NextResponse.json({ url });
    } else {
      const webpPath = originalPath.replace(/\.[^/.]+$/, '.webp');
      const webpBuffer = await compressToWebP(fileBuffer);
      const url = await saveToBucket(webpBuffer, webpPath, 'image/webp');
      return NextResponse.json({ url });
    }
  } catch (error) {
    console.error('🔴 Collection image upload error:', error);
    return NextResponse.json(
      { error: 'Collection image upload failed' },
      { status: 500 }
    );
  }
}
