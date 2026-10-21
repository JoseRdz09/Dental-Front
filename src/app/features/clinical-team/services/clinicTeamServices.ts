
import { api } from "../../../../lib/axios";
import type { ClinicTeamResponse } from "../types/clinicTeam";

export async function getClinicTeam(
  clinicId: number
): Promise<ClinicTeamResponse> {
  if (!Number.isInteger(clinicId) || clinicId <= 0) {
    throw new Error("El ID de la clínica no es válido.");
  }

  const { data } = await api.get<ClinicTeamResponse>(
    `/api/clinics/${clinicId}/team`
  );

  return data;
}
