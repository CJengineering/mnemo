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
    return {
      mode: 'explicit' as const,
      storage: new Storage({
        projectId,
        credentials: { client_email, private_key }
      })
    };
  }
  return { mode: 'adc' as const, storage: new Storage({ projectId }) };
}

export async function GET(req: NextRequest) {
  const { mode, storage } = createStorage();
  const bucket = storage.bucket(bucketName);
  const now = new Date();
  const testPathPrefix = (
    new URL(req.url).searchParams.get('prefix') || '_selftest/'
  ).replace(/^\/+/, '');
  const testObject = `${testPathPrefix}delete-check-${now.getTime()}.txt`;

  const checks: Array<{ name: string; ok: boolean; detail?: any }> = [];

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
}
