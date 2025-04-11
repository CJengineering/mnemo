

export default {
  schema: './lib/db.ts', // ⬅️ update this if your schema file is somewhere else
  out: './drizzle/migrations',
  driver: 'pg',
  dialect: 'postgresql',
  dbCredentials: {
    host: '/cloudsql/cj-tech-381914:europe-west1:mnemo',
    port: '5432',
    user: 'mnemo_db',
    database: 'mnemo_db',
    password: 'simpleTestPassword2025',
    ssl: 'false',
  }
};
