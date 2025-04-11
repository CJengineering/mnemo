import { NextRequest, NextResponse } from 'next/server';
import { mapData } from '@/validators/page-validator/mapData';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.LOCAL_POSTGRES_URL
});

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
  
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }
  
    try {
      const result = await pool.query('SELECT * FROM page WHERE slug = $1 LIMIT 1', [slug]);
      const page = result.rows[0];
  
      if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }
  
      return NextResponse.json(page);
    } catch (err: any) {
      console.error(err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, data, dataHtml, dataSeo } = body;

    if (!slug || !data || !dataHtml || !dataSeo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate DroppedItem[]
    const parsedData = mapData(data);

    // Save to PostgreSQL
    const result = await pool.query(
      `
        INSERT INTO page (slug, data, data_html, data_seo)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [slug, JSON.stringify(parsedData), dataHtml, dataSeo]
    );

    return NextResponse.json({ message: 'Page created', page: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
