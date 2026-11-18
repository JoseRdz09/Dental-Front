
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useQueryClient,
} from "@tanstack/react-query";

import {
  Eye,
  Pencil,
  Trash2,
  Search,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getPatient,
} from "../services/patientService";

import {
  usePatientDirectory,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  patientKeys,
} from "../hooks/usePatients";

import LoadingScreen from "../../../../assets/shared/components/LoadingScreen";

import type {
  Patient,
  PatientPayload,
} from "../types/patient";

import PatientModal from "../components/PatientModal";
import DeletePatientModal from "../components/DeletePatientModal";

import "../css/PatientsPage.css";

type ModalMode = "create" | "view" | "edit";

const PATIENTS_PER_PAGE = 15;

// Tiempo de vigencia de la información individual.
const PATIENT_DETAIL_STALE_TIME = 1000 * 60 * 2;

// Normalizar texto para ignorar acentos y mayúsculas.
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function PatientsPage() {
  const queryClient = useQueryClient();

  // =====================================================
  // CONSULTA DE PACIENTES CON TANSTACK QUERY
  // =====================================================

  const {
    data: patients = [],
    isLoading: loading,
    isFetching,
    error: patientsError,
    refetch,
  } = usePatientDirectory();

  // =====================================================
  // MUTACIONES
  // =====================================================

  const createPatientMutation = useCreatePatient();

  const updatePatientMutation = useUpdatePatient();

  const deletePatientMutation = useDeletePatient();

  // Estados de operaciones.
  const [saving, setSaving] = useState(false);

  // Búsqueda local.
  const [searchTerm, setSearchTerm] = useState("");

  // Paginación local.
  const [currentPage, setCurrentPage] = useState(1);

  // Control de solicitudes individuales.
  const patientRequestId = useRef(0);

  // Modales.
  const [modalMode, setModalMode] =
    useState<ModalMode | null>(null);

  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Patient | null>(null);

  // =====================================================
  // ERRORES DE CONSULTA
  // =====================================================

  useEffect(() => {
    if (patientsError) {
      toast.error(
        patientsError instanceof Error
          ? patientsError.message
          : "No se pudieron cargar los pacientes.",
        { id: "patients-load-error" }
      );
    }
  }, [patientsError]);

  // =====================================================
  // FILTRADO LOCAL
  // =====================================================

  const filteredPatients = useMemo(() => {
    const search = normalizeText(searchTerm);

    if (!search) {
      return patients;
    }

    return patients.filter((patient) => {
      const fullName = normalizeText(
        `${patient.first_name} ${patient.last_name}`
      );

      return fullName.includes(search);
    });
  }, [patients, searchTerm]);

  // =====================================================
  // PAGINACIÓN LOCAL
  // =====================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredPatients.length / PATIENTS_PER_PAGE
    )
  );

  const paginatedPatients = useMemo(() => {
    const startIndex =
      (currentPage - 1) * PATIENTS_PER_PAGE;

    return filteredPatients.slice(
      startIndex,
      startIndex + PATIENTS_PER_PAGE
    );
  }, [filteredPatients, currentPage]);

  // Reiniciar página cuando cambia la búsqueda.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Evitar permanecer en una página inexistente.
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // =====================================================
  // ACTUALIZAR DIRECTORIO MANUALMENTE
  // =====================================================

  function handleRefresh() {
    void refetch();
  }

  // =====================================================
  // ABRIR MODAL DE REGISTRO
  // =====================================================

  function openCreate() {
    patientRequestId.current++;

    setSelectedPatient(null);
    setModalMode("create");
  }

  // =====================================================
  // CONSULTAR PACIENTE INDIVIDUAL CON CACHÉ
  // =====================================================

  async function openPatient(
    patient: Patient,
    mode: "view" | "edit"
  ) {
    const requestId = ++patientRequestId.current;

    try {
      const fullPatient = await queryClient.fetchQuery({
        queryKey: patientKeys.detail(patient.id),

        queryFn: () => getPatient(patient.id),

        staleTime: PATIENT_DETAIL_STALE_TIME,
      });

      // Ignorar respuestas de solicitudes anteriores.
      if (requestId !== patientRequestId.current) {
        return;
      }

      setSelectedPatient(fullPatient);
      setModalMode(mode);

    } catch (err) {
      if (requestId !== patientRequestId.current) {
        return;
      }

      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo consultar el paciente.",
        { id: "patient-detail-error" }
      );
    }
  }

  // =====================================================
  // CERRAR MODAL
  // =====================================================

  function closeModal() {
    if (saving) return;

    patientRequestId.current++;

    setModalMode(null);
    setSelectedPatient(null);
  }

  // =====================================================
  // REGISTRAR O ACTUALIZAR PACIENTE
  // =====================================================

  async function handleSave(payload: PatientPayload) {
    if (saving) return;

    setSaving(true);

    try {
      if (modalMode === "create") {
        await createPatientMutation.mutateAsync(payload);

        toast.success(
          "Paciente registrado correctamente."
        );

        setCurrentPage(1);

      } else if (
        modalMode === "edit" &&
        selectedPatient
      ) {
        await updatePatientMutation.mutateAsync({
          id: selectedPatient.id,
          payload,
        });

        toast.success(
          "Paciente actualizado correctamente."
        );

      } else {
        return;
      }

      setModalMode(null);
      setSelectedPatient(null);

      // No llamamos manualmente a loadPatients.
      // La mutación invalida la caché desde el hook.

    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el paciente.",
        { id: "patient-save-error" }
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // ELIMINAR PACIENTE
  // =====================================================

  async function handleDelete() {
    if (!deleteTarget || saving) return;

    setSaving(true);

    try {
      await deletePatientMutation.mutateAsync(
        deleteTarget.id
      );

      toast.success(
        "Paciente eliminado correctamente."
      );

      setDeleteTarget(null);

    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el paciente.",
        { id: "patient-delete-error" }
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // LIMPIAR BÚSQUEDA
  // =====================================================

  function clearSearch() {
    setSearchTerm("");
  }

  // =====================================================
  // INTERFAZ
  // =====================================================

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

      <section className="patients-page__stats">
        <div className="patients-page__stat">
          <span className="patients-page__stat-icon">
            ♙
          </span>

          <div>
            <span>Total de pacientes</span>
            <strong>{patients.length}</strong>
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

          {/* Buscador local */}
          <div className="patients-page__search">
            <Search
              size={20}
              aria-hidden="true"
            />

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
            onClick={handleRefresh}
            disabled={isFetching}
          >
            {isFetching ? "Actualizando..." : "Actualizar"}
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
                    className="patients-page__loading"
                  >
                    <LoadingScreen />
                  </td>
                </tr>
              ) : patientsError ? (
                <tr>
                  <td
                    colSpan={5}
                    className="patients-page__empty"
                  >
                    <strong>
                      No se pudieron cargar los pacientes.
                    </strong>

                    <button
                      type="button"
                      className="patient-button patient-button--secondary"
                      onClick={handleRefresh}
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="patients-page__empty"
                  >
                    <span className="patients-page__empty-icon">
                      ♙
                    </span>

                    <strong>
                      {searchTerm.trim()
                        ? "No se encontraron pacientes"
                        : "No hay pacientes registrados"}
                    </strong>

                    <span>
                      {searchTerm.trim()
                        ? "Intenta buscar con otro nombre o apellido."
                        : "Registra un paciente para comenzar a llenar el directorio de tu clínica."}
                    </span>

                    {!searchTerm.trim() && (
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
                paginatedPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="patients-page__person">
                        <span className="patients-page__avatar">
                          {(patient.first_name || "?")
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        {patient.first_name}{" "}
                        {patient.last_name}
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
                          <Eye
                            size={18}
                            aria-hidden="true"
                          />
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
                          <Pencil
                            size={18}
                            aria-hidden="true"
                          />
                        </button>

                        <button
                          type="button"
                          className="patients-page__delete-action"
                          title="Eliminar paciente"
                          aria-label={`Eliminar ${patient.first_name}`}
                          onClick={() =>
                            setDeleteTarget(patient)
                          }
                        >
                          <Trash2
                            size={18}
                            aria-hidden="true"
                          />
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
            {searchTerm.trim()
              ? `${filteredPatients.length} pacientes encontrados`
              : `${patients.length} pacientes registrados`}
            {" · "}
            Página {currentPage} de {totalPages}
          </span>

          <div>
            <button
              type="button"
              className="patient-button patient-button--secondary"
              disabled={loading || currentPage <= 1}
              onClick={() =>
                setCurrentPage((page) => page - 1)
              }
            >
              Anterior
            </button>

            <button
              type="button"
              className="patient-button patient-button--secondary"
              disabled={
                loading || currentPage >= totalPages
              }
              onClick={() =>
                setCurrentPage((page) => page + 1)
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
            if (!saving) {
              setDeleteTarget(null);
            }
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </main>
  );
}
