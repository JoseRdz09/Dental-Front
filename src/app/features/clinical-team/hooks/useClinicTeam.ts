
import { useCallback, useEffect, useState } from "react";
import { getClinicTeam } from "../services/clinicTeamServices";
import type { ClinicTeamMember } from "../types/clinicTeam";

export function useClinicTeam(clinicId: number | null) {
  const [members, setMembers] = useState<ClinicTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((previous) => previous + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchTeam() {
      if (!clinicId || clinicId <= 0) {
        setMembers([]);
        setError("Selecciona una clínica para consultar su equipo.");
        setLoading(false);
        return;
      }

      try {
        const response = await getClinicTeam(clinicId);

        if (cancelled) return;

        setMembers(response.data);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;

        setMembers([]);

        const message =
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
            : "No fue posible cargar el equipo clínico.";

        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchTeam();

    return () => {
      cancelled = true;
    };
  }, [clinicId, reloadKey]);

  return {
    members,
    total: members.length,
    loading,
    error,
    reload,
  };
}
