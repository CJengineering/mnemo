import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export const runtime = 'nodejs';

const projectId = process.env.GCP_PROJECT_ID || 'cj-tech-381914';
const bucketName = process.env.GCS_BUCKET || 'mnemo';

function createStorage() {
  const rawKey = process.env.PRIVATE_GCL || '';
  const client_email = process.env.GCP_CLIENT_EMAIL || '';
  const hasKey = rawKey && rawKey.trim().length > 0;
  const hasEmail = client_email && client_email.trim().length > 0;
  if (hasKey && hasEmail) {
    let private_key = rawKey.replace(/\\n/g, '\n');
    if (!private_key.includes('BEGIN PRIVATE KEY')) {
      private_key = `-----BEGIN PRIVATE KEY-----\n${private_key}\n-----END PRIVATE KEY-----\n`;
    }
    console.log('🔐 GCS auth: using explicit service account credentials');
    return new Storage({
      projectId,
      credentials: { client_email, private_key }
    });
  }
  console.warn(
    '⚠️ GCS auth: using Application Default Credentials (no env creds found)'
  );
  return new Storage({ projectId });
}

const storage = createStorage();
const bucket = storage.bucket(bucketName);

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting file: ${filePath}`);

    // Check if it's a folder (ends with /)
    const isFolder = filePath.endsWith('/');

    if (isFolder) {
      // Delete all files in the folder
      const [files] = await bucket.getFiles({
        prefix: filePath
      });

      if (files.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Folder not found or already empty' },
          { status: 404 }
        );
      }

      // Delete all files in the folder
      const deletePromises = files.map((file) => file.delete());
      await Promise.all(deletePromises);

      console.log(
        `✅ Folder deleted successfully: ${filePath} (${files.length} files)`
      );

      return NextResponse.json({
        success: true,
        message: `Folder deleted successfully`,
        deletedFiles: files.length
      });
    } else {
      // Delete single file
      const file = bucket.file(filePath);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }

      await file.delete();

      console.log(`✅ File deleted successfully: ${filePath}`);

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully'
      });
    }
  } catch (error) {
    console.error('🔴 Error deleting file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
