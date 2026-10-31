import type { AppointmentStatus } from "../types/appointment";

export type StatusKey = "pendiente" | "confirmada" | "completada" | "cancelada";

export interface StatusStyle {
  label: string;
  bg: string; // fondo suave de la cita
  fg: string; // texto
  accent: string; // borde lateral / punto de la leyenda
}

export const STATUS: Record<StatusKey, StatusStyle> = {
  pendiente: { label: "Pendiente", bg: "#fdf0cf", fg: "#6b4204", accent: "#d48806" },
  confirmada: { label: "Confirmada", bg: "#d9f2ee", fg: "#0b4f49", accent: "#0f766e" },
  completada: { label: "Completada", bg: "#e8edf0", fg: "#43545c", accent: "#7b8e98" },
  cancelada: { label: "Cancelada", bg: "#fde4e4", fg: "#8a1c1c", accent: "#dc2626" },
};

export const STATUS_ORDER = Object.keys(STATUS) as StatusKey[];

/** Opciones del <select> del formulario (mismo texto que usa la leyenda). */
// Las etiquetas de STATUS deben coincidir con los valores de AppointmentStatus.
export const STATUS_OPTIONS = STATUS_ORDER.map(
  (key) => STATUS[key].label,
) as AppointmentStatus[];

/** Las citas cerradas no se pueden mover en el calendario. */
export const LOCKED_STATUSES: StatusKey[] = ["completada", "cancelada"];

export function getStatusKey(status: string): StatusKey {
  const key = status.toLowerCase();
  return key in STATUS ? (key as StatusKey) : "pendiente";
}