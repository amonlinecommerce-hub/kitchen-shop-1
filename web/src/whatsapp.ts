import type { CartLine } from "./cart";
import { formatMoneyPlain } from "./format";

interface OrderContext {
  shopName: string;
  whatsappNumber: string;
}

/** Build the plain-text order that the shopper's WhatsApp will send to the business. */
export function buildOrderMessage(lines: CartLine[], ctx: OrderContext): string {
  const rows = lines.map((line, i) => {
    const unit = line.product.priceAmount;
    const lineTotal = unit == null ? null : unit * line.qty;
    return [
      `${i + 1}. ${line.product.name}`,
      `   ${line.qty} × ${formatMoneyPlain(unit)} = ${formatMoneyPlain(lineTotal)}`,
      line.product.retailerId ? `   ref: ${line.product.retailerId}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const total = lines.reduce((sum, l) => sum + (l.product.priceAmount ?? 0) * l.qty, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);

  return [
    `*New order — ${ctx.shopName}*`,
    "",
    ...rows,
    "",
    `*Items:* ${itemCount}`,
    `*Order total:* ${formatMoneyPlain(total)}`,
    "",
    "Please confirm availability and delivery. Thank you!",
  ].join("\n");
}

export function whatsappLink(lines: CartLine[], ctx: OrderContext): string {
  const text = encodeURIComponent(buildOrderMessage(lines, ctx));
  const number = ctx.whatsappNumber.replace(/[^\d]/g, "");
  return `https://wa.me/${number}?text=${text}`;
}
