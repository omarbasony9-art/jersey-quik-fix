-- ── Products table ────────────────────────────────────────────────────────────
-- Prices stored in DOLLARS (REAL) for simplicity.
-- Public API returns dollars; admin API normalises to cents on the way out.
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,                    -- UUID
  name        TEXT NOT NULL,
  sku         TEXT NOT NULL UNIQUE,
  category    TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price       REAL NOT NULL DEFAULT 0,             -- dollars
  images      TEXT NOT NULL DEFAULT '[]',          -- JSON array of URLs
  in_stock    INTEGER NOT NULL DEFAULT 1,          -- boolean
  featured    INTEGER NOT NULL DEFAULT 0,          -- boolean
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Product images metadata table ─────────────────────────────────────────────
-- Tracks every image uploaded to R2 so the admin list endpoint works without
-- calling R2 list (which requires list permissions and is slower).
CREATE TABLE IF NOT EXISTS product_images (
  filename    TEXT PRIMARY KEY,
  url         TEXT NOT NULL,
  size        INTEGER NOT NULL DEFAULT 0,
  mime_type   TEXT NOT NULL DEFAULT 'image/jpeg',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
