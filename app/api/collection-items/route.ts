import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.LOCAL_POSTGRES_URL
});

// GET - Fetch all collection items or filter by type
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const client = await pool.connect();

    let query = 'SELECT * FROM "collectionItem"';
    const params: string[] = [];
    const conditions: string[] = [];

    if (type) {
      conditions.push(`type = $${params.length + 1}`);
      params.push(type);
    }

    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await client.query(query, params);
    client.release();

    return NextResponse.json({ success: true, collectionItems: rows });
  } catch (error) {
    console.error('Error fetching collection items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection items' },
      { status: 500 }
    );
  }
}

// POST - Create a new collection item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📥 API POST Request Body:', JSON.stringify(body, null, 2));

    const { type, status, slug, title, data } = body;

    console.log('🔍 Field Validation:', {
      type: { value: type, valid: !!type },
      status: { value: status, valid: !!status },
      slug: { value: slug, valid: !!slug },
      title: { value: title, valid: !!title }
    });

    if (!type || !status || !slug || !title) {
      const missingFields = [];
      if (!type) missingFields.push('type');
      if (!status) missingFields.push('status');
      if (!slug) missingFields.push('slug');
      if (!title) missingFields.push('title');

      console.error('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          received: { type, status, slug, title }
        },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    const { rows } = await client.query(
      `INSERT INTO "collectionItem" (type, status, slug, title, data) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [type, status, slug, title, data || null]
    );
    client.release();

    console.log('✅ Successfully created collection item:', rows[0]);
    return NextResponse.json({ success: true, collectionItem: rows[0] });
  } catch (error) {
    console.error('💥 Error creating collection item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create collection item' },
      { status: 500 }
    );
  }
}
