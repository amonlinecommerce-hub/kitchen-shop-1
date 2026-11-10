import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { translateBatch } from "./translation";

export type Lang = "en" | "ar";

const LANG_KEY = "kitchen-shop.lang";
const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);

type UiKey =
  | "cart"
  | "all"
  | "add"
  | "soldOut"
  | "addToCart"
  | "viewProduct"
  | "yourCart"
  | "cartEmpty"
  | "total"
  | "buyNow"
  | "clearCart"
  | "remove"
  | "loading"
  | "wrong"
  | "noProducts"
  | "demoCatalog"
  | "catalogUpdated"
  | "noWhatsapp"
  | "close"
  | "decrease"
  | "increase"
  | "switchLang"
  | "brandTagline"
  | "contactUs"
  | "instagram"
  | "facebook"
  | "support"
  | "supportMsg"
  | "footerRights"
  | "searchPlaceholder"
  | "clearSearch"
  | "sortBy"
  | "sortFeatured"
  | "sortPriceAsc"
  | "sortPriceDesc"
  | "sortNameAsc"
  | "priceRange"
  | "min"
  | "max"
  | "results"
  | "clearFilters"
  | "noResults";

// Static UI copy. Dynamic catalog text is handled by phrase()/translateBatch.
const UI: Record<UiKey, Record<Lang, string>> = {
  cart: { en: "Cart", ar: "السلة" },
  all: { en: "All", ar: "الكل" },
  add: { en: "Add", ar: "أضف" },
  soldOut: { en: "Sold out", ar: "نفدت الكمية" },
  addToCart: { en: "Add to cart", ar: "أضف إلى السلة" },
  viewProduct: { en: "View product", ar: "عرض المنتج" },
  yourCart: { en: "Your cart", ar: "سلتك" },
  cartEmpty: { en: "Your cart is empty.", ar: "سلتك فارغة." },
  total: { en: "Total", ar: "الإجمالي" },
  buyNow: { en: "Buy now on WhatsApp", ar: "اطلب الآن عبر واتساب" },
  clearCart: { en: "Clear cart", ar: "إفراغ السلة" },
  remove: { en: "Remove", ar: "حذف" },
  loading: { en: "Loading catalog…", ar: "جارٍ تحميل الكتالوج…" },
  wrong: { en: "Something went wrong", ar: "حدث خطأ ما" },
  noProducts: { en: "No products in this collection yet.", ar: "لا توجد منتجات في هذه المجموعة بعد." },
  demoCatalog: { en: "demo catalog", ar: "كتالوج تجريبي" },
  catalogUpdated: { en: "Catalog updated", ar: "آخر تحديث للكتالوج" },
  noWhatsapp: {
    en: "This shop has no WhatsApp number configured yet.",
    ar: "لم يتم ضبط رقم واتساب لهذا المتجر بعد.",
  },
  close: { en: "Close", ar: "إغلاق" },
  decrease: { en: "Decrease quantity", ar: "إنقاص الكمية" },
  increase: { en: "Increase quantity", ar: "زيادة الكمية" },
  switchLang: { en: "العربية", ar: "English" },
  brandTagline: {
    en: "Your marketplace for home & kitchen",
    ar: "متجرك لكل ما يخص المنزل والمطبخ",
  },
  contactUs: { en: "Contact us", ar: "تواصل معنا" },
  instagram: { en: "Instagram", ar: "إنستغرام" },
  facebook: { en: "Facebook", ar: "فيسبوك" },
  support: { en: "Support on WhatsApp", ar: "الدعم عبر واتساب" },
  supportMsg: {
    en: "Hi Sallatona Onsouq, I need help.",
    ar: "مرحبًا سلّتنا أونسوق، أحتاج إلى مساعدة.",
  },
  footerRights: { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
  searchPlaceholder: { en: "Search products…", ar: "ابحث عن منتجات…" },
  clearSearch: { en: "Clear search", ar: "مسح البحث" },
  sortBy: { en: "Sort", ar: "ترتيب" },
  sortFeatured: { en: "Featured", ar: "مميّز" },
  sortPriceAsc: { en: "Price: low to high", ar: "السعر: من الأقل" },
  sortPriceDesc: { en: "Price: high to low", ar: "السعر: من الأعلى" },
  sortNameAsc: { en: "Name: A to Z", ar: "الاسم: أ إلى ي" },
  priceRange: { en: "Price", ar: "السعر" },
  min: { en: "Min", ar: "الأدنى" },
  max: { en: "Max", ar: "الأقصى" },
  results: { en: "results", ar: "نتيجة" },
  clearFilters: { en: "Clear filters", ar: "مسح عوامل التصفية" },
  noResults: { en: "No products match your search.", ar: "لا توجد منتجات مطابقة لبحثك." },
};

interface I18nApi {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  t: (key: UiKey) => string;
  /** Localised dynamic text, falling back to the source string. */
  phrase: (text: string | null | undefined) => string;
  /** Merge known translations (e.g. ones the server already cached). */
  seed: (pairs: Record<string, string | null | undefined>) => void;
  /** Request translation of any strings not yet known. No-op while lang is English. */
  ensure: (texts: Array<string | null | undefined>) => void;
  translating: boolean;
}

const I18nContext = createContext<I18nApi | null>(null);

function initialLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "ar" || fromUrl === "en") return fromUrl;
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "ar" || stored === "en") return stored;
  } catch {
    // ignore
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [dict, setDict] = useState<Record<string, string>>({});
  const [inFlight, setInFlight] = useState(0);

  const dictRef = useRef(dict);
  dictRef.current = dict;
  const pending = useRef<Set<string>>(new Set());

  const dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang, dir]);

  const seed = useCallback((pairs: Record<string, string | null | undefined>) => {
    setDict((prev) => {
      let next = prev;
      for (const [src, translated] of Object.entries(pairs)) {
        const key = src.trim();
        if (key && translated && next[key] !== translated) {
          if (next === prev) next = { ...prev };
          next[key] = translated;
        }
      }
      return next;
    });
  }, []);

  const ensure = useCallback(
    (texts: Array<string | null | undefined>) => {
      if (lang === "en") return;
      const missing = [
        ...new Set(texts.map((t) => (t ?? "").trim()).filter(Boolean)),
      ].filter((t) => !(t in dictRef.current) && !pending.current.has(t));
      if (missing.length === 0) return;

      missing.forEach((t) => pending.current.add(t));
      setInFlight((n) => n + 1);
      translateBatch(missing, lang)
        .then((map) => setDict((d) => ({ ...d, ...map })))
        .catch(() => undefined)
        .finally(() => {
          missing.forEach((t) => pending.current.delete(t));
          setInFlight((n) => Math.max(0, n - 1));
        });
    },
    [lang],
  );

  const t = useCallback((key: UiKey) => UI[key][lang], [lang]);

  const phrase = useCallback(
    (text: string | null | undefined) => {
      if (!text) return text ?? "";
      if (lang === "en") return text;
      return dict[text.trim()] ?? text;
    },
    [lang, dict],
  );

  const value = useMemo<I18nApi>(
    () => ({ lang, dir, setLang, t, phrase, seed, ensure, translating: inFlight > 0 }),
    [lang, dir, t, phrase, seed, ensure, inFlight],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nApi {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
