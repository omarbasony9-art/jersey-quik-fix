-- Jersey Quik Fix — D1/SQLite schema
-- Migrated from PostgreSQL.  Key type mappings:
--   text / uuid         → TEXT
--   serial              → INTEGER PRIMARY KEY AUTOINCREMENT
--   boolean             → INTEGER (0 = false, 1 = true)
--   timestamp           → TEXT (ISO-8601 stored via datetime('now'))
--   decimal / numeric   → REAL
--   jsonb               → TEXT (JSON string)

-- ── repair_tickets ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repair_tickets (
  id          TEXT    PRIMARY KEY NOT NULL,
  ticket      TEXT    NOT NULL UNIQUE,
  category    TEXT    NOT NULL,
  brand       TEXT    NOT NULL,
  model       TEXT    NOT NULL,
  issue       TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  phone       TEXT    NOT NULL,
  email       TEXT    NOT NULL DEFAULT '',
  date        TEXT    NOT NULL DEFAULT '',
  status      TEXT    NOT NULL DEFAULT 'Checked In',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── trade_inquiries ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade_inquiries (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  name               TEXT    NOT NULL,
  email              TEXT    NOT NULL,
  phone              TEXT    NOT NULL,
  device_type        TEXT    NOT NULL,
  device_description TEXT    NOT NULL,
  condition          TEXT    NOT NULL,
  notes              TEXT,
  status             TEXT    NOT NULL DEFAULT 'New',
  created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── email_subscribers ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_subscribers (
  id          TEXT PRIMARY KEY NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL DEFAULT '',
  source      TEXT NOT NULL DEFAULT 'website',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── membership_codes ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membership_codes (
  id                TEXT    PRIMARY KEY NOT NULL,
  email             TEXT    NOT NULL,
  user_id           TEXT,
  code              TEXT    NOT NULL UNIQUE,
  stripe_session_id TEXT    UNIQUE,
  discount_percent  INTEGER NOT NULL DEFAULT 10,
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at        TEXT    NOT NULL
);

-- ── cart_items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          TEXT    NOT NULL,
  product_id       TEXT    NOT NULL,
  product_name     TEXT    NOT NULL,
  product_category TEXT,
  price            REAL    NOT NULL,
  quantity         INTEGER NOT NULL DEFAULT 1,
  image            TEXT,
  sku              TEXT,
  badge            TEXT,
  created_at       TEXT    DEFAULT (datetime('now')),
  updated_at       TEXT    DEFAULT (datetime('now')),
  UNIQUE (user_id, product_id)
);

-- ── site_content ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_content (
  key         TEXT PRIMARY KEY NOT NULL,
  data        TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
