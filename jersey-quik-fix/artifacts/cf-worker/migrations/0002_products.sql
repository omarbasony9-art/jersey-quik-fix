-- ── Products table ────────────────────────────────────────────────────────────
-- Schema mirrors the PostgreSQL products table so the ShopPage mapping works
-- without changes. Prices stored in DOLLARS (REAL).
CREATE TABLE IF NOT EXISTS products (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  sku               TEXT NOT NULL UNIQUE,
  category          TEXT NOT NULL DEFAULT '',
  subcategory       TEXT,
  description       TEXT NOT NULL DEFAULT '',
  price             REAL NOT NULL DEFAULT 0,         -- dollars
  old_price         REAL,
  price_note        TEXT,
  condition         TEXT,
  stock             INTEGER NOT NULL DEFAULT 1,
  images            TEXT NOT NULL DEFAULT '[]',      -- JSON array of URLs
  badge             TEXT,
  rating            REAL,
  active            INTEGER NOT NULL DEFAULT 1,      -- boolean; ShopPage filters on this
  featured          INTEGER NOT NULL DEFAULT 0,
  verified          INTEGER NOT NULL DEFAULT 0,
  verification_note TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Product images metadata table ─────────────────────────────────────────────
-- Tracks images uploaded to R2 so admin list endpoint works without R2 list().
CREATE TABLE IF NOT EXISTS product_images (
  filename    TEXT PRIMARY KEY,
  url         TEXT NOT NULL,
  size        INTEGER NOT NULL DEFAULT 0,
  mime_type   TEXT NOT NULL DEFAULT 'image/jpeg',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
