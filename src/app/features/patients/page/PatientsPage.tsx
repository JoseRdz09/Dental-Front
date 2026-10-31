
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Pencil, Trash2, Search, X } from "lucide-react";

import {
  createPatient,
  deletePatient,
  getPatient,
  getPatients,
  updatePatient,
} from "../services/patientService";

import type {
  PaginatedPatients,
  Patient,
  PatientPayload,
} from "../types/patient";

import PatientModal from "../components/PatientModal";
import DeletePatientModal from "../components/DeletePatientModal";

import "../css/PatientsPage.css";

type ModalMode = "create" | "view" | "edit";

const initialData: PaginatedPatients = {
  current_page: 1,
  data: [],
  last_page: 1,
  per_page: 15,
  total: 0,
};

export default function PatientsPage() {
  const [result, setResult] =
    useState<PaginatedPatients>(initialData);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Identificador para ignorar respuestas anteriores
  const searchRequestId = useRef(0);

  const [modalMode, setModalMode] =
    useState<ModalMode | null>(null);

  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Patient | null>(null);

  // Espera 700 ms después de dejar de escribir.
  // Solo busca cuando existen al menos 2 caracteres.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const search = searchTerm.trim();

      setDebouncedSearch(search.length >= 2 ? search : "");
    }, 700);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Cargar pacientes
  const loadPatients = useCallback(
    async (page = 1, search = debouncedSearch) => {
      const requestId = ++searchRequestId.current;

      setLoading(true);
      setError("");

      try {
        const data = await getPatients(page, search);

        // Ignorar respuestas de solicitudes anteriores
        if (requestId !== searchRequestId.current) return;

        setResult(data);
      } catch (err) {
        if (requestId !== searchRequestId.current) return;

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los pacientes."
        );
      } finally {
        if (requestId === searchRequestId.current) {
          setLoading(false);
        }
      }
    },
    [debouncedSearch]
  );

  // Consultar cuando cambie la búsqueda confirmada
  useEffect(() => {
    void loadPatients(1, debouncedSearch);
  }, [debouncedSearch, loadPatients]);

  function openCreate() {
    setSelectedPatient(null);
    setModalMode("create");
    setError("");
  }

  async function openPatient(
    patient: Patient,
    mode: "view" | "edit"
  ) {
    setError("");
    setSaving(true);

    try {
      const fullPatient = await getPatient(patient.id);

      setSelectedPatient(fullPatient);
      setModalMode(mode);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo consultar el paciente."
      );
    } finally {
      setSaving(false);
    }
  }

  function closeModal() {
    if (saving) return;

    setModalMode(null);
    setSelectedPatient(null);
  }

  async function handleSave(payload: PatientPayload) {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (modalMode === "create") {
        await createPatient(payload);
        setNotice("Paciente registrado correctamente.");
      } else if (modalMode === "edit" && selectedPatient) {
        await updatePatient(selectedPatient.id, payload);
        setNotice("Paciente actualizado correctamente.");
      } else {
        return;
      }

      const page = modalMode === "create"
        ? 1
        : result.current_page;

      setModalMode(null);
      setSelectedPatient(null);

      await loadPatients(page, debouncedSearch);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el paciente."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await deletePatient(deleteTarget.id);

      setDeleteTarget(null);
      setNotice("Paciente eliminado correctamente.");

      const nextPage =
        result.data.length === 1 && result.current_page > 1
          ? result.current_page - 1
          : result.current_page;

      await loadPatients(nextPage, debouncedSearch);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el paciente."
      );
    } finally {
      setSaving(false);
    }
  }

  function clearSearch() {
    setSearchTerm("");
  }

  return (
    <main className="patients-page">
      <header className="patients-page__header">
        <div>
          <span className="patients-page__eyebrow">
            GESTIÓN CLÍNICA
          </span>

          <h1>Pacientes</h1>

          <p>
            Administra los expedientes de tus pacientes.
          </p>
        </div>

        <button
          type="button"
          className="patient-button patient-button--primary"
          onClick={openCreate}
        >
          <span aria-hidden="true">＋</span>
          Nuevo paciente
        </button>
      </header>

      {error && (
        <div className="patients-page__alert patients-page__alert--error">
          {error}

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      {notice && (
        <div className="patients-page__alert patients-page__alert--success">
          {notice}

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      <section className="patients-page__stats">
        <div className="patients-page__stat">
          <span className="patients-page__stat-icon">♙</span>

          <div>
            <span>Total de pacientes</span>
            <strong>{result.total}</strong>
          </div>
        </div>
      </section>

      <section className="patients-page__panel">
        <div className="patients-page__panel-header">
          <div>
            <h2>Directorio de pacientes</h2>

            <p>
              Consulta y administra los expedientes registrados.
            </p>
          </div>

          {/* Buscador de pacientes */}
          <div className="patients-page__search">
            <Search size={20} aria-hidden="true" />

            <input
              type="search"
              placeholder="Buscar paciente por nombre o apellidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar pacientes"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Limpiar búsqueda"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="patient-button patient-button--secondary"
            onClick={() =>
              void loadPatients(
                result.current_page,
                debouncedSearch
              )
            }
            disabled={loading}
          >
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>

        <div className="patients-page__table-wrapper">
          <table className="patients-page__table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Expediente</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="patients-page__empty"
                  >
                    Cargando pacientes...
                  </td>
                </tr>
              ) : result.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="patients-page__empty"
                  >
                    <span className="patients-page__empty-icon">
                      ♙
                    </span>

                    <strong>
                      {debouncedSearch
                        ? "No se encontraron pacientes"
                        : "No hay pacientes registrados"}
                    </strong>

                    <span>
                      {debouncedSearch
                        ? "Intenta buscar con otro nombre o apellido."
                        : "Registra un paciente para comenzar a llenar el directorio de tu clínica."}
                    </span>

                    {!debouncedSearch && (
                      <button
                        type="button"
                        className="patient-button patient-button--primary"
                        onClick={openCreate}
                      >
                        Registrar primer paciente
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                result.data.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="patients-page__person">
                        <span className="patients-page__avatar">
                          {(patient.first_name || "?")
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        {patient.first_name} {patient.last_name}
                      </div>
                    </td>

                    <td>
                      {patient.record_clinical || "—"}
                    </td>

                    <td>
                      {patient.phone || "—"}
                    </td>

                    <td>
                      <span
                        className={`patients-page__status ${
                          patient.status === "active"
                            ? "patients-page__status--active"
                            : "patients-page__status--inactive"
                        }`}
                      >
                        {patient.status === "active"
                          ? "Activo"
                          : patient.status === "inactive"
                            ? "Inactivo"
                            : patient.status || "Sin estado"}
                      </span>
                    </td>

                    <td>
                      <div className="patients-page__actions">
                        <button
                          type="button"
                          title="Ver paciente"
                          aria-label={`Ver ${patient.first_name}`}
                          onClick={() =>
                            void openPatient(patient, "view")
                          }
                        >
                          <Eye size={18} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          className="patients-page__view-action"
                          title="Editar paciente"
                          aria-label={`Editar ${patient.first_name}`}
                          onClick={() =>
                            void openPatient(patient, "edit")
                          }
                        >
                          <Pencil size={18} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          className="patients-page__delete-action"
                          title="Eliminar paciente"
                          aria-label={`Eliminar ${patient.first_name}`}
                          onClick={() => setDeleteTarget(patient)}
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="patients-page__pagination">
          <span>
            Página {result.current_page} de {result.last_page}
            {" · "}
            {result.total} pacientes
          </span>

          <div>
            <button
              type="button"
              className="patient-button patient-button--secondary"
              disabled={loading || result.current_page <= 1}
              onClick={() =>
                void loadPatients(
                  result.current_page - 1,
                  debouncedSearch
                )
              }
            >
              Anterior
            </button>

            <button
              type="button"
              className="patient-button patient-button--secondary"
              disabled={
                loading ||
                result.current_page >= result.last_page
              }
              onClick={() =>
                void loadPatients(
                  result.current_page + 1,
                  debouncedSearch
                )
              }
            >
              Siguiente
            </button>
          </div>
        </footer>
      </section>

      {modalMode && (
        <PatientModal
          mode={modalMode}
          patient={selectedPatient}
          loading={saving}
          onClose={closeModal}
          onSave={(payload) => void handleSave(payload)}
        />
      )}

      {deleteTarget && (
        <DeletePatientModal
          patientName={`${deleteTarget.first_name} ${deleteTarget.last_name}`}
          loading={saving}
          onClose={() => {
            if (!saving) setDeleteTarget(null);
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </main>
  );
}
