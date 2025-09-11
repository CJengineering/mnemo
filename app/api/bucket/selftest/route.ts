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
    try {
      // Try multiple approaches to handle the private key
      let private_key = rawKey.replace(/\\n/g, '\n');

      // Debug logging
      console.log('🔍 Private key debug:');
      console.log('- Raw key length:', rawKey.length);
      console.log(
        '- Has BEGIN header:',
        private_key.includes('BEGIN PRIVATE KEY')
      );
      console.log('- Has END footer:', private_key.includes('END PRIVATE KEY'));
      console.log(
        '- First 50 chars:',
        JSON.stringify(private_key.substring(0, 50))
      );
      console.log(
        '- Last 50 chars:',
        JSON.stringify(private_key.substring(private_key.length - 50))
      );

      // Normalize line endings and whitespace
      private_key = private_key.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      // Ensure proper PEM format
      if (!private_key.includes('BEGIN PRIVATE KEY')) {
        private_key = `-----BEGIN PRIVATE KEY-----\n${private_key}\n-----END PRIVATE KEY-----\n`;
        console.log('✅ Added PEM headers to private key');
      }

      // Try to create storage with explicit credentials
      console.log(
        '🔧 Attempting to create Storage with explicit credentials...'
      );
      const storage = new Storage({
        projectId,
        credentials: { client_email, private_key }
      });

      console.log('✅ Storage created successfully with explicit credentials');
      return {
        mode: 'explicit' as const,
        storage
      };
    } catch (credentialError: any) {
      console.error('❌ Failed to create Storage with explicit credentials:', {
        error: credentialError.message,
        code: credentialError.code,
        stack: credentialError.stack
      });

      // Try with base64 encoded JSON credentials as fallback
      try {
        console.log('🔄 Attempting fallback: JSON credentials...');
        const credentials = {
          type: 'service_account',
          project_id: projectId,
          private_key_id: 'placeholder',
          private_key: rawKey.replace(/\\n/g, '\n'),
          client_email,
          client_id: 'placeholder',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url:
            'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(client_email)}`
        };

        const storage = new Storage({
          projectId,
          credentials
        });

        console.log('✅ Storage created with JSON credentials fallback');
        return {
          mode: 'explicit-json' as const,
          storage
        };
      } catch (jsonError: any) {
        console.error('❌ JSON credentials fallback also failed:', {
          error: jsonError.message,
          code: jsonError.code
        });

        // Fall back to ADC
        console.log('🔄 Falling back to Application Default Credentials...');
        return {
          mode: 'adc-fallback' as const,
          storage: new Storage({ projectId }),
          error: `Explicit credentials failed: ${credentialError.message}`
        };
      }
    }
  }

  console.log(
    '🔧 Using Application Default Credentials (no explicit credentials provided)'
  );
  return { mode: 'adc' as const, storage: new Storage({ projectId }) };
}

export async function GET(req: NextRequest) {
  try {
    // Environment debug info
    console.log('🔧 Environment debug:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID);
    console.log('- GCS_BUCKET:', process.env.GCS_BUCKET);
    console.log('- Has GCP_CLIENT_EMAIL:', !!process.env.GCP_CLIENT_EMAIL);
    console.log('- Has PRIVATE_GCL:', !!process.env.PRIVATE_GCL);
    console.log('- PRIVATE_GCL length:', process.env.PRIVATE_GCL?.length || 0);

    const { mode, storage } = createStorage();
    const bucket = storage.bucket(bucketName);
    const now = new Date();
    const testPathPrefix = (
      new URL(req.url).searchParams.get('prefix') || '_selftest/'
    ).replace(/^\/+/, '');
    const testObject = `${testPathPrefix}delete-check-${now.getTime()}.txt`;

    const checks: Array<{ name: string; ok: boolean; detail?: any }> = [];

    console.log('🚀 Starting selftest with authMode:', mode);

    // 1) Bucket exists
    try {
      const [exists] = await bucket.exists();
      checks.push({
        name: 'bucket.exists',
        ok: !!exists,
        detail: { bucketName }
      });
      if (!exists) {
        return NextResponse.json(
          {
            success: false,
            authMode: mode,
            projectId,
            bucketName,
            checks,
            error: 'Bucket does not exist or not accessible.'
          },
          { status: 500 }
        );
      }
    } catch (e: any) {
      checks.push({
        name: 'bucket.exists',
        ok: false,
        detail: { code: e?.code, message: e?.message, errors: e?.errors }
      });
      return NextResponse.json(
        { success: false, authMode: mode, projectId, bucketName, checks },
        { status: 500 }
      );
    }

    const file = bucket.file(testObject);

    // 2) Upload small test object
    try {
      await file.save(Buffer.from('ok'), { contentType: 'text/plain' });
      checks.push({
        name: 'file.save',
        ok: true,
        detail: { object: testObject }
      });
    } catch (e: any) {
      checks.push({
        name: 'file.save',
        ok: false,
        detail: { code: e?.code, message: e?.message, errors: e?.errors }
      });
      return NextResponse.json(
        { success: false, authMode: mode, projectId, bucketName, checks },
        { status: 500 }
      );
    }

    // 3) file.exists
    try {
      const [exists] = await file.exists();
      checks.push({ name: 'file.exists', ok: !!exists });
      if (!exists) {
        return NextResponse.json(
          {
            success: false,
            authMode: mode,
            projectId,
            bucketName,
            checks,
            error: 'Uploaded file not found'
          },
          { status: 500 }
        );
      }
    } catch (e: any) {
      checks.push({
        name: 'file.exists',
        ok: false,
        detail: { code: e?.code, message: e?.message, errors: e?.errors }
      });
      return NextResponse.json(
        { success: false, authMode: mode, projectId, bucketName, checks },
        { status: 500 }
      );
    }

    // 4) file.delete
    try {
      await file.delete();
      checks.push({ name: 'file.delete', ok: true });
    } catch (e: any) {
      checks.push({
        name: 'file.delete',
        ok: false,
        detail: { code: e?.code, message: e?.message, errors: e?.errors }
      });
      return NextResponse.json(
        { success: false, authMode: mode, projectId, bucketName, checks },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      authMode: mode,
      projectId,
      bucketName,
      object: testObject,
      checks
    });
  } catch (error) {
    console.error('🔴 Unexpected error in selftest:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
