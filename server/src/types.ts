// Shapes shared between the sync layer, the store, and the HTTP routes.

export interface Product {
  id: string;
  retailerId: string | null;
  name: string;
  description: string | null;
  priceAmount: number | null;
  currency: string | null;
  availability: string | null;
  visibility: string | null;
  imageUrl: string | null;
  additionalImageUrls: string[];
  productUrl: string | null;
  brand: string | null;
  category: string | null;
}

export interface Collection {
  id: string;
  name: string;
  /** Cached machine translation of `name` into config.translate.targetLang, if available. */
  nameAr?: string | null;
  productCount: number;
  productIds: string[];
}

/** One product plus the collections it belongs to, as served to the storefront. */
export type CatalogProduct = Product & {
  collectionIds: string[];
  nameAr?: string | null;
  descriptionAr?: string | null;
};

export interface SyncState {
  lastRunAt: string | null;
  lastStatus: string;
  lastError: string | null;
  productCount: number | null;
  source: string | null;
}

/** The full catalog snapshot a sync produces, before it is written to the cache. */
export interface CatalogSnapshot {
  products: Product[];
  collections: Collection[];
  source: "meta" | "mock";
}
