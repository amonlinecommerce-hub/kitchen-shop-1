import { BRAND } from "../brand";
import { useCart } from "../cart";
import { formatMoney } from "../format";
import { useI18n } from "../i18n";
import { whatsappLink } from "../whatsapp";
import { WhatsappIcon } from "./icons";

interface Props {
  open: boolean;
  onClose: () => void;
  shopName: string;
  whatsappNumber: string;
}

export function CartDrawer({ open, onClose, shopName, whatsappNumber }: Props) {
  const cart = useCart();
  const { t, phrase } = useI18n();
  const canCheckout = cart.lines.length > 0 && whatsappNumber.length > 0;

  // Order text stays in English (plus each line's ref) so it matches the
  // shop owner's own catalog regardless of the shopper's language.
  const orderUrl = canCheckout ? whatsappLink(cart.lines, { shopName, whatsappNumber }) : null;

  return (
    <>
      <div className={open ? "scrim scrim-open" : "scrim"} onClick={onClose} role="presentation" />
      <aside className={open ? "drawer drawer-open" : "drawer"} aria-label={t("yourCart")} aria-hidden={!open}>
        <div className="drawer-head">
          <h2>{t("yourCart")}</h2>
          <button className="modal-close" onClick={onClose} aria-label={t("close")}>
            ×
          </button>
        </div>

        {cart.lines.length === 0 ? (
          <p className="drawer-empty">{t("cartEmpty")}</p>
        ) : (
          <div className="drawer-lines">
            {cart.lines.map((line) => (
              <div className="line" key={line.product.id}>
                <div className="line-media">
                  {line.product.imageUrl && <img src={line.product.imageUrl} alt="" />}
                </div>
                <div className="line-body">
                  <div className="line-name">{phrase(line.product.name)}</div>
                  <div className="line-price">{formatMoney(line.product.priceAmount)}</div>
                  <div className="stepper stepper-sm">
                    <button
                      onClick={() => cart.setQty(line.product.id, line.qty - 1)}
                      aria-label={t("decrease")}
                    >
                      −
                    </button>
                    <span>{line.qty}</span>
                    <button
                      onClick={() => cart.setQty(line.product.id, line.qty + 1)}
                      aria-label={t("increase")}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="line-total">
                  {formatMoney((line.product.priceAmount ?? 0) * line.qty)}
                  <button className="link" onClick={() => cart.remove(line.product.id)}>
                    {t("remove")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="drawer-foot">
          <div className="total-row">
            <span>{t("total")}</span>
            <span className="total-amount">{formatMoney(cart.total)}</span>
          </div>
          {orderUrl ? (
            <a className="wa-cta" href={orderUrl} target="_blank" rel="noopener noreferrer">
              <WhatsappIcon />
              {t("buyNow")}
            </a>
          ) : (
            <button className="wa-cta" disabled>
              <WhatsappIcon />
              {t("buyNow")}
            </button>
          )}
          {canCheckout ? (
            <p className="wa-dest">
              <WhatsappIcon />
              {BRAND.orderWhatsapp}
            </p>
          ) : (
            cart.lines.length > 0 &&
            whatsappNumber.length === 0 && <p className="warn">{t("noWhatsapp")}</p>
          )}
          {cart.lines.length > 0 && (
            <button className="link" onClick={cart.clear}>
              {t("clearCart")}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
