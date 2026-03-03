-- Cloudflare D1 schema
-- Run with: wrangler d1 execute projekti-im --file=schema.sql

CREATE TABLE IF NOT EXISTS users (
  id       TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Add your own tables below as your app grows.
-- Example:
-- CREATE TABLE IF NOT EXISTS posts (
--   id         TEXT PRIMARY KEY,
--   user_id    TEXT NOT NULL REFERENCES users(id),
--   title      TEXT NOT NULL,
--   body       TEXT NOT NULL,
--   created_at TEXT NOT NULL DEFAULT (datetime('now'))
-- );
