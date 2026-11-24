
import type {
  AppointmentItemType,
  AppointmentStatus,
} from "./appointment";


export type AppointmentFormItem =
  | {
      id?: number;
      type: "treatment";
      treatmentId: number;
      quantity: number;
    }
  | {
      id?: number;
      type: "product" | "extra";
      description: string;
      quantity: number;
      unitPrice: number;
    };


export interface AppointmentFormValues {
  id?: string;

  patientId: number | null;
  dentistUserId: number | null;

  // Conceptos asociados a la cita.
  items: AppointmentFormItem[];

  // Datos generales de la cita.
  details: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
}

export interface ApiErrorResponse {
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
