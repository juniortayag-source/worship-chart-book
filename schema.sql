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

-- One row per Sunday date (the id IS the date, e.g. "2026-11-08"), holding
-- who said they're available that day. Independent of the `sundays` table —
-- a date can have availability marked before anyone has built a set for it.
CREATE TABLE IF NOT EXISTS availability (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL
);
