// All SQL lives here. Everything above this layer works with the types from ../types.ts.

import { db } from "./index.ts";
import { config } from "../config.ts";
import type {
  CatalogProduct,
  CatalogSnapshot,
  Collection,
  Product,
  SyncState,
} from "../types.ts";

interface ProductRow {
  id: string;
  retailer_id: string | null;
  name: string;
  description: string | null;
  price_amount: number | null;
  currency: string | null;
  availability: string | null;
  visibility: string | null;
  image_url: string | null;
  additional_image_urls: string | null;
  product_url: string | null;
  brand: string | null;
  category: string | null;
}

function rowToProduct(row: ProductRow): Product {
  let additionalImageUrls: string[] = [];
  if (row.additional_image_urls) {
    try {
      const parsed: unknown = JSON.parse(row.additional_image_urls);
      if (Array.isArray(parsed)) additionalImageUrls = parsed.filter((v): v is string => typeof v === "string");
    } catch {
      // ignore malformed cache value
    }
  }
  return {
    id: row.id,
    retailerId: row.retailer_id,
    name: row.name,
    description: row.description,
    priceAmount: row.price_amount,
    currency: row.currency,
    availability: row.availability,
    visibility: row.visibility,
    imageUrl: row.image_url,
    additionalImageUrls,
    productUrl: row.product_url,
    brand: row.brand,
    category: row.category,
  };
}

const insertProduct = db.prepare(`
  INSERT INTO products (
    id, retailer_id, name, description, price_amount, currency, availability,
    visibility, image_url, additional_image_urls, product_url, brand, category, raw, synced_at
  ) VALUES (
    :id, :retailer_id, :name, :description, :price_amount, :currency, :availability,
    :visibility, :image_url, :additional_image_urls, :product_url, :brand, :category, :raw, :synced_at
  )
`);

const insertSet = db.prepare(`
  INSERT INTO product_sets (id, retailer_id, name, product_count, position, synced_at)
  VALUES (:id, :retailer_id, :name, :product_count, :position, :synced_at)
`);

const insertSetItem = db.prepare(`
  INSERT OR IGNORE INTO product_set_items (set_id, product_id, position)
  VALUES (:set_id, :product_id, :position)
`);

