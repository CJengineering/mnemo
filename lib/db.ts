import 'server-only';

import { neon } from '@neondatabase/serverless';
//import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import {
  pgTable,
  text,
  numeric,
  integer,
  timestamp,
  pgEnum,
  serial,
  primaryKey,
  uuid,
  jsonb
} from 'drizzle-orm/pg-core';
import { count, eq, ilike } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';

const pool = new Pool({
  connectionString: process.env.LOCAL_POSTGRES_URL
});

// export const db = drizzle(neon(process.env.LOCAL_POSTGRES_URL!));
export const db = drizzle(pool);

export const statusEnum = pgEnum('status', ['active', 'inactive', 'archived']);
export const contentStatusEnum = pgEnum('content_status', [
  'draft',
  'published',
  'archived'
]);
export const collectionItemTypeEnum = pgEnum('collection_item_type', [
  'event',
  'post',
  'programme',
  'news',
  'team',
  'innovation',
  'award',
  'publication',
  'prize',
  'partner'
]);
export const collectionItemStatusEnum = pgEnum('collection_item_status', [
  'published',
  'draft'
]);

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  name: text('name').notNull(),
  status: statusEnum('status').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').notNull(),
  availableAt: timestamp('available_at').notNull()
});
export const programme = pgTable('programme', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  shortTitle: text('short_title'),
  acronym: text('acronym'),
  data: jsonb('data').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
export const content = pgTable('content', {
  id: serial('id').primaryKey(),
  programmeId: uuid('programme_id')
    .notNull()
    .references(() => programme.id, { onDelete: 'cascade' }), // Add reference to programme
  title: text('title').notNull(),
  description: text('description'),
  data: jsonb('data').notNull().default({}), // Store actual data (text, video URL, etc.)
  metaData: jsonb('meta_data').notNull().default({}), // Store metadata
  status: contentStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Table for storing individual data chunks (previously content_components)
export const dataChunks = pgTable('data_chunks', {
  id: serial('id').primaryKey(),
  programmeId: uuid('programme_id')
    .notNull()
    .references(() => programme.id, { onDelete: 'cascade' }), // Add reference to programme
  name: text('name').notNull(),
  type: text('type')
    .notNull()
    .$type<'text' | 'rich_text' | 'image' | 'video' | 'link'>(),
  metaData: jsonb('meta_data').notNull().default({}),
  data: jsonb('data').notNull(), // Store actual data (text, video URL, etc.)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Table for linking content entries to data chunks
export const contentDataChunkRelation = pgTable('content_data_chunk_relation', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id')
    .notNull()
    .references(() => content.id, { onDelete: 'cascade' }),
  dataChunkId: integer('data_chunk_id')
    .notNull()
    .references(() => dataChunks.id, { onDelete: 'cascade' }),
  metaData: jsonb('meta_data').notNull().default({}),
  data: jsonb('data').default({})
});
export const page = pgTable('page', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(), // URL-friendly string like "programme/events"
  data: jsonb('data').default({}), // flexible object (e.g., title, layout info)
  dataHtml: jsonb('data_html').default({}), // contains "rawHtml" and maybe more
  dataSeo: jsonb('data_seo').default({}), // SEO metadata like title/desc/og:image
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
export const programmeContent = pgTable(
  'programme_content',
  {
    programmeId: uuid('programme_id')
      .notNull()
      .references(() => programme.id, { onDelete: 'cascade' }),
    contentId: integer('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.programmeId, table.contentId] }) // ✅ Correct primary key definition
  })
);
export const programmeDataChunk = pgTable(
  'programme_data_chunk',
  {
    programmeId: uuid('programme_id')
      .notNull()
      .references(() => programme.id, { onDelete: 'cascade' }),
    dataChunkId: integer('data_chunk_id')
      .notNull()
      .references(() => dataChunks.id, { onDelete: 'cascade' })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.programmeId, table.dataChunkId] }) // ✅ Correct primary key definition
  })
);
export const collectionItem = pgTable('collectionItem', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: collectionItemTypeEnum('type').notNull(),
  status: collectionItemStatusEnum('status').notNull(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  data: jsonb('data')
});
export async function createDataChunk(
  name: string,
  type: 'text' | 'rich_text' | 'image' | 'video' | 'link',
  dataValue: any,
  programmeId: string
) {
  const [newChunk] = await db
    .insert(dataChunks)
    .values({
      name: name, // Provide a name for the data chunk
      type: type, // Ensure type is specified
      data: dataValue, // Fix: Use `data` instead of `text`
      programmeId: programmeId, // Fix: Ensure `programmeId` is included
      metaData: {} // Optional: Default empty metadata
    })
    .returning();

  return newChunk;
}

export async function linkDataChunkToContent(
  contentId: number,
  dataChunkId: number,
  metaData: any = {},
  data: any = {}
) {
  await db.insert(contentDataChunkRelation).values({
    contentId,
    dataChunkId,
    metaData, // ✅ Replaces position with metaData
    data // ✅ Allows storing extra data for this relation
  });
}
export async function getContentWithDataChunks(contentId: number) {
  return await db
    .select({
      contentTitle: content.title,
      contentDescription: content.description,
      dataChunkData: dataChunks.data, // ✅ Replaces text with data
      metaData: contentDataChunkRelation.metaData // ✅ Include metadata
    })
    .from(content)
    .leftJoin(
      contentDataChunkRelation,
      eq(content.id, contentDataChunkRelation.contentId)
    )
    .leftJoin(
      dataChunks,
      eq(contentDataChunkRelation.dataChunkId, dataChunks.id)
    )
    .where(eq(content.id, contentId));
}
export type SelectProduct = typeof products.$inferSelect;
export const insertProductSchema = createInsertSchema(products);

export async function getProducts(
  search: string,
  offset: number
): Promise<{
  products: SelectProduct[];
  newOffset: number | null;
  totalProducts: number;
}> {
  // Always search the full table, not per page
  if (search) {
    return {
      products: await db
        .select()
        .from(products)
        .where(ilike(products.name, `%${search}%`))
        .limit(1000),
      newOffset: null,
      totalProducts: 0
    };
  }

  if (offset === null) {
    return { products: [], newOffset: null, totalProducts: 0 };
  }

  let totalProducts = await db.select({ count: count() }).from(products);
  let moreProducts = await db.select().from(products).limit(5).offset(offset);
  let newOffset = moreProducts.length >= 5 ? offset + 5 : null;

  return {
    products: moreProducts,
    newOffset,
    totalProducts: totalProducts[0].count
  };
}

export async function deleteProductById(id: number) {
  await db.delete(products).where(eq(products.id, id));
}
