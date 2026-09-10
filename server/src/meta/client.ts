// Thin wrapper over the Meta Graph API. Only the read paths the sync needs.

import { config } from "../config.ts";

const GRAPH_BASE = "https://graph.facebook.com";

interface Paged<T> {
  data: T[];
  paging?: { next?: string; cursors?: { after?: string } };
}

interface GraphError {
  error?: { message?: string; type?: string; code?: number };
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  const body = (await response.json().catch(() => ({}))) as T & GraphError;
  if (!response.ok || body.error) {
    const message = body.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Meta Graph API error: ${message}`);
  }
  return body;
}

/** Follow `paging.next` until the collection is exhausted. */
async function getAllPages<T>(firstUrl: string): Promise<T[]> {
  const out: T[] = [];
  let url: string | undefined = firstUrl;
  let guard = 0;
  while (url && guard++ < 1000) {
    const page: Paged<T> = await getJson<Paged<T>>(url);
    out.push(...page.data);
    url = page.paging?.next;
  }
  return out;
}

function endpoint(path: string, params: Record<string, string>): string {
  const url = new URL(`${GRAPH_BASE}/${config.meta.graphVersion}/${path}`);
  url.searchParams.set("access_token", config.meta.accessToken);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

export interface MetaProduct {
  id: string;
  retailer_id?: string;
  name?: string;
  description?: string;
  price?: string | number; // formatted ("5,400.00 MAD") or bare number, depending on the field
  currency?: string;
  availability?: string;
  visibility?: string;
  image_url?: string;
  additional_image_urls?: string[];
  url?: string;
  brand?: string;
  category?: string;
}

export interface MetaProductSet {
  id: string;
  name?: string;
  product_count?: number;
  retailer_id?: string;
}

const PRODUCT_FIELDS = [
  "id",
  "retailer_id",
  "name",
  "description",
  "price",
  "currency",
  "availability",
  "visibility",
  "image_url",
  "additional_image_urls",
  "url",
  "brand",
  "category",
].join(",");

export function fetchProducts(): Promise<MetaProduct[]> {
  return getAllPages<MetaProduct>(
    endpoint(`${config.meta.catalogId}/products`, { fields: PRODUCT_FIELDS, limit: "100" }),
  );
}

export function fetchProductSets(): Promise<MetaProductSet[]> {
  return getAllPages<MetaProductSet>(
    endpoint(`${config.meta.catalogId}/product_sets`, {
      fields: "id,name,product_count,retailer_id",
      limit: "100",
    }),
  );
}

/** Product ids belonging to a set, in the order Meta returns them. */
export function fetchProductSetItems(setId: string): Promise<string[]> {
  return getAllPages<{ id: string }>(
    endpoint(`${setId}/products`, { fields: "id", limit: "100" }),
  ).then((rows) => rows.map((r) => r.id));
}
