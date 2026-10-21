import type { Appointment } from "../types/appointment";
import type { AppointmentFormValues } from "../types/appointmentForm";

const pad = (n: number) => String(n).padStart(2, "0");

export const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const addMinutes = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000);

/**
 * Valores iniciales del formulario a partir del hueco donde se hizo clic.
 * - Vista semana/día: `dateStr` trae hora ("2026-10-16T09:30:00-06:00").
 * - Vista mes: `dateStr` es solo fecha ("2026-10-16") → se propone las 09:00.
 *   (Ojo: new Date("2026-10-16") se interpreta en UTC y puede caer el día anterior,
 *    por eso se construye con hora local.)
 */
export function slotToFormValues(
  dateStr: string,
  allDay: boolean,
  durationMinutes = 30,
): AppointmentFormValues {
  const start = allDay ? new Date(`${dateStr}T09:00:00`) : new Date(dateStr);
  const end = addMinutes(start, durationMinutes);

  return {
    patientName: "",
    treatment: "",
    dentist: "",
    details: "",
    date: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    status: "Pendiente",
  };
}

export function appointmentToFormValues(a: Appointment): AppointmentFormValues {
  const start = new Date(a.start);
  const end = new Date(a.end);

  return {
    id: String(a.id),
    patientName: a.patientName,
    treatment: a.treatment,
    dentist: a.dentist,
    details: a.details,
    date: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    status: a.status,
  };
}

/** Del formulario (fecha + horas locales) a ISO para guardar. */
export function formValuesToRange(v: AppointmentFormValues) {
  return {
    start: new Date(`${v.date}T${v.startTime}`).toISOString(),
    end: new Date(`${v.date}T${v.endTime}`).toISOString(),
  };
}