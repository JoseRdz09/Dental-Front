
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

// Obtener fecha local YYYY-MM-DD
const getLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Obtener hora local HH:mm
const getLocalTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

// Obtener el siguiente múltiplo de 5 estrictamente posterior
// a la hora actual.
//
// 10:37 -> 10:40
// 10:40 -> 10:45
// 10:43 -> 10:45
// 10:55 -> 11:00
const getNextFiveMinuteSlot = (date: Date): Date => {
  const next = new Date(date);

  const totalMinutes =
    next.getHours() * 60 + next.getMinutes();

  const nextMinutes =
    (Math.floor(totalMinutes / 5) + 1) * 5;

  next.setHours(0, nextMinutes, 0, 0);

  return next;
};

// Obtener el siguiente múltiplo de 5 posterior a una hora.
// Se utiliza para calcular la hora mínima de finalización.
//
// 10:37 -> 10:40
// 10:40 -> 10:45
const getNextFiveMinuteTime = (time: string): string => {
  if (!time) return "00:00";

  const [hours, minutes] = time.split(":").map(Number);

  const totalMinutes = hours * 60 + minutes;

  const nextMinutes =
    (Math.floor(totalMinutes / 5) + 1) * 5;

  const normalizedHours = Math.floor(nextMinutes / 60) % 24;
  const normalizedMinutes = nextMinutes % 60;

  return `${String(normalizedHours).padStart(2, "0")}:${String(
    normalizedMinutes,
  ).padStart(2, "0")}`;
};

// Validar intervalos de 5 minutos
const isFiveMinuteInterval = (time: string): boolean => {
  if (!time) return false;

  const [, minutes] = time.split(":");

  return Number(minutes) % 5 === 0;
};

// Convertir fecha y hora local a Date
const getSelectedDateTime = (
  date: string,
  time: string,
): Date => {
  return new Date(`${date}T${time}:00`);
};

