-- Local read-through cache of the Meta Commerce Catalog. Meta remains the source of truth;
-- rows here are replaced wholesale on every successful sync.

CREATE TABLE IF NOT EXISTS products (
  id                    TEXT PRIMARY KEY,          -- Meta product id
  retailer_id           TEXT,                      -- merchant SKU / content id
  name                  TEXT NOT NULL,
  description           TEXT,
  price_amount          REAL,                      -- major units, e.g. 5400.00
  currency              TEXT,
  availability          TEXT,                      -- 'in stock' | 'out of stock' | 'preorder' | ...
  visibility            TEXT,                      -- 'published' | 'staging'
  image_url             TEXT,
  additional_image_urls TEXT,                      -- JSON array of strings
  product_url           TEXT,
  brand                 TEXT,
  category              TEXT,
  raw                   TEXT,                      -- full JSON node from Meta, for debugging
  synced_at             TEXT NOT NULL              -- ISO timestamp of the sync that wrote this row
);

CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability);
CREATE INDEX IF NOT EXISTS idx_products_visibility ON products(visibility);

-- Collections, curated in the WhatsApp Business app and exposed by Meta as product sets.
CREATE TABLE IF NOT EXISTS product_sets (
  id            TEXT PRIMARY KEY,   -- Meta product set id
  retailer_id   TEXT,
  name          TEXT NOT NULL,
  product_count INTEGER,
  position      INTEGER,            -- display order, as returned by Meta
  synced_at     TEXT NOT NULL
);

-- Membership of products in a set. Rebuilt wholesale on every sync.
CREATE TABLE IF NOT EXISTS product_set_items (
  set_id     TEXT NOT NULL REFERENCES product_sets(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position   INTEGER,
  PRIMARY KEY (set_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_set_items_product ON product_set_items(product_id);

-- Machine-translation cache, keyed by source text. Survives catalog replacement
-- (translations are reusable as long as the English text is unchanged).
CREATE TABLE IF NOT EXISTS translations (
  source_text TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  translated  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (source_text, target_lang)
);

CREATE TABLE IF NOT EXISTS sync_state (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  last_run_at   TEXT,
  last_status   TEXT,      -- 'ok' | 'error'
  last_error    TEXT,
  product_count INTEGER,
  source        TEXT       -- 'meta' | 'mock'
);

INSERT OR IGNORE INTO sync_state (id, last_status) VALUES (1, 'never');
