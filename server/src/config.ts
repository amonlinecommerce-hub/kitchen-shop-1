// Central environment parsing. Import this instead of reading process.env directly.

function str(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing required env var ${name}`);
  return value;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const metaCatalogId = process.env.META_CATALOG_ID?.trim() ?? "";
const metaAccessToken = process.env.META_ACCESS_TOKEN?.trim() ?? "";

export const config = {
  port: int("PORT", 8787),
  databaseFile: str("DATABASE_FILE", "./data/catalog.sqlite"),

  meta: {
    catalogId: metaCatalogId,
    accessToken: metaAccessToken,
    graphVersion: str("META_GRAPH_VERSION", "v21.0"),
    /** When false the server seeds and serves the bundled mock catalog. */
    enabled: Boolean(metaCatalogId && metaAccessToken),
  },

  syncCron: str("SYNC_CRON", "*/15 * * * *"),
  syncSecret: str("SYNC_SECRET", "change-me"),

  translate: {
    /** Free EN->target machine translation for catalog text. Set TRANSLATE_ENABLED=false to disable. */
    enabled: (process.env.TRANSLATE_ENABLED ?? "true").toLowerCase() !== "false",
    targetLang: str("TRANSLATE_TARGET_LANG", "ar"),
    /** Optional email — MyMemory raises the free daily word limit when it is provided. */
    email: process.env.TRANSLATE_EMAIL?.trim() ?? "",
  },

  shop: {
    name: str("SHOP_NAME", "Kitchen Equipment"),
    currency: str("SHOP_CURRENCY", "USD"),
    locale: str("SHOP_LOCALE", "en"),
    whatsappNumber: str("SHOP_WHATSAPP_NUMBER", "").replace(/[^\d]/g, ""),
  },

  corsOrigins: str("CORS_ORIGINS", "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export type Config = typeof config;
