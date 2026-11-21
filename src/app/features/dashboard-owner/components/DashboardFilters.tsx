
import { CalendarDays, ChevronDown } from "lucide-react";

import type {
  DashboardClinic,
  DashboardPeriod,
} from "../types/dashboard";

interface Props {
  clinics: DashboardClinic[];
  clinicId: number | null;
  period: DashboardPeriod;
  onClinicChange: (id: number | null) => void;
  onPeriodChange: (period: DashboardPeriod) => void;
}

const DashboardFilters = ({
  clinics,
  clinicId,
  period,
  onClinicChange,
  onPeriodChange,
}: Props) => {
  return (
    <section className="dashboard-filters">
      <div className="dashboard-filters__clinic">
        <label htmlFor="dashboard-clinic">
          Clínica
        </label>

        <div className="dashboard-filters__select">
          <select
            id="dashboard-clinic"
            value={clinicId ?? "all"}
            onChange={(e) =>
              onClinicChange(
                e.target.value === "all"
                  ? null
                  : Number(e.target.value)
              )
            }
          >
            <option value="all">Todas las clínicas</option>

            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>

          <ChevronDown size={17} />
        </div>
      </div>

      <div className="dashboard-filters__period">
        <CalendarDays size={17} />

        <select
          aria-label="Periodo de estadísticas"
          value={period}
          onChange={(e) =>
            onPeriodChange(e.target.value as DashboardPeriod)
          }
        >
          <option value="today">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
          <option value="year">Este año</option>
        </select>
      </div>
    </section>
  );
};

export default DashboardFilters;
