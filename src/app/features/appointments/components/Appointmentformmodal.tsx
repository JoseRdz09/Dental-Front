
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { STATUS_OPTIONS } from "../constants/Appointmentstatus";
import type { AppointmentFormValues } from "../types/appointmentForm";

import type {
  ApiAppointmentOptions,
} from "../services/appointmentService";

import "../css/Appointmentformmodal.css";

interface Props {
  mode: "create" | "edit";
  initialValues: AppointmentFormValues;
  options: ApiAppointmentOptions;
  onSubmit: (values: AppointmentFormValues) => Promise<void> | void;
  onClose: () => void;
}

export default function AppointmentFormModal({
  mode,
  initialValues,
  options,
  onSubmit,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const setField =
    (field: keyof AppointmentFormValues) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setValues((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handlePatientChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;

    setValues((prev) => ({
      ...prev,
      patientId: id ? Number(id) : null,
    }));
  };

  const handleTreatmentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;

    setValues((prev) => ({
      ...prev,
      treatmentId: id ? Number(id) : null,
    }));
  };

  const handleDentistChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;

    setValues((prev) => ({
      ...prev,
      dentistUserId: id ? Number(id) : null,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (values.patientId === null) {
      setError("Selecciona un paciente.");
      return;
    }

    if (values.treatmentId === null) {
      setError("Selecciona un tratamiento.");
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
        details: values.details.trim(),
      });
    } catch (err) {
      console.error("Error al guardar la cita:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la cita. Inténtalo de nuevo.",
      );
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
        if (e.target === dialogRef.current && !saving) {
          onClose();
        }
      }}
    >
      <form className="appt-modal__form" onSubmit={handleSubmit} noValidate>
        <h2 id="appt-modal-title" className="appt-modal__title">
          {mode === "create" ? "Nueva cita" : "Editar cita"}
        </h2>

        <label className="appt-field">
          <span>Paciente</span>

          <select
            value={values.patientId ?? ""}
            onChange={handlePatientChange}
            required
          >
            <option value="">Selecciona un paciente</option>

            {options.patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name}
              </option>
            ))}
          </select>
        </label>

        <label className="appt-field">
          <span>Tratamiento</span>

          <select
            value={values.treatmentId ?? ""}
            onChange={handleTreatmentChange}
            required
          >
            <option value="">Selecciona un tratamiento</option>

            {options.treatments.map((treatment) => (
              <option key={treatment.id} value={treatment.id}>
                {treatment.name} — ${Number(treatment.price).toFixed(2)}
              </option>
            ))}
          </select>
        </label>

        <label className="appt-field">
          <span>Dentista</span>

          <select
            value={values.dentistUserId ?? ""}
            onChange={handleDentistChange}
          >
            <option value="">Sin asignar</option>

            {options.dentists.map((dentist) => (
              <option key={dentist.id} value={dentist.id}>
                {dentist.name}
              </option>
            ))}
          </select>
        </label>

        <div className="appt-row">
          <label className="appt-field">
            <span>Fecha</span>

            <input
              type="date"
              value={values.date}
              onChange={setField("date")}
              required
            />
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

          <select
            value={values.status}
            onChange={setField("status")}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
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
          <button
            type="button"
            className="appt-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="appt-btn appt-btn--primary"
            disabled={saving}
          >
            {saving
              ? "Guardando…"
              : mode === "create"
                ? "Guardar cita"
                : "Guardar cambios"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
