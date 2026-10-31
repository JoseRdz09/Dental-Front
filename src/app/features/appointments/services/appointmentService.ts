
import { api } from "../../../../lib/axios";

import type {
  Appointment,
  AppointmentStatus,
} from "../types/appointment";

import type { AppointmentFormValues } from "../types/appointmentForm";

export interface ApiClinic {
  id: number;
  name: string;
}

export interface ApiPatient {
  id: number;
  first_name: string;
  last_name: string;
}

export interface ApiDentist {
  id: number;
  name: string;
}

export interface ApiTreatment {
  id: number;
  name: string;
  description?: string | null;
  duration: number;
  price: string | number;
}

export interface ApiAppointmentOptions {
  patients: ApiPatient[];
  dentists: ApiDentist[];
  treatments: ApiTreatment[];
}

export interface ApiAppointment {
  id: number;
  clinic_id: number;
  patient_id: number;
  dentist_user_id: number | null;
  treatment_id: number | null;
  treatment_price: string | number | null;
  title: string;
  start_at: string | null;
  end_at: string | null;
  status: string;
  notes: string | null;
  patient: ApiPatient | null;
  dentist: ApiDentist | null;
  treatment: ApiTreatment | null;
}

export interface AppointmentsResponse {
  clinics: ApiClinic[];
  selected_clinic_id: number | null;
  data: ApiAppointment[];
  options: ApiAppointmentOptions;
}

export interface CalendarAppointment extends Appointment {
  title: string;
}

export interface AppointmentPayload {
  clinic_id: number;
  patient_id: number;
  dentist_user_id: number | null;
  treatment_id: number;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  notes: string;
}

function normalizeAppointmentStatus(
  status: string,
): AppointmentStatus {
  switch (status.trim().toLowerCase()) {
    case "pendiente":
    case "pending":
    case "scheduled":
      return "Pendiente";

    case "confirmada":
    case "confirmed":
      return "Confirmada";

    case "completada":
    case "completed":
      return "Completada";

    case "cancelada":
    case "cancelled":
    case "canceled":
      return "Cancelada";

    default:
      throw new Error(`Estado de cita no reconocido: "${status}"`);
  }
}

function mapAppointment(
  appointment: ApiAppointment,
): CalendarAppointment {
  const patientName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`.trim()
    : "Paciente";

  return {
    id: String(appointment.id),
    patientId: appointment.patient_id,
    treatmentId: appointment.treatment_id,
    dentistUserId: appointment.dentist_user_id,
    title: appointment.title,
    patientName,
    treatment: appointment.treatment?.name ?? appointment.title,
    dentist: appointment.dentist?.name ?? "Sin asignar",
    start: appointment.start_at ?? "",
    end: appointment.end_at ?? "",
    status: normalizeAppointmentStatus(appointment.status),
    details: appointment.notes ?? "",
  };
}

export async function getAppointments(
  clinicId?: number | null,
  start?: string,
  end?: string,
) {
  const response = await api.get<AppointmentsResponse>(
    "/api/appointments",
    {
      params: {
        ...(clinicId != null ? { clinic_id: clinicId } : {}),
        ...(start ? { start } : {}),
        ...(end ? { end } : {}),
      },
    },
  );

  return {
    clinics: response.data.clinics,
    selected_clinic_id: response.data.selected_clinic_id,
    data: response.data.data.map(mapAppointment),
    options: response.data.options,
  };
}

export async function createAppointment(
  payload: AppointmentPayload,
): Promise<void> {
  await api.post("/api/appointments", payload);
}

export async function updateAppointment(
  id: string,
  payload: AppointmentPayload,
): Promise<void> {
  await api.put(`/api/appointments/${id}`, payload);
}

export function formValuesToPayload(
  values: AppointmentFormValues,
  clinicId: number,
): AppointmentPayload {
  if (values.patientId === null || values.treatmentId === null) {
    throw new Error("Selecciona un paciente y un tratamiento.");
  }

  return {
    clinic_id: clinicId,
    patient_id: values.patientId,
    dentist_user_id: values.dentistUserId,
    treatment_id: values.treatmentId,
    start_at: new Date(
      `${values.date}T${values.startTime}`,
    ).toISOString(),
    end_at: new Date(
      `${values.date}T${values.endTime}`,
    ).toISOString(),
    status: values.status,
    notes: values.details.trim(),
  };
}
