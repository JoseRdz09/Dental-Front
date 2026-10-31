import type { AppointmentStatus } from "./appointment";

export interface AppointmentFormValues {
  id?: string;
  patientName: string;
  treatment: string;
  dentist: string;
  details: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
}