export default function AppointmentFormModal({
  mode,
  initialValues,
  options,
  onSubmit,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [values, setValues] = useState<AppointmentFormValues>(
    initialValues,
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Mantener actualizada la hora mientras el modal está abierto.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  // Abrir modal
  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // Estados para busqueda de pacinetes
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientResults, setShowPatientResults] = useState(false);

  const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Fecha actual
  const today = getLocalDate(now);

  // Comprobar si se conserva la fecha original.
  const isOriginalDate =
    mode === "edit" &&
    values.date === initialValues.date;

  // Comprobar si se conserva la hora original de inicio.
  const isOriginalStartTime =
    isOriginalDate &&
    values.startTime === initialValues.startTime;

  // Comprobar si se conserva la hora original de finalización.
  const isOriginalEndTime =
    isOriginalDate &&
    values.endTime === initialValues.endTime;

  // Comprobar si se conserva todo el horario original.
  const isOriginalSchedule =
    isOriginalStartTime && isOriginalEndTime;

  // ¿La cita seleccionada corresponde a hoy?
  const isToday = values.date === today;

  // Calcular siguiente horario disponible.
  const nextSlot = getNextFiveMinuteSlot(now);

  const nextSlotDate = getLocalDate(nextSlot);
  const nextSlotTime = getLocalTime(nextSlot);

  // Fecha mínima:
  // - Crear: hoy.
  // - Editar una cita pasada conservando su fecha: fecha original.
  // - Editar cambiando la fecha: hoy.
  const minDate =
    mode === "edit" &&
    isOriginalDate &&
    initialValues.date < today
      ? initialValues.date
      : today;

  // Hora mínima de inicio:
  //
  // Crear cita:
  // - Hoy: siguiente múltiplo de 5 posterior a la hora actual.
  // - Futuro: 00:00.
  //
  // Editar:
  // - Si conserva la hora original, permitir visualizarla aunque haya pasado.
  // - Si cambia la hora, aplicar las restricciones normales.
  const minStartTime = isOriginalStartTime
    ? "00:00"
    : isToday
      ? nextSlotDate === today
        ? nextSlotTime
        : undefined
      : "00:00";

  // Determinar si ya no quedan horarios disponibles hoy.
  // No bloquear cuando se está conservando el horario original.
  const noMoreSlotsToday =
    isToday &&
    nextSlotDate !== today &&
    !isOriginalStartTime;

  // La hora de finalización debe ser posterior al inicio.
  // Se utiliza el siguiente múltiplo de 5 para no desplazar
  // la referencia de step a un minuto distinto de múltiplo de 5.
  const minEndTime = values.startTime
    ? getNextFiveMinuteTime(values.startTime)
    : "00:00";

  // Actualizar campos generales
  const setField =
    (field: keyof AppointmentFormValues) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const value = e.target.value;

      setValues((prev) => ({
        ...prev,
        [field]: value,
      }));

      setError(null);
    };

  // Cambiar paciente
  const handlePatientChange = (
    e: ChangeEvent<HTMLSelectElement>,
  ) => {
    const id = e.target.value;

    setValues((prev) => ({
      ...prev,
      patientId: id ? Number(id) : null,
    }));

    setError(null);
  };

  // Cambiar tratamiento
  const handleTreatmentChange = (
    e: ChangeEvent<HTMLSelectElement>,
  ) => {
    const id = e.target.value;

    setValues((prev) => ({
      ...prev,
      treatmentId: id ? Number(id) : null,
    }));

    setError(null);
  };

  // Cambiar dentista
  const handleDentistChange = (
    e: ChangeEvent<HTMLSelectElement>,
  ) => {
    const id = e.target.value;

    setValues((prev) => ({
      ...prev,
      dentistUserId: id ? Number(id) : null,
    }));

    setError(null);
  };

  // Cambiar fecha
  const handleDateChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const date = e.target.value;

    setValues((prev) => {
      let startTime = prev.startTime;
      let endTime = prev.endTime;

      const currentNow = new Date();

      const currentToday = getLocalDate(currentNow);

      const currentNextSlot =
        getNextFiveMinuteSlot(currentNow);

      const currentNextDate = getLocalDate(currentNextSlot);
      const currentNextTime = getLocalTime(currentNextSlot);

      // Si cambia a hoy, comprobar que el horario sea futuro.
      if (date === currentToday) {
        if (
          currentNextDate !== currentToday ||
          !startTime ||
          startTime < currentNextTime
        ) {
          startTime = "";
          endTime = "";
        }
      }

      return {
        ...prev,
        date,
        startTime,
        endTime,
      };
    });

    setError(null);
  };

  // Cambiar hora de inicio
  const handleStartTimeChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const startTime = e.target.value;

    setValues((prev) => ({
      ...prev,
      startTime,

      // Si la hora final ya no es posterior, limpiarla.
      endTime:
        prev.endTime && prev.endTime > startTime
          ? prev.endTime
          : "",
    }));

    setError(null);
  };

  // Enviar formulario
  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (saving) return;

    const submitNow = new Date();
    const submitToday = getLocalDate(submitNow);

    // Comprobar si se conserva la fecha original.
    const keepingOriginalDate =
      mode === "edit" &&
      values.date === initialValues.date;

    // Comprobar si se conserva la hora original de inicio.
    const keepingOriginalStart =
      keepingOriginalDate &&
      values.startTime === initialValues.startTime;

    // Comprobar si se conserva la hora original de finalización.
    const keepingOriginalEnd =
      keepingOriginalDate &&
      values.endTime === initialValues.endTime;

    // Validar fecha
    if (!values.date) {
      setError("Selecciona una fecha para la cita.");
      return;
    }

    // No permitir fechas pasadas al crear.
    // En edición se permite conservar la fecha original.
    if (
      values.date < submitToday &&
      !keepingOriginalDate
    ) {
      setError("No puedes agendar o reprogramar citas en días pasados.");
      return;
    }

    // Validar paciente
    if (values.patientId === null) {
      setError("Selecciona un paciente.");
      return;
    }

    // Validar tratamiento
    if (values.treatmentId === null) {
      setError("Selecciona un tratamiento.");
      return;
    }

    // Validar hora de inicio
    if (!values.startTime) {
      setError("Selecciona una hora de inicio.");
      return;
    }

    // Validar hora de finalización
    if (!values.endTime) {
      setError("Selecciona una hora de finalización.");
      return;
    }

    // Validar múltiplos de 5.
    // Si se conserva la hora original, no se obliga a modificarla.
    if (
      !keepingOriginalStart &&
      !isFiveMinuteInterval(values.startTime)
    ) {
      setError(
        "La hora de inicio debe avanzar en intervalos de 5 minutos.",
      );
      return;
    }

    if (
      !keepingOriginalEnd &&
      !isFiveMinuteInterval(values.endTime)
    ) {
      setError(
        "La hora de finalización debe avanzar en intervalos de 5 minutos.",
      );
      return;
    }

    // Validar que la hora de inicio sea futura.
    // Se omite únicamente cuando se conserva la hora original.
    if (
      values.date === submitToday &&
      !keepingOriginalStart
    ) {
      const selectedStart = getSelectedDateTime(
        values.date,
        values.startTime,
      );

      if (selectedStart <= submitNow) {
        setError(
          "La hora de inicio debe ser posterior a la hora actual.",
        );
        return;
      }
    }

    // Validar que la hora final sea posterior al inicio.
    if (values.endTime <= values.startTime) {
      setError(
        "La hora de fin debe ser posterior a la de inicio.",
      );
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
      <form
        className="appt-modal__form"
        onSubmit={handleSubmit}
        noValidate
      >
        <h2
          id="appt-modal-title"
          className="appt-modal__title"
        >
          {mode === "create" ? "Nueva cita" : "Editar cita"}
        </h2>

        {/* PACIENTE */}
        <label className="appt-field">
          <span>Paciente</span>

          <div
            className="patient-search"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setShowPatientResults(false);
              }
            }}
          >
            <input
              className="patient-search__input"
              type="text"
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setShowPatientResults(true);
              }}
              onFocus={() => {
                if (patientSearch.trim()) {
                  setShowPatientResults(true);
                }
              }}
              placeholder="Buscar paciente..."
              autoComplete="off"
            />

            {showPatientResults && patientSearch.trim() !== "" && (
              <div className="patient-search-results">
                {options.patients
                  .filter((patient) =>
                    normalizeText(`${patient.first_name} ${patient.last_name}`)
                      .includes(normalizeText(patientSearch))
                  )
                  .slice(0, 10)
                  .map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        handlePatientChange({
                          target: { value: String(patient.id) },
                        } as React.ChangeEvent<HTMLSelectElement>);

                        setPatientSearch(
                          `${patient.first_name} ${patient.last_name}`
                        );

                        setShowPatientResults(false);
                      }}
                    >
                      {patient.first_name} {patient.last_name}
                    </button>
                  ))}

                {options.patients.filter((patient) =>
                  normalizeText(`${patient.first_name} ${patient.last_name}`)
                    .includes(normalizeText(patientSearch))
                ).length === 0 && (
                  <div className="patient-search-results__empty">
                    No se encontraron pacientes.
                  </div>
                )}
              </div>
            )}
          </div>
        </label>

        {/* TRATAMIENTO */}
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
                {treatment.name} — $
                {Number(treatment.price).toFixed(2)}
              </option>
            ))}
          </select>
        </label>

        {/* DENTISTA */}
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

        {/* FECHA Y HORARIO */}
        <div className="appt-row">
          {/* FECHA */}
          <label className="appt-field">
            <span>Fecha</span>

            <input
              type="date"
              value={values.date}
              min={minDate}
              onChange={handleDateChange}
              required
            />
          </label>

          {/* HORA DE INICIO */}
          <label className="appt-field">
            <span>Inicio</span>

            <input
              type="time"
              step={300}
              min={minStartTime}
              value={values.startTime}
              onChange={handleStartTimeChange}
              disabled={noMoreSlotsToday}
              required
            />
          </label>

          {/* HORA DE FINALIZACIÓN */}
          <label className="appt-field">
            <span>Fin</span>

            <input
              type="time"
              step={300}
              min={minEndTime}
              value={values.endTime}
              onChange={setField("endTime")}
              disabled={!values.startTime}
              required
            />
          </label>
        </div>

        {noMoreSlotsToday && (
          <p className="appt-modal__error" role="status">
            Ya no hay horarios disponibles para hoy. Selecciona otro día.
          </p>
        )}

        {/* ESTADO */}
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

        {/* DETALLES */}
        <label className="appt-field">
          <span>Detalles (opcional)</span>

          <textarea
            rows={3}
            value={values.details}
            onChange={setField("details")}
          />
        </label>

        {/* ERROR */}
        {error && (
          <p className="appt-modal__error" role="alert">
            {error}
          </p>
        )}

        {/* BOTONES */}
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
            disabled={saving || noMoreSlotsToday}
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
