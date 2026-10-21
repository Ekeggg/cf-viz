import pg from 'pg';

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      handle_lower TEXT PRIMARY KEY,
      handle       TEXT NOT NULL,
      data         JSONB NOT NULL,
      fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS searches (
      id           SERIAL PRIMARY KEY,
      handle_lower TEXT NOT NULL,
      searched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS searches_handle_idx ON searches (handle_lower, searched_at DESC);
  `);
}
