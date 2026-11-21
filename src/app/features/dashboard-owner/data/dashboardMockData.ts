
import type {
  DashboardClinic,
  DashboardTeamMember,
} from "../types/dashboard";

export const DASHBOARD_CLINICS: DashboardClinic[] = [
  {
    id: 1,
    name: "Clínica Dental Norte",
    stats: {
      monthlyIncome: 105000,
      performance: 92,
      confirmedAppointments: 78,
      pendingAppointments: 8,
      dailySales: 4250,
      completedAppointments: 72,
      activeTeamMembers: 4,
    },
  },
  {
    id: 2,
    name: "Clínica Dental Centro",
    stats: {
      monthlyIncome: 82300,
      performance: 87,
      confirmedAppointments: 62,
      pendingAppointments: 9,
      dailySales: 4100,
      completedAppointments: 54,
      activeTeamMembers: 5,
    },
  },
  {
    id: 3,
    name: "Clínica Dental Sur",
    stats: {
      monthlyIncome: 58500,
      performance: 85,
      confirmedAppointments: 46,
      pendingAppointments: 7,
      dailySales: 4100,
      completedAppointments: 36,
      activeTeamMembers: 3,
    },
  },
];

export const DASHBOARD_TEAM: Record<number, DashboardTeamMember[]> = {
  1: [
    { id: 1, name: "Carlos Ramírez", role: "dentist", isActive: true },
    { id: 2, name: "Laura Martínez", role: "clinic_admin", isActive: true },
    { id: 3, name: "Ana Torres", role: "assistant", isActive: true },
    { id: 4, name: "Roberto Díaz", role: "dentist", isActive: true },
  ],
  2: [
    { id: 5, name: "María López", role: "clinic_admin", isActive: true },
    { id: 6, name: "Pedro García", role: "dentist", isActive: true },
  ],
  3: [
    { id: 7, name: "Sofía Hernández", role: "assistant", isActive: true },
    { id: 8, name: "Luis Torres", role: "dentist", isActive: true },
  ],
};

export const DASHBOARD_CHART_DATA = [
  { label: "Sem. 1", value: 18000 },
  { label: "Sem. 2", value: 22000 },
  { label: "Sem. 3", value: 27000 },
  { label: "Sem. 4", value: 38000 },
];
