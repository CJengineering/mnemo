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
      `🟢 Fetching files from Google Cloud Storage bucket: mnemo, prefix: "${prefix}"`
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
      const metadata = file.metadata;
      return {
        name: file.name,
        url: `${CDN_BASE_URL}/${file.name}`,
        size: metadata.size
          ? typeof metadata.size === 'string'
            ? parseInt(metadata.size)
            : metadata.size
          : undefined,
        timeCreated: metadata.timeCreated,
        contentType: metadata.contentType,
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
    });
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
