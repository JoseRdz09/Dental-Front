
import { useState } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";

import { useTreatments } from "../hooks/useTreatments";
import "../css/Treatments.css";

import type {
  Treatment,
  UpdateTreatmentPayload,
} from "../types/treatment";

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

  const formatPrice = (price: number | string) =>
    Number(price).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });

  // Loading
  if (loading) {
    return (
      <div className="treatments-loading">
        <Loader2 size={32} />
        <p>Loading treatments...</p>
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

            <h2 className="treatments__title">
              Treatments
            </h2>
          </div>

          <p className="treatments__description">
            Manage your clinic treatments and prices.
          </p>
        </div>

        <div className="treatments__count">
          <span className="treatments__dot" />
          <span>{treatments.length} treatments</span>
        </div>
      </div>

      {/* Table */}
      <div className="treatments__table-container">
        <div className="treatments__table-scroll">
          <table className="treatments__table">

            <thead>
              <tr>
                <th>Treatment</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
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
                        No treatments registered
                      </p>

                      <p className="treatments__empty-description">
                        Your clinic treatments will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                treatments.map((treatment) => (
                  <tr key={treatment.id}>

                    {/* Treatment */}
                    <td>
                      <p className="treatments__name">
                        {treatment.name}
                      </p>

                      <p className="treatments__detail">
                        {treatment.description || "No description"}
                      </p>
                    </td>

                    {/* Duration */}
                    <td>
                      <div className="treatments__duration">
                        <Clock size={16} />
                        <span>{treatment.duration} min</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td>
                      <span className="treatments__price">
                        {formatPrice(treatment.price)}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      {treatment.is_active ? (
                        <span className="treatments__status treatments__status--active">
                          <CheckCircle size={13} />
                          Active
                        </span>
                      ) : (
                        <span className="treatments__status treatments__status--inactive">
                          <XCircle size={13} />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="treatments__actions">
                        <button
                          type="button"
                          onClick={() => openEditModal(treatment)}
                          title="Edit treatment"
                          className="treatments__action treatments__action--edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(treatment)}
                          disabled={
                            deletingId === treatment.id || deleting
                          }
                          title="Delete treatment"
                          className="treatments__action treatments__action--delete"
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

        {/* Footer */}
        {treatments.length > 0 && (
          <div className="treatments__footer">
            <p>
              Showing {treatments.length} registered treatments
            </p>
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
