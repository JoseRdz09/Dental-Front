import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { STATUS_OPTIONS } from "../constants/Appointmentstatus";
import PatientDebtNotice from "../../payment/components/PatientDebtNotice";
import AppointmentPaymentFields, {
  toCents,
} from "../../payment/components/AppointmentPaymentFields";
import type {
  AppointmentFormValues,
  AppointmentFormItem,
  AppointmentSubmitValues,
  PaymentFormValues,
  ApiError,
} from "../types/appointmentForm";
import type { ApiAppointmentOptions } from "../services/appointmentService";
import { usePatientSearch } from "../hooks/useAppointments";

import "../css/Appointmentformmodal.css";
import LoadingScreen from "../../../../assets/shared/components/LoadingScreen";

interface Props {
  mode: "create" | "edit";
  initialValues: AppointmentFormValues;
  options: ApiAppointmentOptions;
  clinicId: number;
  initialPatientName?: string;
  /** Suma de pagos `completed` de esta cita (0 al crear). */
  alreadyPaid?: number;
  onCollectDebt?: (patient: { id: number; name: string }) => void;
  onSubmit: (values: AppointmentSubmitValues) => Promise<void> | void;
  onClose: () => void;
}

/* ==========================================
   CONSTANTES
========================================== */

const SEARCH_DEBOUNCE = 300;
const STEP = 5;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Debe coincidir con el valor de STATUS_OPTIONS / AppointmentStatus. */
const PAYABLE_STATUS = "Completada";
const CANCELLED_STATUS = "Cancelada";

/** Estados finales: la cita solo se puede consultar. */
const LOCKED_STATUSES: string[] = [PAYABLE_STATUS, CANCELLED_STATUS];

const EMPTY_PAYMENT: PaymentFormValues = {
  amount: "",
  method: "cash",
  reference: "",
};

const FIELD_LABELS: Record<string, string> = {
  patient_id: "Paciente",
  dentist_user_id: "Dentista",
  clinic_id: "Clínica",
  start_at: "Hora de inicio",
  end_at: "Hora de finalización",
  status: "Estado",
  notes: "Detalles",
  items: "Conceptos",
  payment: "Pago",
  "payment.amount": "Monto del pago",
  "payment.method": "Método de pago",
  "payment.reference": "Referencia del pago",
  idempotency_key: "Identificador del pago",
};

const STATUS_MESSAGES: Record<number, string> = {
  401: "Tu sesión ha expirado. Inicia sesión nuevamente.",
  403: "No tienes permisos para realizar esta operación.",
  404: "No se encontró la cita o alguno de los recursos seleccionados.",
  409: "Existe un conflicto con el horario seleccionado.",
};

const ITEM_LABELS: Record<string, string> = {
  treatment: "Tratamiento",
  product: "Producto",
  extra: "Cargo adicional",
};

/* ==========================================
   UTILIDADES
========================================== */

const pad = (n: number) => String(n).padStart(2, "0");

const getLocalDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const getLocalTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const getNextSlot = (d: Date) => {
  const next = new Date(d);
  const minutes = next.getHours() * 60 + next.getMinutes();
  next.setHours(0, (Math.floor(minutes / STEP) + 1) * STEP, 0, 0);
  return next;
};

const addStep = (time: string) => {
  if (!TIME_RE.test(time)) return "00:00";
  const [h, m] = time.split(":").map(Number);
  const total = (Math.floor((h * 60 + m) / STEP) + 1) * STEP;
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
};

const isStepAligned = (time: string) =>
  TIME_RE.test(time) && Number(time.slice(3)) % STEP === 0;

const formatCurrency = (() => {
  const f = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  });
  return (n: number) => f.format(n);
})();

const normalizeValues = (v: AppointmentFormValues): AppointmentFormValues => ({
  ...v,
  patientId: v.patientId == null ? null : Number(v.patientId),
  dentistUserId: v.dentistUserId == null ? null : Number(v.dentistUserId),
  payment: v.payment ?? EMPTY_PAYMENT,
  items: (v.items ?? []).map((item): AppointmentFormItem => {
    const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;

    return item.type === "treatment"
      ? {
          id: item.id,
          type: "treatment",
          treatmentId: Number(item.treatmentId),
          quantity,
        }
      : {
          id: item.id,
          type: item.type,
          description: item.description,
          quantity,
          unitPrice: Number(item.unitPrice),
        };
  }),
});

