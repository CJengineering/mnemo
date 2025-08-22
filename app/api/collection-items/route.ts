import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.LOCAL_POSTGRES_URL
});

// Helper to send webhooks for create/update events
async function sendCollectionWebhook(
  action: 'create' | 'update',
  payload: any
) {
  const endpoints =
    action === 'create'
      ? [
          'http://localhost:3000/api/mnemo/create-collection',
          'https://www.communityjameel.org/api/mnemo/create-collection'
        ]
      : [
          'http://localhost:3000/api/mnemo/update-collection',
          'https://www.communityjameel.org/api/mnemo/update-collection'
        ];
  try {
    await Promise.all(
      endpoints.map((url) =>
        fetch(url, {
          method: 'POST',
          // Send all data including status, type, timestamps
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch((e) => {
          console.error(`Webhook failed (${action}) => ${url}:`, e);
        })
      )
    );
  } catch (e) {
    console.error('Unexpected webhook dispatch error:', e);
  }
}

// GET - Fetch all collection items or filter by type
export async function GET(req: NextRequest) {
  try {
    // If an external API base is configured, proxy the request there instead of local DB (DB not present locally)
    const external = process.env.NEXT_PUBLIC_EXTERNAL_API_BASE_URL;
    if (external) {
      const url = new URL(req.url);
      const proxied = `${external}/api/collection-items${url.search}`;
      const r = await fetch(proxied, { cache: 'no-store' });
      const data = await r.json();
      return NextResponse.json(data, { status: r.status });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search'); // optional text search
    const slugsParam = searchParams.get('slugs'); // optional comma separated list of slugs to fetch explicitly

    const slugList = slugsParam
      ? slugsParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const client = await pool.connect();

    let query = 'SELECT * FROM "collectionItem"';
    const params: any[] = [];
    const conditions: string[] = [];

    if (type) {
      conditions.push(`type = $${params.length + 1}`);
      params.push(type);
    }

    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (slugList.length > 0) {
      conditions.push(`slug = ANY($${params.length + 1})`);
      params.push(slugList);
    }

    if (search) {
      const like = `%${search}%`;
      conditions.push(
        `(
          slug ILIKE $${params.length + 1}
          OR title ILIKE $${params.length + 1}
          OR (data->>'name') ILIKE $${params.length + 1}
          OR (data->>'title') ILIKE $${params.length + 1}
        )`
      );
      params.push(like);
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

    // Fire webhooks (non-blocking but awaited here to ensure ordering; could be detached if needed)
    sendCollectionWebhook('create', {
      event: 'collectionItem.created',
      action: 'create',
      timestamp: new Date().toISOString(),
      collectionItem: rows[0]
    });
    return NextResponse.json({ success: true, collectionItem: rows[0] });
  } catch (error) {
    console.error('💥 Error creating collection item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create collection item' },
      { status: 500 }
    );
  }
}
