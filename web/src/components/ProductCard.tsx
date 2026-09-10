import type { Product } from "../api";
import { formatMoney } from "../format";
import { useI18n } from "../i18n";

interface Props {
  product: Product;
  onOpen: () => void;
  onAdd: () => void;
}

export function ProductCard({ product, onOpen, onAdd }: Props) {
  const { t, phrase } = useI18n();
  const soldOut = product.availability === "out of stock";
  const name = phrase(product.name);

  return (
    <article className="card">
      <button className="card-media" onClick={onOpen} aria-label={`${t("viewProduct")}: ${name}`}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={name} loading="lazy" />
        ) : (
          <div className="card-media-empty" />
        )}
      </button>
      <div className="card-body">
        <button className="card-name" onClick={onOpen}>
          {name}
        </button>
        {product.brand && <div className="card-brand">{product.brand}</div>}
        <div className="card-foot">
          <span className="card-price">{formatMoney(product.priceAmount)}</span>
          <button className="add-button" onClick={onAdd} disabled={soldOut}>
            {soldOut ? t("soldOut") : t("add")}
          </button>
        </div>
      </div>
    </article>
  );
}
