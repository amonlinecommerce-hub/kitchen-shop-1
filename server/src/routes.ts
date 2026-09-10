import { Router, type Request, type Response } from "express";
import { config } from "./config.ts";
import { getSyncState, listCollections, listProducts } from "./db/store.ts";
import { runSync } from "./meta/sync.ts";
import { translateTexts } from "./translate/index.ts";

export const api = Router();

api.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

api.get("/config", (_req: Request, res: Response) => {
  const sync = getSyncState();
  res.json({
    shop: {
      name: config.shop.name,
      currency: config.shop.currency,
      locale: config.shop.locale,
      whatsappNumber: config.shop.whatsappNumber,
    },
    catalog: {
      source: sync.source,
      lastSyncAt: sync.lastRunAt,
      status: sync.lastStatus,
    },
    translate: {
      enabled: config.translate.enabled,
      targetLang: config.translate.targetLang,
    },
    languages: config.translate.enabled ? ["en", config.translate.targetLang] : ["en"],
  });
});

api.get("/catalog", (_req: Request, res: Response) => {
  const sync = getSyncState();
  res.json({
    collections: listCollections(),
    products: listProducts(),
    syncedAt: sync.lastRunAt,
    source: sync.source,
  });
});

/**
 * Client-side fallback translation. The storefront calls this only when the
 * browser's own translation isn't available. Cache-backed, so repeat shoppers
 * and repeat strings don't re-hit the provider.
 */
api.post("/translate", async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as { to?: unknown; q?: unknown };
  const to = typeof body.to === "string" && body.to ? body.to : config.translate.targetLang;
  const q = Array.isArray(body.q) ? body.q.filter((x): x is string => typeof x === "string") : [];
  if (!config.translate.enabled || q.length === 0) {
    res.json({ translations: {} });
    return;
  }
  try {
    res.json({ translations: await translateTexts(q, to) });
  } catch {
    res.json({ translations: {} });
  }
});

function authorized(req: Request): boolean {
  const header = req.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  const provided = bearer ?? (typeof req.query.secret === "string" ? req.query.secret : null);
  return provided !== null && provided === config.syncSecret;
}

api.post("/sync", async (req: Request, res: Response) => {
  if (!authorized(req)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  try {
    await runSync();
    res.json({ ok: true, state: getSyncState() });
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      state: getSyncState(),
    });
  }
});
