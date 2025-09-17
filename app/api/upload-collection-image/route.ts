import { Storage } from '@google-cloud/storage';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const theKey = process.env.PRIVATE_GCL;

const storage = new Storage({
  projectId: 'cj-tech-381914',
  credentials: {
    client_email: 'todo-test@cj-tech-381914.iam.gserviceaccount.com',
    private_key: `-----BEGIN PRIVATE KEY-----\n${theKey}=\n-----END PRIVATE KEY-----\n`
  }
});

const bucket = storage.bucket('mnemo');
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
