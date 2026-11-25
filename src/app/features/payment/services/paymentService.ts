
import { api } from "../../../../lib/axios";

import type {
  PatientAccount,
  Payment,
  CreatePaymentPayload,
} from "../types/payment";

type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

function patientAccountUrl(
  clinicId: number,
  patientId: number,
): string {
  return `/api/clinics/${clinicId}/patients/${patientId}`;
}

export async function getPatientAccount(
  clinicId: number,
  patientId: number,
): Promise<PatientAccount> {
  const response = await api.get<ApiEnvelope<PatientAccount>>(
    `${patientAccountUrl(clinicId, patientId)}/account`,
  );

  return response.data.data;
}

export async function createPatientPayment(
  clinicId: number,
  patientId: number,
  payload: CreatePaymentPayload,
): Promise<Payment> {
  const response = await api.post<ApiEnvelope<Payment>>(
    `${patientAccountUrl(clinicId, patientId)}/payments`,
    payload,
  );

  return response.data.data;
}

export async function cancelPatientPayment(
  clinicId: number,
  patientId: number,
  paymentId: number,
  cancellationReason: string,
): Promise<void> {
  await api.post(
    `${patientAccountUrl(clinicId, patientId)}/payments/${paymentId}/cancel`,
    {
      cancellation_reason: cancellationReason,
    },
  );
}
