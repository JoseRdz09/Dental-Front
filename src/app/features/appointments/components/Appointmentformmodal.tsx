import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { STATUS_OPTIONS } from "../constants/Appointmentstatus";
import type { AppointmentFormValues } from "../types/appointmentForm";
import "../css/Appointmentformmodal.css";

interface Props {
  mode: "create" | "edit";
  initialValues: AppointmentFormValues;
  onSubmit: (values: AppointmentFormValues) => Promise<void> | void;
  onClose: () => void;
}

/**
 * La página lo monta solo cuando hay que mostrarlo (y lo desmonta al cerrar),
 * por eso el estado inicial sale de `initialValues` y no hace falta resetearlo.
 */
export default function AppointmentFormModal({
  mode,
  initialValues,
  onSubmit,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // <dialog> nativo: foco atrapado, Esc para cerrar y accesibilidad gratis
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const setField =
    (field: keyof AppointmentFormValues) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !values.patientName.trim() ||
      !values.treatment.trim() ||
      !values.dentist.trim()
    ) {
      setError("Escribe el paciente, el tratamiento y el dentista.");
      return;
    }
    if (values.endTime <= values.startTime) {
      setError("La hora de fin debe ser posterior a la de inicio.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSubmit({
        ...values,
        patientName: values.patientName.trim(),
        treatment: values.treatment.trim(),
        dentist: values.dentist.trim(),
        details: values.details.trim(),
      });
    } catch {
      setError("No se pudo guardar la cita. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="appt-modal"
      aria-labelledby="appt-modal-title"
      onClose={onClose}
      onClick={(e) => {
        // clic en el fondo (fuera del formulario) cierra
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <form className="appt-modal__form" onSubmit={handleSubmit} noValidate>
        <h2 id="appt-modal-title" className="appt-modal__title">
          {mode === "create" ? "Nueva cita" : "Editar cita"}
        </h2>

        <label className="appt-field">
          <span>Paciente</span>
          <input
            type="text"
            value={values.patientName}
            onChange={setField("patientName")}
            autoFocus
            required
          />
        </label>

        <label className="appt-field">
          <span>Tratamiento</span>
          <input
            type="text"
            value={values.treatment}
            onChange={setField("treatment")}
            required
          />
        </label>

        <label className="appt-field">
          <span>Dentista</span>
          <input
            type="text"
            value={values.dentist}
            onChange={setField("dentist")}
            required
          />
        </label>

        <div className="appt-row">
          <label className="appt-field">
            <span>Fecha</span>
            <input type="date" value={values.date} onChange={setField("date")} required />
          </label>
          <label className="appt-field">
            <span>Inicio</span>
            <input
              type="time"
              step={900}
              value={values.startTime}
              onChange={setField("startTime")}
              required
            />
          </label>
          <label className="appt-field">
            <span>Fin</span>
            <input
              type="time"
              step={900}
              value={values.endTime}
              onChange={setField("endTime")}
              required
            />
          </label>
        </div>

        <label className="appt-field">
          <span>Estado</span>
          <select value={values.status} onChange={setField("status")}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="appt-field">
          <span>Detalles (opcional)</span>
          <textarea
            rows={3}
            value={values.details}
            onChange={setField("details")}
          />
        </label>

        {error && (
          <p className="appt-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="appt-modal__actions">
          <button type="button" className="appt-btn" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="appt-btn appt-btn--primary" disabled={saving}>
            {saving ? "Guardando…" : mode === "create" ? "Guardar cita" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </dialog>
  );
}