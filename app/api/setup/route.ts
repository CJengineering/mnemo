import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.LOCAL_POSTGRES_URL
});

export async function POST() {
  try {
    const client = await pool.connect();

    // Create the enum types first
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE collection_item_type AS ENUM (
          'event', 'post', 'programme', 'news', 'team', 
          'innovation', 'award', 'publication', 'prize', 'partner'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE collection_item_status AS ENUM ('published', 'draft');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create the collectionItem table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "collectionItem" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type collection_item_type NOT NULL,
        status collection_item_status NOT NULL,
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        data JSONB
      )
    `);

    client.release();

    return NextResponse.json({
      success: true,
      message: 'collectionItem table created successfully'
    });
  } catch (error) {
    console.error('Error creating collectionItem table:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create collectionItem table' },
      { status: 500 }
    );
  }
}
