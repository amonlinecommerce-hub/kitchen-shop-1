export interface ShopConfig {
  shop: { name: string; currency: string; locale: string; whatsappNumber: string };
  catalog: { source: string | null; lastSyncAt: string | null; status: string };
  translate: { enabled: boolean; targetLang: string };
  languages: string[];
}

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
  collectionIds: string[];
  /** Server-cached translation into the shop's target language, when available. */
  nameAr?: string | null;
  descriptionAr?: string | null;
}

export interface Collection {
  id: string;
  name: string;
  nameAr?: string | null;
  productCount: number;
  productIds: string[];
}

export interface Catalog {
  collections: Collection[];
  products: Product[];
  syncedAt: string | null;
  source: string | null;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${path} -> HTTP ${response.status}`);
  return (await response.json()) as T;
}

export const fetchConfig = () => getJson<ShopConfig>("/api/config");
export const fetchCatalog = () => getJson<Catalog>("/api/catalog");
