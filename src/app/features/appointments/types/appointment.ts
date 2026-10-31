
export type AppointmentStatus =
  | "Pendiente"
  | "Confirmada"
  | "Completada"
  | "Cancelada";

export interface Appointment {
  id: string;

  // Identificadores relacionados con la cita.
  patientId: number | null;
  treatmentId: number | null;
  dentistUserId: number | null;

  // Información que muestra el calendario.
  patientName: string;
  treatment: string;
  dentist: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  details: string;
}
