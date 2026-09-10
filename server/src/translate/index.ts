// Cache-first catalog translation. Reads the SQLite cache, fills gaps from the
// free provider, writes results back. Callers get source-text -> translated-text.

import { config } from "../config.ts";
import { getCachedTranslations, listCollections, listProducts, putTranslations } from "../db/store.ts";
import { translateOne } from "./provider.ts";

const MAX_TEXT_LEN = 1500;
const MAX_BATCH = 200;
const CONCURRENCY = 3;

/** Run `worker` over `items` with a fixed number of parallel slots. */
async function pool<T>(items: T[], size: number, worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      if (item !== undefined) await worker(item);
    }
  });
  await Promise.all(runners);
}

/**
 * Translate `texts` into `lang` (defaults to the configured target). Returns a map
 * from every translatable source string to its translation. Missing/failed entries
 * are simply absent, so callers fall back to the source text.
 */
export async function translateTexts(
  texts: string[],
  lang: string = config.translate.targetLang,
): Promise<Record<string, string>> {
  if (!config.translate.enabled) return {};

  const wanted = [
    ...new Set(texts.map((t) => t.trim()).filter((t) => t.length > 0 && t.length <= MAX_TEXT_LEN)),
  ].slice(0, MAX_BATCH);
  if (wanted.length === 0) return {};

  const cached = getCachedTranslations(wanted, lang);
  const missing = wanted.filter((t) => !(t in cached));
  if (missing.length === 0) return cached;

  const fresh: Record<string, string> = {};
  await pool(missing, CONCURRENCY, async (text) => {
    const translated = await translateOne(text, "en", lang);
    if (translated) fresh[text] = translated;
  });

  if (Object.keys(fresh).length > 0) putTranslations(fresh, lang);
  return { ...cached, ...fresh };
}

/** Pre-translate the whole current catalog so the first shopper who switches language is fast. */
export async function warmCatalogTranslations(): Promise<void> {
  if (!config.translate.enabled) return;
  const texts = [
    ...listProducts().flatMap((p) => [p.name, p.description ?? ""]),
    ...listCollections().map((c) => c.name),
  ];
  try {
    const map = await translateTexts(texts);
    console.log(`[translate] ${config.translate.targetLang} cache warmed (${Object.keys(map).length} strings)`);
  } catch (error) {
    console.warn(`[translate] warm failed — ${error instanceof Error ? error.message : String(error)}`);
  }
}
