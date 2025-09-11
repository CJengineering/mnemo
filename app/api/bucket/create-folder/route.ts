import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export const runtime = 'nodejs';

const projectId = process.env.GCP_PROJECT_ID || 'cj-tech-381914';
const bucketName = process.env.GCS_BUCKET || 'mnemo';

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
