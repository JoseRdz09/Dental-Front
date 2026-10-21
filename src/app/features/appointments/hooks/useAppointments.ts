
import { useCallback, useEffect, useState } from "react";

import type { Appointment } from "../types/appointment";
import type { AppointmentFormValues } from "../types/appointmentForm";
import { getAppointments } from "../services/appointmentService";
import { formValuesToRange } from "../utils/Datetime";

export function useAppointments(
  clinicId: number | null | undefined,
  start?: string,
  end?: string,
) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchAppointments() {
      if (clinicId == null) {
        setAppointments([]);
        setLoading(false);
        return; // sin error: aún no hay clínica
      }
      if (!Number.isInteger(clinicId) || clinicId <= 0) {
        setAppointments([]);
        setLoading(false);
        setError("Selecciona una clínica válida para cargar las citas.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getAppointments(clinicId, start, end);

        if (active) {
          setAppointments(data);
        }
      } catch (err) {
        console.error("Error al cargar las citas:", err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar las citas.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchAppointments();

    return () => {
      active = false;
    };
  }, [clinicId, start, end]);

  const reloadAppointments = useCallback(async () => {
    if (
      clinicId == null ||
      !Number.isInteger(clinicId) ||
      clinicId <= 0
    ) {
      setError("Selecciona una clínica válida para cargar las citas.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAppointments(clinicId, start, end);
      setAppointments(data);
    } catch (err) {
      console.error("Error al recargar las citas:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las citas.",
      );
    } finally {
      setLoading(false);
    }
  }, [clinicId, start, end]);

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
    async (
      id: string,
      range: { start: string; end: string },
    ) => {
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
    loading,
    error,
    reloadAppointments,
    saveAppointment,
    moveAppointment,
  };
}
