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

-- One row per logged action (song/Sunday added, edited, deleted; logins),
-- for the Activity Log — visible only to admin accounts (see api/_auth.js).
-- created_at is set by the database itself, not by the client, so the log
-- can't be backdated by whatever a request happens to send.
CREATE TABLE IF NOT EXISTS activity_log (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
