
import { useState } from "react";
import { useClinic } from "../hooks/useClinic";
import "../css/ClinicsOrganizations.css";
import EditClinicModal from "../components/EditClinicModal";
import CreateClinicModal from "../components/CreateClinicModal";
import type { Clinic } from "../types/clinic";

export default function ClinicsOrganizations() {
  const {
    clinics: loadedClinics,
    loading,
    error,
  } = useClinic();

  const [editingClinic, setEditingClinic] =
    useState<Clinic | null>(null);

  const [creatingClinic, setCreatingClinic] = useState(false);

  const [updatedClinics, setUpdatedClinics] =
    useState<Record<number, Clinic>>({});

  const [newClinics, setNewClinics] = useState<Clinic[]>([]);

  // IDs de clínicas eliminadas durante esta sesión.
  const [deletedClinicIds, setDeletedClinicIds] =
    useState<Set<number>>(() => new Set());

  // 1. Combinar las clínicas originales con las actualizaciones.
  const clinicsMap = new Map<number, Clinic>();

  loadedClinics.forEach((clinic) => {
    if (deletedClinicIds.has(Number(clinic.id))) {
      return;
    }

    clinicsMap.set(
      clinic.id,
      updatedClinics[clinic.id] ?? clinic
    );
  });

  // 2. Agregar clínicas creadas localmente sin duplicar IDs.
  newClinics.forEach((clinic) => {
    if (deletedClinicIds.has(Number(clinic.id))) {
      return;
    }

    if (!clinicsMap.has(clinic.id)) {
      clinicsMap.set(
        clinic.id,
        updatedClinics[clinic.id] ?? clinic
      );
    }
  });

  // 3. Obtener el listado final sin IDs duplicados.
  const clinics = Array.from(clinicsMap.values());

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
        <p>Cargando clínicas...</p>
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

      {creatingClinic && (
        <CreateClinicModal
          onClose={() => setCreatingClinic(false)}
          onSaved={(createdClinic) => {
            // Si el backend reutiliza un ID, permitir mostrarlo
            // solo cuando realmente se haya creado correctamente.
            setDeletedClinicIds((previous) => {
              const updated = new Set(previous);
              updated.delete(Number(createdClinic.id));
              return updated;
            });

            setNewClinics((previous) => [
              ...previous.filter(
                (clinic) => clinic.id !== createdClinic.id
              ),
              createdClinic,
            ]);

            setCreatingClinic(false);
          }}
        />
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
          onDeleted={(clinicId) => {
            const id = Number(clinicId);

            // Ocultar inmediatamente la clínica del listado.
            setDeletedClinicIds((previous) => {
              const updated = new Set(previous);
              updated.add(id);
              return updated;
            });

            // Limpiar los datos locales de esa clínica.
            setUpdatedClinics((previous) => {
              const updated = { ...previous };
              delete updated[id];
              return updated;
            });

            setNewClinics((previous) =>
              previous.filter(
                (clinic) => Number(clinic.id) !== id
              )
            );

            setEditingClinic(null);
          }}
        />
      )}
    </section>
  );
}
