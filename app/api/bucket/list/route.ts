import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export const runtime = 'nodejs';

// Config from env with sensible defaults
const projectId = process.env.GCP_PROJECT_ID || 'cj-tech-381914';
const bucketName = process.env.GCS_BUCKET || 'mnemo';
const cdnBaseUrl = process.env.CDN_BASE_URL || 'https://cdn.communityjameel.io';

// Build Storage client preferring base64 JSON creds, then explicit, then ADC
function createStorage() {
  // Approach 1: Base64 encoded JSON credentials (most reliable for serverless)
  const base64Creds = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (base64Creds) {
    try {
      console.log('🔐 GCS auth: using base64 JSON credentials');
      const credentials = JSON.parse(
        Buffer.from(base64Creds, 'base64').toString()
      );
      return new Storage({ projectId, credentials });
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

interface BucketFile {
  name: string;
  url: string;
  size?: number;
  timeCreated?: string;
  contentType?: string;
  isFolder?: boolean;
}

interface BucketResponse {
  success: boolean;
  files: BucketFile[];
  totalFiles: number;
  currentPrefix: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    const delimiter = searchParams.get('delimiter') || '/';

    console.log(
      `🟢 Fetching files from Google Cloud Storage bucket: ${bucketName}, prefix: "${prefix}"`
    );

    // Get files and prefixes (folders) from the bucket
    const [files, , apiResponse] = await bucket.getFiles({
      prefix: prefix,
      delimiter: delimiter,
      autoPaginate: false
    });

    console.log(`🟢 Found ${files.length} files in bucket`);

    // Transform Google Cloud Storage files to our format
    const bucketFiles: BucketFile[] = files.map((file) => {
      const metadata = file.metadata as any;
      return {
        name: file.name,
        url: `${cdnBaseUrl}/${file.name}`,
        size: metadata?.size
          ? typeof metadata.size === 'string'
            ? parseInt(metadata.size)
            : metadata.size
          : undefined,
        timeCreated: metadata?.timeCreated,
        contentType: metadata?.contentType,
        isFolder: false
      };
    });

    // Add folders (prefixes) to the list
    const prefixes = (apiResponse as any)?.prefixes || [];
    const folderItems: BucketFile[] = prefixes.map((folderPrefix: string) => ({
      name: folderPrefix,
      url: '', // Folders don't have URLs
      isFolder: true
    }));

    // Combine folders and files
    const allItems = [...folderItems, ...bucketFiles];

    // Sort: folders first, then files, both alphabetically
    allItems.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    console.log(
      '🟢 Sample items found:',
      allItems.slice(0, 5).map((f) => `${f.isFolder ? '📁' : '📄'} ${f.name}`)
    );

    return NextResponse.json({
      success: true,
      files: allItems,
      totalFiles: allItems.length,
      currentPrefix: prefix
    } as BucketResponse);
  } catch (error) {
    console.error('🔴 Error fetching bucket files:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch bucket files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
