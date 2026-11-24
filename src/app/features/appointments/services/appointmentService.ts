import { api } from "../../../../lib/axios";

import type {
  Appointment,
  AppointmentItem,
  AppointmentItemType,
  AppointmentStatus,
} from "../types/appointment";

import type {
  AppointmentFormValues,
  AppointmentFormItem,
} from "../types/appointmentForm";

/* ==========================================
   API TYPES
========================================== */

export type ApiClinic = {
  id: number;
  name: string;
};

export type ApiPatient = {
  id: number;
  first_name: string;
  last_name: string;
};

export type ApiDentist = {
  id: number;
  name: string;
};

export type ApiTreatment = {
  id: number;
  name: string;
  description?: string | null;
  duration: number;
  price: string | number;
  is_active: boolean;
};

export type ApiAppointmentOptions = {
  dentists: ApiDentist[];
  treatments: ApiTreatment[];
};

export type ApiAppointmentItem = {
  id: number;
  appointment_id: number;
  type: AppointmentItemType;
  treatment_id: number | null;
  product_id: number | null;
  description: string;
  quantity: string | number;
  unit_price: string | number;
  total: string | number;
  created_at?: string;
};

/**
 * Cita tal como la devuelve Laravel.
 * index, store, update y show incluyen `items`.
 */
export type ApiAppointment = {
  id: number;
  clinic_id: number;
  patient_id: number;
  dentist_user_id: number | null;
  title: string;
  start_at: string | null;
  end_at: string | null;
  status: string;
  notes: string | null;
  patient: ApiPatient | null;
  dentist: ApiDentist | null;
  items?: ApiAppointmentItem[];
};

export type ApiAppointmentStats = {
  today: number;
  pending: number;
  upcoming: number;
  cancelled: number;
};

type ApiEnvelope<T> = { message?: string; data: T };

export type CalendarAppointment = Appointment & {
  title: string;
};

export type AppointmentDetail = CalendarAppointment & {
  items: AppointmentItem[];
};

/** Opciones comunes para poder cancelar peticiones (AbortController). */
export type RequestOptions = {
  signal?: AbortSignal;
};

/* ==========================================
   FRONTEND PAYLOAD TYPES
========================================== */

export type AppointmentItemPayload =
  | {
      type: "treatment";
      treatment_id: number;
      quantity: number;
    }
  | {
      type: "product" | "extra";
      description: string;
      quantity: number;
      unit_price: number;
    };

export type AppointmentPayload = {
  clinic_id: number;
  patient_id: number;
  dentist_user_id: number | null;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  notes: string;
};

export type CreateAppointmentPayload = AppointmentPayload & {
  items: AppointmentItemPayload[];
};

/* ==========================================
   MAPPING
========================================== */

const STATUS_BY_ALIAS = new Map<string, AppointmentStatus>([
  ["pendiente", "Pendiente"],
  ["pending", "Pendiente"],
  ["scheduled", "Pendiente"],
  ["confirmada", "Confirmada"],
  ["confirmed", "Confirmada"],
  ["completada", "Completada"],
  ["completed", "Completada"],
  ["cancelada", "Cancelada"],
  ["cancelled", "Cancelada"],
  ["canceled", "Cancelada"],
]);

function normalizeAppointmentStatus(status: string): AppointmentStatus {
  const normalized = STATUS_BY_ALIAS.get(status.trim().toLowerCase());

  if (!normalized) {
    throw new Error(`Estado de cita no reconocido: "${status}"`);
  }

  return normalized;
}

function mapAppointmentItem(item: ApiAppointmentItem): AppointmentItem {
  return {
    id: item.id,
    appointmentId: item.appointment_id,
    type: item.type,
    treatmentId: item.treatment_id,
    productId: item.product_id,
    description: item.description,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    total: Number(item.total),
    createdAt: item.created_at,
  };
}

