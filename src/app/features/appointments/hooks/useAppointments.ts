import { useCallback, useEffect, useState } from "react";

import type { Appointment } from "../types/appointment";
import type { AppointmentFormValues } from "../types/appointmentForm";
import { getAppointments } from "../services/appointmentService";
import { formValuesToRange } from "../utils/Datetime";

interface Clinic {
  id: number;
  name: string;
}

// Comparte la petición en curso entre ejecuciones del hook
// con los mismos parámetros.
const pendingRequests = new Map<
  string,
  ReturnType<typeof getAppointments>
>();

function requestAppointments(start?: string, end?: string) {
  const key = `${start ?? ""}|${end ?? ""}`;

  const existingRequest = pendingRequests.get(key);

  if (existingRequest) {
    return existingRequest;
  }

  const request = getAppointments(undefined, start, end);
  pendingRequests.set(key, request);

  void request.finally(() => {
    if (pendingRequests.get(key) === request) {
      pendingRequests.delete(key);
    }
  }).catch(() => {
    // El error original se gestiona en fetchAppointments.
  });

  return request;
}

export function useAppointments(start?: string, end?: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await requestAppointments(start, end);

      setClinics(response.clinics);
      setClinicId(response.selected_clinic_id);
      setAppointments(response.data);
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
  }, [start, end]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await requestAppointments(start, end);

        if (!active) return;

        setClinics(response.clinics);
        setClinicId(response.selected_clinic_id);
        setAppointments(response.data);
      } catch (err) {
        if (!active) return;

        console.error("Error al cargar las citas:", err);

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las citas.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [start, end]);

  const reloadAppointments = useCallback(async () => {
    await fetchAppointments();
  }, [fetchAppointments]);

  const saveAppointment = useCallback(
    async (values: AppointmentFormValues) => {
      const { start: appointmentStart, end: appointmentEnd } =
        formValuesToRange(values);

      if (values.id) {
        setAppointments((prev) =>
          prev.map((appointment) =>
            String(appointment.id) === values.id
              ? {
                  ...appointment,
                  patientName: values.patientName,
                  treatment: values.treatment,
                  dentist: values.dentist,
                  details: values.details,
                  status: values.status,
                  start: appointmentStart,
                  end: appointmentEnd,
                }
              : appointment,
          ),
        );

        return;
      }

      const created: Appointment = {
        id: crypto.randomUUID(),
        patientName: values.patientName,
        treatment: values.treatment,
        dentist: values.dentist,
        details: values.details,
        status: values.status,
        start: appointmentStart,
        end: appointmentEnd,
      };

      setAppointments((prev) => [...prev, created]);
    },
    [],
  );

  const moveAppointment = useCallback(
    async (id: string, range: { start: string; end: string }) => {
      setAppointments((prev) =>
        prev.map((appointment) =>
          String(appointment.id) === id
            ? { ...appointment, ...range }
            : appointment,
        ),
      );

      return true;
    },
    [],
  );

  return {
    appointments,
    clinics,
    clinicId,
    loading,
    error,
    reloadAppointments,
    saveAppointment,
    moveAppointment,
  };
}