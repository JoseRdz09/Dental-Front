
import type {
  Appointment,
  AppointmentItem,
} from "../types/appointment";

import type {
  AppointmentFormValues,
  AppointmentFormItem,
} from "../types/appointmentForm";

const pad = (n: number) => String(n).padStart(2, "0");

export const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}`;

export const toTimeInput = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60_000);

// ==========================================
// CREAR VALORES PARA UNA NUEVA CITA
// ==========================================

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
    dentistUserId: null,
    items: [],
    details: "",
    date: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    status: "Pendiente",
  };
}

// ==========================================
// CONVERTIR CONCEPTOS DE API AL FORMULARIO
// ==========================================

export function appointmentItemsToFormItems(
  items: AppointmentItem[],
): AppointmentFormItem[] {
  return items.map((item) => {
    if (item.type === "treatment") {
      return {
        id: item.id,
        type: "treatment",
        treatmentId: Number(item.treatmentId),
        quantity: Number(item.quantity),
      };
    }

    return {
      id: item.id,
      type: item.type,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    };
  });
}

// ==========================================
// CONVERTIR CITA EXISTENTE AL FORMULARIO
// ==========================================

type AppointmentWithItems = Appointment & {
  items: AppointmentItem[];
};

export function appointmentToFormValues(
  appointment: AppointmentWithItems,
): AppointmentFormValues {
  const start = new Date(appointment.start);
  const end = new Date(appointment.end);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error(
      "La cita contiene una fecha u horario inválido.",
    );
  }

  return {
    id: String(appointment.id),
    patientId: appointment.patientId,
    dentistUserId: appointment.dentistUserId,

    items: appointmentItemsToFormItems(
      appointment.items,
    ),

    details: appointment.details,

    date: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),

    status: appointment.status,
  };
}

// ==========================================
// CONVERTIR FECHA Y HORARIO A ISO
// ==========================================

export function formValuesToRange(
  values: AppointmentFormValues,
) {
  return {
    start: new Date(
      `${values.date}T${values.startTime}`,
    ).toISOString(),

    end: new Date(
      `${values.date}T${values.endTime}`,
    ).toISOString(),
  };
}
