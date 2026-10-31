
import type { Appointment } from "../types/appointment";
import type { AppointmentFormValues } from "../types/appointmentForm";

const pad = (n: number) => String(n).padStart(2, "0");

export const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const toTimeInput = (d: Date) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const addMinutes = (d: Date, minutes: number) =>
  new Date(d.getTime() + minutes * 60_000);

export function slotToFormValues(
  dateStr: string,
  allDay: boolean,
  durationMinutes = 30,
): AppointmentFormValues {
  const start = allDay
    ? new Date(`${dateStr}T09:00:00`)
    : new Date(dateStr);

  const end = addMinutes(start, durationMinutes);

  return {
    patientId: null,
    treatmentId: null,
    dentistUserId: null,
    details: "",
    date: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    status: "Pendiente",
  };
}

export function appointmentToFormValues(
  appointment: Appointment,
): AppointmentFormValues {
  const start = new Date(appointment.start);
  const end = new Date(appointment.end);

  return {
    id: String(appointment.id),
    patientId: appointment.patientId,
    treatmentId: appointment.treatmentId,
    dentistUserId: appointment.dentistUserId,
    details: appointment.details,
    date: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    status: appointment.status,
  };
}

export function formValuesToRange(values: AppointmentFormValues) {
  return {
    start: new Date(
      `${values.date}T${values.startTime}`,
    ).toISOString(),

    end: new Date(
      `${values.date}T${values.endTime}`,
    ).toISOString(),
  };
}
