import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CLINICS_QUERY_KEY } from "../../../appointments/hooks/useAppointments";
import {
  getClinics,
  type ApiClinic,
} from "../../../appointments/services/appointmentService";

const EMPTY_CLINICS: ApiClinic[] = [];

/**
 * Clínica activa para pantallas que no necesitan todo `useAppointments`.
 * Comparte la misma caché de clínicas que el calendario (misma query key),
 * así que no hay una petición extra si ya se habían cargado.
 */
export function useActiveClinic() {
  const query = useQuery({
    queryKey: CLINICS_QUERY_KEY,
    queryFn: ({ signal }) => getClinics({ signal }),
    staleTime: 5 * 60 * 1000,
  });

  const clinics = query.data ?? EMPTY_CLINICS;
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);

  const clinicId = useMemo(
    () =>
      selectedClinicId !== null &&
      clinics.some((clinic) => clinic.id === selectedClinicId)
        ? selectedClinicId
        : (clinics[0]?.id ?? null),
    [clinics, selectedClinicId],
  );

  return {
    clinics,
    clinicId,
    selectClinic: setSelectedClinicId,
    loading: query.isLoading,
    error: query.error,
  };
}