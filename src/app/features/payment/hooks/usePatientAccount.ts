import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  APPOINTMENTS_QUERY_KEY,
  APPOINTMENT_DETAIL_QUERY_KEY,
} from "../../appointments/hooks/useAppointments";

import {
  cancelPatientPayment,
  createPatientPayment,
  getPatientAccount,
  getReceivables,
  type CreatePatientPaymentInput,
  type PatientAccount,
} from "../services/patientAccountService";

export const PATIENT_ACCOUNT_QUERY_KEY = ["patient-account"] as const;

export const RECEIVABLES_QUERY_KEY = ["receivables"] as const;

const accountKey = (clinicId: number | null, patientId: number | null) =>
  [...PATIENT_ACCOUNT_QUERY_KEY, clinicId, patientId] as const;

/** Adeudo y desglose por cita de un paciente. */
export function usePatientAccount(
  clinicId: number | null,
  patientId: number | null,
) {
  return useQuery({
    queryKey: accountKey(clinicId, patientId),
    queryFn: ({ signal }) =>
      getPatientAccount(clinicId as number, patientId as number, { signal }),
    enabled: clinicId !== null && patientId !== null,
    staleTime: 15 * 1000,
  });
}

/**
 * Abonos y cancelaciones. La respuesta trae la cuenta actualizada
 * (se guarda directo en caché) y se invalidan las citas, porque su
 * `paidTotal` / `balance` cambiaron.
 */
export function usePatientPaymentActions(
  clinicId: number,
  patientId: number,
) {
  const queryClient = useQueryClient();

  const onSuccess = (account: PatientAccount) => {
    queryClient.setQueryData(accountKey(clinicId, patientId), account);

    void queryClient.invalidateQueries({
      queryKey: APPOINTMENTS_QUERY_KEY,
    });

    void queryClient.invalidateQueries({
      queryKey: APPOINTMENT_DETAIL_QUERY_KEY,
    });

    void queryClient.invalidateQueries({
      queryKey: [...RECEIVABLES_QUERY_KEY, clinicId],
    });
  };

  const pay = useMutation<PatientAccount, Error, CreatePatientPaymentInput>({
    mutationFn: (input) => createPatientPayment(clinicId, patientId, input),
    onSuccess,
  });

  const cancel = useMutation<
    PatientAccount,
    Error,
    { paymentId: number; reason: string }
  >({
    mutationFn: ({ paymentId, reason }) =>
      cancelPatientPayment(clinicId, patientId, paymentId, reason),
    onSuccess,
  });

  return { pay, cancel };
}

/** Lista general de pacientes con adeudos de una clínica. */
export function useReceivables(clinicId: number) {
  return useQuery({
    queryKey: [...RECEIVABLES_QUERY_KEY, clinicId],
    queryFn: ({ signal }) => getReceivables(clinicId, { signal }),
    enabled: clinicId > 0,
    staleTime: 15 * 1000,
  });
}