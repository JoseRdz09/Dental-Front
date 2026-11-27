import DashboardHeader from "../components/DashboardHeader";
import DashboardFilters from "../components/DashboardFilters";
import DashboardStats from "../components/DashboardStats";
import DashboardSalesCard from "../components/DashboardSalesCard";
import DashboardPerformance from "../components/DashboardPerformance";
import DashboardTeamCard from "../components/DashboardTeamCard";

import { useDashboard } from "../hooks/useDashboard";

import "../css/DashboardPage.css";
import LoadingScreen from "../../../../assets/shared/components/LoadingScreen";

const DashboardPage = () => {
  const {
    clinics,
    clinicId,
    setClinicId,
    date,
    setDate,
    stats,
    team,
    loading,
    error,
  } = useDashboard();

  return (
    <main className="dashboard-page">
      <DashboardHeader organizationName="Clínica Dental Norte" />

      <div className="dashboard-page__body">
        <DashboardFilters
          clinics={clinics}
          clinicId={clinicId}
          date={date}
          onClinicChange={setClinicId}
          onDateChange={setDate}
        />

        {error && <p className="dashboard-page__error">{error}</p>}

        {loading && !stats && (
          // <p className="dashboard-page__loading">Cargando…</p>
          < LoadingScreen />
        )}

        {stats && (
          <>
            <DashboardStats stats={stats} date={date} />

            <section className="dashboard-page__bottom">
              <DashboardPerformance stats={stats} />

              <div className="dashboard-page__sidebar">
                <DashboardSalesCard sales={stats.todaySales} />

                <DashboardTeamCard
                  clinicId={clinicId}
                  clinics={clinics}
                  team={team} // pendiente: ver nota abajo
                />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default DashboardPage;