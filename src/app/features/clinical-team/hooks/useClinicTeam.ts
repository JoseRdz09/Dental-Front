
import { useCallback, useEffect, useState } from "react";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getClinicsWithTeam } from "../services/clinicTeamServices";

const CLINIC_TEAM_QUERY_KEY = ["clinic-team"] as const;

export function useClinicTeam() {
  const queryClient = useQueryClient();

  // Obtener todas las clínicas y sus integrantes en una petición.
  const {
    data: clinics = [],
    isLoading: clinicsLoading,
    error,
  } = useQuery({
    queryKey: CLINIC_TEAM_QUERY_KEY,
    queryFn: getClinicsWithTeam,
    staleTime: Infinity,
    retry: 1,
  });

  // Clínica seleccionada.
  const [clinicId, setClinicId] = useState<number | null>(null);

  // Seleccionar la primera clínica disponible.
  // Conservar la selección mientras siga existiendo.
  useEffect(() => {
    if (clinicsLoading) return;

    if (clinics.length === 0) {
      setClinicId(null);
      return;
    }

    setClinicId((currentId) => {
      const clinicExists = clinics.some(
        (clinic) => clinic.id === currentId
      );

      return clinicExists
        ? currentId
        : clinics[0].id;
    });
  }, [clinics, clinicsLoading]);

  // Obtener la clínica seleccionada desde los datos almacenados.
  const clinic =
    clinics.find((item) => item.id === clinicId) ?? null;

  // Obtener integrantes sin realizar otra petición.
  const members = clinic?.team?.data ?? [];
  const total = clinic?.team?.total ?? 0;

  // Recargar todas las clínicas y sus integrantes.
  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: CLINIC_TEAM_QUERY_KEY,
      exact: true,
    });
  }, [queryClient]);

  return {
    clinics,
    clinic,
    clinicId,
    setClinicId,

    members,
    total,

    clinicsLoading,
    loading: clinicsLoading,

    error: error instanceof Error
      ? error.message
      : error
        ? "No se pudieron cargar las clínicas."
        : null,

    reload,
  };
}
