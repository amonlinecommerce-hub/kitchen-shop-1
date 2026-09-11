// Round icons for the Meta product sets, drawn inline in the brand's
// brown + gold line style. A set is matched loosely on its name; unmatched
// sets fall back to their first letter (handled by the caller).
//
// To use real artwork instead, drop a file in web/public/sets/ and add an
// entry to IMAGE_OVERRIDES below — the image wins over the drawn icon.

const BROWN = "#7c2d12";
const GOLD = "#c2952f";

interface Rule {
  key: string;
  test: RegExp;
}

const RULES: Rule[] = [
  { key: "clothes", test: /cloth|wear|apparel|bag|fashion/i },
  { key: "kitchen", test: /kitchen|home|cook|utensil|houseware/i },
  { key: "cosmetics", test: /cosmetic|beaut|makeup|make-up|perfume|fragrance|skincare/i },
  { key: "coffee", test: /coffee|tea|drink|beverage/i },
];

/** Optional real-image overrides, e.g. { clothes: "/sets/clothes.png" }. */
const IMAGE_OVERRIDES: Record<string, string> = {};

function keyFor(name: string | null | undefined): string | null {
  if (!name) return null;
  return RULES.find((r) => r.test.test(name))?.key ?? null;
}

/** True when this set name maps to an icon (drawn or image). */
export function hasSetIcon(name: string | null | undefined): boolean {
  return keyFor(name) !== null;
}

const svgProps = {
  viewBox: "0 0 64 64",
  fill: "none",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Drawn({ iconKey }: { iconKey: string }) {
  switch (iconKey) {
    case "clothes":
      return (
        <svg {...svgProps}>
          {/* shirt */}
          <path
            d="M23 13 27 10c1.6 3.4 8.4 3.4 10 0l4 3 7 7-5 4v25H21V27l-5-4z"
            stroke={BROWN}
          />
          {/* tote bag */}
          <path d="M27 34h13l1.5 17h-16z" stroke={GOLD} />
          <path d="M30.5 34v-2.5a3 3 0 0 1 6 0V34" stroke={GOLD} />
        </svg>
      );
    case "kitchen":
      return (
        <svg {...svgProps}>
          {/* chef hat */}
          <path
            d="M24 33v-5a6 6 0 0 1-1.5-11 6.5 6.5 0 0 1 12-2.5 6.5 6.5 0 0 1 12 2.5A6 6 0 0 1 45 28v5z"
            stroke={GOLD}
          />
          <path d="M24 33h21" stroke={GOLD} />
          {/* spatula + spoon */}
          <path d="M25 52 33 40" stroke={BROWN} />
          <path d="M44 52 37 41" stroke={BROWN} />
          <path d="M36 39a2.5 2.5 0 1 1 3 4z" stroke={BROWN} />
        </svg>
      );
    case "cosmetics":
      return (
        <svg {...svgProps}>
          {/* spray bottle */}
          <path d="M25 27h8v24h-8z" stroke={BROWN} />
          <path d="M26.5 27v-4h5v4M31.5 19h4.5v3.5h-4.5" stroke={BROWN} />
          {/* makeup brush */}
          <path d="M39 51 45 32" stroke={GOLD} />
          <path d="M43 33.5c1.3-4 6.2-5.4 7.5-1.4S48 39 44 37.6z" stroke={GOLD} />
        </svg>
      );
    case "coffee":
      return (
        <svg {...svgProps}>
          <path d="M18 24h26v13a13 13 0 0 1-26 0z" stroke={BROWN} />
          <path d="M44 27h4a5 5 0 0 1 0 10h-4" stroke={BROWN} />
          <path d="M24 14c-2 3 2 4 0 7M32 13c-2 3 2 4 0 7" stroke={GOLD} />
        </svg>
      );
    default:
      return null;
  }
}

export function SetIcon({ name }: { name: string }) {
  const key = keyFor(name);
  if (!key) return null;
  const override = IMAGE_OVERRIDES[key];
  if (override) return <img src={override} alt="" />;
  return <Drawn iconKey={key} />;
}

/** The auto-generated Meta "All Products" set — hidden by the storefront's own "All". */
export function isAllProductsSet(name: string): boolean {
  return /^all\s*products?$/i.test(name.trim());
}
