
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientDirectory,
} from "../services/patientService";

import type {
  PatientPayload,
} from "../types/patient";

// Claves centralizadas de caché.
export const patientKeys = {
  all: ["patients"] as const,

  lists: () => [...patientKeys.all, "list"] as const,

  list: (page: number, search: string) =>
    [...patientKeys.lists(), { page, search }] as const,

  details: () => [...patientKeys.all, "detail"] as const,

  detail: (id: number) =>
    [...patientKeys.details(), id] as const,

  directory: () => [...patientKeys.all, "directory"] as const,
};

/**
 * Obtener pacientes con paginación y búsqueda.
 */
export function usePatients(page = 1, search = "") {
  const normalizedSearch = search.trim();

  return useQuery({
    queryKey: patientKeys.list(page, normalizedSearch),

    queryFn: () => getPatients(page, normalizedSearch),

    staleTime: 1000 * 60 * 2,

    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Obtener información de un paciente.
 */
export function usePatient(id: number | null) {
  return useQuery({
    queryKey: patientKeys.detail(id ?? 0),

    queryFn: () => getPatient(id!),

    enabled: id !== null && id > 0,

    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Obtener directorio de pacientes.
 */
export function usePatientDirectory() {
  return useQuery({
    queryKey: patientKeys.directory(),

    queryFn: getPatientDirectory,

    staleTime: 1000 * 60 * 5,

    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Registrar paciente.
 */
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PatientPayload) =>
      createPatient(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: patientKeys.all,
      });
    },
  });
}

/**
 * Actualizar paciente.
 */
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<PatientPayload>;
    }) => updatePatient(id, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: patientKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: patientKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Eliminar paciente.
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePatient(id),

    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: patientKeys.all,
      });

      queryClient.removeQueries({
        queryKey: patientKeys.detail(id),
      });
    },
  });
}
