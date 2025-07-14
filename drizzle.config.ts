import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: '/cloudsql/cj-tech-381914:europe-west1:mnemo',
    port: 5432,
    user: 'mnemo_db',
    database: 'mnemo_db',
    password: 'simpleTestPassword2025',
    ssl: false
  }
});
