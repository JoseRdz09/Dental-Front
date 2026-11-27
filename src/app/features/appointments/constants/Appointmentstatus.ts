import type { AppointmentStatus } from "../types/appointment";

export interface StatusStyle {
  label: string;
  bg: string; // fondo suave de la cita
  fg: string; // texto
  accent: string; // borde lateral / punto de la leyenda
}

/**
 * Fuente única de verdad de los estados.
 * `as const` conserva los literales ("Pendiente", ...) y `satisfies`
 * valida la forma sin ensanchar los tipos.
 */
export const STATUS = {
  pendiente: { label: "Pendiente", bg: "#FEF3C7", fg: "#92400E", accent: "#F59E0B" },
  confirmada: { label: "Confirmada", bg: "#DCFCE7", fg: "#166534", accent: "#16A34A" },
  completada: { label: "Completada", bg: "#DBEAFE", fg: "#1E40AF", accent: "#2563EB" },
  cancelada: { label: "Cancelada", bg: "#FEE2E2", fg: "#991B1B", accent: "#DC2626" },
} as const satisfies Record<string, StatusStyle>;

export type StatusKey = keyof typeof STATUS;

/** Orden explícito para leyenda y select (no depende de Object.keys). */
export const STATUS_ORDER = [
  "pendiente",
  "confirmada",
  "completada",
  "cancelada",
] as const satisfies readonly StatusKey[];

/**
 * Opciones del <select> del formulario.
 * Sin `as`: si una etiqueta deja de coincidir con `AppointmentStatus`
 * (y con el enum del backend), TypeScript marca error aquí.
 */
export const STATUS_OPTIONS: AppointmentStatus[] = STATUS_ORDER.map(
  (key) => STATUS[key].label,
);

/** Las citas cerradas no se pueden mover en el calendario. */
export const LOCKED_STATUSES: readonly StatusKey[] = ["completada", "cancelada"];

const LOCKED_SET: ReadonlySet<StatusKey> = new Set(LOCKED_STATUSES);

function isStatusKey(value: string): value is StatusKey {
  // `in` también acepta claves heredadas ("constructor", "toString"...).
  return Object.prototype.hasOwnProperty.call(STATUS, value);
}

export function getStatusKey(status: string): StatusKey {
  const key = status.trim().toLowerCase();
  return isStatusKey(key) ? key : "pendiente";
}

export function getStatusStyle(status: string): StatusStyle {
  return STATUS[getStatusKey(status)];
}

export function isLockedStatus(status: string): boolean {
  return LOCKED_SET.has(getStatusKey(status));
}