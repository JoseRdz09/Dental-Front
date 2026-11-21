
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { STATUS_OPTIONS } from "../constants/Appointmentstatus";

import type {
  AppointmentFormValues,
  ApiError,
} from "../types/appointmentForm";

import type {
  ApiAppointmentOptions,
} from "../services/appointmentService";

import { usePatientSearch } from "../hooks/useAppointments";

import "../css/Appointmentformmodal.css";
import LoadingScreen from "../../../../assets/shared/components/LoadingScreen";

interface Props {
  mode: "create" | "edit";
  initialValues: AppointmentFormValues;
  options: ApiAppointmentOptions;
  clinicId: number;
  initialPatientName?: string;
  onSubmit: (values: AppointmentFormValues) => Promise<void> | void;
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  patient_id: "Paciente",
  treatment_id: "Tratamiento",
  dentist_user_id: "Dentista",
  clinic_id: "Clínica",
  start_at: "Hora de inicio",
  end_at: "Hora de finalización",
  status: "Estado",
  title: "Título",
  notes: "Detalles",
  treatment_price: "Precio del tratamiento",
};

// ==========================================
// OBTENER MENSAJES DE ERRORES DEL BACKEND
// ==========================================

const getAppointmentError = (err: unknown): string => {
  const error = err as ApiError;

  const status = error.response?.status;
  const data = error.response?.data;

  if (status === 422) {
    if (data?.errors) {
      const messages = Object.entries(data.errors).flatMap(
        ([field, fieldMessages]) => {
          const label = FIELD_LABELS[field] ?? field;

          const normalizedMessages = Array.isArray(fieldMessages)
            ? fieldMessages
            : [fieldMessages];

          return normalizedMessages.map(
            (message) => `${label}: ${message}`
          );
        }
      );

      return messages.length > 0
        ? messages.join("\n")
        : data.message ?? "Revisa los datos de la cita.";
    }

    return data?.message ?? "Los datos enviados no son válidos.";
  }

  if (status === 401) {
    return "Tu sesión ha expirado. Inicia sesión nuevamente.";
  }

  if (status === 403) {
    return "No tienes permisos para realizar esta operación.";
  }

  if (status === 404) {
    return "No se encontró la cita o alguno de los recursos seleccionados.";
  }

  if (status === 409) {
    return "Existe un conflicto con el horario seleccionado.";
  }

  if (status && status >= 500) {
    return "Ocurrió un error en el servidor. Inténtalo nuevamente.";
  }

  return (
    data?.message ??
    error.message ??
    "No se pudo guardar la cita. Inténtalo nuevamente."
  );
};

// ==========================================
// FECHA LOCAL YYYY-MM-DD
// ==========================================

const getLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ==========================================
// HORA LOCAL HH:mm
// ==========================================

const getLocalTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

// ==========================================
// SIGUIENTE MÚLTIPLO DE 5 MINUTOS
// ==========================================

const getNextFiveMinuteSlot = (date: Date): Date => {
  const next = new Date(date);

  const totalMinutes =
    next.getHours() * 60 + next.getMinutes();

  const nextMinutes =
    (Math.floor(totalMinutes / 5) + 1) * 5;

  next.setHours(0, nextMinutes, 0, 0);

  return next;
};

// ==========================================
// SIGUIENTE MÚLTIPLO DE 5 PARA UNA HORA
// ==========================================

const getNextFiveMinuteTime = (time: string): string => {
  if (!time) return "00:00";

  const [hours, minutes] = time.split(":").map(Number);

  const totalMinutes = hours * 60 + minutes;

  const nextMinutes =
    (Math.floor(totalMinutes / 5) + 1) * 5;

  const normalizedHours = Math.floor(nextMinutes / 60) % 24;
  const normalizedMinutes = nextMinutes % 60;

  return `${String(normalizedHours).padStart(2, "0")}:${String(
    normalizedMinutes
  ).padStart(2, "0")}`;
};

// ==========================================
// VALIDAR INTERVALOS DE 5 MINUTOS
// ==========================================

const isFiveMinuteInterval = (time: string): boolean => {
  if (!time) return false;

  const [, minutes] = time.split(":");

  return Number(minutes) % 5 === 0;
};

// ==========================================
// FECHA Y HORA LOCAL A DATE
// ==========================================

const getSelectedDateTime = (
  date: string,
  time: string
): Date => {
  return new Date(`${date}T${time}:00`);
};

// ==========================================
// COMPONENTE
// ==========================================

