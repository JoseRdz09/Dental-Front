
import { useState } from "react";
import type { FormEvent } from "react";
import type { Clinic } from "../types/clinic";
import toast from "react-hot-toast";
import axios from "axios";
import {
  updateClinic,
  type UpdateClinicData,
} from "../services/clinicService";
import "../css/EditClinicModal.css";

interface Props {
  clinic: Clinic;
  onClose: () => void;
  onSaved: (clinic: Clinic) => void;
}

export default function EditClinicModal({
  clinic,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<UpdateClinicData>(() => ({
    name: clinic.name ?? "",
    email: clinic.email ?? "",
    phone: clinic.phone ?? "",
    address: clinic.address ?? "",
    status: clinic.status ?? "active",
    timezone: clinic.timezone ?? "America/Mexico_City",
  }));

  const [saving, setSaving] = useState(false);

  function handleChange(
    field: keyof UpdateClinicData,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);

    const toastId = toast.loading("Actualizando clínica...");

    try {
      const updatedClinic = await updateClinic(
        clinic.id,
        form
      );

      toast.success("Clínica actualizada correctamente.", {
        id: toastId,
      });

      onSaved(updatedClinic);
    } catch (error: unknown) {
      let message =
        "No se pudo actualizar la clínica. Inténtalo nuevamente.";

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 422) {
          const validationErrors = data?.errors as
            | Record<string, string[]>
            | undefined;

          message =
            validationErrors
              ? Object.values(validationErrors)
                  .flat()
                  .join(" ")
              : data?.message ??
                "Los datos proporcionados no son válidos.";
        } else if (status === 401) {
          message = "Tu sesión expiró. Inicia sesión nuevamente.";
        } else if (status === 403) {
          message = "No tienes permisos para actualizar esta clínica.";
        } else if (status === 404) {
          message = "La clínica no existe o ya no está disponible.";
        } else if (!error.response) {
          message =
            "No se pudo conectar con el servidor. Verifica tu conexión.";
        } else if (data?.message) {
          message = data.message;
        }
      }

      toast.error(message, {
        id: toastId,
      });
    } finally {
      setSaving(false);
    }
  }


  return (
    <div
      className="clinic-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <section
        className="clinic-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-clinic-title"
      >
        <header className="clinic-modal-header">
          <div>
            <h2 id="edit-clinic-title">
              Editar clínica
            </h2>
            <p>
              Actualiza la información de la clínica.
            </p>
          </div>

          <button
            type="button"
            className="clinic-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="clinic-modal-fields">
            <label>
              Nombre de la clínica *
              <input
                required
                maxLength={255}
                value={form.name}
                onChange={(event) =>
                  handleChange("name", event.target.value)
                }
              />
            </label>

            <label>
              Correo electrónico
              <input
                type="email"
                maxLength={255}
                value={form.email}
                onChange={(event) =>
                  handleChange("email", event.target.value)
                }
              />
            </label>

            <label>
              Teléfono
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                value={form.phone}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10);

                  handleChange("phone", value);
                }}
                title="Ingresa un teléfono de exactamente 10 dígitos"
              />
            </label>

            <label>
              Dirección
              <input
                maxLength={255}
                value={form.address}
                onChange={(event) =>
                  handleChange("address", event.target.value)
                }
              />
            </label>


            <label>
              Zona horaria
              <select
                value={form.timezone}
                onChange={(event) =>
                  handleChange("timezone", event.target.value)
                }
              >
                <option value="America/Mexico_City">
                  Ciudad de México
                </option>
                <option value="America/Monterrey">
                  Monterrey
                </option>
                <option value="America/Mazatlan">
                  Mazatlán
                </option>
                <option value="America/Tijuana">
                  Tijuana
                </option>
              </select>
            </label>
          </div>

          <footer className="clinic-modal-actions">
            <button
              type="button"
              className="clinic-btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="clinic-btn-save"
              disabled={saving}
            >
              {saving
                ? "Guardando..."
                : "Guardar cambios"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
