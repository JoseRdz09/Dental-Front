import { useState } from "react";
import MyAccountSection from "../components/MyAccountSection";
import SubscriptionSection from "../components/SubscriptionSection";
import "../css/SettingsPage.css";

type SettingsTab = "account" | "subscription";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  return (
    <main className="settings-page">
      <header className="settings-page__header">
        <div>
          <span className="settings-page__eyebrow">PREFERENCIAS</span>
          <h1>Configuración</h1>
          <p>Administra tu cuenta y consulta tu suscripción.</p>
        </div>
      </header>

      <div
        className="settings-tabs"
        role="tablist"
        aria-label="Configuración"
      >
        <button
          type="button"
          role="tab"
          id="tab-account"
          aria-selected={activeTab === "account"}
          aria-controls="panel-account"
          tabIndex={activeTab === "account" ? 0 : -1}
          className={`settings-tabs__item ${
            activeTab === "account" ? "is-active" : ""
          }`}
          onClick={() => setActiveTab("account")}
        >
          <span className="settings-tabs__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </span>
          <span>
            <strong>Mi cuenta</strong>
            <small>Perfil y seguridad</small>
          </span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-subscription"
          aria-selected={activeTab === "subscription"}
          aria-controls="panel-subscription"
          tabIndex={activeTab === "subscription" ? 0 : -1}
          className={`settings-tabs__item ${
            activeTab === "subscription" ? "is-active" : ""
          }`}
          onClick={() => setActiveTab("subscription")}
        >
          <span className="settings-tabs__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="M3 10h18M7 15h4" />
            </svg>
          </span>
          <span>
            <strong>Suscripción</strong>
            <small>Plan y facturación</small>
          </span>
        </button>
      </div>

      <section className="settings-page__content">
        <div
          role="tabpanel"
          id="panel-account"
          aria-labelledby="tab-account"
          hidden={activeTab !== "account"}
        >
          <MyAccountSection />
        </div>

        <div
          role="tabpanel"
          id="panel-subscription"
          aria-labelledby="tab-subscription"
          hidden={activeTab !== "subscription"}
        >
          <SubscriptionSection />
        </div>
      </section>
    </main>
  );
}