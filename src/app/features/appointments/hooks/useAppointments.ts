import { useCallback, useEffect, useMemo, useState } from "react";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";

import type { AppointmentStatus } from "../types/appointment";
import type { AppointmentFormValues } from "../types/appointmentForm";

import {
  addAppointmentItems,
  createAppointment,
  deleteAppointmentItem,
  formValuesToAppointmentPayload,
  formValuesToPayload,
  getAppointmentDetail,
  getAppointmentOptions,
  getAppointmentStats,
  getAppointments,
  getClinics,
  searchPatients,
  updateAppointment,
  type ApiAppointmentOptions,
  type ApiAppointmentStats,
  type ApiClinic,
  type ApiPatient,
  type AppointmentDetail,
  type AppointmentItemPayload,
  type AppointmentPayload,
} from "../services/appointmentService";

/* ==========================================
   QUERY KEYS
========================================== */

export const CLINICS_QUERY_KEY = ["appointment-clinics"] as const;
export const APPOINTMENTS_QUERY_KEY = ["appointments"] as const;
export const APPOINTMENT_STATS_QUERY_KEY = ["appointment-stats"] as const;
export const APPOINTMENT_OPTIONS_QUERY_KEY = ["appointment-options"] as const;
export const PATIENT_SEARCH_QUERY_KEY = ["appointment-patient-search"] as const;
export const APPOINTMENT_DETAIL_QUERY_KEY = ["appointment-detail"] as const;

/** ["appointments", clinicId, start, end] */
const appointmentsKey = (
  clinicId: number | null,
  start?: string,
  end?: string,
) => [...APPOINTMENTS_QUERY_KEY, clinicId, start ?? null, end ?? null] as const;

const appointmentsClinicKey = (clinicId: number | null) =>
  [...APPOINTMENTS_QUERY_KEY, clinicId] as const;

const statsKey = (clinicId: number | null) =>
  [...APPOINTMENT_STATS_QUERY_KEY, clinicId] as const;

const optionsKey = (clinicId: number | null) =>
  [...APPOINTMENT_OPTIONS_QUERY_KEY, clinicId] as const;

const detailKey = (clinicId: number | null, appointmentId: string | null) =>
  [...APPOINTMENT_DETAIL_QUERY_KEY, clinicId, appointmentId] as const;

/* ==========================================
   CONSTANTS / TYPES
========================================== */

const NO_CLINIC_MESSAGE = "No hay una clínica seleccionada.";
const MIN_SEARCH_LENGTH = 3;

const EMPTY_CLINICS: ApiClinic[] = [];
const EMPTY_APPOINTMENTS: AppointmentDetail[] = [];
const EMPTY_PATIENTS: ApiPatient[] = [];

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

/** Debe coincidir con AppointmentStatus::isClosed() del backend. */
const CLOSED_STATUSES: ReadonlySet<AppointmentStatus> = new Set<AppointmentStatus>([
  "Completada",
  "Cancelada",
]);

type MoveAppointmentPayload = {
  id: string;
  range: {
    start: string;
    end: string;
  };
};

type AppointmentsSnapshot = Array<[QueryKey, AppointmentDetail[] | undefined]>;

/* ==========================================
   HELPERS
========================================== */

function required<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }

  return value;
}

const toTime = (value: string): number => new Date(value).getTime();

const sortByStart = (list: AppointmentDetail[]): AppointmentDetail[] =>
  [...list].sort((a, b) => toTime(a.start) - toTime(b.start));

const hasId = (item: { id?: number | string | null }): boolean =>
  item.id !== undefined && item.id !== null;

function getNewItemPayload(
  item: AppointmentFormValues["items"][number],
): AppointmentItemPayload {
  if (item.type === "treatment") {
    return {
      type: "treatment",
      treatment_id: Number(item.treatmentId),
      quantity: Number(item.quantity),
    };
  }

  return {
    type: item.type,
    description: item.description.trim(),
    quantity: Number(item.quantity),
    unit_price: Number(item.unitPrice),
  };
}

/** ¿Cambió algún dato general? Si no, se evita el PUT. */
function hasGeneralChanges(
  original: AppointmentDetail,
  payload: AppointmentPayload,
): boolean {
  return (
    original.patientId !== payload.patient_id ||
    original.dentistUserId !== payload.dentist_user_id ||
    toTime(original.start) !== toTime(payload.start_at) ||
    toTime(original.end) !== toTime(payload.end_at) ||
    original.status !== payload.status ||
    original.details !== payload.notes
  );
}

/* ==========================================
   CACHE HELPERS (lista de citas por rango)
========================================== */

function overlapsRange(
  appointment: Pick<AppointmentDetail, "start" | "end">,
  rangeStart: string | null,
  rangeEnd: string | null,
): boolean {
  if (!rangeStart || !rangeEnd) return false;

  return (
    toTime(appointment.start) < toTime(rangeEnd) &&
    toTime(appointment.end) > toTime(rangeStart)
  );
}

