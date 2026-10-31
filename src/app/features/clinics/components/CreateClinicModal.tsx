
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import { api } from "../../../../lib/axios";
import type { Clinic } from "../types/clinic";
import "../css/CreateClinicModal.css";

interface CreateClinicModalProps {
  onClose: () => void;
  onSaved: (clinic: Clinic) => void;
}

interface ClinicForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
}

type ClinicField = keyof ClinicForm;

export default function CreateClinicModal({
  onClose,
  onSaved,
}: CreateClinicModalProps) {
  const [form, setForm] = useState<ClinicForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    timezone: "America/Mexico_City",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] =
    useState<Record<string, string[]>>({});

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setValidationErrors((previous) => ({
      ...previous,
      [name]: [],
    }));

    setError("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    // Evita envíos repetidos mientras se procesa la petición.
    if (saving) return;

    setSaving(true);
    setError("");
    setValidationErrors({});

    try {
      const response = await api.post("/api/clinics", {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        timezone: form.timezone,
      });

      const clinic = response.data?.data as Clinic | undefined;

      // Verifica que Laravel haya devuelto la clínica creada.
      if (!clinic || clinic.id == null) {
        throw new Error(
          "El servidor no devolvió los datos de la clínica creada."
        );
      }

      // Notifica el éxito y comunica la clínica al componente padre.
      toast.success("¡Clínica creada correctamente!");

      // IMPORTANTE: ejecutar solamente una vez.
      onSaved(clinic);
    } catch (err: unknown) {
      console.error("Error al crear clínica:", err);

      if (axios.isAxiosError(err)) {
        console.error("URL solicitada:", err.config?.url);
        console.error("Código HTTP:", err.response?.status);
        console.error("Respuesta Laravel:", err.response?.data);

        if (err.response) {
          const status = err.response.status;
          const responseData = err.response.data;

          const message =
            responseData?.message ??
            `No se pudo crear la clínica. Error ${status}.`;

          setError(message);
          setValidationErrors(responseData?.errors ?? {});

          if (status === 422) {
            toast.error("Revisa los datos del formulario.");
          } else {
            toast.error(message);
          }
        } else {
          const message =
            "No se pudo conectar con el servidor. Inténtalo nuevamente.";

          setError(message);
          toast.error(message);
        }
      } else {
        const message =
          err instanceof Error
            ? err.message
            : "Ocurrió un error inesperado al crear la clínica.";

        setError(message);
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  }

  function renderValidationErrors(field: ClinicField) {
    return validationErrors[field]?.map((message, index) => (
      <small
        key={`${field}-${index}-${message}`}
        className="create-clinic-error"
      >
        {message}
      </small>
    ));
  }

  return (
    <div
      className="create-clinic-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        className="create-clinic-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-clinic-title"
      >
        <header className="create-clinic-header">
          <div>
            <h2 id="create-clinic-title">Agregar nueva clínica</h2>
            <p>Ingresa los datos de la nueva clínica.</p>
          </div>

          <button
            type="button"
            className="create-clinic-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          {error && (
            <p className="create-clinic-error" role="alert">
              {error}
            </p>
          )}

          <div className="create-clinic-field">
            <label htmlFor="clinic-name">Nombre de la clínica *</label>
            <input
              id="clinic-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              maxLength={255}
              required
              autoFocus
              placeholder="Ej. Clínica Dental Central"
            />
            {renderValidationErrors("name")}
          </div>

          <div className="create-clinic-field">
            <label htmlFor="clinic-email">Correo electrónico</label>
            <input
              id="clinic-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              maxLength={255}
              placeholder="contacto@clinica.com"
            />
            {renderValidationErrors("email")}
          </div>

          <div className="create-clinic-field">
            <label htmlFor="clinic-phone">Teléfono</label>
            <input
              id="clinic-phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              maxLength={10}
              inputMode="numeric"
              pattern="[0-9]{1,10}"
              title="Ingresa hasta 10 dígitos."
              placeholder="6181234567"
            />
            {renderValidationErrors("phone")}
          </div>

          <div className="create-clinic-field">
            <label htmlFor="clinic-address">Dirección</label>
            <textarea
              id="clinic-address"
              name="address"
              value={form.address}
              onChange={handleChange}
              maxLength={255}
              rows={2}
              placeholder="Dirección de la clínica"
            />
            {renderValidationErrors("address")}
          </div>

          <div className="create-clinic-field">
            <label htmlFor="clinic-timezone">Zona horaria *</label>
            <select
              id="clinic-timezone"
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
              required
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
            {renderValidationErrors("timezone")}
          </div>

          <footer className="create-clinic-actions">
            <button
              type="button"
              className="create-clinic-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="create-clinic-submit"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Crear clínica"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