const getAppointmentError = (err: unknown): string => {
  const { response, message } = (
    err && typeof err === "object" ? err : {}
  ) as ApiError;

  const status = response?.status;
  const data = response?.data;

  if (status === 422) {
    const errors = data?.errors;

    const conflict = (
      Array.isArray(errors?.start_at) ? errors.start_at : []
    ).find(
      (m: unknown) =>
        typeof m === "string" &&
        m.toLowerCase().includes("dentista") &&
        m.toLowerCase().includes("cita"),
    );
    if (conflict) return conflict;

    if (errors) {
      const messages = Object.entries(errors).flatMap(([field, msgs]) =>
        ([] as unknown[])
          .concat(msgs)
          .map((m) => `${FIELD_LABELS[field] ?? field}: ${String(m)}`),
      );
      if (messages.length) return messages.join("\n");
      return data?.message ?? "Revisa los datos de la cita.";
    }

    return data?.message ?? "Los datos enviados no son válidos.";
  }

  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (status && status >= 500)
    return "Ocurrió un error en el servidor. Inténtalo nuevamente.";

  return (
    data?.message ??
    message ??
    "No se pudo guardar la cita. Inténtalo nuevamente."
  );
};

/* ==========================================
   COMPONENTE
   Nota: para reiniciar el formulario cuando cambie la cita,
   usa `key` desde el padre (p. ej. key={appointment.id}).
========================================== */

