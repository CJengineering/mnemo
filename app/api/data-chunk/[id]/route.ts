import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.LOCAL_POSTGRES_URL, // Make sure this is set in .env
});

// Helper to extract the ID from the URL
function getIdFromRequest(req: NextRequest) {
  return req.nextUrl.pathname.split('/').pop() || '';
}

// GET
export async function GET(req: NextRequest) {
  const id = getIdFromRequest(req);

  try {
    const client = await pool.connect();
    const { rows } = await client.query(
      `SELECT * FROM data_chunks WHERE id = $1`,
      [id]
    );
    client.release();

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Data chunk not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, dataChunk: rows[0] });
  } catch (error) {
    console.error('Error fetching data chunk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data chunk' },
      { status: 500 }
    );
  }
}

// PUT
export async function PUT(req: NextRequest) {
  const id = getIdFromRequest(req);

  try {
    const { name, type, programmeId, data, metaData } = await req.json();

    if (!name || !type || !programmeId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    const { rowCount, rows } = await client.query(
      `UPDATE data_chunks 
         SET name = $1, type = $2, programme_id = $3, data = $4, meta_data = $5, updated_at = NOW() 
         WHERE id = $6 RETURNING *`,
      [name, type, programmeId, data, metaData, id]
    );
    client.release();

    if (rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update data chunk' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, dataChunk: rows[0] });
  } catch (error) {
    console.error('Error updating data chunk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update data chunk' },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  const id = getIdFromRequest(req);

  try {
    const client = await pool.connect();
    const { rowCount } = await client.query(
      `DELETE FROM data_chunks WHERE id = $1`,
      [id]
    );
    client.release();

    if (rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete data chunk' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data chunk deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting data chunk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete data chunk' },
      { status: 500 }
    );
  }
}
