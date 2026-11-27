
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { dashboardService } from "../services/dashboardService";

const getLocalDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const useDashboard = () => {
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [date, setDate] = useState<string>(getLocalDate);

  // Clínicas
  const clinicsQuery = useQuery({
    queryKey: ["dashboard-owner", "clinics"],
    queryFn: ({ signal }) =>
      dashboardService.getClinics(signal),
    staleTime: 2 * 60 * 1000,
  });

  // Estadísticas por clínica y fecha
  const statsQuery = useQuery({
    queryKey: ["dashboard-owner", "stats", clinicId, date],
    queryFn: ({ signal }) =>
      dashboardService.getStats(clinicId, date, signal),
    placeholderData: keepPreviousData,
  });

  // Equipo
  const teamQuery = useQuery({
    queryKey: ["dashboard-owner", "team", clinicId],
    queryFn: ({ signal }) =>
      dashboardService.getTeam(clinicId, signal),
  });

  return {
    clinics: clinicsQuery.data ?? [],
    clinicId,
    setClinicId,

    date,
    setDate,

    stats: statsQuery.data ?? null,
    team: teamQuery.data ?? [],

    loading: statsQuery.isLoading,
    error: statsQuery.isError
      ? "No se pudieron cargar las estadísticas."
      : null,
  };
};