export default function AppointmentFormModal({
  mode,
  initialValues,
  options,
  clinicId,
  initialPatientName = "",
  alreadyPaid = 0,
  onCollectDebt,
  onSubmit,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [values, setValues] = useState(() => normalizeValues(initialValues));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [extraDescription, setExtraDescription] = useState("");
  const [extraUnitPrice, setExtraUnitPrice] = useState("");

  // Una sola clave por apertura del modal: los reintentos no duplican el pago.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const isEdit = mode === "edit";

  /* ---------- Reglas de solo lectura ---------- */

  // Se evalúa contra el estado ORIGINAL de la cita, no contra el del select.
  const readOnly = isEdit && LOCKED_STATUSES.includes(initialValues.status);

  // Una vez creada la cita, el paciente no se puede cambiar.
  const patientLocked = isEdit;

  // Bloqueo general de campos (guardando o cita en modo lectura).
  const locked = saving || readOnly;

  /* ---------- Búsqueda de pacientes ---------- */

  const [patientSearch, setPatientSearch] = useState(initialPatientName);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(
      () =>
        setDebouncedSearch(
          showResults && !patientLocked ? patientSearch.trim() : "",
        ),
      SEARCH_DEBOUNCE,
    );
    return () => window.clearTimeout(t);
  }, [patientSearch, showResults, patientLocked]);

  const {
    patients,
    loading: patientsLoading,
    error: patientsError,
  } = usePatientSearch(clinicId, debouncedSearch);

  /* ---------- Diálogo ---------- */

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  /* ---------- Fecha y horario ---------- */

  const now = new Date();
  const today = getLocalDate(now);
  const nextSlot = getNextSlot(now);
  const nextSlotIsToday = getLocalDate(nextSlot) === today;
  const nextSlotTime = getLocalTime(nextSlot);

  const isOriginalDate = isEdit && values.date === initialValues.date;
  const isOriginalStart =
    isOriginalDate && values.startTime === initialValues.startTime;
  const isToday = values.date === today;

  const minDate =
    isOriginalDate && initialValues.date < today ? initialValues.date : today;

  const minStartTime =
    isToday && !isOriginalStart && nextSlotIsToday ? nextSlotTime : "00:00";

  const noMoreSlotsToday =
    !readOnly && isToday && !nextSlotIsToday && !isOriginalStart;

  const minEndTime = values.startTime ? addStep(values.startTime) : "00:00";

  /* ---------- Conceptos ---------- */

  const availableTreatments = options.treatments.filter(
    (t) => t.is_active !== false,
  );

  const rows = values.items.map((item) => {
    if (item.type === "treatment") {
      const treatment = options.treatments.find(
        (t) => Number(t.id) === Number(item.treatmentId),
      );
      return {
        item,
        description: treatment?.name ?? `Tratamiento #${item.treatmentId}`,
        unitPrice: treatment ? Number(treatment.price) : null,
        inactive: !treatment || treatment.is_active === false,
      };
    }
    return {
      item,
      description: item.description,
      unitPrice: Number(item.unitPrice),
      inactive: false,
    };
  });

  const estimatedTotal = rows.reduce(
    (sum, r) => sum + (r.unitPrice ?? 0) * (Number(r.item.quantity) || 1),
    0,
  );

  const hasUnavailableTreatment = rows.some(
    (r) => r.item.type === "treatment" && r.inactive,
  );

  /* ---------- Pago ---------- */

  // Solo informativo: el backend recalcula el total desde los conceptos.
  const showPayment = values.status === PAYABLE_STATUS;
  const pendingCents = Math.max(
    toCents(estimatedTotal) - toCents(alreadyPaid),
    0,
  );

  const excludeAppointmentId =
    isEdit && initialValues.id && Number.isFinite(Number(initialValues.id))
      ? Number(initialValues.id)
      : undefined;

  /* ---------- Handlers ---------- */

  const patch = (changes: Partial<AppointmentFormValues>) => {
    if (readOnly) return;
    setValues((prev) => ({ ...prev, ...changes }));
    setError(null);
  };

  const patchPayment = (changes: Partial<PaymentFormValues>) => {
    if (readOnly) return;
    setValues((prev) => ({
      ...prev,
      payment: { ...prev.payment, ...changes },
    }));
    setError(null);
  };

  const setField =
    (field: keyof AppointmentFormValues) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      patch({ [field]: e.target.value });

  const addItem = (item: AppointmentFormItem) => {
    if (readOnly) return;
    setValues((prev) => ({ ...prev, items: [...prev.items, item] }));
    setError(null);
  };

  const handleAddTreatment = (id: string) => {
    if (readOnly || !id) return;
    const treatmentId = Number(id);
    const treatment = options.treatments.find(
      (t) => Number(t.id) === treatmentId,
    );

    if (!treatment || treatment.is_active === false) {
      setError("El tratamiento seleccionado no está disponible.");
      return;
    }

    addItem({ type: "treatment", treatmentId, quantity: 1 });
  };

  const handleAddExtra = () => {
    if (readOnly) return;

    const description = extraDescription.trim();
    const unitPrice = Number(extraUnitPrice);

    if (!description) {
      setError("Escribe la descripción del cargo adicional.");
      return;
    }

    if (
      extraUnitPrice.trim() === "" ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      setError("Ingresa un precio válido.");
      return;
    }

    addItem({ type: "extra", description, quantity: 1, unitPrice });
    setExtraDescription("");
    setExtraUnitPrice("");
  };

  const handleRemoveItem = (index: number) =>
    patch({ items: values.items.filter((_, i) => i !== index) });

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    const clearTimes =
      date === today &&
      (!nextSlotIsToday ||
        !values.startTime ||
        values.startTime < nextSlotTime);

    patch({
      date,
      ...(clearTimes ? { startTime: "", endTime: "" } : {}),
    });
  };

  const handleStartTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const startTime = e.target.value;
    patch({
      startTime,
      endTime: values.endTime > startTime ? values.endTime : "",
    });
  };

  /* ---------- Validación ---------- */

  const getValidationError = (): string | null => {
    const { date, startTime, endTime, patientId, items } = values;
    const submitNow = new Date();
    const keepingDate = isEdit && date === initialValues.date;
    const keepingStart = keepingDate && startTime === initialValues.startTime;

    if (!date) return "Selecciona una fecha para la cita.";

    if (date < getLocalDate(submitNow) && !keepingDate)
      return "No puedes agendar o reprogramar citas en días pasados.";

    if (patientId === null) return "Selecciona un paciente.";
    if (items.length === 0) return "Agrega al menos un concepto a la cita.";

    for (const item of items) {
      if (!(Number(item.quantity) > 0))
        return "Todos los conceptos deben tener una cantidad válida.";

      if (
        item.type !== "treatment" &&
        (!item.description.trim() ||
          !Number.isFinite(Number(item.unitPrice)) ||
          Number(item.unitPrice) < 0)
      )
        return "Revisa la descripción y el precio de los conceptos adicionales.";
    }

    if (!startTime) return "Selecciona una hora de inicio.";
    if (!endTime) return "Selecciona una hora de finalización.";

    if (!keepingStart && !isStepAligned(startTime))
      return "La hora de inicio debe avanzar en intervalos de 5 minutos.";

    if (!isStepAligned(endTime))
      return "La hora de finalización debe avanzar en intervalos de 5 minutos.";

    if (
      date === getLocalDate(submitNow) &&
      !keepingStart &&
      new Date(`${date}T${startTime}:00`) <= submitNow
    )
      return "La hora de inicio debe ser posterior a la hora actual.";

    if (endTime <= startTime)
      return "La hora de finalización debe ser posterior a la hora de inicio.";

    if (showPayment && values.payment.amount.trim() !== "") {
      const cents = toCents(values.payment.amount);

      if (!Number.isFinite(cents) || cents <= 0)
        return "Ingresa un monto de pago válido.";

      if (cents > pendingCents)
        return "El pago no puede ser mayor al saldo pendiente.";
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving || readOnly) return;

    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const normalized = normalizeValues(values);

      // Si el estado no es "Completada", el pago se ignora aunque haya texto escrito.
      const paymentCents =
        showPayment && values.payment.amount.trim() !== ""
          ? toCents(values.payment.amount)
          : 0;

      await onSubmit({
        ...normalized,
        // En edición el paciente nunca cambia: se conserva el original.
        patientId: isEdit ? initialValues.patientId : normalized.patientId,
        details: normalized.details.trim(),
        payment:
          paymentCents > 0
            ? {
                amount: paymentCents / 100,
                method: values.payment.method,
                reference:
                  values.payment.method === "cash"
                    ? null
                    : values.payment.reference.trim() || null,
              }
            : null,
        idempotencyKey,
      });
    } catch (err: unknown) {
      console.error("Error al guardar la cita:", err);
      setError(getAppointmentError(err));
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================
     RENDER
  ========================================== */

  const title = readOnly
    ? "Detalle de la cita"
    : isEdit
      ? "Editar cita"
      : "Nueva cita";

  const subtitle = readOnly
    ? "Consulta la información de la cita."
    : "Completa la información de la cita del paciente.";

  return (
    <dialog
      ref={dialogRef}
      className="appt-modal"
      aria-labelledby="appt-modal-title"
      onClose={onClose}
      onCancel={(e) => saving && e.preventDefault()}
      onClick={(e) => {
        if (e.target === dialogRef.current && !saving) onClose();
      }}
    >
      <form className="appt-modal__form" onSubmit={handleSubmit} noValidate>
        {/* ENCABEZADO */}
        <header className="appt-modal__header">
          <div>
            <h2 id="appt-modal-title">{title}</h2>
            <p>{subtitle}</p>
          </div>

          <button
            type="button"
            className="appt-modal__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </header>

        {/* AVISO DE SOLO LECTURA */}
        {readOnly && (
          <p className="appt-inline-warning" role="status">
            {initialValues.status === CANCELLED_STATUS
              ? "Esta cita está cancelada y no se puede modificar."
              : "Esta cita ya fue completada y no se puede modificar."}
          </p>
        )}

        {/* CONTENIDO PRINCIPAL: DOS COLUMNAS */}
        <div className="appt-modal__grid">
          {/* COLUMNA IZQUIERDA */}
          <div className="appt-column">
            {/* PACIENTE */}
            <section className="appt-section">
              <div className="appt-section__heading">
                <span className="appt-section__number">01</span>
                <div>
                  <h3>Información del paciente</h3>
                  <p>
                    {patientLocked
                      ? "El paciente no se puede cambiar una vez creada la cita."
                      : "Selecciona al paciente y al responsable."}
                  </p>
                </div>
              </div>

              <div className="appt-field">
                <label htmlFor="appt-patient">Paciente</label>

                <div
                  className="patient-search"
                  onBlur={(e) => {
                    if (
                      !e.currentTarget.contains(
                        e.relatedTarget as Node | null,
                      )
                    ) {
                      setShowResults(false);
                    }
                  }}
                >
                  <input
                    id="appt-patient"
                    className="patient-search__input"
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      if (patientLocked) return;
                      setPatientSearch(e.target.value);
                      setShowResults(true);
                      patch({ patientId: null });
                    }}
                    onFocus={() =>
                      !patientLocked &&
                      patientSearch.trim() &&
                      setShowResults(true)
                    }
                    placeholder="Buscar paciente..."
                    autoComplete="off"
                    disabled={saving || patientLocked}
                    readOnly={patientLocked}
                  />

                  {!patientLocked &&
                    showResults &&
                    patientSearch.trim() !== "" && (
                      <div className="patient-search-results">
                        {patientsLoading && <LoadingScreen />}

                        {!patientsLoading && patientsError && (
                          <div className="patient-search-results__empty">
                            No se pudieron cargar los pacientes.
                          </div>
                        )}

                        {!patientsLoading &&
                          !patientsError &&
                          patients.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              disabled={saving}
                              onClick={() => {
                                patch({ patientId: Number(p.id) });
                                setPatientSearch(
                                  `${p.first_name} ${p.last_name}`.trim(),
                                );
                                setShowResults(false);
                              }}
                            >
                              {p.first_name} {p.last_name}
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
              </div>

              {/* AVISO DE ADEUDO */}
              {values.patientId !== null && (
                <div className="appt-debt-area">
                  <PatientDebtNotice
                    clinicId={clinicId}
                    patientId={values.patientId}
                    excludeAppointmentId={excludeAppointmentId}
                    onCollect={() =>
                      onCollectDebt?.({
                        id: values.patientId!,
                        name: patientSearch.trim(),
                      })
                    }
                    formatCurrency={formatCurrency}
                    disabled={saving || !onCollectDebt}
                  />
                </div>
              )}

              <label className="appt-field">
                <span>Dentista</span>
                <select
                  value={values.dentistUserId ?? ""}
                  onChange={(e) =>
                    patch({
                      dentistUserId: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  disabled={locked}
                >
                  <option value="">Sin asignar</option>
                  {options.dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {/* PROGRAMACIÓN */}
            <section className="appt-section">
              <div className="appt-section__heading">
                <span className="appt-section__number">02</span>
                <div>
                  <h3>Programación</h3>
                  <p>Fecha y horario de atención.</p>
                </div>
              </div>

              <label className="appt-field">
                <span>Fecha</span>
                <input
                  type="date"
                  value={values.date}
                  min={minDate}
                  onChange={handleDateChange}
                  disabled={locked}
                  required
                />
              </label>

              <div className="appt-time-grid">
                <label className="appt-field">
                  <span>Hora de inicio</span>
                  <input
                    type="time"
                    step={300}
                    min={minStartTime}
                    value={values.startTime}
                    onChange={handleStartTimeChange}
                    disabled={locked || noMoreSlotsToday}
                    required
                  />
                </label>

                <label className="appt-field">
                  <span>Hora de finalización</span>
                  <input
                    type="time"
                    step={300}
                    min={minEndTime}
                    value={values.endTime}
                    onChange={setField("endTime")}
                    disabled={locked || !values.startTime}
                    required
                  />
                </label>
              </div>

              <label className="appt-field">
                <span>Estado de la cita</span>
                <select
                  value={values.status}
                  onChange={setField("status")}
                  disabled={locked}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              {noMoreSlotsToday && (
                <p className="appt-inline-warning" role="status">
                  Ya no hay horarios disponibles para hoy. Selecciona otro día.
                </p>
              )}
            </section>

            {/* DETALLES ADICIONALES */}
            <section className="appt-section appt-details">
              <div className="appt-section__heading">
                <span className="appt-section__number">03</span>
                <div>
                  <h3>Detalles adicionales</h3>
                  <p>Observaciones opcionales sobre la cita.</p>
                </div>
              </div>

              <label className="appt-field">
                <span>Observaciones</span>
                <textarea
                  rows={3}
                  value={values.details}
                  onChange={setField("details")}
                  placeholder="Escribe observaciones sobre la cita..."
                  disabled={locked}
                />
              </label>
            </section>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="appt-column">
            {/* CONCEPTOS */}
            <section className="appt-section appt-section--items">
              <div className="appt-section__heading">
                <span className="appt-section__number">04</span>
                <div>
                  <h3>Conceptos de la cita</h3>
                  <p>Tratamientos y cargos adicionales.</p>
                </div>

                <span className="appt-items__count">
                  {values.items.length}
                </span>
              </div>

              {/* AGREGAR TRATAMIENTO Y CARGO (ocultos en modo lectura) */}
              {!readOnly && (
                <>
                  <label className="appt-field">
                    <span>Agregar tratamiento</span>
                    <select
                      value=""
                      onChange={(e) => handleAddTreatment(e.target.value)}
                      disabled={locked || availableTreatments.length === 0}
                    >
                      <option value="">
                        {availableTreatments.length === 0
                          ? "No hay tratamientos disponibles"
                          : "Selecciona un tratamiento..."}
                      </option>

                      {availableTreatments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {formatCurrency(Number(t.price))}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="appt-extra-box">
                    <div className="appt-extra-box__heading">
                      <strong>Cargo adicional</strong>
                      <span>Materiales u otros conceptos.</span>
                    </div>

                    <div className="appt-extra-grid">
                      <label className="appt-field">
                        <span>Descripción</span>
                        <input
                          type="text"
                          value={extraDescription}
                          onChange={(e) =>
                            setExtraDescription(e.target.value)
                          }
                          placeholder="Ej. Material"
                          maxLength={255}
                          disabled={locked}
                        />
                      </label>

                      <label className="appt-field">
                        <span>Precio</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={extraUnitPrice}
                          onChange={(e) => setExtraUnitPrice(e.target.value)}
                          placeholder="0.00"
                          disabled={locked}
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      className="appt-btn appt-btn--secondary appt-add-extra"
                      onClick={handleAddExtra}
                      disabled={locked}
                    >
                      + Agregar cargo
                    </button>
                  </div>
                </>
              )}

              {/* LISTA DE CONCEPTOS */}
              <div className="appt-items__list">
                <div className="appt-items__list-header">
                  <h4>Conceptos agregados</h4>
                </div>

                {rows.length === 0 ? (
                  <div className="appt-items__empty">
                    <span>+</span>
                    <strong>Sin conceptos todavía</strong>
                    <p>
                      {readOnly
                        ? "Esta cita no tiene conceptos registrados."
                        : "Agrega un tratamiento o cargo adicional."}
                    </p>
                  </div>
                ) : (
                  <div className="appt-items__table">
                    {rows.map(
                      ({ item, description, unitPrice, inactive }, i) => (
                        <div
                          className="appt-items__item"
                          key={`${item.type}-${item.id ?? i}`}
                        >
                          <div className="appt-items__item-info">
                            <strong>{description}</strong>

                            <div className="appt-items__item-meta">
                              <span
                                className={`appt-item-badge appt-item-badge--${
                                  item.type === "treatment"
                                    ? "treatment"
                                    : "extra"
                                }`}
                              >
                                {ITEM_LABELS[item.type] ?? ITEM_LABELS.extra}
                              </span>

                              {inactive && (
                                <span className="appt-item-inactive">
                                  No disponible
                                </span>
                              )}
                            </div>

                            {unitPrice === null && (
                              <span className="appt-item-warning">
                                Este tratamiento ya no está disponible.
                              </span>
                            )}
                          </div>

                          <strong className="appt-items__total">
                            {unitPrice === null
                              ? "—"
                              : formatCurrency(
                                  unitPrice * (Number(item.quantity) || 1),
                                )}
                          </strong>

                          {!readOnly && (
                            <button
                              type="button"
                              className="appt-items__remove"
                              onClick={() => handleRemoveItem(i)}
                              disabled={locked}
                              aria-label={`Eliminar ${description}`}
                              title="Eliminar concepto"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* TOTAL */}
              <div className="appt-items__summary">
                <div>
                  <span>Total estimado</span>
                  <small>
                    {values.items.length}{" "}
                    {values.items.length === 1 ? "concepto" : "conceptos"}
                  </small>
                </div>

                <strong>{formatCurrency(estimatedTotal)}</strong>
              </div>

              {hasUnavailableTreatment && (
                <p className="appt-inline-warning">
                  Hay tratamientos que ya no están disponibles en el catálogo.
                  Se conservarán como conceptos existentes.
                </p>
              )}
            </section>

            {/* PAGO */}
            {showPayment && (
              <section className="appt-section appt-payment-area">
                <div className="appt-section__heading">
                  <span className="appt-section__number">05</span>
                  <div>
                    <h3>Registro de pago</h3>
                    <p>
                      {readOnly
                        ? "Resumen del pago de la cita."
                        : "Registra el importe recibido."}
                    </p>
                  </div>
                </div>

                <AppointmentPaymentFields
                  total={estimatedTotal}
                  alreadyPaid={alreadyPaid}
                  value={values.payment}
                  onChange={patchPayment}
                  formatCurrency={formatCurrency}
                  disabled={locked}
                />
              </section>
            )}
          </div>
        </div>

        {/* ERROR */}
        {error && !readOnly && (
          <div
            className="appt-modal__error"
            role="alert"
            aria-live="assertive"
          >
            <strong>No se pudo guardar la cita</strong>
            <p>{error}</p>
          </div>
        )}

        {/* ACCIONES */}
        <footer className="appt-modal__actions">
          <button
            type="button"
            className="appt-btn appt-btn--cancel"
            onClick={onClose}
            disabled={saving}
          >
            {readOnly ? "Cerrar" : "Cancelar"}
          </button>

          {!readOnly && (
            <button
              type="submit"
              className="appt-btn appt-btn--primary"
              disabled={saving || noMoreSlotsToday}
            >
              {saving
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Guardar cita"}
            </button>
          )}
        </footer>
      </form>
    </dialog>
  );
}