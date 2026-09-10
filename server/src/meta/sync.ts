// Pulls the catalog from Meta (or falls back to the mock) and writes it to the SQLite cache.

import { config } from "../config.ts";
import { recordSyncError, replaceCatalog } from "../db/store.ts";
import { mockSnapshot } from "../mock/catalog.ts";
import { warmCatalogTranslations } from "../translate/index.ts";
import type { CatalogSnapshot, Collection, Product } from "../types.ts";
import {
  fetchProducts,
  fetchProductSetItems,
  fetchProductSets,
  type MetaProduct,
} from "./client.ts";

/** Parse Meta's price, e.g. "5,400.00 MAD", "5 400,00" or a bare number, into major units. */
export function parsePriceAmount(raw: string | number | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const cleaned = raw.replace(/[^\d.,]/g, "").trim();
  if (!cleaned) return null;

  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  let normalized: string;
  if (lastDot === -1 && lastComma === -1) {
    normalized = cleaned;
  } else if (lastComma > lastDot) {
    // comma is the decimal separator
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // dot is the decimal separator
    normalized = cleaned.replace(/,/g, "");
  }
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseCurrency(raw: string | number | undefined, fallback: string | undefined): string | null {
  const code = typeof raw === "string" ? raw.match(/[A-Za-z]{3}/)?.[0] : undefined;
  return (code ?? fallback ?? null)?.toUpperCase() ?? null;
}

function mapProduct(node: MetaProduct): Product {
  return {
    id: node.id,
    retailerId: node.retailer_id ?? null,
    name: node.name ?? "(unnamed)",
    description: node.description ?? null,
    priceAmount: parsePriceAmount(node.price),
    currency: parseCurrency(node.price, node.currency),
    availability: node.availability ?? null,
    visibility: node.visibility ?? null,
    imageUrl: node.image_url ?? null,
    additionalImageUrls: Array.isArray(node.additional_image_urls) ? node.additional_image_urls : [],
    productUrl: node.url ?? null,
    brand: node.brand ?? null,
    category: node.category ?? null,
  };
}

async function fetchMetaSnapshot(): Promise<CatalogSnapshot> {
  const [metaProducts, metaSets] = await Promise.all([fetchProducts(), fetchProductSets()]);
  const products = metaProducts.map(mapProduct);

  const collections: Collection[] = [];
  for (const set of metaSets) {
    const productIds = await fetchProductSetItems(set.id);
    collections.push({
      id: set.id,
      name: set.name ?? "Collection",
      productCount: set.product_count ?? productIds.length,
      productIds,
    });
  }

  return { products, collections, source: "meta" };
}

let running: Promise<CatalogSnapshot> | null = null;

async function doSync(): Promise<CatalogSnapshot> {
  try {
    const snapshot = config.meta.enabled ? await fetchMetaSnapshot() : mockSnapshot();
    replaceCatalog(snapshot);
    console.log(
      `[sync] ok — ${snapshot.products.length} products, ${snapshot.collections.length} collections (${snapshot.source})`,
    );
    // Best-effort: pre-fill the translation cache in the background.
    void warmCatalogTranslations();
    return snapshot;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    recordSyncError(message);
    console.error(`[sync] failed — ${message}`);
    throw error;
  }
}

/** Run one sync. Concurrent callers share the in-flight run. */
export function runSync(): Promise<CatalogSnapshot> {
  if (running) return running;
  const current = doSync();
  running = current;
  // Clear the guard once settled. Scheduled as a microtask, so it always runs
  // after `running` has been assigned, even when doSync resolves synchronously.
  void current.then(
    () => {
      if (running === current) running = null;
    },
    () => {
      if (running === current) running = null;
    },
  );
  return current;
}
