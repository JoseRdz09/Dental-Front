
import { api } from "../../../../lib/axios";

import type {
  DashboardClinic,
  DashboardStatsData,
  DashboardTeamMember,
} from "../types/dashboard";

export const dashboardService = {
  async getClinics(signal?: AbortSignal): Promise<DashboardClinic[]> {
    const { data } = await api.get("/api/dashboard-owner/clinics", {
      signal,
    });

    return data.data;
  },

  async getStats(
    clinicId: number | null,
    date: string,
    signal?: AbortSignal
  ): Promise<DashboardStatsData> {
    const { data } = await api.get("/api/dashboard-owner/stats", {
      params: {
        clinic_id: clinicId ?? undefined,
        date,
      },
      signal,
    });

    return data.data;
  },

  async getTeam(
    clinicId: number | null,
    signal?: AbortSignal
  ): Promise<DashboardTeamMember[]> {
    const { data } = await api.get("/api/dashboard-owner/team", {
      params: {
        clinic_id: clinicId ?? undefined,
      },
      signal,
    });

    return data.data;
  },
};
