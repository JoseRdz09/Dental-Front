
import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { AppointmentFormValues } from "../types/appointmentForm";

import {
  createAppointment,
  updateAppointment,
  formValuesToPayload,
  getAppointments,
  getClinics,
  getAppointmentOptions,
  getAppointmentStats,
  searchPatients,
  type ApiAppointmentOptions,
  type ApiAppointmentStats,
  type ApiClinic,
} from "../services/appointmentService";

/* ==========================================
   QUERY KEYS
========================================== */

export const CLINICS_QUERY_KEY = ["appointment-clinics"] as const;

export const APPOINTMENTS_QUERY_KEY = ["appointments"] as const;

export const APPOINTMENT_STATS_QUERY_KEY = [
  "appointment-stats",
] as const;

export const APPOINTMENT_OPTIONS_QUERY_KEY = [
  "appointment-options",
] as const;

export const PATIENT_SEARCH_QUERY_KEY = [
  "appointment-patient-search",
] as const;

/* ==========================================
   TYPES
========================================== */

type MoveAppointmentPayload = {
  id: string;
  range: {
    start: string;
    end: string;
  };
};

/* ==========================================
   DEFAULT VALUES
========================================== */

const EMPTY_OPTIONS: ApiAppointmentOptions = {
  dentists: [],
  treatments: [],
};

const EMPTY_STATS: ApiAppointmentStats = {
  today: 0,
  pending: 0,
  upcoming: 0,
  cancelled: 0,
};

/* ==========================================
   APPOINTMENTS HOOK
========================================== */

export function useAppointments(
  start?: string,
  end?: string,
) {
  const queryClient = useQueryClient();

  const [selectedClinicId, setSelectedClinicId] =
    useState<number | null>(null);

  /* ==========================================
     CLINICS
  ========================================== */

  const clinicsQuery = useQuery<ApiClinic[]>({
    queryKey: CLINICS_QUERY_KEY,
    queryFn: getClinics,
    staleTime: 5 * 60 * 1000,
  });

  const clinics = clinicsQuery.data ?? [];

  const clinicId =
    selectedClinicId ?? clinics[0]?.id ?? null;

  /* ==========================================
     APPOINTMENTS
  ========================================== */

  const appointmentsQuery = useQuery({
    queryKey: [
      ...APPOINTMENTS_QUERY_KEY,
      clinicId,
      start ?? null,
      end ?? null,
    ],

    queryFn: () => {
      if (!clinicId || !start || !end) {
        throw new Error("Falta el rango de fechas de las citas.");
      }

      return getAppointments(clinicId, start, end);
    },

    enabled: clinicId !== null && Boolean(start && end),

    staleTime: 30 * 1000,
  });

  const appointments = appointmentsQuery.data ?? [];

  /* ==========================================
     MONTHLY STATISTICS
  ========================================== */

  const statsQuery = useQuery({
    queryKey: [
      ...APPOINTMENT_STATS_QUERY_KEY,
      clinicId,
      start ?? null,
      end ?? null,
    ],

    queryFn: () => {
      if (!clinicId || !start || !end) {
        throw new Error("Falta el rango mensual de las estadísticas.");
      }

      return getAppointmentStats(clinicId, start, end);
    },

    enabled: clinicId !== null && Boolean(start && end),

    staleTime: 30 * 1000,
  });

  const stats = statsQuery.data ?? EMPTY_STATS;

  /* ==========================================
     APPOINTMENT OPTIONS
  ========================================== */

  const optionsQuery = useQuery({
    queryKey: [
      ...APPOINTMENT_OPTIONS_QUERY_KEY,
      clinicId,
    ],

    queryFn: () => {
      if (!clinicId) {
        throw new Error("No hay una clínica seleccionada.");
      }

      return getAppointmentOptions(clinicId);
    },

    enabled: clinicId !== null,

    staleTime: 5 * 60 * 1000,
  });

  const options = optionsQuery.data ?? EMPTY_OPTIONS;

  /* ==========================================
     INVALIDATE CALENDAR DATA
  ========================================== */

  const invalidateCalendar = async () => {
    if (!clinicId) return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          ...APPOINTMENTS_QUERY_KEY,
          clinicId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          ...APPOINTMENT_STATS_QUERY_KEY,
          clinicId,
        ],
      }),
    ]);
  };

  /* ==========================================
     SAVE APPOINTMENT
  ========================================== */

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

    onSuccess: invalidateCalendar,
  });

  /* ==========================================
     MOVE APPOINTMENT
  ========================================== */

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
        throw new Error(
          "No se encontró la información de la cita.",
        );
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

    onSuccess: invalidateCalendar,

    onError: () => {
      void invalidateCalendar();
    },
  });

  /* ==========================================
     SELECT CLINIC
  ========================================== */

  const selectClinic = (newClinicId: number) => {
    if (newClinicId === clinicId) return;

    setSelectedClinicId(newClinicId);
  };

  /* ==========================================
     RELOAD APPOINTMENTS
  ========================================== */

  const reloadAppointments = async () => {
    await Promise.all([
      appointmentsQuery.refetch(),
      statsQuery.refetch(),
    ]);
  };

  /* ==========================================
     PUBLIC ACTIONS
  ========================================== */

  const saveAppointment = async (
    values: AppointmentFormValues,
  ) => {
    await saveMutation.mutateAsync(values);
  };

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

  /* ==========================================
     ERROR
  ========================================== */

  const queryError =
    clinicsQuery.error ??
    appointmentsQuery.error ??
    statsQuery.error ??
    optionsQuery.error;

  /* ==========================================
     RETURN
  ========================================== */

  return {
    appointments,
    clinics,
    clinicId,
    options,
    stats,

    loading:
      clinicsQuery.isLoading ||
      appointmentsQuery.isLoading,

    statsLoading: statsQuery.isLoading,
    optionsLoading: optionsQuery.isLoading,

    error: queryError
      ? queryError instanceof Error
        ? queryError.message
        : "No se pudieron cargar los datos de las citas."
      : null,

    selectClinic,
    reloadAppointments,
    saveAppointment,
    moveAppointment,
  };
}

/* ==========================================
   PATIENT SEARCH HOOK
========================================== */

export function usePatientSearch(
  clinicId: number | null,
  search: string,
) {
  const normalizedSearch = search.trim();

  const patientsQuery = useQuery({
    queryKey: [
      ...PATIENT_SEARCH_QUERY_KEY,
      clinicId,
      normalizedSearch,
    ],

    queryFn: () => {
      if (!clinicId) {
        throw new Error("No hay una clínica seleccionada.");
      }

      return searchPatients(clinicId, normalizedSearch);
    },

    enabled:
      clinicId !== null &&
      normalizedSearch.length >= 1,

    staleTime: 30 * 1000,
  });

  return {
    patients: patientsQuery.data ?? [],
    loading: patientsQuery.isLoading,
    error: patientsQuery.error,
  };
}