/** Replace the entire cached catalog in a single transaction. */
export function replaceCatalog(snapshot: CatalogSnapshot): void {
  const syncedAt = new Date().toISOString();
  const knownProductIds = new Set(snapshot.products.map((p) => p.id));

  db.exec("BEGIN");
  try {
    db.exec("DELETE FROM product_set_items");
    db.exec("DELETE FROM product_sets");
    db.exec("DELETE FROM products");

    for (const p of snapshot.products) {
      insertProduct.run({
        id: p.id,
        retailer_id: p.retailerId,
        name: p.name,
        description: p.description,
        price_amount: p.priceAmount,
        currency: p.currency,
        availability: p.availability,
        visibility: p.visibility,
        image_url: p.imageUrl,
        additional_image_urls: JSON.stringify(p.additionalImageUrls ?? []),
        product_url: p.productUrl,
        brand: p.brand,
        category: p.category,
        raw: null,
        synced_at: syncedAt,
      });
    }

    snapshot.collections.forEach((c, index) => {
      insertSet.run({
        id: c.id,
        retailer_id: null,
        name: c.name,
        product_count: c.productCount,
        position: index,
        synced_at: syncedAt,
      });
      c.productIds.forEach((productId, position) => {
        if (!knownProductIds.has(productId)) return;
        insertSetItem.run({ set_id: c.id, product_id: productId, position });
      });
    });

    db.prepare(`
      UPDATE sync_state
      SET last_run_at = :at, last_status = 'ok', last_error = NULL,
          product_count = :count, source = :source
      WHERE id = 1
    `).run({ at: syncedAt, count: snapshot.products.length, source: snapshot.source });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function recordSyncError(message: string): void {
  db.prepare(`
    UPDATE sync_state
    SET last_run_at = :at, last_status = 'error', last_error = :error
    WHERE id = 1
  `).run({ at: new Date().toISOString(), error: message });
}

export function getSyncState(): SyncState {
  const row = db.prepare(`
    SELECT last_run_at, last_status, last_error, product_count, source FROM sync_state WHERE id = 1
  `).get() as unknown as {
    last_run_at: string | null;
    last_status: string | null;
    last_error: string | null;
    product_count: number | null;
    source: string | null;
  };
  return {
    lastRunAt: row.last_run_at,
    lastStatus: row.last_status ?? "never",
    lastError: row.last_error,
    productCount: row.product_count,
    source: row.source,
  };
}

/** Only products that are published and can actually be bought are shown to shoppers. */
const VISIBLE_WHERE = `
  (visibility IS NULL OR visibility = 'published')
  AND (availability IS NULL OR availability NOT IN ('out of stock', 'discontinued'))
`;

// ---- translation cache ----------------------------------------------------

function placeholders(n: number): string {
  return Array.from({ length: n }, () => "?").join(", ");
}

/** Look up already-cached translations for the given source strings. */
export function getCachedTranslations(texts: string[], lang: string): Record<string, string> {
  const unique = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
  if (unique.length === 0) return {};
  const rows = db
    .prepare(
      `SELECT source_text, translated FROM translations
       WHERE target_lang = ? AND source_text IN (${placeholders(unique.length)})`,
    )
    .all(lang, ...unique) as unknown as { source_text: string; translated: string }[];
  const out: Record<string, string> = {};
  for (const row of rows) out[row.source_text] = row.translated;
  return out;
}

const upsertTranslation = db.prepare(`
  INSERT INTO translations (source_text, target_lang, translated, updated_at)
  VALUES (:source, :lang, :translated, :at)
  ON CONFLICT (source_text, target_lang)
  DO UPDATE SET translated = excluded.translated, updated_at = excluded.updated_at
`);

export function putTranslations(map: Record<string, string>, lang: string): void {
  const at = new Date().toISOString();
  db.exec("BEGIN");
  try {
    for (const [source, translated] of Object.entries(map)) {
      upsertTranslation.run({ source, lang, translated, at });
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

/** SQL fragment + params to left-join a cached translation of `column` as `alias`. */
const TR_LANG = config.translate.targetLang;

export function listCollections(): Collection[] {
  const sets = db.prepare(`
    SELECT ps.id, ps.name, ps.product_count, tn.translated AS name_tr
    FROM product_sets ps
    LEFT JOIN translations tn ON tn.source_text = ps.name AND tn.target_lang = ?
    ORDER BY ps.position ASC, ps.name ASC
  `).all(TR_LANG) as unknown as {
    id: string;
    name: string;
    product_count: number | null;
    name_tr: string | null;
  }[];

  const items = db.prepare(`
    SELECT si.set_id, si.product_id
    FROM product_set_items si
    JOIN products p ON p.id = si.product_id
    WHERE ${VISIBLE_WHERE}
    ORDER BY si.position ASC
  `).all() as unknown as { set_id: string; product_id: string }[];

  const bySet = new Map<string, string[]>();
  for (const item of items) {
    const list = bySet.get(item.set_id) ?? [];
    list.push(item.product_id);
    bySet.set(item.set_id, list);
  }

  return sets
    .map((s) => {
      const productIds = bySet.get(s.id) ?? [];
      return {
        id: s.id,
        name: s.name,
        nameAr: s.name_tr,
        productCount: productIds.length,
        productIds,
      };
    })
    .filter((c) => c.productCount > 0);
}

export function listProducts(): CatalogProduct[] {
  const rows = db.prepare(`
    SELECT p.id, p.retailer_id, p.name, p.description, p.price_amount, p.currency, p.availability,
           p.visibility, p.image_url, p.additional_image_urls, p.product_url, p.brand, p.category,
           tn_name.translated AS name_tr,
           tn_desc.translated AS description_tr
    FROM products p
    LEFT JOIN translations tn_name ON tn_name.source_text = p.name AND tn_name.target_lang = ?
    LEFT JOIN translations tn_desc ON tn_desc.source_text = p.description AND tn_desc.target_lang = ?
    WHERE ${VISIBLE_WHERE}
    ORDER BY p.name ASC
  `).all(TR_LANG, TR_LANG) as unknown as (ProductRow & {
    name_tr: string | null;
    description_tr: string | null;
  })[];

  const membership = db.prepare(`
    SELECT set_id, product_id FROM product_set_items
  `).all() as unknown as { set_id: string; product_id: string }[];

  const byProduct = new Map<string, string[]>();
  for (const m of membership) {
    const list = byProduct.get(m.product_id) ?? [];
    list.push(m.set_id);
    byProduct.set(m.product_id, list);
  }

  return rows.map((row) => ({
    ...rowToProduct(row),
    collectionIds: byProduct.get(row.id) ?? [],
    nameAr: row.name_tr,
    descriptionAr: row.description_tr,
  }));
}
