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

export async function POST(request: NextRequest) {
  try {
    const { folderPath } = await request.json();

    if (!folderPath) {
      return NextResponse.json(
        { success: false, error: 'No folder path provided' },
        { status: 400 }
      );
    }

    // Ensure the folder path ends with a slash
    const normalizedPath = folderPath.endsWith('/')
      ? folderPath
      : `${folderPath}/`;

    console.log(`📁 Creating folder: ${normalizedPath}`);

    // Check if folder already exists
    const [exists] = await bucket.file(`${normalizedPath}.keep`).exists();
    if (exists) {
      return NextResponse.json(
        { success: false, error: 'Folder already exists' },
        { status: 409 }
      );
    }

    // Create a placeholder file to ensure the folder exists
    // Google Cloud Storage doesn't have actual folders, so we create a hidden file
    const placeholderFile = bucket.file(`${normalizedPath}.keep`);

    await placeholderFile.save('', {
      metadata: {
        contentType: 'text/plain',
        metadata: {
          createdBy: 'bucket-explorer',
          purpose: 'folder-placeholder'
        }
      }
    });

    console.log(`✅ Folder created successfully: ${normalizedPath}`);

    return NextResponse.json({
      success: true,
      message: 'Folder created successfully',
      folderPath: normalizedPath
    });
  } catch (error) {
    console.error('🔴 Error creating folder:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create folder'
      },
      { status: 500 }
    );
  }
}
