
export type PaymentMethod = "cash" | "card" | "transfer";

export type PaymentStatus = "completed" | "cancelled";

export interface PaymentAllocation {
  id: number;
  appointment_id: number;
  amount: string | number;
  appointment?: {
    id: number;
    title: string;
    start_at: string;
  };
}

export interface Payment {
  id: number;
  clinic_id: number;
  patient_id: number;
  appointment_id: number | null;
  amount: string | number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  paid_at: string;
  reference: string | null;
  notes: string | null;
  received_by?: {
    id: number;
    name: string;
  };
  allocations?: PaymentAllocation[];
}

export interface PatientDebt {
  appointment_id: number;
  date: string;
  total: number;
  paid: number;
  balance: number;
}

export interface PatientAccount {
  patient: {
    id: number;
    name: string;
  };
  total_debt: number;
  total_paid: number;
  balance: number;
  debts: PatientDebt[];
  payments: Payment[];
}

export interface CreatePaymentPayload {
  amount: number;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
  paid_at?: string;
}

type ApiEnvelope<T> = {
  message?: string;
  data: T;
};
