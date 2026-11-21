
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Timer,
  DollarSign,
  Stethoscope,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { createTreatment } from "../services/treatmentService";
import { TREATMENTS_QUERY_KEY } from "../hooks/useTreatments";

import type { CreateTreatmentPayload } from "../types/treatment";

interface Props {
  clinicId: number;
  onClose: () => void;
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

export default function CreateTreatmentModal({
  clinicId,
  onClose,
}: Props) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<TreatmentForm>(INITIAL_FORM);

  const createMutation = useMutation({
    mutationFn: (payload: CreateTreatmentPayload) =>
      createTreatment(clinicId, payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...TREATMENTS_QUERY_KEY, clinicId],
      });

      toast.success("Tratamiento creado correctamente.");
      onClose();
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al crear el tratamiento."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = form.name.trim();
    const duration = Number(form.duration);
    const price = Number(form.price);

    if (
      !name ||
      !Number.isInteger(duration) ||
      duration < 1 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      toast.error("Verifica los datos del tratamiento.");
      return;
    }

    const payload: CreateTreatmentPayload = {
      name,
      description: form.description.trim() || null,
      duration,
      price,
      is_active: form.is_active,
    };

    createMutation.mutate(payload);
  };

  const creating = createMutation.isPending;

  return (
    <div
      className="treatment-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !creating) {
          onClose();
        }
      }}
    >
      <div
        className="treatment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-treatment-title"
      >
        <div className="treatment-modal__header">
          <div className="treatment-modal__heading">
            <div className="treatment-modal__icon">
              <Stethoscope size={20} />
            </div>

            <div>
              <h3
                id="create-treatment-title"
                className="treatment-modal__title"
              >
                Nuevo tratamiento
              </h3>

              <p className="treatment-modal__subtitle">
                Registra un tratamiento para tu clínica.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="treatment-modal__close"
            title="Cerrar"
          >
            <X size={19} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="treatment-form"
        >
          <div className="treatment-form__group">
            <label className="treatment-form__label">
              Nombre del tratamiento
            </label>

            <input
              type="text"
              required
              maxLength={255}
              autoFocus
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Ej. Resina dental"
              className="treatment-form__input"
            />
          </div>

          <div className="treatment-form__group">
            <label className="treatment-form__label">
              Descripción
            </label>

            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              placeholder="Describe el tratamiento..."
              className="treatment-form__textarea"
            />
          </div>

          <div className="treatment-form__row">
            <div className="treatment-form__group">
              <label className="treatment-form__label">
                <Timer size={15} />
                Duración (min)
              </label>

              <input
                type="number"
                required
                min="1"
                step="1"
                value={form.duration}
                onChange={(e) =>
                  setForm({
                    ...form,
                    duration: e.target.value,
                  })
                }
                className="treatment-form__input"
              />
            </div>

            <div className="treatment-form__group">
              <label className="treatment-form__label">
                <DollarSign size={15} />
                Precio (MXN)
              </label>

              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value,
                  })
                }
                className="treatment-form__input"
              />
            </div>
          </div>

          <label className="treatment-form__active">
            <div>
              <p className="treatment-form__active-title">
                Tratamiento activo
              </p>

              <p className="treatment-form__active-description">
                Disponible para utilizarse en citas.
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

          <div className="treatment-modal__footer">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="treatment-btn treatment-btn--cancel"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={creating}
              className="treatment-btn treatment-btn--primary"
            >
              {creating && <Loader2 size={16} />}

              {creating
                ? "Guardando..."
                : "Crear tratamiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