export default function AppointmentFormModal({
  mode,
  initialValues,
  options,
  clinicId,
  initialPatientName = "",
  onSubmit,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [values, setValues] = useState<AppointmentFormValues>({
    ...initialValues,
    patientId:
      initialValues.patientId == null
        ? null
        : Number(initialValues.patientId),
    treatmentId:
      initialValues.treatmentId == null
        ? null
        : Number(initialValues.treatmentId),
    dentistUserId:
      initialValues.dentistUserId == null
        ? null
        : Number(initialValues.dentistUserId),
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // ==========================================
  // BÚSQUEDA DE PACIENTES
  // ==========================================

  const [patientSearch, setPatientSearch] = useState(
    initialPatientName
  );

  const [debouncedPatientSearch, setDebouncedPatientSearch] =
    useState("");

  const [showPatientResults, setShowPatientResults] =
    useState(false);

  // Esperar 300 ms antes de consultar el backend.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedPatientSearch(
        showPatientResults ? patientSearch.trim() : ""
      );
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [patientSearch, showPatientResults]);

  // Consultar pacientes de la clínica seleccionada.
  const {
    patients,
    loading: patientsLoading,
    error: patientsError,
  } = usePatientSearch(
    clinicId,
    debouncedPatientSearch
  );

  // ==========================================
  // SINCRONIZAR VALORES DEL FORMULARIO
  // ==========================================

  useEffect(() => {
    setValues({
      ...initialValues,
      patientId:
        initialValues.patientId == null
          ? null
          : Number(initialValues.patientId),
      treatmentId:
        initialValues.treatmentId == null
          ? null
          : Number(initialValues.treatmentId),
      dentistUserId:
        initialValues.dentistUserId == null
          ? null
          : Number(initialValues.dentistUserId),
    });

    setError(null);

    setPatientSearch(initialPatientName);
    setDebouncedPatientSearch("");
    setShowPatientResults(false);
  }, [
    initialValues.patientId,
    initialValues.treatmentId,
    initialValues.dentistUserId,
    initialValues.date,
    initialValues.startTime,
    initialValues.endTime,
    initialValues.status,
    initialValues.details,
    initialPatientName,
  ]);

  // ==========================================
  // MANTENER ACTUALIZADA LA HORA
  // ==========================================

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 15000);

    return () => window.clearInterval(interval);
  }, []);

  // ==========================================
  // ABRIR MODAL
  // ==========================================

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // ==========================================
  // VALIDACIONES DE FECHA Y HORARIO
  // ==========================================

  const today = getLocalDate(now);

  const isOriginalDate =
    mode === "edit" &&
    values.date === initialValues.date;

  const isOriginalStartTime =
    isOriginalDate &&
    values.startTime === initialValues.startTime;

  const isToday = values.date === today;

  const nextSlot = getNextFiveMinuteSlot(now);

  const nextSlotDate = getLocalDate(nextSlot);
  const nextSlotTime = getLocalTime(nextSlot);

  const minDate =
    mode === "edit" &&
    isOriginalDate &&
    initialValues.date < today
      ? initialValues.date
      : today;

  const minStartTime = isOriginalStartTime
    ? "00:00"
    : isToday
      ? nextSlotDate === today
        ? nextSlotTime
        : undefined
      : "00:00";

  const noMoreSlotsToday =
    isToday &&
    nextSlotDate !== today &&
    !isOriginalStartTime;

  const minEndTime = values.startTime
    ? getNextFiveMinuteTime(values.startTime)
    : "00:00";

  // ==========================================
  // ACTUALIZAR CAMPOS GENERALES
  // ==========================================

  const setField =
    (field: keyof AppointmentFormValues) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const value = e.target.value;

      setValues((prev) => ({
        ...prev,
        [field]: value,
      }));

      setError(null);
    };

  // ==========================================
  // CAMBIAR PACIENTE
  // ==========================================

  const handlePatientChange = (id: string) => {
    setValues((prev) => ({
      ...prev,
      patientId: id ? Number(id) : null,
    }));

    setError(null);
  };

  // ==========================================
  // CAMBIAR TRATAMIENTO
  // ==========================================

  const handleTreatmentChange = (
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    const id = e.target.value;

    setValues((prev) => ({
      ...prev,
      treatmentId: id ? Number(id) : null,
    }));

    setError(null);
  };

  // ==========================================
  // CAMBIAR DENTISTA
  // ==========================================

  const handleDentistChange = (
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    const id = e.target.value;

    setValues((prev) => ({
      ...prev,
      dentistUserId: id ? Number(id) : null,
    }));

    setError(null);
  };

  // ==========================================
  // CAMBIAR FECHA
  // ==========================================

  const handleDateChange = (
    e: ChangeEvent<HTMLInputElement>
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

  // ==========================================
  // CAMBIAR HORA DE INICIO
  // ==========================================

  const handleStartTimeChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const startTime = e.target.value;

    setValues((prev) => ({
      ...prev,
      startTime,
      endTime:
        prev.endTime && prev.endTime > startTime
          ? prev.endTime
          : "",
    }));

    setError(null);
  };

  // ==========================================
  // ENVIAR FORMULARIO
  // ==========================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (saving) return;

    const submitNow = new Date();
    const submitToday = getLocalDate(submitNow);

    const keepingOriginalDate =
      mode === "edit" &&
      values.date === initialValues.date;

    const keepingOriginalStart =
      keepingOriginalDate &&
      values.startTime === initialValues.startTime;

    const keepingOriginalEnd =
      keepingOriginalDate &&
      values.endTime === initialValues.endTime;

    // Validar fecha.
    if (!values.date) {
      setError("Selecciona una fecha para la cita.");
      return;
    }

    if (
      values.date < submitToday &&
      !keepingOriginalDate
    ) {
      setError(
        "No puedes agendar o reprogramar citas en días pasados."
      );
      return;
    }

    // Validar paciente.
    if (values.patientId === null) {
      setError("Selecciona un paciente.");
      return;
    }

    // Validar tratamiento.
    if (values.treatmentId === null) {
      setError("Selecciona un tratamiento.");
      return;
    }

    // Validar hora de inicio.
    if (!values.startTime) {
      setError("Selecciona una hora de inicio.");
      return;
    }

    // Validar hora de finalización.
    if (!values.endTime) {
      setError("Selecciona una hora de finalización.");
      return;
    }

    // Validar intervalos de 5 minutos.
    if (
      !keepingOriginalStart &&
      !isFiveMinuteInterval(values.startTime)
    ) {
      setError(
        "La hora de inicio debe avanzar en intervalos de 5 minutos."
      );
      return;
    }

    if (
      !keepingOriginalEnd &&
      !isFiveMinuteInterval(values.endTime)
    ) {
      setError(
        "La hora de finalización debe avanzar en intervalos de 5 minutos."
      );
      return;
    }

    // Validar que la hora de inicio sea futura.
    if (
      values.date === submitToday &&
      !keepingOriginalStart
    ) {
      const selectedStart = getSelectedDateTime(
        values.date,
        values.startTime
      );

      if (selectedStart <= submitNow) {
        setError(
          "La hora de inicio debe ser posterior a la hora actual."
        );
        return;
      }
    }

    // Validar hora final.
    if (values.endTime <= values.startTime) {
      setError(
        "La hora de finalización debe ser posterior a la hora de inicio."
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await onSubmit({
        ...values,
        patientId: Number(values.patientId),
        treatmentId: Number(values.treatmentId),
        dentistUserId:
          values.dentistUserId == null
            ? null
            : Number(values.dentistUserId),
        details: values.details.trim(),
      });
    } catch (err: unknown) {
      console.error("Error al guardar la cita:", err);

      setError(getAppointmentError(err));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // TRATAMIENTOS DISPONIBLES
  // ==========================================

  const selectedInactiveTreatment =
    mode === "edit"
      ? options.treatments.find(
          (treatment) =>
            Number(treatment.id) === Number(values.treatmentId) &&
            treatment.is_active === false
        )
      : undefined;

  const availableTreatments = [
    ...options.treatments.filter(
      (treatment) => treatment.is_active === true
    ),
    ...(selectedInactiveTreatment
      ? [selectedInactiveTreatment]
      : []),
  ];

  // ==========================================
  // RENDER
  // ==========================================

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
              if (
                !e.currentTarget.contains(
                  e.relatedTarget as Node | null
                )
              ) {
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

                // Al modificar la búsqueda,
                // se invalida la selección anterior.
                setValues((prev) => ({
                  ...prev,
                  patientId: null,
                }));

                setError(null);
              }}
              onFocus={() => {
                if (patientSearch.trim()) {
                  setShowPatientResults(true);
                }
              }}
              placeholder="Buscar paciente..."
              autoComplete="off"
            />

            {showPatientResults &&
              patientSearch.trim() !== "" && (
                <div className="patient-search-results">
                  {patientsLoading && (
                    // <div className="patient-search-results__empty">
                    //   Buscando pacientes...
                    // </div>
                    <LoadingScreen />
                  )}

                  {!patientsLoading && patientsError && (
                    <div className="patient-search-results__empty">
                      No se pudieron cargar los pacientes.
                    </div>
                  )}

                  {!patientsLoading &&
                    !patientsError &&
                    patients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          handlePatientChange(
                            String(patient.id)
                          );

                          setPatientSearch(
                            `${patient.first_name} ${patient.last_name}`.trim()
                          );

                          setShowPatientResults(false);
                        }}
                      >
                        {patient.first_name} {patient.last_name}
                      </button>
                    ))}

                  {!patientsLoading &&
                    !patientsError &&
                    patients.length === 0 && (
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
            <option value="">
              Selecciona un tratamiento
            </option>

            {availableTreatments.map((treatment) => (
              <option
                key={treatment.id}
                value={treatment.id}
              >
                {treatment.name}
                {treatment.is_active === false
                  ? " (Inactivo - Tratamiento actual)"
                  : ""}
                {" — $"}
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
              <option
                key={dentist.id}
                value={dentist.id}
              >
                {dentist.name}
              </option>
            ))}
          </select>
        </label>

        {/* FECHA Y HORARIO */}
        <div className="appt-row">
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
            Ya no hay horarios disponibles para hoy.
            Selecciona otro día.
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
          <div
            className="appt-modal__error"
            role="alert"
            aria-live="assertive"
          >
            <div className="appt-modal__error-header">
              <span className="appt-modal__error-icon">
                !
              </span>

              <strong>
                No se pudo guardar la cita
              </strong>
            </div>

            <p>{error}</p>
          </div>
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
