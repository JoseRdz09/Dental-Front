import type { AppointmentStatus } from "./appointment";

export interface AppointmentFormValues {
  id?: string;

  // Identificadores de los registros.
  patientId: number | null;
  treatmentId: number | null;
  dentistUserId: number | null;

  // Datos del formulario.
  details: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm

  status: AppointmentStatus;
}

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[] | string>;
}


export interface ApiError {
  response?: {
    status?: number;
    data?: ApiErrorResponse;
  };
  message?: string;
}