import { api } from "../../../../lib/axios";

import type { PaymentMethod } from "../../appointments/types/appointmentForm";

/* ==========================================
   API TYPES
========================================== */

type ApiEnvelope<T> = { message?: string; data: T };

type ApiPatientDebt = {
  id: number;
  title: string | null;
  start_at: string;
  total: number | string;
  paid_total: number | string;
  balance: number | string;
};

type ApiPatientPayment = {
  id: number;
  appointment_id: number | null;
  amount: number | string;
  payment_method: PaymentMethod;
  status: "completed" | "cancelled";
  paid_at: string;
  reference: string | null;
  payment_group_id: string | null;
  cancellation_reason: string | null;
};

type ApiPatientAccount = {
  patient: { id: number; first_name: string; last_name: string };
  total_debt: number | string;
  appointments: ApiPatientDebt[];
  payments: ApiPatientPayment[];
};

/* ==========================================
   APP TYPES
========================================== */

export type PatientDebt = {
  id: number;
  title: string;
  startAt: string;
  total: number;
  paidTotal: number;
  balance: number;
};

export type PatientPayment = {
  id: number;
  appointmentId: number | null;
  amount: number;
  method: PaymentMethod;
  status: "completed" | "cancelled";
  paidAt: string;
  reference: string | null;
  groupId: string | null;
  cancellationReason: string | null;
};

export type PatientAccount = {
  patientId: number;
  patientName: string;
  totalDebt: number;
  debts: PatientDebt[];
  payments: PatientPayment[];
};

export type CreatePatientPaymentInput = {
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  /** Si se omite, se reparte de la cita más antigua a la más reciente. */
  appointmentId: number | null;
  idempotencyKey: string;
};

/* ==========================================
   APP TYPES ADEUDOS
========================================== */

export type ReceivablePatient = {
  patientId: number;
  patientName: string;
  balance: number;
  appointmentsCount: number;
  oldestAt: string;
};

export type Receivables = {
  total: number;
  patientsCount: number;
  patients: ReceivablePatient[];
};

type ApiReceivablePatient = {
  patient_id: number;
  patient_name: string;
  balance: number | string;
  appointments_count: number;
  oldest_at: string;
};

type ApiReceivables = {
  total: number | string;
  patients_count: number;
  patients: ApiReceivablePatient[];
};
/* ==========================================
   MAPPING
========================================== */

function mapAccount(data: ApiPatientAccount): PatientAccount {
  return {
    patientId: data.patient.id,
    patientName: `${data.patient.first_name} ${data.patient.last_name}`.trim(),
    totalDebt: Number(data.total_debt),
    debts: data.appointments.map((a) => ({
      id: a.id,
      title: a.title ?? "Cita",
      startAt: a.start_at,
      total: Number(a.total),
      paidTotal: Number(a.paid_total),
      balance: Number(a.balance),
    })),
    payments: data.payments.map((p) => ({
      id: p.id,
      appointmentId: p.appointment_id,
      amount: Number(p.amount),
      method: p.payment_method,
      status: p.status,
      paidAt: p.paid_at,
      reference: p.reference,
      groupId: p.payment_group_id,
      cancellationReason: p.cancellation_reason,
    })),
  };
}

const base = (clinicId: number, patientId: number) =>
  `/api/clinics/${clinicId}/patients/${patientId}`;

/* ==========================================
   MAPPING ADEUDOS
========================================== */
function mapReceivables(data: ApiReceivables): Receivables {
  return {
    total: Number(data.total),
    patientsCount: data.patients_count,
    patients: data.patients.map((p) => ({
      patientId: p.patient_id,
      patientName: p.patient_name,
      balance: Number(p.balance),
      appointmentsCount: p.appointments_count,
      oldestAt: p.oldest_at,
    })),
  };
}
/* ==========================================
   REQUESTS
========================================== */

export async function getPatientAccount(
  clinicId: number,
  patientId: number,
  { signal }: { signal?: AbortSignal } = {},
): Promise<PatientAccount> {
  const response = await api.get<ApiEnvelope<ApiPatientAccount>>(
    `${base(clinicId, patientId)}/account`,
    { signal },
  );

  return mapAccount(response.data.data);
}

/** Registra el abono y devuelve la cuenta ya actualizada. */
export async function createPatientPayment(
  clinicId: number,
  patientId: number,
  input: CreatePatientPaymentInput,
): Promise<PatientAccount> {
  const response = await api.post<ApiEnvelope<ApiPatientAccount>>(
    `${base(clinicId, patientId)}/payments`,
    {
      amount: input.amount,
      method: input.method,
      reference: input.reference,
      appointment_id: input.appointmentId,
      idempotency_key: input.idempotencyKey,
    },
  );

  return mapAccount(response.data.data);
}

/** Cancela un pago (o el cobro completo si fue un abono general). */
export async function cancelPatientPayment(
  clinicId: number,
  patientId: number,
  paymentId: number,
  reason: string,
): Promise<PatientAccount> {
  const response = await api.post<ApiEnvelope<ApiPatientAccount>>(
    `${base(clinicId, patientId)}/payments/${paymentId}/cancel`,
    { reason },
  );

  return mapAccount(response.data.data);
}

// Funcion para aduedos
export async function getReceivables(
  clinicId: number,
  { signal }: { signal?: AbortSignal } = {},
): Promise<Receivables> {
  const response = await api.get<ApiEnvelope<ApiReceivables>>(
    `/api/clinics/${clinicId}/receivables`,
    { signal },
  );

  return mapReceivables(response.data.data);
}