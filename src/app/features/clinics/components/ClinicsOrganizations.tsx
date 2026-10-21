
import { useState } from "react";
import { useClinic } from "../hooks/useClinic";
import "../css/ClinicsOrganizations.css";
import EditClinicModal from "../components/EditClinicModal";
import type { Clinic } from "../types/clinic";

export default function ClinicsOrganizations() {
  const {
    clinics: loadedClinics,
    loading,
    error,
  } = useClinic();

  const [editingClinic, setEditingClinic] =
    useState<Clinic | null>(null);

  const [updatedClinics, setUpdatedClinics] =
    useState<Record<number, Clinic>>({});

  const clinics = loadedClinics.map(
    (clinic) => updatedClinics[clinic.id] ?? clinic
  );

  if (loading) {
    return (
      <section className="clinics-organizations">
        <p>Cargando clínicas...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="clinics-organizations">
        <p className="clinics-error">{error}</p>
      </section>
    );
  }

  return (
    <section className="clinics-organizations">
      <header className="clinics-header">
        <div>
          <h2>Mis clínicas</h2>
          <p>Clínicas disponibles: {clinics.length}</p>
        </div>
      </header>

      {clinics.length === 0 ? (
        <p>No tienes clínicas disponibles.</p>
      ) : (
        <div className="clinics-grid">
          {clinics.map((clinic) => (
            <article
              key={clinic.id}
              className={`clinic-card ${
                editingClinic?.id === clinic.id ? "selected" : ""
              }`}
            >
              <div className="clinic-card-heading">
                <span className="clinic-card-icon">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V7l8-4v18" />
                    <path d="M19 21V11l-6-4" />
                    <path d="M9 9v.01" />
                    <path d="M9 12v.01" />
                    <path d="M9 15v.01" />
                    <path d="M9 18v.01" />
                    <path d="M16 13v.01" />
                    <path d="M16 16v.01" />
                    <path d="M16 19v.01" />
                  </svg>
                </span>

                <div className="clinic-card-title">
                  <h3>{clinic.name || "Sin nombre"}</h3>
                </div>

                <span
                  className={`clinic-status ${
                    clinic.status === "active"
                      ? "clinic-status-active"
                      : "clinic-status-inactive"
                  }`}
                >
                  {clinic.status === "active"
                    ? "Activa"
                    : clinic.status === "inactive"
                      ? "Inactiva"
                      : clinic.status || "Sin estado"}
                </span>
              </div>

              <div className="clinic-card-details">
                <div className="clinic-detail">
                  <span className="clinic-detail-label">
                    Correo electrónico
                  </span>
                  <span className="clinic-detail-value">
                    {clinic.email || "No registrado"}
                  </span>
                </div>

                <div className="clinic-detail">
                  <span className="clinic-detail-label">
                    Teléfono
                  </span>
                  <span className="clinic-detail-value">
                    {clinic.phone || "No registrado"}
                  </span>
                </div>

                <div className="clinic-detail">
                  <span className="clinic-detail-label">
                    Dirección
                  </span>
                  <span className="clinic-detail-value">
                    {clinic.address || "No registrada"}
                  </span>
                </div>

                <div className="clinic-detail">
                  <span className="clinic-detail-label">
                    Zona horaria
                  </span>
                  <span className="clinic-detail-value">
                    {clinic.timezone || "No configurada"}
                  </span>
                </div>

              </div>

              <div className="clinic-card-actions">
                <button
                  type="button"
                  className="clinic-edit-button"
                  onClick={() => setEditingClinic(clinic)}
                >
                  Editar clínica
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editingClinic && (
        <EditClinicModal
          key={editingClinic.id}
          clinic={editingClinic}
          onClose={() => setEditingClinic(null)}
          onSaved={(updatedClinic) => {
            setUpdatedClinics((previous) => ({
              ...previous,
              [updatedClinic.id]: updatedClinic,
            }));

            setEditingClinic(null);
          }}
        />
      )}
    </section>
  );
}