/**
 * Inserta o reemplaza la cita en todos los rangos cacheados donde cae,
 * y la quita de los rangos donde ya no le corresponde.
 */
function upsertAppointmentInCache(
  queryClient: QueryClient,
  clinicId: number,
  appointment: AppointmentDetail,
): void {
  const entries = queryClient.getQueriesData<AppointmentDetail[]>({
    queryKey: appointmentsClinicKey(clinicId),
  });

  for (const [key, list] of entries) {
    if (!list) continue;

    const [, , rangeStart, rangeEnd] = key as readonly [
      string,
      number | null,
      string | null,
      string | null,
    ];

    const exists = list.some((item) => item.id === appointment.id);

    if (overlapsRange(appointment, rangeStart, rangeEnd)) {
      queryClient.setQueryData<AppointmentDetail[]>(
        key,
        sortByStart(
          exists
            ? list.map((item) =>
                item.id === appointment.id ? appointment : item,
              )
            : [...list, appointment],
        ),
      );
    } else if (exists) {
      queryClient.setQueryData<AppointmentDetail[]>(
        key,
        list.filter((item) => item.id !== appointment.id),
      );
    }
  }
}

function findAppointmentInCache(
  queryClient: QueryClient,
  clinicId: number,
  appointmentId: string,
): AppointmentDetail | null {
  const entries = queryClient.getQueriesData<AppointmentDetail[]>({
    queryKey: appointmentsClinicKey(clinicId),
  });

  for (const [, list] of entries) {
    const found = list?.find((item) => item.id === appointmentId);
    if (found) return found;
  }

  return (
    queryClient.getQueryData<AppointmentDetail>(
      detailKey(clinicId, appointmentId),
    ) ?? null
  );
}

/* ==========================================
   APPOINTMENTS HOOK
========================================== */

