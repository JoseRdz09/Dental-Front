
import { ChartNoAxesCombined } from "lucide-react";

import type { DashboardStatsData } from "../types/dashboard";

interface Props {
  stats: DashboardStatsData;
}

const DashboardPerformance = ({ stats }: Props) => {
  const chartData = [
    { label: "Sem. 1", value: 18000 },
    { label: "Sem. 2", value: 22000 },
    { label: "Sem. 3", value: 27000 },
    { label: "Sem. 4", value: 38000 },
  ];

  const maxValue = Math.max(...chartData.map((item) => item.value));

  return (
    <article className="dashboard-performance">
      <div className="dashboard-card__header">
        <div>
          <h2>Rendimiento mensual</h2>
          <p>Resumen de ingresos de la clínica</p>
        </div>

        <div className="dashboard-performance__icon">
          <ChartNoAxesCombined size={21} />
        </div>
      </div>

      <div className="dashboard-performance__income">
        <strong>
          {stats.monthlyIncome.toLocaleString("es-MX", {
            style: "currency",
            currency: "MXN",
            maximumFractionDigits: 0,
          })}
        </strong>

        <span>Ingresos del mes</span>
      </div>

      <div className="dashboard-performance__chart">
        {chartData.map((item) => (
          <div className="dashboard-performance__bar-item" key={item.label}>
            <span className="dashboard-performance__bar-value">
              ${(item.value / 1000).toFixed(0)}k
            </span>

            <div className="dashboard-performance__bar-track">
              <div
                className="dashboard-performance__bar"
                style={{
                  height: `${(item.value / maxValue) * 100}%`,
                }}
              />
            </div>

            <span className="dashboard-performance__bar-label">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="dashboard-performance__footer">
        <div>
          <span>Citas completadas</span>
          <strong>{stats.completedAppointments}</strong>
        </div>

        <div>
          <span>Rendimiento</span>
          <strong>{stats.performance}%</strong>
        </div>
      </div>

      <div className="dashboard-performance__progress">
        <div
          style={{ width: `${Math.min(stats.performance, 100)}%` }}
        />
      </div>
    </article>
  );
};

export default DashboardPerformance;
