
import { useCallback, useEffect, useState } from "react";

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

const EMPTY_OPTIONS: ApiAppointmentOptions = {
  patients: [],
  dentists: [],
  treatments: [],
};

const pendingRequests = new Map<string, ReturnType<typeof getAppointments>>();

function requestAppointments(
  clinicId?: number | null,
  start?: string,
  end?: string,
) {
  const key = `${clinicId ?? ""}|${start ?? ""}|${end ?? ""}`;

  const existingRequest = pendingRequests.get(key);

  if (existingRequest) {
    return existingRequest;
  }

  const request = getAppointments(clinicId, start, end);

  pendingRequests.set(key, request);

  void request.finally(() => {
    if (pendingRequests.get(key) === request) {
      pendingRequests.delete(key);
    }
  }).catch(() => {
    // El error original se maneja en fetchAppointments.
  });

  return request;
}

export function useAppointments(start?: string, end?: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinics, setClinics] = useState<ApiClinic[]>([]);
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [options, setOptions] =
    useState<ApiAppointmentOptions>(EMPTY_OPTIONS);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: RequestResult = await requestAppointments(
        clinicId,
        start,
        end,
      );

      setClinics(response.clinics);
      setClinicId(response.selected_clinic_id);
      setAppointments(response.data);
      setOptions(response.options ?? EMPTY_OPTIONS);
    } catch (err) {
      console.error("Error al cargar las citas:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las citas.",
      );
    } finally {
      setLoading(false);
    }
  }, [clinicId, start, end]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await requestAppointments(
          clinicId,
          start,
          end,
        );

        if (!active) return;

        setClinics(response.clinics);
        setClinicId(response.selected_clinic_id);
        setAppointments(response.data);
        setOptions(response.options ?? EMPTY_OPTIONS);
      } catch (err) {
        if (!active) return;

        console.error("Error al cargar las citas:", err);

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las citas.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [start, end, clinicId]);

  const reloadAppointments = useCallback(async () => {
    await fetchAppointments();
  }, [fetchAppointments]);

  const saveAppointment = useCallback(
    async (values: AppointmentFormValues) => {
      if (!clinicId) {
        throw new Error("No hay una clínica seleccionada.");
      }

      const payload = formValuesToPayload(values, clinicId);

      if (values.id) {
        await updateAppointment(values.id, payload);
      } else {
        await createAppointment(payload);
      }

      await fetchAppointments();
    },
    [clinicId, fetchAppointments],
  );

  const moveAppointment = useCallback(
    async (
      id: string,
      range: { start: string; end: string },
    ): Promise<boolean> => {
      if (!clinicId) {
        return false;
      }

      const appointment = appointments.find(
        (item) => String(item.id) === id,
      );

      if (!appointment) {
        return false;
      }

      if (
        appointment.patientId === null ||
        appointment.treatmentId === null
      ) {
        return false;
      }

      try {
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

        await fetchAppointments();

        return true;
      } catch (error) {
        console.error("Error al actualizar la cita:", error);

        await fetchAppointments();

        return false;
      }
    },
    [clinicId, appointments, fetchAppointments],
  );

  return {
    appointments,
    clinics,
    clinicId,
    options,
    loading,
    error,
    reloadAppointments,
    saveAppointment,
    moveAppointment,
  };
}
