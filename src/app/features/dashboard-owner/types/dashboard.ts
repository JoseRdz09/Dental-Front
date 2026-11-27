export interface DashboardClinic {
  id: number;
  name: string;
}

export interface DashboardChartItem {
  label: string;
  value: number;
}

export interface DashboardStatsData {
  monthlyIncome: number;
  performance: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  todaySales: number;
  chart: DashboardChartItem[];
}

// types/dashboard.ts
export interface DashboardTeamMember {
  id: number;
  name: string;
  role: string;
  clinic_id: number;
}