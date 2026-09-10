// EN -> target-language translation for dynamic catalog text.
// Prefers the browser's own on-device translator (Chrome 138+ `Translator`, or the
// older experimental `translation` API). Falls back to the server's cached free
// provider only when the browser can't do it. Results cached in localStorage.

const CACHE_KEY = "kitchen-shop.tr.v1";

type Cache = Record<string, Record<string, string>>;

function loadCache(): Cache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Cache) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Cache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage full / unavailable — translations just won't persist
  }
}

interface BrowserTranslator {
  translate: (text: string) => Promise<string>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function createBrowserTranslator(to: string): Promise<BrowserTranslator | null> {
  const g = globalThis as any;
  try {
    if (g.Translator?.availability) {
      const status: string = await g.Translator.availability({
        sourceLanguage: "en",
        targetLanguage: to,
      });
      if (status === "available" || status === "downloadable" || status === "downloading") {
        return (await g.Translator.create({
          sourceLanguage: "en",
          targetLanguage: to,
        })) as BrowserTranslator;
      }
      return null;
    }
    if (g.translation?.createTranslator) {
      const can: string = g.translation.canTranslate
        ? await g.translation.canTranslate({ sourceLanguage: "en", targetLanguage: to })
        : "readily";
      if (can !== "no") {
        return (await g.translation.createTranslator({
          sourceLanguage: "en",
          targetLanguage: to,
        })) as BrowserTranslator;
      }
    }
  } catch {
    // fall back to the server
  }
  return null;
}

export function browserOffersTranslation(): boolean {
  const g = globalThis as any;
  return Boolean(g.Translator?.availability || g.translation?.createTranslator);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const translators = new Map<string, Promise<BrowserTranslator | null>>();

function browserTranslator(to: string): Promise<BrowserTranslator | null> {
  let p = translators.get(to);
  if (!p) {
    p = createBrowserTranslator(to);
    translators.set(to, p);
  }
  return p;
}

async function serverTranslate(texts: string[], to: string): Promise<Record<string, string>> {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, q: texts }),
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { translations?: Record<string, string> };
    return data.translations ?? {};
  } catch {
    return {};
  }
}

/** Translate `texts` into `to`; returns source -> translation for everything handled. */
export async function translateBatch(texts: string[], to: string): Promise<Record<string, string>> {
  const unique = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
  const cache = loadCache();
  const known = { ...(cache[to] ?? {}) };
  const missing = unique.filter((t) => !(t in known));
  if (missing.length === 0) return known;

  const fresh: Record<string, string> = {};
  const translator = await browserTranslator(to);

  if (translator) {
    await Promise.all(
      missing.map(async (text) => {
        try {
          const out = (await translator.translate(text)).trim();
          if (out && out.toLowerCase() !== text.toLowerCase()) fresh[text] = out;
        } catch {
          // leave this string in English
        }
      }),
    );
  } else {
    Object.assign(fresh, await serverTranslate(missing, to));
  }

  const merged = { ...known, ...fresh };
  cache[to] = merged;
  saveCache(cache);
  return merged;
}
