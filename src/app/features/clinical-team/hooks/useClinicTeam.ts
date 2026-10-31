
import { useCallback, useEffect, useState } from "react";
import { getClinicTeam } from "../services/clinicTeamServices";
import type { ClinicTeamMember } from "../types/clinicTeam";

export function useClinicTeam(clinicId: number | null) {
  const [members, setMembers] = useState<ClinicTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedClinicId, setLoadedClinicId] = useState<number | null>(
    null
  );

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((previous) => previous + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchTeam() {
      if (clinicId === null || clinicId <= 0) {
        setMembers([]);
        setError("Selecciona una clínica para consultar su equipo.");
        setLoadedClinicId(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getClinicTeam(clinicId);

        if (cancelled) return;

        setMembers(response.data);
      } catch (err: unknown) {
        if (cancelled) return;

        // No borramos los integrantes anteriores.
        // Mostramos el error por separado.
        const responseMessage =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof err.response === "object" &&
          err.response !== null &&
          "data" in err.response &&
          typeof err.response.data === "object" &&
          err.response.data !== null &&
          "message" in err.response.data &&
          typeof err.response.data.message === "string"
            ? err.response.data.message
            : null;

        setError(
          responseMessage ??
            "No fue posible cargar el equipo clínico."
        );
      } finally {
        if (!cancelled) {
          setLoadedClinicId(clinicId);
          setLoading(false);
        }
      }
    }

    void fetchTeam();

    return () => {
      cancelled = true;
    };
  }, [clinicId, reloadKey]);

  // Evita mostrar una lista vacía durante el primer render
  // cuando cambia la clínica seleccionada.
  const isLoading =
    loading ||
    (clinicId !== null &&
      clinicId > 0 &&
      loadedClinicId !== clinicId);

  return {
    members,
    total: members.length,
    loading: isLoading,
    error,
    reload,
  };
}
