
import { useCallback, useEffect, useState } from "react";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getMyClinics } from "../services/clinicService";


export const MY_CLINICS_QUERY_KEY = ["my-clinics"] as const;

export function useClinic() {
  const queryClient = useQueryClient();

  const [clinicId, setClinicId] = useState<number | null>(null);

  const {
    data: clinics = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: MY_CLINICS_QUERY_KEY,
    queryFn: getMyClinics,

    // Mantener los datos frescos durante 5 minutos.
    staleTime: 5 * 60 * 1000,

    retry: 1,
  });

  // Seleccionar la primera clínica al cargar los datos.
  // Si ya hay una seleccionada y sigue existiendo, conservarla.
  useEffect(() => {
    if (isLoading) return;

    setClinicId((currentId) => {
      if (
        currentId !== null &&
        clinics.some((clinic) => clinic.id === currentId)
      ) {
        return currentId;
      }

      return clinics[0]?.id ?? null;
    });
  }, [clinics, isLoading]);

  // Recargar las clínicas manualmente.
  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: MY_CLINICS_QUERY_KEY,
      exact: true,
    });
  }, [queryClient]);

  return {
    clinics,
    clinicId,
    setClinicId,
    loading: isLoading,
    error: error instanceof Error
      ? error.message
      : error
        ? "No se pudieron cargar las clínicas."
        : null,
    reload,
  };
}
