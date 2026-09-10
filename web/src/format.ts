let currency = "USD";
let locale = "en";

/** Return the locale only if the runtime's Intl can actually use it, else "en". */
function safeLocale(candidate: string): string {
  const value = candidate || "en";
  try {
    new Intl.NumberFormat(value);
    return value;
  } catch {
    return "en";
  }
}

export function configureFormatting(nextLocale: string, nextCurrency: string): void {
  locale = safeLocale(nextLocale);
  currency = (nextCurrency || "USD").toUpperCase();
}

function numberFormat(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale, options);
  } catch {
    return new Intl.NumberFormat("en", options);
  }
}

export function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return "—";
  try {
    return numberFormat({ style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Plain-text money for the WhatsApp message, e.g. "5,400.00 MAD". Never throws. */
export function formatMoneyPlain(amount: number | null | undefined): string {
  if (amount == null) return "—";
  try {
    const n = numberFormat({ minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    return `${n} ${currency}`;
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