export function useAppointments(
  start?: string,
  end?: string,
  appointmentId?: string | null,
) {
  const queryClient = useQueryClient();

  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);

  const hasRange = Boolean(start && end);

  /* ---------- CLINICS ---------- */

  const clinicsQuery = useQuery({
    queryKey: CLINICS_QUERY_KEY,
    queryFn: ({ signal }) => getClinics({ signal }),
    staleTime: 5 * 60 * 1000,
  });

  const clinics = clinicsQuery.data ?? EMPTY_CLINICS;

  const clinicId = useMemo(
    () =>
      selectedClinicId !== null &&
      clinics.some((clinic) => clinic.id === selectedClinicId)
        ? selectedClinicId
        : (clinics[0]?.id ?? null),
    [clinics, selectedClinicId],
  );

  /* ---------- APPOINTMENTS ---------- */

  const appointmentsQuery = useQuery({
    queryKey: appointmentsKey(clinicId, start, end),

    queryFn: ({ signal }) =>
      getAppointments(
        required(clinicId, NO_CLINIC_MESSAGE),
        required(start, "Falta el rango de fechas de las citas."),
        required(end, "Falta el rango de fechas de las citas."),
        { signal },
      ),

    enabled: clinicId !== null && hasRange,
    staleTime: 30 * 1000,

    // Al navegar entre semanas se conserva lo anterior (sin parpadeo),
    // pero nunca se muestran citas de otra clínica.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === clinicId ? previous : undefined,
  });

  const appointments = appointmentsQuery.data ?? EMPTY_APPOINTMENTS;

  /* ---------- APPOINTMENT DETAIL ----------
     El listado ya trae los conceptos: solo se pide el detalle
     al servidor si la cita no está en la lista (otro rango). */

  const detailFromList = useMemo(
    () =>
      appointmentId
        ? (appointments.find((item) => item.id === appointmentId) ?? null)
        : null,
    [appointments, appointmentId],
  );

  const appointmentDetailQuery = useQuery({
    queryKey: detailKey(clinicId, appointmentId ?? null),

    queryFn: ({ signal }) =>
      getAppointmentDetail(
        required(appointmentId, "No hay una cita seleccionada."),
        { signal },
      ),

    enabled: clinicId !== null && Boolean(appointmentId) && !detailFromList,
    staleTime: 30 * 1000,
  });

  const appointmentDetail = detailFromList ?? appointmentDetailQuery.data ?? null;

  /* ---------- STATS ---------- */

  const statsQuery = useQuery({
    queryKey: statsKey(clinicId),
    queryFn: ({ signal }) =>
      getAppointmentStats(required(clinicId, NO_CLINIC_MESSAGE), { signal }),
    enabled: clinicId !== null,
    staleTime: 30 * 1000,
  });

  const stats = statsQuery.data ?? EMPTY_STATS;

  /* ---------- OPTIONS (dentistas y tratamientos) ---------- */

  const optionsQuery = useQuery({
    queryKey: optionsKey(clinicId),
    queryFn: ({ signal }) =>
      getAppointmentOptions(required(clinicId, NO_CLINIC_MESSAGE), { signal }),
    enabled: clinicId !== null,
    staleTime: 5 * 60 * 1000,
  });

  const options = optionsQuery.data ?? EMPTY_OPTIONS;

  /* ==========================================
     SINCRONIZACIÓN DE CACHÉ
  ========================================== */

  /** Las estadísticas son la única consulta que sí hay que repetir. */
  const refreshStats = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: statsKey(clinicId),
      }),
    [queryClient, clinicId],
  );

  /** Aplica la respuesta del servidor a la lista y al detalle. */
  const syncAppointment = useCallback(
    (appointment: AppointmentDetail) => {
      if (clinicId === null) return;

      upsertAppointmentInCache(queryClient, clinicId, appointment);

      queryClient.setQueryData(
        detailKey(clinicId, appointment.id),
        appointment,
      );
    },
    [queryClient, clinicId],
  );

  /** Solo para fallos parciales: el servidor puede haber aplicado cambios. */
  const resyncAppointment = useCallback(
    async (id: string) => {
      if (clinicId === null) return;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: appointmentsClinicKey(clinicId),
        }),
        queryClient.invalidateQueries({
          queryKey: detailKey(clinicId, id),
        }),
        refreshStats(),
      ]);
    },
    [queryClient, clinicId, refreshStats],
  );

  /* ==========================================
     SAVE APPOINTMENT

     CREATE: POST (devuelve la cita completa).
     UPDATE: PUT (solo si cambió algo) + conceptos nuevos/eliminados.
             Sin recargar el calendario: se usa la respuesta del servidor.
  ========================================== */

  const saveMutation = useMutation<AppointmentDetail, Error, AppointmentFormValues>({
    mutationFn: async (values) => {
      const activeClinicId = required(clinicId, NO_CLINIC_MESSAGE);

      /* ---------- CREAR ---------- */

      if (!values.id) {
        return createAppointment(formValuesToPayload(values, activeClinicId));
      }
      
      /* ---------- ACTUALIZAR ---------- */

      const id = String(values.id);
      

      const original = findAppointmentInCache(queryClient, activeClinicId, id);

      if (!original) {
        throw new Error(
          "No se encontró el detalle original de la cita. Cierra el formulario y vuelve a abrirlo.",
        );
      }

      if (!values.items || values.items.length === 0) {
        throw new Error("La cita debe tener al menos un concepto.");
      }

      const payload = formValuesToAppointmentPayload(values, activeClinicId);
      const generalChanged = hasGeneralChanges(original, payload);

      const retainedIds = new Set(
        values.items.filter(hasId).map((item) => Number(item.id)),
      );

      const removedIds = original.items
        .map((item) => Number(item.id))
        .filter((itemId) => !retainedIds.has(itemId));

      const newItems = values.items
        .filter((item) => !hasId(item))
        .map(getNewItemPayload);

      // Sin cambios: no se hace ninguna petición.
      if (!generalChanged && removedIds.length === 0 && newItems.length === 0) {
        return original;
      }

      let saved: AppointmentDetail = original;
      let baseItems = original.items;
      let touched = false;

      const saveGeneral = async () => {
        if (!generalChanged) return;

        saved = await updateAppointment(id, payload);
        baseItems = saved.items;
        touched = true;
      };

      // Altas y bajas son independientes: se ejecutan en paralelo.
      const saveItems = async () => {
        const tasks: Promise<void>[] = [];

        if (newItems.length > 0) {
          tasks.push(
            addAppointmentItems(id, newItems).then((items) => {
              baseItems = items;
              touched = true;
            }),
          );
        }

        for (const itemId of removedIds) {
          tasks.push(
            deleteAppointmentItem(id, itemId).then(() => {
              touched = true;
            }),
          );
        }

        await Promise.all(tasks);
      };

      try {
        // El backend no permite editar conceptos de citas cerradas:
        // si la cita pasa a Completada/Cancelada, los conceptos van primero;
        // si se reabre o sigue abierta, primero el estado.
        if (CLOSED_STATUSES.has(values.status)) {
          await saveItems();
          await saveGeneral();
        } else {
          await saveGeneral();
          await saveItems();
        }
      } catch (error) {
        if (touched) {
          await resyncAppointment(id);
        }

        throw error;
      }

      const removedSet = new Set(removedIds);

      return {
        ...saved,
        items: baseItems.filter((item) => !removedSet.has(Number(item.id))),
      };
    },

    onSuccess: (appointment) => {
      syncAppointment(appointment);
      void refreshStats();
    },
  });

  /* ==========================================
     MOVE APPOINTMENT (actualización optimista)
  ========================================== */

  const moveMutation = useMutation<
    AppointmentDetail,
    Error,
    MoveAppointmentPayload,
    { snapshot: AppointmentsSnapshot } | undefined
  >({
    mutationFn: async ({ id, range }) => {
      const activeClinicId = required(clinicId, NO_CLINIC_MESSAGE);

      const appointment = findAppointmentInCache(queryClient, activeClinicId, id);

      if (!appointment || appointment.patientId === null) {
        throw new Error("No se encontró la información de la cita.");
      }

      return updateAppointment(id, {
        clinic_id: activeClinicId,
        patient_id: appointment.patientId,
        dentist_user_id: appointment.dentistUserId,
        start_at: range.start,
        end_at: range.end,
        status: appointment.status,
        notes: appointment.details,
      });
    },

    onMutate: async ({ id, range }) => {
      if (clinicId === null) return undefined;

      const queryKey = appointmentsClinicKey(clinicId);

      await queryClient.cancelQueries({ queryKey });

      const snapshot = queryClient.getQueriesData<AppointmentDetail[]>({
        queryKey,
      });

      queryClient.setQueriesData<AppointmentDetail[]>({ queryKey }, (old) =>
        old?.map((item) =>
          item.id === id
            ? { ...item, start: range.start, end: range.end }
            : item,
        ),
      );

      return { snapshot };
    },

    onError: (_error, _variables, context) => {
      // Rollback: el PUT es atómico, no hace falta volver a consultar.
      context?.snapshot.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },

    onSuccess: (appointment) => {
      syncAppointment(appointment);
      void refreshStats();
    },
  });

  /* ==========================================
     ACCIONES PÚBLICAS
  ========================================== */

  const selectClinic = useCallback(
    (newClinicId: number) => {
      if (
        newClinicId === clinicId ||
        !clinics.some((clinic) => clinic.id === newClinicId)
      ) {
        return;
      }

      setSelectedClinicId(newClinicId);
    },
    [clinics, clinicId],
  );

  const reloadAppointments = useCallback(async () => {
    if (clinicId === null || !hasRange) return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: appointmentsClinicKey(clinicId),
      }),
      refreshStats(),
    ]);
  }, [queryClient, clinicId, hasRange, refreshStats]);

  const { mutateAsync: saveAsync } = saveMutation;
  const { mutateAsync: moveAsync } = moveMutation;

  const saveAppointment = useCallback(
    (values: AppointmentFormValues) => saveAsync(values),
    [saveAsync],
  );

  const moveAppointment = useCallback(
    async (
      id: string,
      range: { start: string; end: string },
    ): Promise<boolean> => {
      try {
        await moveAsync({ id, range });
        return true;
      } catch (error) {
        console.error("Error al mover la cita:", error);
        return false;
      }
    },
    [moveAsync],
  );

  /* ==========================================
     ERROR
  ========================================== */

  const queryError =
    clinicsQuery.error ??
    appointmentsQuery.error ??
    statsQuery.error ??
    optionsQuery.error ??
    appointmentDetailQuery.error;

  /* ==========================================
     RETURN
  ========================================== */

  return {
    appointments,

    appointmentDetail,
    appointmentDetailLoading: appointmentDetailQuery.isLoading,
    appointmentDetailFetching: appointmentDetailQuery.isFetching,

    clinics,
    clinicId,
    options,
    stats,

    loading: clinicsQuery.isLoading || appointmentsQuery.isLoading,
    fetching: appointmentsQuery.isFetching,

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

    saving: saveMutation.isPending,
    moving: moveMutation.isPending,
  };
}

/* ==========================================
   PATIENT SEARCH HOOK
========================================== */

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function usePatientSearch(
  clinicId: number | null,
  search: string,
  debounceMs = 300,
) {
  const trimmed = search.trim();
  const debouncedSearch = useDebouncedValue(trimmed, debounceMs);

  const canSearch =
    clinicId !== null && debouncedSearch.length >= MIN_SEARCH_LENGTH;

  const patientsQuery = useQuery({
    queryKey: [...PATIENT_SEARCH_QUERY_KEY, clinicId, debouncedSearch],

    queryFn: ({ signal }) =>
      searchPatients(required(clinicId, NO_CLINIC_MESSAGE), debouncedSearch, {
        signal,
      }),

    enabled: canSearch,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  const isDebouncing =
    trimmed.length >= MIN_SEARCH_LENGTH && trimmed !== debouncedSearch;

  return {
    patients: canSearch ? (patientsQuery.data ?? EMPTY_PATIENTS) : EMPTY_PATIENTS,
    loading: canSearch && (patientsQuery.isFetching || isDebouncing),
    error: patientsQuery.error,
  };
}