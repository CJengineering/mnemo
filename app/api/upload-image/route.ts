export const runtime = 'nodejs';

import { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';

const projectId = process.env.GCP_PROJECT_ID || 'cj-tech-381914';
const bucketName = process.env.GCS_BUCKET || 'mnemo';
const CDN_BASE_URL =
  process.env.CDN_BASE_URL || 'https://cdn.communityjameel.io';

function resolveCredentials() {
  const b64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (b64 && b64.trim()) {
    try {
      const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      if (json.client_email && json.private_key) return json;
    } catch {}
  }
  const rawKey = process.env.PRIVATE_GCL || '';
  const client_email = process.env.GCP_CLIENT_EMAIL || '';
  if (rawKey && client_email) {
    let private_key = rawKey.replace(/\\n/g, '\n');
    if (!private_key.includes('BEGIN PRIVATE KEY')) {
      private_key = `-----BEGIN PRIVATE KEY-----\n${private_key}\n-----END PRIVATE KEY-----\n`;
    }
    return { client_email, private_key } as any;
  }
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

/**
 * Compress and convert an image to WebP format
 */
async function compressToWebP(fileBuffer: Buffer): Promise<Buffer> {
  return await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
}

/**
 * Upload a file to a folder in the bucket
 */
async function uploadToBucket(
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

export async function POST(req: Request) {
  try {
    console.log('🟢 Received request at /api/upload-image');

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const folder = formData.get('folder') as string | null; // Optional folder
    const preserveFormat = formData.get('preserveFormat') as string | null; // New flag for preserving original format

    if (!file || !fileName) {
      return new Response(
        JSON.stringify({ error: 'File and fileName are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(
      `🟢 Processing file: ${fileName}, preserveFormat: ${preserveFormat}`
    );

    // Convert to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Generate file paths with sanitized filename
    const timestamp = Date.now();
    let folderPath = '';

    // Create proper folder structure for programmes
    if (folder && preserveFormat === 'true') {
      folderPath = `website/programmes/${folder}/`;
    } else if (folder) {
      folderPath = `${folder}/`;
    }

    // Sanitize filename: remove spaces, special chars, convert to lowercase
    const sanitizedFileName = fileName
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9.-]/g, '') // Remove special characters except dots and hyphens
      .toLowerCase(); // Convert to lowercase

    // If preserveFormat is true, keep original format and name
    if (preserveFormat === 'true') {
      const originalFileName = `${folderPath}${sanitizedFileName}`;

      console.log(`🟢 Uploading original file to: ${originalFileName}`);
      const originalUrl = await uploadToBucket(
        fileBuffer,
        originalFileName,
        (file as any).type || 'application/octet-stream'
      );

      return new Response(JSON.stringify({ url: originalUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Legacy behavior: convert to WebP
      const originalFileName = `${folderPath}${timestamp}-${sanitizedFileName}`;
      const webpFileName = `${folderPath}${timestamp}-${sanitizedFileName.replace(/\.[^/.]+$/, '')}.webp`;

      // Compress and convert to WebP
      const webpBuffer = await compressToWebP(fileBuffer);

      // Upload original and WebP files
      console.log('🟢 Uploading original file...');
      await uploadToBucket(fileBuffer, originalFileName, file.type);

      console.log('🟢 Uploading WebP file...');
      const webpUrl = await uploadToBucket(
        webpBuffer,
        webpFileName,
        'image/webp'
      );

      return new Response(JSON.stringify({ url: webpUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('🔴 Unexpected server error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
