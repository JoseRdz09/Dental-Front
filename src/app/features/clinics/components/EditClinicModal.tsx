
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Clinic } from "../types/clinic";
import toast from "react-hot-toast";
import axios from "axios";
import {
  updateClinic,
  deleteClinic,
  type UpdateClinicData,
} from "../services/clinicService";
import DeleteClinicModal from "./DeleteClinicModal";
import { Upload, X } from "lucide-react";
import "../css/EditClinicModal.css";

interface Props {
  clinic: Clinic;
  onClose: () => void;
  onSaved: (clinic: Clinic) => void;
  onDeleted: (clinicId: number) => void;
}

export default function EditClinicModal({
  clinic,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [form, setForm] = useState<UpdateClinicData>(() => ({
    name: clinic.name ?? "",
    email: clinic.email ?? "",
    phone: clinic.phone ?? "",
    address: clinic.address ?? "",
    status: clinic.status ?? "active",
    timezone: clinic.timezone ?? "America/Mexico_City",
  }));

  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const busy = saving || deleting;

  function handleChange(
    field: keyof UpdateClinicData,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleLogoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Selecciona una imagen JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("El logotipo no debe superar los 2 MB.");
      event.target.value = "";
      return;
    }

    setSelectedLogo(file);
  }

  function removeSelectedLogo() {
    setSelectedLogo(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (busy) return;

    setSaving(true);

    const toastId = toast.loading("Actualizando clínica...");

    try {
      const updatedClinic = await updateClinic(clinic.id, {
        ...form,
        logo_file: selectedLogo,
      });

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

          message = validationErrors
            ? Object.values(validationErrors).flat().join(" ")
            : data?.message ??
              "Los datos proporcionados no son válidos.";
        } else if (status === 401) {
          message = "Tu sesión expiró. Inicia sesión nuevamente.";
        } else if (status === 403) {
          message =
            "No tienes permisos para actualizar esta clínica.";
        } else if (status === 404) {
          message =
            "La clínica no existe o ya no está disponible.";
        } else if (!error.response) {
          message =
            "No se pudo conectar con el servidor. Verifica tu conexión.";
        } else if (data?.message) {
          message = data.message;
        }
      }

      toast.error(message, { id: toastId });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (busy) return;

    setDeleting(true);

    const toastId = toast.loading("Eliminando clínica...");

    try {
      await deleteClinic(clinic.id);

      toast.success("Clínica eliminada correctamente.", {
        id: toastId,
      });

      onDeleted(clinic.id);
      onClose();
    } catch (error: unknown) {
      let message = "No se pudo eliminar la clínica.";

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 401) {
          message = "Tu sesión expiró. Inicia sesión nuevamente.";
        } else if (status === 403) {
          message =
            "No tienes permisos para eliminar esta clínica.";
        } else if (status === 404) {
          message =
            "La clínica no existe o ya fue eliminada.";
        } else if (!error.response) {
          message = "No se pudo conectar con el servidor.";
        } else if (data?.message) {
          message = data.message;
        }
      }

      toast.error(message, { id: toastId });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        className="clinic-modal-overlay"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !busy &&
            !confirmDelete
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
              <h2 id="edit-clinic-title">Editar clínica</h2>
              <p>Actualiza la información de la clínica.</p>
            </div>

            <button
              type="button"
              className="clinic-modal-close"
              onClick={onClose}
              disabled={busy || confirmDelete}
              aria-label="Cerrar modal"
            >
              ×
            </button>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="clinic-modal-fields">

              {/* LOGOTIPO */}
              <div className="clinic-logo-section">
                <div className="clinic-logo-info">
                  <div className="clinic-logo-heading">
                    <div className="clinic-logo-title">
                      <strong>Logotipo de la clínica</strong>
                      <span>Identifica visualmente tu clínica.</span>
                    </div>

                    <span className="clinic-logo-format">
                      JPG · PNG · WEBP
                    </span>
                  </div>

                  <div className="clinic-logo-actions">
                    <button
                      type="button"
                      className="clinic-logo-upload"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={busy}
                    >
                      <Upload size={17} strokeWidth={2} />
                      {selectedLogo ? "Cambiar imagen" : "Subir logotipo"}
                    </button>

                    {selectedLogo && (
                      <button
                        type="button"
                        className="clinic-logo-remove"
                        onClick={removeSelectedLogo}
                        disabled={busy}
                        aria-label="Cancelar imagen seleccionada"
                        title="Cancelar imagen seleccionada"
                      >
                        <X size={17} />
                      </button>
                    )}
                  </div>

                  <span className="clinic-logo-hint">
                    <span className="clinic-logo-hint-dot" />
                    Formatos JPG, PNG o WEBP. Tamaño máximo de 2 MB.
                  </span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoChange}
                    hidden
                    disabled={busy}
                  />
                </div>

              </div>

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
                className="clinic-btn-delete"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                Eliminar clínica
              </button>

              <button
                type="button"
                className="clinic-btn-cancel"
                onClick={onClose}
                disabled={busy || confirmDelete}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="clinic-btn-save"
                disabled={busy || confirmDelete}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </footer>
          </form>
        </section>
      </div>

      {confirmDelete && (
        <DeleteClinicModal
          clinicName={clinic.name}
          deleting={deleting}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
