import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.LOCAL_POSTGRES_URL
});

// Helper to extract the ID from the URL
function getIdFromRequest(req: NextRequest) {
  return req.nextUrl.pathname.split('/').pop() || '';
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
