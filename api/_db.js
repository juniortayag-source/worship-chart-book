// Shared Postgres connection helper for every API route.
//
// Uses the plain `pg` driver against a DATABASE_URL connection string, so it
// works with any Postgres provider (Neon, Supabase, Railway, Vercel's own
// Postgres marketplace integration, or a self-hosted instance) without
// depending on a vendor-specific SDK. `max: 1` keeps each serverless
// function instance to a single connection, which is the safe default for
// short-lived serverless invocations.
const { Pool } = require("pg");

let pool;
function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set. See README.md for setup.");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
  }
  return pool;
}

// Every row in both tables is just { id, data jsonb }. Flattening here keeps
// the shape identical to what the front-end already expects: { id, ...data }.
function rowToDoc(row) {
  return Object.assign({ id: row.id }, row.data);
}

module.exports = { getPool, rowToDoc };
