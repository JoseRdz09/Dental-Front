
export interface DashboardStatsData {
  monthlyIncome: number;
  performance: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  dailySales: number;
  completedAppointments: number;
  activeTeamMembers: number;
}

export interface DashboardClinic {
  id: number;
  name: string;
  stats: DashboardStatsData;
}

export interface DashboardTeamMember {
  id: number;
  name: string;
  role: "dentist" | "assistant" | "clinic_admin" | "cashier";
  isActive: boolean;
}

export type DashboardPeriod =
  | "today"
  | "week"
  | "month"
  | "year";

export interface DashboardFilters {
  clinicId: number | null;
  period: DashboardPeriod;
}
