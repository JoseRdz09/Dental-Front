import { api } from "../../../../lib/axios";
import type {
  Appointment,
  AppointmentStatus,
} from "../types/appointment";

export interface ApiClinic {
  id: number;
  name: string;
}

export interface ApiAppointment {
  id: number;
  clinic_id: number;
  patient_id: number;
  dentist_user_id: number | null;
  title: string;
  start_at: string | null;
  end_at: string | null;
  status: string;
  notes: string | null;

  patient: {
    id: number;
    name?: string;
  } | null;

  dentist: {
    id: number;
    name: string;
  } | null;
}

export interface AppointmentsResponse {
  clinics: ApiClinic[];
  selected_clinic_id: number | null;
  data: ApiAppointment[];
}

export interface CalendarAppointment extends Appointment {
  title: string;
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
      throw new Error(
        `Estado de cita no reconocido: "${status}"`,
      );
  }
}

function mapAppointment(
  appointment: ApiAppointment,
): CalendarAppointment {
  return {
    id: String(appointment.id),
    title: appointment.title,
    patientName: appointment.patient?.name ?? "Paciente",
    treatment: appointment.title,
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
): Promise<{
  clinics: ApiClinic[];
  selected_clinic_id: number | null;
  data: CalendarAppointment[];
}> {
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
  };
}
