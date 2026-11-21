
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useClinic, MY_CLINICS_QUERY_KEY } from "../hooks/useClinic";

import "../css/ClinicsOrganizations.css";

import EditClinicModal from "../components/EditClinicModal";
import CreateClinicModal from "../components/CreateClinicModal";

import type { Clinic } from "../types/clinic";
import LoadingScreen from "../../../../assets/shared/components/LoadingScreen";

export default function ClinicsOrganizations() {
  const queryClient = useQueryClient();

  const {
    clinics,
    loading,
    error,
  } = useClinic();

  const [editingClinic, setEditingClinic] =
    useState<Clinic | null>(null);

  const [creatingClinic, setCreatingClinic] =
    useState(false);

  // Actualizar la caché cuando se crea una clínica.
  const handleClinicCreated = (createdClinic: Clinic) => {
    queryClient.setQueryData<Clinic[]>(
      MY_CLINICS_QUERY_KEY,
      (previous = []) => {
        const exists = previous.some(
          (clinic) => clinic.id === createdClinic.id
        );

        if (exists) {
          return previous.map((clinic) =>
            clinic.id === createdClinic.id
              ? createdClinic
              : clinic
          );
        }

        return [...previous, createdClinic];
      }
    );

    setCreatingClinic(false);
  };

  // Actualizar la caché cuando se edita una clínica.
  const handleClinicUpdated = (updatedClinic: Clinic) => {
    queryClient.setQueryData<Clinic[]>(
      MY_CLINICS_QUERY_KEY,
      (previous = []) =>
        previous.map((clinic) =>
          clinic.id === updatedClinic.id
            ? updatedClinic
            : clinic
        )
    );

    setEditingClinic(null);
  };

  // Actualizar la caché cuando se elimina una clínica.
  const handleClinicDeleted = (clinicId: number) => {
    const id = Number(clinicId);

    queryClient.setQueryData<Clinic[]>(
      MY_CLINICS_QUERY_KEY,
      (previous = []) =>
        previous.filter(
          (clinic) => Number(clinic.id) !== id
        )
    );

    setEditingClinic(null);
  };

  return (
    <section className="clinics-organizations">
      <header className="clinics-header">
        <div>
          <h2>Mis clínicas</h2>
          <p>Administra las clínicas de tu organización.</p>
        </div>

        <button
          type="button"
          className="clinic-create-button"
          onClick={() => setCreatingClinic(true)}
        >
          <span aria-hidden="true">+</span>
          Agregar nueva clínica
        </button>
      </header>

      {loading ? (
        < LoadingScreen />
      ) : error ? (
        <p className="clinics-error">{error}</p>
      ) : clinics.length === 0 ? (
        <div className="clinics-empty">
          <p>No tienes clínicas disponibles.</p>
          <p>Agrega tu primera clínica para comenzar.</p>
        </div>
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
                  {clinic.logo_url ? (
                    <img
                      src={clinic.logo_url}
                      alt={`Logo de ${clinic.name}`}
                      className="clinic-card-logo"
                    />
                  ) : (
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
                  )}
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

      {/* Modal para crear una clínica */}
      {creatingClinic && (
        <CreateClinicModal
          onClose={() => setCreatingClinic(false)}
          onSaved={handleClinicCreated}
        />
      )}

      {/* Modal para editar o eliminar una clínica */}
      {editingClinic && (
        <EditClinicModal
          key={editingClinic.id}
          clinic={editingClinic}
          onClose={() => setEditingClinic(null)}
          onSaved={handleClinicUpdated}
          onDeleted={handleClinicDeleted}
        />
      )}
    </section>
  );
}
