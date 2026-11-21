
import { api } from "../../../../lib/axios";

import type {
  Appointment,
  AppointmentStatus,
} from "../types/appointment";

import type { AppointmentFormValues } from "../types/appointmentForm";

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

export type ApiAppointment = {
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
};

export type ApiAppointmentStats = {
  today: number;
  pending: number;
  upcoming: number;
  cancelled: number;
};

export type ApiAppointmentsResponse = {
  data: ApiAppointment[];
};

export type ApiClinicsResponse = {
  data: ApiClinic[];
};

export type ApiAppointmentOptionsResponse = {
  data: ApiAppointmentOptions;
};

export type ApiAppointmentStatsResponse = {
  data: ApiAppointmentStats;
};

export type ApiPatientsResponse = {
  data: ApiPatient[];
};

export type CalendarAppointment = Appointment & {
  title: string;
};

export type AppointmentPayload = {
  clinic_id: number;
  patient_id: number;
  dentist_user_id: number | null;
  treatment_id: number;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  notes: string;
};

/* ==========================================
   APPOINTMENT MAPPING
========================================== */

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
      throw new Error(
        `Estado de cita no reconocido: "${status}"`,
      );
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

/* ==========================================
   CLINICS
========================================== */

export async function getClinics(): Promise<ApiClinic[]> {
  const response = await api.get<ApiClinicsResponse>(
    "/api/appointments/clinics",
  );

  return response.data.data;
}

/* ==========================================
   APPOINTMENTS
========================================== */

export async function getAppointments(
  clinicId: number,
  start: string,
  end: string,
): Promise<CalendarAppointment[]> {
  const response = await api.get<ApiAppointmentsResponse>(
    "/api/appointments",
    {
      params: {
        clinic_id: clinicId,
        start,
        end,
      },
    },
  );

  return response.data.data.map(mapAppointment);
}

/* ==========================================
   APPOINTMENT STATISTICS
========================================== */

export async function getAppointmentStats(
  clinicId: number,
  start: string,
  end: string,
): Promise<ApiAppointmentStats> {
  const response = await api.get<ApiAppointmentStatsResponse>(
    "/api/appointments/stats",
    {
      params: {
        clinic_id: clinicId,
        start,
        end,
      },
    },
  );

  return response.data.data;
}

/* ==========================================
   FORM OPTIONS
========================================== */

export async function getAppointmentOptions(
  clinicId: number,
): Promise<ApiAppointmentOptions> {
  const response = await api.get<ApiAppointmentOptionsResponse>(
    "/api/appointments/options",
    {
      params: {
        clinic_id: clinicId,
      },
    },
  );

  return response.data.data;
}

/* ==========================================
   PATIENT SEARCH
========================================== */

export async function searchPatients(
  clinicId: number,
  search: string,
): Promise<ApiPatient[]> {
  const response = await api.get<ApiPatientsResponse>(
    `/api/clinics/${clinicId}/patients/search`,
    {
      params: {
        q: search,
      },
    },
  );

  return response.data.data;
}

/* ==========================================
   CREATE APPOINTMENT
========================================== */

export async function createAppointment(
  payload: AppointmentPayload,
): Promise<void> {
  await api.post("/api/appointments", payload);
}

/* ==========================================
   UPDATE APPOINTMENT
========================================== */

export async function updateAppointment(
  id: string,
  payload: AppointmentPayload,
): Promise<void> {
  await api.put(`/api/appointments/${id}`, payload);
}

/* ==========================================
   FORM VALUES TO API PAYLOAD
========================================== */

export function formValuesToPayload(
  values: AppointmentFormValues,
  clinicId: number,
): AppointmentPayload {
  if (
    values.patientId === null ||
    values.treatmentId === null
  ) {
    throw new Error(
      "Selecciona un paciente y un tratamiento.",
    );
  }

  return {
    clinic_id: clinicId,
    patient_id: values.patientId,
    dentist_user_id: values.dentistUserId,
    treatment_id: values.treatmentId,

    // Se conserva la conversión UTC actual.
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
