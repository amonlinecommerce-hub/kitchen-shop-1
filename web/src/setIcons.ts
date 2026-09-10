// Round icons for the Meta product sets (a.k.a. collections). Drop the image
// files into `web/public/sets/` and they attach to any set whose name matches.

interface SetIconRule {
  test: RegExp;
  src: string;
}

const SET_ICONS: SetIconRule[] = [
  { test: /cloth|wear|apparel|bag|fashion/i, src: "/sets/clothes.png" },
  { test: /kitchen|home|cook|utensil|houseware|kitchenware/i, src: "/sets/kitchen.png" },
  { test: /cosmetic|beaut|makeup|make-up|perfume|fragrance|skincare/i, src: "/sets/cosmetics.png" },
];

/** Local icon path for a set, matched loosely on its name, or null. */
export function setIcon(name: string | null | undefined): string | null {
  if (!name) return null;
  return SET_ICONS.find((rule) => rule.test.test(name))?.src ?? null;
}

/** The auto-generated Meta "All Products" set — hidden because the storefront has its own "All". */
export function isAllProductsSet(name: string): boolean {
  return /^all\s*products?$/i.test(name.trim());
}
