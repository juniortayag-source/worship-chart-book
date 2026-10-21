-- Run this once against your Postgres database before first use.
-- Each table is a simple { id, data jsonb } document store, matching the
-- shape the app's API routes read and write.

CREATE TABLE IF NOT EXISTS songs (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS sundays (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL
);
