
import { api } from "../../../../lib/axios";
import type {
  Appointment,
  AppointmentStatus,
} from "../types/appointment";

export interface ApiAppointment {
  id: number;
  clinic_id: number;
  patient_id: number;
  dentist_user_id: number;
  title: string;
  start_at: string;
  end_at: string;
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

interface AppointmentsResponse {
  data: ApiAppointment[];
}

// Conservamos title para los eventos del calendario.
export interface CalendarAppointment extends Appointment {
  title: string;
}

// Convierte los estados de Laravel al formato de React.

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


export async function getAppointments(
  clinicId: number,
  start?: string,
  end?: string,
): Promise<CalendarAppointment[]> {
  console.log("Cargando citas para clinicId:", clinicId);
  const response = await api.get<AppointmentsResponse>(
    "/api/appointments",
    {
      params: {
        clinic_id: clinicId,
        ...(start ? { start } : {}),
        ...(end ? { end } : {}),
      },
    },
  );

  return response.data.data.map((appointment) => ({
    id: String(appointment.id),
    title: appointment.title,
    patientName: appointment.patient?.name ?? "Paciente",
    treatment: appointment.title,
    dentist: appointment.dentist?.name ?? "Sin asignar",
    start: appointment.start_at,
    end: appointment.end_at,
    status: normalizeAppointmentStatus(appointment.status),
    details: appointment.notes ?? "",
  }));
}
