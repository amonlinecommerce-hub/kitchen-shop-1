import type { ShopConfig } from "../api";
import { BRAND } from "../brand";
import { useI18n } from "../i18n";
import { WhatsappIcon } from "./icons";

interface Props {
  config: ShopConfig;
  syncedAt: string | null;
}

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M14 9h3l.5-3H14V4.5c0-.9.3-1.5 1.6-1.5H18V.2C17.5.1 16.4 0 15.2 0 12.6 0 11 1.5 11 4.3V6H8v3h3v9h3V9Z" />
  </svg>
);

export function SiteFooter({ config, syncedAt }: Props) {
  const { t, lang } = useI18n();

  const supportNumber = (
    BRAND.supportWhatsapp ||
    BRAND.orderWhatsapp ||
    config.shop.whatsappNumber
  ).replace(/[^\d]/g, "");
  const supportHref = supportNumber
    ? `https://wa.me/${supportNumber}?text=${encodeURIComponent(t("supportMsg"))}`
    : null;

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-logo">
            {BRAND.logoSrc ? <img src={BRAND.logoSrc} alt={BRAND.name} /> : BRAND.name.charAt(0)}
          </span>
          <div>
            <div className="footer-name">{BRAND.name}</div>
            <div className="footer-tagline">{t("brandTagline")}</div>
          </div>
        </div>

        <nav className="footer-links" aria-label="Contact">
          <a href={`mailto:${BRAND.contactEmail}`}>
            <MailIcon />
            {t("contactUs")}
          </a>
          <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">
            <InstagramIcon />
            {t("instagram")}
          </a>
          <a href={BRAND.facebookUrl} target="_blank" rel="noopener noreferrer">
            <FacebookIcon />
            {t("facebook")}
          </a>
          {supportHref && (
            <a href={supportHref} target="_blank" rel="noopener noreferrer">
              <WhatsappIcon />
              {t("support")}
            </a>
          )}
        </nav>
      </div>

      <div className="footer-base">
        <span>
          © {new Date().getFullYear()} {BRAND.name}. {t("footerRights")}
        </span>
        {config.catalog.source === "mock" && <span className="tag">{t("demoCatalog")}</span>}
        {syncedAt && (
          <span>
            {t("catalogUpdated")} {new Date(syncedAt).toLocaleString(lang)}
          </span>
        )}
      </div>
    </footer>
  );
}
