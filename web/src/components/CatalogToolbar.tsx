import { useI18n } from "../i18n";

export type SortKey = "featured" | "price-asc" | "price-desc" | "name";

interface Props {
  query: string;
  onQuery: (value: string) => void;
  sort: SortKey;
  onSort: (value: SortKey) => void;
  price: { min: string; max: string };
  onPrice: (which: "min" | "max", value: string) => void;
  bounds: { min: number; max: number };
  resultCount: number;
  filtersActive: boolean;
  onClear: () => void;
}

export function CatalogToolbar({
  query,
  onQuery,
  sort,
  onSort,
  price,
  onPrice,
  bounds,
  resultCount,
  filtersActive,
  onClear,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="toolbar">
      <div className="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
        />
        {query && (
          <button className="search-clear" onClick={() => onQuery("")} aria-label={t("clearSearch")}>
            ×
          </button>
        )}
      </div>

      <div className="toolbar-row">
        <span className="result-count">
          {resultCount} {t("results")}
        </span>

        <div className="toolbar-controls">
          <label className="control">
            <span>{t("sortBy")}</span>
            <select value={sort} onChange={(e) => onSort(e.target.value as SortKey)}>
              <option value="featured">{t("sortFeatured")}</option>
              <option value="price-asc">{t("sortPriceAsc")}</option>
              <option value="price-desc">{t("sortPriceDesc")}</option>
              <option value="name">{t("sortNameAsc")}</option>
            </select>
          </label>

          <div className="control price-filter">
            <span>{t("priceRange")}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={price.min}
              onChange={(e) => onPrice("min", e.target.value)}
              placeholder={String(Math.floor(bounds.min))}
              aria-label={t("min")}
            />
            <span className="dash">–</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={price.max}
              onChange={(e) => onPrice("max", e.target.value)}
              placeholder={String(Math.ceil(bounds.max))}
              aria-label={t("max")}
            />
          </div>

          {filtersActive && (
            <button className="link" onClick={onClear}>
              {t("clearFilters")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
