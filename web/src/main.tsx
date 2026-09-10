import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { CartProvider } from "./cart";
import { I18nProvider } from "./i18n";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("#root not found");

createRoot(container).render(
  <StrictMode>
    <I18nProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </I18nProvider>
  </StrictMode>,
);
