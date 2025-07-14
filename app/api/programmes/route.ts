import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.LOCAL_POSTGRES_URL // Ensure this is set in .env
});

export async function GET() {
  try {
    const client = await pool.connect();
    // Query collection items where type is 'programme'
    const result = await client.query(
      'SELECT id, title, slug, status, data, created_at, updated_at FROM "collectionItem" WHERE type = $1 ORDER BY created_at DESC',
      ['programme']
    );
    client.release();

    return NextResponse.json({ success: true, programmes: result.rows });
  } catch (error) {
    console.error('Error fetching programmes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch programmes' },
      { status: 500 }
    );
  }
}
