import { useEffect, useState } from "react";
import type { Product } from "../api";
import { formatMoney } from "../format";
import { useI18n } from "../i18n";

interface Props {
  product: Product;
  onClose: () => void;
  onAdd: (qty: number) => void;
}

export function ProductModal({ product, onClose, onAdd }: Props) {
  const { t, phrase } = useI18n();
  const images = [product.imageUrl, ...product.additionalImageUrls].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const activeSrc = images[active];
  const activeBroken = activeSrc ? brokenImages.has(activeSrc) : true;
  const soldOut = product.availability === "out of stock";
  const name = phrase(product.name);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={name}>
        <button className="modal-close" onClick={onClose} aria-label={t("close")}>
          ×
        </button>
        <div className="modal-media">
          {activeSrc && !activeBroken ? (
            <img
              src={activeSrc}
              alt={name}
              onError={() => setBrokenImages((prev) => new Set(prev).add(activeSrc))}
            />
          ) : (
            <div className="card-media-empty" />
          )}
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((src, i) => (
                <button
                  key={src}
                  className={i === active ? "thumb thumb-active" : "thumb"}
                  onClick={() => setActive(i)}
                >
                  <img src={src} alt="" onError={() => setBrokenImages((prev) => new Set(prev).add(src))} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="modal-info">
          <h2>{name}</h2>
          {product.brand && <div className="card-brand">{product.brand}</div>}
          <div className="modal-price">{formatMoney(product.priceAmount)}</div>
          {product.description && <p className="modal-desc">{phrase(product.description)}</p>}

          <div className="qty-row">
            <div className="stepper">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t("decrease")}>
                −
              </button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} aria-label={t("increase")}>
                +
              </button>
            </div>
            <button className="primary" onClick={() => onAdd(qty)} disabled={soldOut}>
              {soldOut ? t("soldOut") : t("addToCart")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
