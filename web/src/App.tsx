import { useEffect, useMemo, useState } from "react";
import { fetchCatalog, fetchConfig, type Catalog, type Product, type ShopConfig } from "./api";
import { BRAND } from "./brand";
import { isAllProductsSet, setIcon } from "./setIcons";
import { useCart } from "./cart";
import { configureFormatting } from "./format";
import { useI18n } from "./i18n";
import { CartDrawer } from "./components/CartDrawer";
import { ProductCard } from "./components/ProductCard";
import { ProductModal } from "./components/ProductModal";
import { SiteFooter } from "./components/SiteFooter";

const ALL = "__all__";

export function App() {
  const [config, setConfig] = useState<ShopConfig | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCollection, setActiveCollection] = useState<string>(ALL);
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const cart = useCart();
  const { lang, setLang, t, phrase, seed, ensure } = useI18n();

  useEffect(() => {
    Promise.all([fetchConfig(), fetchCatalog()])
      .then(([cfg, cat]) => {
        configureFormatting(cfg.shop.locale, cfg.shop.currency);
        setConfig(cfg);
        setCatalog(cat);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    document.title = BRAND.name;
  }, []);

  // Feed the server's already-cached translations straight into the dictionary.
  useEffect(() => {
    if (!catalog) return;
    const pairs: Record<string, string | null | undefined> = {};
    for (const p of catalog.products) {
      if (p.nameAr) pairs[p.name] = p.nameAr;
      if (p.description && p.descriptionAr) pairs[p.description] = p.descriptionAr;
    }
    for (const c of catalog.collections) if (c.nameAr) pairs[c.name] = c.nameAr;
    seed(pairs);
  }, [catalog, seed]);

  // Translate anything still missing once the shopper switches language.
  useEffect(() => {
    if (!catalog || lang === "en") return;
    // Shop name and brands are proper nouns — left as written.
    ensure([
      ...catalog.products.flatMap((p) => [p.name, p.description]),
      ...catalog.collections.map((c) => c.name),
    ]);
  }, [catalog, lang, ensure]);

  const sets = useMemo(
    () => (catalog ? catalog.collections.filter((c) => !isAllProductsSet(c.name)) : []),
    [catalog],
  );

  const visibleProducts = useMemo(() => {
    if (!catalog) return [];
    if (activeCollection === ALL) return catalog.products;
    return catalog.products.filter((p) => p.collectionIds.includes(activeCollection));
  }, [catalog, activeCollection]);

  if (error) {
    return (
      <div className="state">
        <h1>{t("wrong")}</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!config || !catalog) {
    return <div className="state">{t("loading")}</div>;
  }

  const canSwitchLanguage = config.languages.length > 1;

  return (
    <div className="app">
      <header className="header">
        <div className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              {/* Round slot for the marketplace logo — drop the image into BRAND.logoSrc. */}
              <span className="brand-logo">
                {BRAND.logoSrc ? (
                  <img src={BRAND.logoSrc} alt={BRAND.name} />
                ) : (
                  BRAND.name.charAt(0)
                )}
              </span>
              <span className="brand-name">{BRAND.name}</span>
            </div>
            <div className="header-actions">
              {canSwitchLanguage && (
                <button
                  className="lang-toggle"
                  onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                  aria-label="Switch language"
                >
                  {t("switchLang")}
                </button>
              )}
              <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={t("cart")}>
                <span>{t("cart")}</span>
                {cart.count > 0 && <span className="cart-badge">{cart.count}</span>}
              </button>
            </div>
          </div>
        </div>
        <nav className="set-nav" aria-label="Collections">
          <button
            className={activeCollection === ALL ? "set-item set-item-active" : "set-item"}
            onClick={() => setActiveCollection(ALL)}
          >
            <span className="set-icon set-icon-all" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="8" height="8" rx="2" />
                <rect x="13" y="3" width="8" height="8" rx="2" />
                <rect x="3" y="13" width="8" height="8" rx="2" />
                <rect x="13" y="13" width="8" height="8" rx="2" />
              </svg>
            </span>
            <span className="set-label">{t("all")}</span>
          </button>
          {sets.map((c) => {
            const icon = setIcon(c.name);
            const label = phrase(c.name);
            return (
              <button
                key={c.id}
                className={activeCollection === c.id ? "set-item set-item-active" : "set-item"}
                onClick={() => setActiveCollection(c.id)}
              >
                <span className="set-icon">
                  {icon ? <img src={icon} alt="" /> : label.charAt(0)}
                </span>
                <span className="set-label">
                  {label}
                  <span className="set-count">{c.productCount}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="catalog">
        {visibleProducts.length === 0 ? (
          <p className="state">{t("noProducts")}</p>
        ) : (
          <div className="grid">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpen={() => setOpenProduct(product)}
                onAdd={() => cart.add(product)}
              />
            ))}
          </div>
        )}
      </main>

      <SiteFooter config={config} syncedAt={catalog.syncedAt} />

      {openProduct && (
        <ProductModal
          product={openProduct}
          onClose={() => setOpenProduct(null)}
          onAdd={(qty) => {
            cart.add(openProduct, qty);
            setOpenProduct(null);
            setCartOpen(true);
          }}
        />
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        shopName={BRAND.name}
        whatsappNumber={BRAND.orderWhatsapp || config.shop.whatsappNumber}
      />
    </div>
  );
}
