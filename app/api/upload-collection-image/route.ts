import { Storage } from '@google-cloud/storage';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

const projectId = process.env.GCP_PROJECT_ID || 'cj-tech-381914';
const bucketName = process.env.GCS_BUCKET || 'mnemo';

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
const CDN_BASE_URL = 'https://cdn.communityjameel.io';

/**
 * Compress and convert an image to WebP format
 */
async function compressToWebP(fileBuffer: Buffer): Promise<Buffer> {
  return await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
}

/**
 * Upload a file to the collection folder structure
 */
async function uploadToCollectionBucket(
  buffer: Buffer,
  destination: string,
  contentType: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = bucket.file(destination);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: contentType
    });

    blobStream.on('error', (err) => {
      console.error(`🔴 Error uploading ${destination}:`, err);
      reject(new Error('Collection image upload failed'));
    });

    blobStream.on('finish', () => {
      const publicUrl = `${CDN_BASE_URL}/${destination}`;
      resolve(publicUrl);
    });

    blobStream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log('🟢 Received request at /api/upload-collection-image');

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

    console.log(
      `🟢 Processing collection image: ${fileName} for ${collectionType}/${slug}`
    );

    // Convert to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Sanitize filename: remove spaces, special chars, convert to lowercase
    const sanitizedFileName = fileName
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9.-]/g, '') // Remove special characters except dots and hyphens
      .toLowerCase(); // Convert to lowercase

    // Create collection folder structure: /collection/[type]/[slug]/image-name.ext
    const collectionPath = `collection/${collectionType}/${slug}/${sanitizedFileName}`;

    // If preserveFormat is true, keep original format
    if (preserveFormat === 'true') {
      console.log(`🟢 Uploading original format to: ${collectionPath}`);
      const originalUrl = await uploadToCollectionBucket(
        fileBuffer,
        collectionPath,
        file.type
      );

      return NextResponse.json({ url: originalUrl });
    } else {
      // Convert to WebP for optimized storage
      const webpPath = collectionPath.replace(/\.[^/.]+$/, '.webp');
      const webpBuffer = await compressToWebP(fileBuffer);

      console.log(`🟢 Uploading WebP format to: ${webpPath}`);
      const webpUrl = await uploadToCollectionBucket(
        webpBuffer,
        webpPath,
        'image/webp'
      );

      return NextResponse.json({ url: webpUrl });
    }
  } catch (error) {
    console.error('🔴 Collection image upload error:', error);
    return NextResponse.json(
      { error: 'Collection image upload failed' },
      { status: 500 }
    );
  }
}
