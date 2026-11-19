
import { useState } from "react";

import MyAccountSection from "../components/MyAccountSection";
import OrganizationSection from "../components/OrganizationSection";


import "../css/SettingsPage.css";

import { useAuth } from "../../auth/useAuth";

type SettingsTab = "account" | "organization" | "subscription";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const { user } = useAuth();

  // Identificar si el usuario es propietario de alguna organización.
  const organization = user?.organizations?.find(
    (organization) => organization.role === "owner"
  );

  const isOwner = Boolean(organization);

  return (
    <main className="settings-page">
      <header className="settings-page__header">
        <div>
          <span className="settings-page__eyebrow">PREFERENCIAS</span>
          <h1>Configuración</h1>
          <p>Administra tu cuenta y tu organización.</p>
        </div>
      </header>

      <div
        className="settings-tabs"
        role="tablist"
        aria-label="Configuración"
      >
        {/* MI CUENTA */}
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

        {/* PESTAÑAS EXCLUSIVAS DEL OWNER */}
        {isOwner && (
          <>
            {/* ORGANIZACIÓN */}
            <button
              type="button"
              role="tab"
              id="tab-organization"
              aria-selected={activeTab === "organization"}
              aria-controls="panel-organization"
              tabIndex={activeTab === "organization" ? 0 : -1}
              className={`settings-tabs__item ${
                activeTab === "organization" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("organization")}
            >
              <span className="settings-tabs__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                  <path d="M9 21v-6h6v6M9 9h.01M15 9h.01" />
                </svg>
              </span>

              <span>
                <strong>Organización</strong>
                <small>Información y logotipo</small>
              </span>
            </button>
          </>
        )}
      </div>

      <section className="settings-page__content">
        {/* MI CUENTA */}
        <div
          role="tabpanel"
          id="panel-account"
          aria-labelledby="tab-account"
          hidden={activeTab !== "account"}
        >
          <MyAccountSection />
        </div>

        {/* ORGANIZACIÓN */}
        {isOwner && (
          <div
            role="tabpanel"
            id="panel-organization"
            aria-labelledby="tab-organization"
            hidden={activeTab !== "organization"}
          >
            <OrganizationSection
              organizationId={organization!.id}
              organizationName={organization!.name}
              logoUrl={organization!.logo}
            />
          </div>
        )}
      </section>
    </main>
  );
}
