
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

// Payment

export type PaymentMethod = "cash" | "card" | "transfer";

export interface PaymentFormValues {
  amount: string;
  method: PaymentMethod;
  reference: string;
}

export interface AppointmentFormValues {
  // ...tus campos actuales (patientId, dentistUserId, date, startTime, endTime, status, details, items)
  payment: PaymentFormValues;   // <- agrega esta línea
}

export type AppointmentSubmitValues = Omit<AppointmentFormValues, "payment"> & {
  payment: { amount: number; method: PaymentMethod; reference: string | null } | null;
  idempotencyKey: string;
};