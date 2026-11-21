
import { useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Timer,
  DollarSign,
  Stethoscope,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

import { useTreatments } from "../hooks/useTreatments";
import "../css/Treatments.css";

import type {
  Treatment,
  UpdateTreatmentPayload,
} from "../types/treatment";
import LoadingScreen from "../../../../assets/shared/components/LoadingScreen";

interface TreatmentsPageProps {
  clinicId: number;
}

interface TreatmentForm {
  name: string;
  description: string;
  duration: string;
  price: string;
  is_active: boolean;
}

const INITIAL_FORM: TreatmentForm = {
  name: "",
  description: "",
  duration: "30",
  price: "0",
  is_active: true,
};

export default function TreatmentsPage({
  clinicId,
}: TreatmentsPageProps) {
  const {
    treatments,
    loading,
    error,
    updateTreatment,
    deleteTreatment,
    updating,
    deleting,
  } = useTreatments(clinicId);

  const [selectedTreatment, setSelectedTreatment] =
    useState<Treatment | null>(null);

  const [form, setForm] = useState<TreatmentForm>(INITIAL_FORM);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const openEditModal = (treatment: Treatment) => {
    setSelectedTreatment(treatment);

    setForm({
      name: treatment.name,
      description: treatment.description ?? "",
      duration: String(treatment.duration),
      price: String(treatment.price),
      is_active: treatment.is_active,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTreatment(null);
    setForm(INITIAL_FORM);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedTreatment) return;

    const payload: UpdateTreatmentPayload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      duration: Number(form.duration),
      price: Number(form.price),
      is_active: form.is_active,
    };

    if (
      !payload.name ||
      !Number.isFinite(payload.duration) ||
      payload.duration! < 1 ||
      !Number.isFinite(payload.price) ||
      payload.price! < 0
    ) {
      toast.error("Please enter valid treatment information.");
      return;
    }

    try {
      await updateTreatment({
        treatmentId: selectedTreatment.id,
        payload,
      });

      toast.success("Treatment updated successfully.");
      closeModal();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error updating treatment."
      );
    }
  };

  const handleDelete = async (treatment: Treatment) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${treatment.name}"?`
    );

    if (!confirmed) return;

    setDeletingId(treatment.id);

    try {
      await deleteTreatment(treatment.id);
      toast.success("Treatment deleted successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error deleting treatment."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 8;

  // Normalize text (ignore accents and uppercase)
  const normalizeSearch = (value: string) => {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Filter treatments (accent-insensitive search)
  const filteredTreatments = treatments.filter((treatment) => {
    const search = normalizeSearch(searchTerm);

    const name = normalizeSearch(treatment.name);
    const description = normalizeSearch(
      treatment.description ?? ""
    );

    return (
      name.includes(search) ||
      description.includes(search)
    );
  });

  // Pagination
  const totalPages = Math.ceil(
    filteredTreatments.length / ITEMS_PER_PAGE
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedTreatments = filteredTreatments.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Reset pagination when searching
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Ensure current page is valid
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  

  const formatPrice = (price: number | string) =>
    Number(price).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });

  // Loading
  if (loading) {
    return (
      <div className="treatments-loading">
        <LoadingScreen />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="treatments-error">
        <p>
          {error instanceof Error
            ? error.message
            : "Error loading treatments."}
        </p>
      </div>
    );
  }

  return (
    <div className="treatments">

      {/* Header */}
      <div className="treatments__header">
        <div>
          <div className="treatments__heading">
            <div className="treatments__icon">
              <Stethoscope size={21} />
            </div>

            <h1 className="treatments__title">
              Tratamientos
            </h1>
          </div>

          <p className="treatments__description">
            Gestiona los tratamientos y precios de tu clínica.
          </p>
        </div>

        <div className="treatments__count">
          <span className="treatments__dot" />
          <span>{treatments.length} Tratamientos</span>
        </div>
      </div>

      {/* Search */}
      <div className="treatments__toolbar">
        <div className="treatments__search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Buscar tratamiento por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => handleSearch("")}
              title="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <span className="treatments__results">
          {filteredTreatments.length} resultados
        </span>
      </div>

      
      {/* Table */}
      <div className="treatments__table-container">
        <div className="treatments__table-scroll">
          <table className="treatments__table">
            <thead>
              <tr>
                <th>Tratamiento</th>
                <th>Duración</th>
                <th>Precio</th>
                <th>Status</th>
                <th className="treatments__actions-header">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {treatments.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="treatments__empty">
                      <div className="treatments__empty-icon">
                        <Stethoscope size={26} />
                      </div>

                      <p className="treatments__empty-title">
                        Sin tratamientos registrados
                      </p>

                      <p className="treatments__empty-description">
                        Aquí aparecerán tus tratamientos de la clínica.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredTreatments.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="treatments__empty">
                      <div className="treatments__empty-icon">
                        <Search size={26} />
                      </div>

                      <p className="treatments__empty-title">
                        No se encontraron tratamientos
                      </p>

                      <p className="treatments__empty-description">
                        Intenta buscar con otro nombre o descripción.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTreatments.map((treatment) => (
                  <tr key={treatment.id}>
                    <td>
                      <div className="treatments__info">
                        <p className="treatments__name">
                          {treatment.name}
                        </p>

                        <p className="treatments__detail">
                          {treatment.description || "Sin descripción"}
                        </p>
                      </div>
                    </td>

                    <td>
                      <div className="treatments__duration">
                        <Clock size={16} />
                        <span>{treatment.duration} min</span>
                      </div>
                    </td>

                    <td>
                      <span className="treatments__price">
                        {formatPrice(treatment.price)}
                      </span>
                    </td>

                    <td>
                      {treatment.is_active ? (
                        <span className="treatments__status treatments__status--active">
                          <CheckCircle size={13} />
                          Activo
                        </span>
                      ) : (
                        <span className="treatments__status treatments__status--inactive">
                          <XCircle size={13} />
                          Inactivo
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="treatments__actions">
                        <button
                          type="button"
                          onClick={() => openEditModal(treatment)}
                          title="Editar tratamiento"
                          className="treatments__action_edit_button"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(treatment)}
                          disabled={
                            deletingId === treatment.id || deleting
                          }
                          title="Eliminar tratamiento"
                          className="treatments__action_delete_button"
                        >
                          {deletingId === treatment.id ? (
                            <Loader2 size={16} />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredTreatments.length > 0 && (
          <div className="treatments__footer">
            <p>
              Mostrando{" "}
              <strong>{startIndex + 1}</strong>
              {" - "}
              <strong>
                {Math.min(
                  startIndex + ITEMS_PER_PAGE,
                  filteredTreatments.length
                )}
              </strong>
              {" de "}
              <strong>{filteredTreatments.length}</strong>
              {" tratamientos"}
            </p>

            {totalPages > 1 && (
              <div className="treatments__pagination">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  disabled={currentPage === 1}
                  className="treatments__page-btn"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={17} />
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`treatments__page-btn ${
                      currentPage === page
                        ? "treatments__page-btn--active"
                        : ""
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage === totalPages}
                  className="treatments__page-btn"
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Edit Modal */}
      {isModalOpen && selectedTreatment && (
        <div className="treatment-modal-overlay">

          <div className="treatment-modal">

            {/* Modal Header */}
            <div className="treatment-modal__header">
              <div className="treatment-modal__heading">
                <div className="treatment-modal__icon">
                  <Pencil size={20} />
                </div>

                <div>
                  <h3 className="treatment-modal__title">
                    Edit treatment
                  </h3>

                  <p className="treatment-modal__subtitle">
                    Update treatment information
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={updating}
                className="treatment-modal__close"
                title="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="treatment-form">

              {/* Name */}
              <div className="treatment-form__group">
                <label className="treatment-form__label">
                  Treatment name
                </label>

                <input
                  type="text"
                  required
                  maxLength={255}
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g. Dental cleaning"
                  className="treatment-form__input"
                />
              </div>

              {/* Description */}
              <div className="treatment-form__group">
                <label className="treatment-form__label">
                  Description
                </label>

                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe the treatment..."
                  className="treatment-form__textarea"
                />
              </div>

              {/* Duration and Price */}
              <div className="treatment-form__row">

                <div className="treatment-form__group">
                  <label className="treatment-form__label">
                    <Timer size={15} />
                    Duration (min)
                  </label>

                  <input
                    type="number"
                    required
                    min="1"
                    value={form.duration}
                    onChange={(e) =>
                      setForm({ ...form, duration: e.target.value })
                    }
                    className="treatment-form__input"
                  />
                </div>

                <div className="treatment-form__group">
                  <label className="treatment-form__label">
                    <DollarSign size={15} />
                    Price (MXN)
                  </label>

                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="treatment-form__input"
                  />
                </div>

              </div>

              {/* Active status */}
              <label className="treatment-form__active">
                <div>
                  <p className="treatment-form__active-title">
                    Active treatment
                  </p>

                  <p className="treatment-form__active-description">
                    Allow this treatment to be used in appointments.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_active: e.target.checked,
                    })
                  }
                  className="treatment-form__checkbox"
                />
              </label>

              {/* Modal Footer */}
              <div className="treatment-modal__footer">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={updating}
                  className="treatment-btn treatment-btn--cancel"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="treatment-btn treatment-btn--primary"
                >
                  {updating && (
                    <Loader2 size={16} />
                  )}

                  {updating ? "Saving..." : "Save changes"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
