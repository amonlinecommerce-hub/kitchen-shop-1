# Kitchen Shop

A single-shop storefront. One Node process serves the built web app **and** the API.
Shoppers browse collections, add to a cart, and "Buy now" opens WhatsApp with a
detailed order pre-filled to the shop's business number.

## How it works

```
Meta Commerce Catalog  ──(cron sync)──▶  SQLite cache  ──▶  /api/catalog  ──▶  web storefront
(source of truth,                        (server/data/                          (cart in localStorage)
 collections = product sets)              catalog.sqlite)                             │
                                                                                     ▼
                                                                    wa.me/<number>?text=<order>
```

- **Collections** are Meta **product sets** (curated in the WhatsApp Business app).
- With **no Meta credentials**, the server serves a bundled **mock catalog** so it runs offline.
- Checkout is **click-to-chat only** — no WhatsApp API, no server-side orders.

## Run it

```bash
npm install

# optional: real shop config / Meta catalog
cp server/.env.example server/.env   # edit SHOP_* and META_* as needed

npm run dev        # server on :8787, web dev server on :5173 (proxies /api)
```

Production (single origin):

```bash
npm run build      # builds web/dist
npm start --workspace=server   # serves web/dist + /api on :8787
```

## API

| Method | Path           | Notes                                                        |
| ------ | -------------- | ----------------------------------------------------------- |
| GET    | `/api/config`  | Shop name, currency, locale, WhatsApp number, sync status.   |
| GET    | `/api/catalog` | `{ collections, products, syncedAt, source }`.               |
| POST   | `/api/sync`    | Force a catalog sync. Auth: `Authorization: Bearer $SYNC_SECRET`. |
| GET    | `/api/health`  | `{ ok: true }`.                                              |

## Configuration (`server/.env`)

| Var                    | Default                | Purpose                                            |
| ---------------------- | ---------------------- | ------------------------------------------------- |
| `PORT`                 | `8787`                 | HTTP port.                                         |
| `DATABASE_FILE`        | `./data/catalog.sqlite`| SQLite cache location.                             |
| `META_CATALOG_ID`      | –                      | Meta catalog id. Blank + token blank ⇒ mock mode.  |
| `META_ACCESS_TOKEN`    | –                      | Meta Graph API token with catalog read access.    |
| `META_GRAPH_VERSION`   | `v21.0`                | Graph API version.                                 |
| `SYNC_CRON`            | `*/15 * * * *`         | Catalog refresh schedule.                          |
| `SYNC_SECRET`          | `change-me`            | Bearer secret for `POST /api/sync`.               |
| `SHOP_NAME`            | `Kitchen Equipment`    | Storefront title.                                  |
| `SHOP_CURRENCY`        | `USD`                  | ISO currency for price formatting.                 |
| `SHOP_LOCALE`          | `en`                   | Locale for number/date formatting.                 |
| `SHOP_WHATSAPP_NUMBER` | –                      | Business number, digits only, international format. |
| `CORS_ORIGINS`         | `http://localhost:5173`| Allowed API origins (comma-separated).             |
