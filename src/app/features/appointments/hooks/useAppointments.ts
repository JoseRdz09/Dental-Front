
import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { Appointment } from "../types/appointment";
import type { AppointmentFormValues } from "../types/appointmentForm";

import {
  createAppointment,
  updateAppointment,
  formValuesToPayload,
  getAppointments,
  type ApiAppointmentOptions,
  type ApiClinic,
} from "../services/appointmentService";

interface RequestResult {
  clinics: ApiClinic[];
  selected_clinic_id: number | null;
  data: Appointment[];
  options: ApiAppointmentOptions;
}

interface MoveAppointmentPayload {
  id: string;
  range: {
    start: string;
    end: string;
  };
}

const EMPTY_OPTIONS: ApiAppointmentOptions = {
  patients: [],
  dentists: [],
  treatments: [],
};

export const APPOINTMENTS_QUERY_KEY = ["appointments"] as const;

export function useAppointments(start?: string, end?: string) {
  const queryClient = useQueryClient();

  // Clínica seleccionada manualmente.
  const [selectedClinicId, setSelectedClinicId] =
    useState<number | null>(null);

  // Consulta de citas y opciones.
  const appointmentsQuery = useQuery<RequestResult>({
    queryKey: [
      ...APPOINTMENTS_QUERY_KEY,
      selectedClinicId ?? "default",
      start ?? null,
      end ?? null,
    ],
    queryFn: () => getAppointments(selectedClinicId, start, end),
    staleTime: 30 * 1000,
  });

  const response = appointmentsQuery.data;

  const appointments = response?.data ?? [];
  const clinics = response?.clinics ?? [];

  const clinicId =
    selectedClinicId ?? response?.selected_clinic_id ?? null;

  const options = response?.options ?? EMPTY_OPTIONS;

  // Invalidar las consultas de citas.
  const invalidateAppointments = () =>
    queryClient.invalidateQueries({
      queryKey: APPOINTMENTS_QUERY_KEY,
    });

  // Crear o actualizar una cita.
  const saveMutation = useMutation({
    mutationFn: async (values: AppointmentFormValues) => {
      if (!clinicId) {
        throw new Error("No hay una clínica seleccionada.");
      }

      const payload = formValuesToPayload(values, clinicId);

      if (values.id) {
        await updateAppointment(values.id, payload);
      } else {
        await createAppointment(payload);
      }
    },

    onSuccess: invalidateAppointments,
  });

  // Mover una cita desde el calendario.
  const moveMutation = useMutation({
    mutationFn: async ({
      id,
      range,
    }: MoveAppointmentPayload) => {
      if (!clinicId) {
        throw new Error("No hay una clínica seleccionada.");
      }

      const appointment = appointments.find(
        (item) => String(item.id) === id,
      );

      if (
        !appointment ||
        appointment.patientId === null ||
        appointment.treatmentId === null
      ) {
        throw new Error("No se encontró la información de la cita.");
      }

      await updateAppointment(id, {
        clinic_id: clinicId,
        patient_id: appointment.patientId,
        dentist_user_id: appointment.dentistUserId,
        treatment_id: appointment.treatmentId,
        start_at: range.start,
        end_at: range.end,
        status: appointment.status,
        notes: appointment.details,
      });
    },

    onSuccess: invalidateAppointments,

    onError: () => {
      // Recuperar la información real del calendario.
      void invalidateAppointments();
    },
  });

  // Cambio manual de clínica.
  const selectClinic = (newClinicId: number) => {
    if (newClinicId === clinicId) return;

    setSelectedClinicId(newClinicId);
  };

  // Recargar citas manualmente.
  const reloadAppointments = async () => {
    await appointmentsQuery.refetch();
  };

  // Guardar cita.
  const saveAppointment = async (values: AppointmentFormValues) => {
    await saveMutation.mutateAsync(values);
  };

  // Mover cita.
  const moveAppointment = async (
    id: string,
    range: { start: string; end: string },
  ): Promise<boolean> => {
    try {
      await moveMutation.mutateAsync({ id, range });
      return true;
    } catch (error) {
      console.error("Error al mover la cita:", error);
      return false;
    }
  };

  return {
    appointments,
    clinics,
    clinicId,
    options,

    loading: appointmentsQuery.isLoading,
    error: appointmentsQuery.error
      ? appointmentsQuery.error instanceof Error
        ? appointmentsQuery.error.message
        : "No se pudieron cargar las citas."
      : null,

    selectClinic,
    reloadAppointments,
    saveAppointment,
    moveAppointment,
  };
}
