export type AppointmentStatus =
  | "Pendiente"
  | "Confirmada"
  | "Completada"
  | "Cancelada";

export interface Appointment {
  id: string;
  patientName: string;
  treatment: string;
  dentist: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  details: string;
}