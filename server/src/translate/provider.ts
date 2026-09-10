// Free machine-translation backend. Currently MyMemory (no API key, CORS-friendly,
// ~5k words/day per IP anonymously, more with an email).

import { config } from "../config.ts";

const ENDPOINT = "https://api.mymemory.translated.net/get";
const QUOTA_MARKER = /MYMEMORY WARNING|QUOTA|USAGE LIMIT|INVALID/i;

interface MyMemoryResponse {
  responseStatus?: number | string;
  responseData?: { translatedText?: string };
}

/** Translate one short string. Returns null on any failure so callers can fall back to the source. */
export async function translateOne(
  text: string,
  from: string,
  to: string,
): Promise<string | null> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${from}|${to}`);
  if (config.translate.email) url.searchParams.set("de", config.translate.email);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as MyMemoryResponse;
    if (Number(body.responseStatus) !== 200) return null;
    const out = body.responseData?.translatedText?.trim();
    if (!out || QUOTA_MARKER.test(out)) return null;
    // MyMemory echoes the input back when it has no translation.
    if (out.toLowerCase() === text.trim().toLowerCase()) return null;
    return out;
  } catch {
    return null;
  }
}
