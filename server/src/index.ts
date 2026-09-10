import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import cron from "node-cron";
import { config } from "./config.ts";
import { api } from "./routes.ts";
import { getSyncState } from "./db/store.ts";
import { runSync } from "./meta/sync.ts";

const here = dirname(fileURLToPath(import.meta.url));
const webDist = resolve(here, "../../web/dist");

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

app.use("/api", api);

// Serve the built storefront, with SPA fallback for client-side routes.
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(join(webDist, "index.html"));
  });
} else {
  console.warn(`[web] ${webDist} not found — run "npm run build" to serve the storefront`);
}

async function bootstrapCatalog(): Promise<void> {
  const state = getSyncState();
  const stale = state.lastStatus !== "ok";
  if (stale) {
    console.log("[sync] no good cached catalog — running initial sync");
    await runSync().catch(() => undefined);
  } else {
    console.log(`[sync] using cached catalog from ${state.lastRunAt} (${state.source})`);
    runSync().catch(() => undefined); // refresh in the background
  }
}

app.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
  console.log(`[server] catalog mode: ${config.meta.enabled ? "meta" : "mock"}`);
  if (config.syncSecret === "change-me") {
    console.warn('[server] SYNC_SECRET is still "change-me" — set a real value before exposing POST /api/sync');
  }
  void bootstrapCatalog();

  if (cron.validate(config.syncCron)) {
    cron.schedule(config.syncCron, () => {
      runSync().catch(() => undefined);
    });
    console.log(`[sync] scheduled: ${config.syncCron}`);
  } else {
    console.warn(`[sync] invalid SYNC_CRON "${config.syncCron}" — scheduled sync disabled`);
  }
});
