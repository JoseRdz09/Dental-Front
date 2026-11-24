
export type AppointmentStatus =
  | "Pendiente"
  | "Confirmada"
  | "Completada"
  | "Cancelada";

export type AppointmentItemType =
  | "treatment"
  | "product"
  | "extra";

export interface AppointmentItem {
  id: number;
  appointmentId: number;
  type: AppointmentItemType;
  treatmentId: number | null;
  productId: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt?: string;
}

// Información que utiliza el calendario.
export interface Appointment {
  id: string;

  patientId: number | null;
  dentistUserId: number | null;

  patientName: string;
  treatment: string;
  dentist: string;

  start: string;
  end: string;

  status: AppointmentStatus;
  details: string;
}
