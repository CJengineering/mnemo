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
