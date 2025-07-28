import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

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

    const fileUrl = `${CDN_BASE_URL}/${fullPath}`;

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
