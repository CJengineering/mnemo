import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.LOCAL_POSTGRES_URL
});

// Helper to extract the ID from the URL
function getIdFromRequest(req: NextRequest) {
  return req.nextUrl.pathname.split('/').pop() || '';
}

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

// GET - Fetch a specific collection item by ID
export async function GET(req: NextRequest) {
  const id = getIdFromRequest(req);

  try {
    const client = await pool.connect();
    const { rows } = await client.query(
      `SELECT * FROM "collectionItem" WHERE id = $1`,
      [id]
    );
    client.release();

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Collection item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, collectionItem: rows[0] });
  } catch (error) {
    console.error('Error fetching collection item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection item' },
      { status: 500 }
    );
  }
}

// PUT - Update a collection item
export async function PUT(req: NextRequest) {
  const id = getIdFromRequest(req);

  try {
    const { type, status, slug, title, data } = await req.json();

    if (!type || !status || !slug || !title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type, status, slug, title'
        },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    const { rowCount, rows } = await client.query(
      `UPDATE "collectionItem" 
       SET type = $1, status = $2, slug = $3, title = $4, data = $5, updated_at = NOW() 
       WHERE id = $6 RETURNING *`,
      [type, status, slug, title, data || null, id]
    );
    client.release();

    if (rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Collection item not found' },
        { status: 404 }
      );
    }

    // Send update webhook
    sendCollectionWebhook('update', {
      event: 'collectionItem.updated',
      action: 'update',
      timestamp: new Date().toISOString(),
      collectionItem: rows[0]
    });

    return NextResponse.json({ success: true, collectionItem: rows[0] });
  } catch (error) {
    console.error('Error updating collection item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update collection item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a collection item
export async function DELETE(req: NextRequest) {
  const id = getIdFromRequest(req);

  try {
    const client = await pool.connect();
    const { rowCount } = await client.query(
      `DELETE FROM "collectionItem" WHERE id = $1`,
      [id]
    );
    client.release();

    if (rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Collection item not found' },
        { status: 404 }
      );
    }

    // Optionally could send a delete webhook if desired (spec not requested)

    return NextResponse.json({
      success: true,
      message: 'Collection item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting collection item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete collection item' },
      { status: 500 }
    );
  }
}
