# Sallatona Onsouq

An online shop that shows products from a **WhatsApp Business / Meta catalog**.
Shoppers browse, add items to a cart, and press **Buy now** — WhatsApp opens with
the full order already written, ready to send.

No payments, no accounts, no database to manage. Just a catalog and WhatsApp.

## Features

- 🛒 Products and collections loaded automatically from your Meta catalog
- 🔎 Search, sort, and filter by price
- 🌍 English and Arabic
- 💬 Checkout through WhatsApp
- 🎬 Promo video banner and Sallatona logo
- 🧪 Works offline with sample products if no Meta account is connected

## Quick start

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm run dev
```

Then open **http://localhost:5173**.

That's it — without any settings it runs with sample products.

## Connect your real catalog

1. Copy the example settings file:

   ```bash
   cp .env.example server/.env
   ```

2. Open `server/.env` and fill in:

   | Setting                | What to put                                         |
   | ---------------------- | --------------------------------------------------- |
   | `META_CATALOG_ID`      | Your catalog ID (Commerce Manager → Settings)       |
   | `META_ACCESS_TOKEN`    | A Meta access token that can read the catalog       |
   | `SHOP_CURRENCY`        | e.g. `MAD`, `USD`, `LBP`                            |
   | `SYNC_SECRET`          | Any long random password                            |

3. Restart with `npm run dev`. The catalog refreshes every 15 minutes.

> 🔒 `server/.env` holds your secrets and is **never** uploaded to GitHub.

## Change the branding

Everything is in one file: [`web/src/brand.ts`](web/src/brand.ts)

- `name` — shop name
- `logoSrc` — logo image (put files in `web/public/`)
- `heroVideo` — banner video
- `orderWhatsapp` — the WhatsApp number that receives orders
- Instagram, Facebook, and contact email links

Colors are at the top of [`web/src/styles.css`](web/src/styles.css).

## Put it online

```bash
npm run build
npm start --workspace=server
```

This runs everything (website + API) on port **8787**.

## Project folders

```
server/   Node + Express API — syncs the Meta catalog, translates to Arabic
web/      React website (Vite)
  public/   logo, video, and other images
  src/      pages, components, branding, translations
```

## Useful commands

| Command         | What it does                         |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the site for development       |
| `npm run build` | Build the website for production     |
| `npm run lint`  | Check the code for type errors       |
| `npm test`      | Run the tests                        |
