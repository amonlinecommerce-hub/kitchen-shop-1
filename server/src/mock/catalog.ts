// Bundled demo catalog used whenever Meta credentials are not configured.
// Shaped exactly like a real sync result so the rest of the app cannot tell the difference.

import type { CatalogSnapshot, Collection, Product } from "../types.ts";

function img(seed: string): string {
  return `https://picsum.photos/seed/${seed}/700/700`;
}

function product(
  id: string,
  name: string,
  priceAmount: number,
  description: string,
  seed: string,
  brand: string,
): Product {
  return {
    id,
    retailerId: id,
    name,
    description,
    priceAmount,
    currency: "MAD",
    availability: "in stock",
    visibility: "published",
    imageUrl: img(seed),
    additionalImageUrls: [img(`${seed}-2`), img(`${seed}-3`)],
    productUrl: null,
    brand,
    category: "kitchen",
  };
}

const products: Product[] = [
  product("p-001", "Carbon Steel Wok 32cm", 480, "Hand-hammered carbon steel wok with a flat base for gas and induction.", "wok", "Zuzu"),
  product("p-002", "Cast Iron Skillet 26cm", 620, "Pre-seasoned cast iron skillet, oven-safe to 260°C.", "skillet", "Zuzu"),
  product("p-003", "Stainless Stock Pot 12L", 940, "Tri-ply base stock pot with tempered glass lid.", "stockpot", "Zuzu"),
  product("p-004", "Non-stick Frying Pan 28cm", 350, "PFOA-free non-stick coating, stay-cool handle.", "frypan", "Zuzu"),
  product("p-005", "Chef's Knife 20cm", 540, "German stainless steel, full tang, 58 HRC.", "chefknife", "Kaya"),
  product("p-006", "Paring Knife 9cm", 190, "Precision paring knife for trimming and peeling.", "paring", "Kaya"),
  product("p-007", "Acacia Cutting Board", 260, "End-grain acacia board, 40 × 30cm, with juice groove.", "board", "Kaya"),
  product("p-008", "Knife Sharpening Steel", 210, "25cm honing rod for weekly edge maintenance.", "steel", "Kaya"),
  product("p-009", "Stand Mixer 5.5L", 4200, "1000W tilt-head stand mixer with dough hook, whisk and beater.", "mixer", "Bahia"),
  product("p-010", "Immersion Blender Set", 890, "800W hand blender with whisk and 500ml chopper.", "blender", "Bahia"),
  product("p-011", "Digital Kitchen Scale 5kg", 150, "1g precision, tare function, folding display.", "scale", "Bahia"),
  product("p-012", "Pour-over Coffee Kettle 1L", 430, "Gooseneck spout, thermometer lid, works on induction.", "kettle", "Bahia"),
];

const collections: Collection[] = [
  {
    id: "c-cookware",
    name: "Cookware",
    productCount: 4,
    productIds: ["p-001", "p-002", "p-003", "p-004"],
  },
  {
    id: "c-knives",
    name: "Knives & Boards",
    productCount: 4,
    productIds: ["p-005", "p-006", "p-007", "p-008"],
  },
  {
    id: "c-appliances",
    name: "Small Appliances",
    productCount: 4,
    productIds: ["p-009", "p-010", "p-011", "p-012"],
  },
];

export function mockSnapshot(): CatalogSnapshot {
  return {
    products: products.map((p) => ({ ...p })),
    collections: collections.map((c) => ({ ...c, productIds: [...c.productIds] })),
    source: "mock",
  };
}
