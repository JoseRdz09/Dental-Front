
import { useMemo, useState } from "react";

import DashboardHeader from "../components/DashboardHeader";
import DashboardFilters from "../components/DashboardFilters";
import DashboardStats from "../components/DashboardStats";
import DashboardSalesCard from "../components/DashboardSalesCard";
import DashboardPerformance from "../components/DashboardPerformance";
import DashboardTeamCard from "../components/DashboardTeamCard";

import {
  DASHBOARD_CLINICS,
  DASHBOARD_TEAM,
} from "../data/dashboardMockData";

import type {
  DashboardPeriod,
  DashboardStatsData,
} from "../types/dashboard";

import "../css/DashboardPage.css";

const DashboardPage = () => {
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  const selectedClinic = useMemo(
    () => DASHBOARD_CLINICS.find((clinic) => clinic.id === clinicId),
    [clinicId]
  );

  const stats = useMemo<DashboardStatsData>(() => {
    if (selectedClinic) {
      return selectedClinic.stats;
    }

    const totals = DASHBOARD_CLINICS.reduce(
      (acc, clinic) => ({
        monthlyIncome:
          acc.monthlyIncome + clinic.stats.monthlyIncome,
        confirmedAppointments:
          acc.confirmedAppointments +
          clinic.stats.confirmedAppointments,
        pendingAppointments:
          acc.pendingAppointments +
          clinic.stats.pendingAppointments,
        dailySales:
          acc.dailySales + clinic.stats.dailySales,
        completedAppointments:
          acc.completedAppointments +
          clinic.stats.completedAppointments,
        activeTeamMembers:
          acc.activeTeamMembers +
          clinic.stats.activeTeamMembers,
      }),
      {
        monthlyIncome: 0,
        confirmedAppointments: 0,
        pendingAppointments: 0,
        dailySales: 0,
        completedAppointments: 0,
        activeTeamMembers: 0,
      }
    );

    const performance =
      totals.confirmedAppointments > 0
        ? Math.round(
            (totals.completedAppointments /
              totals.confirmedAppointments) *
              100
          )
        : 0;

    return {
      ...totals,
      performance,
    };
  }, [selectedClinic]);

  const team = clinicId !== null
    ? DASHBOARD_TEAM[clinicId] ?? []
    : [];

  return (
    <main className="dashboard-page">
      <DashboardHeader organizationName="Clínica Dental Norte" />

      <div className="dashboard-page__body">
        <DashboardFilters
          clinics={DASHBOARD_CLINICS}
          clinicId={clinicId}
          period={period}
          onClinicChange={setClinicId}
          onPeriodChange={setPeriod}
        />

        <DashboardStats stats={stats} />

        <section className="dashboard-page__bottom">
          <DashboardPerformance stats={stats} />

          <div className="dashboard-page__sidebar">
            <DashboardSalesCard sales={stats.dailySales} />

            <DashboardTeamCard
              clinicId={clinicId}
              clinics={DASHBOARD_CLINICS}
              team={team}
            />
          </div>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