function mapAppointment(appointment: ApiAppointment): CalendarAppointment {
  const patientName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`.trim()
    : "Paciente";

  return {
    id: String(appointment.id),
    patientId: appointment.patient_id,
    dentistUserId: appointment.dentist_user_id,

    title: appointment.title,
    patientName,
    treatment: appointment.title,
    dentist: appointment.dentist?.name ?? "Sin asignar",

    start: appointment.start_at ?? "",
    end: appointment.end_at ?? "",

    status: normalizeAppointmentStatus(appointment.status),
    details: appointment.notes ?? "",
  };
}

/** Cita + conceptos. `items` ausente se interpreta como lista vacía. */
function mapAppointmentDetail(appointment: ApiAppointment): AppointmentDetail {
  return {
    ...mapAppointment(appointment),
    items: (appointment.items ?? []).map(mapAppointmentItem),
  };
}

/* ==========================================
   CLINICS
========================================== */

export async function getClinics(
  { signal }: RequestOptions = {},
): Promise<ApiClinic[]> {
  const response = await api.get<ApiEnvelope<ApiClinic[]>>(
    "/api/appointments/clinics",
    { signal },
  );

  return response.data.data;
}

/* ==========================================
   APPOINTMENTS
========================================== */

/**
 * El listado ya incluye los conceptos de cada cita, por lo que
 * abrir el detalle no necesita otra petición (getAppointmentDetail).
 */
export async function getAppointments(
  clinicId: number,
  start: string,
  end: string,
  { signal }: RequestOptions = {},
): Promise<AppointmentDetail[]> {
  const response = await api.get<ApiEnvelope<ApiAppointment[]>>(
    "/api/appointments",
    {
      params: { clinic_id: clinicId, start, end },
      signal,
    },
  );

  return response.data.data.map(mapAppointmentDetail);
}

export async function getAppointmentDetail(
  appointmentId: string,
  { signal }: RequestOptions = {},
): Promise<AppointmentDetail> {
  const response = await api.get<ApiEnvelope<ApiAppointment>>(
    `/api/appointments/${appointmentId}`,
    { signal },
  );

  return mapAppointmentDetail(response.data.data);
}

/**
 * Crea la cita. El backend devuelve la cita completa
 * (paciente, dentista y conceptos): no hace falta recargar el calendario.
 */
export async function createAppointment(
  payload: CreateAppointmentPayload,
): Promise<AppointmentDetail> {
  const response = await api.post<ApiEnvelope<ApiAppointment>>(
    "/api/appointments",
    payload,
  );

  return mapAppointmentDetail(response.data.data);
}

/**
 * Actualiza la cita. El backend devuelve la cita completa actualizada.
 */
export async function updateAppointment(
  id: string,
  payload: AppointmentPayload,
): Promise<AppointmentDetail> {
  const response = await api.put<ApiEnvelope<ApiAppointment>>(
    `/api/appointments/${id}`,
    payload,
  );

  return mapAppointmentDetail(response.data.data);
}

/* ==========================================
   STATS / OPTIONS / PATIENTS
========================================== */

export async function getAppointmentStats(
  clinicId: number,
  { signal }: RequestOptions = {},
): Promise<ApiAppointmentStats> {
  const response = await api.get<ApiEnvelope<ApiAppointmentStats>>(
    "/api/appointments/stats",
    { params: { clinic_id: clinicId }, signal },
  );

  return response.data.data;
}

export async function getAppointmentOptions(
  clinicId: number,
  { signal }: RequestOptions = {},
): Promise<ApiAppointmentOptions> {
  const response = await api.get<ApiEnvelope<ApiAppointmentOptions>>(
    "/api/appointments/options",
    { params: { clinic_id: clinicId }, signal },
  );

  return response.data.data;
}

export async function searchPatients(
  clinicId: number,
  search: string,
  { signal }: RequestOptions = {},
): Promise<ApiPatient[]> {
  const response = await api.get<ApiEnvelope<ApiPatient[]>>(
    `/api/clinics/${clinicId}/patients/search`,
    { params: { q: search }, signal },
  );

  return response.data.data;
}

/* ==========================================
   APPOINTMENT ITEMS
========================================== */

/**
 * Agrega conceptos y devuelve la lista COMPLETA de conceptos de la cita
 * (no solo los nuevos): en el estado hay que reemplazar `items`, no anexar.
 */
export async function addAppointmentItems(
  appointmentId: string,
  items: AppointmentItemPayload[],
): Promise<AppointmentItem[]> {
  if (items.length === 0) {
    return [];
  }

  const response = await api.post<ApiEnvelope<{ items: ApiAppointmentItem[] }>>(
    `/api/appointments/${appointmentId}/items`,
    { items },
  );

  const apiItems = response.data.data?.items;

  if (!Array.isArray(apiItems)) {
    throw new Error(
      "El servidor respondió correctamente, pero el formato de los conceptos no es válido.",
    );
  }

  return apiItems.map(mapAppointmentItem);
}

export async function deleteAppointmentItem(
  appointmentId: string,
  itemId: number,
): Promise<void> {
  await api.delete(`/api/appointments/${appointmentId}/items/${itemId}`);
}

/* ==========================================
   FORM -> API PAYLOAD
========================================== */

function toIsoDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

function mapFormItemToPayload(
  item: AppointmentFormItem,
): AppointmentItemPayload {
  if (item.type === "treatment") {
    return {
      type: "treatment",
      treatment_id: item.treatmentId,
      quantity: item.quantity,
    };
  }

  return {
    type: item.type,
    description: item.description.trim(),
    quantity: item.quantity,
    unit_price: item.unitPrice,
  };
}

/**
 * Datos generales de la cita. Los conceptos se administran por separado.
 */
export function formValuesToAppointmentPayload(
  values: AppointmentFormValues,
  clinicId: number,
): AppointmentPayload {
  if (values.patientId === null) {
    throw new Error("Selecciona un paciente.");
  }

  return {
    clinic_id: clinicId,
    patient_id: values.patientId,
    dentist_user_id: values.dentistUserId,
    start_at: toIsoDateTime(values.date, values.startTime),
    end_at: toIsoDateTime(values.date, values.endTime),
    status: values.status,
    notes: values.details.trim(),
  };
}

/**
 * Datos de la cita + conceptos, para crear.
 */
export function formValuesToPayload(
  values: AppointmentFormValues,
  clinicId: number,
): CreateAppointmentPayload {
  const base = formValuesToAppointmentPayload(values, clinicId);

  if (values.items.length === 0) {
    throw new Error("Agrega al menos un concepto a la cita.");
  }

  return {
    ...base,
    items: values.items.map(mapFormItemToPayload),
  };
}