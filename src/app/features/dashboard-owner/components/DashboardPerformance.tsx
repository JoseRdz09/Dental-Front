
import { useEffect, useState } from "react";
import { ChartNoAxesCombined } from "lucide-react";
import type { DashboardStatsData } from "../types/dashboard";
import "../css/DashboardPerformance.css";

interface Props {
  stats: DashboardStatsData;
}

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const INTERVALS = [
  { label: "07h", range: "7–9 AM" },
  { label: "09h", range: "9–11 AM" },
  { label: "11h", range: "11 AM–1 PM" },
  { label: "13h", range: "1–3 PM" },
  { label: "15h", range: "3–5 PM" },
  { label: "17h", range: "5–7 PM" },
  { label: "19h", range: "7–9 PM" },
];

const DashboardPerformance = ({ stats }: Props) => {
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  useEffect(() => {
    setSelectedHour(null);
  }, [stats]);

  const chartData = INTERVALS.map((interval) => {
    const item = (stats.chart ?? []).find(
      (entry) => entry.label === interval.label
    );

    return {
      ...interval,
      value: Math.max(0, Number(item?.value) || 0),
    };
  });

  const selectedItem = chartData.find(
    (item) => item.label === selectedHour
  );

  const performance = Math.min(
    100,
    Math.max(0, Number(stats.performance) || 0)
  );

  const maxValue = Math.max(...chartData.map((item) => item.value), 0);

  const displayedIncome = selectedItem
    ? selectedItem.value
    : Number(stats.monthlyIncome) || 0;

  return (
    <article className="dashboard-performance">
      <div className="dashboard-card__header">
        <div>
          <h2>Rendimiento</h2>
          <p>Ingresos registrados por horario</p>
        </div>

        <div className="dashboard-performance__icon">
          <ChartNoAxesCombined size={21} />
        </div>
      </div>

      <div className="dashboard-performance__income">
        <strong>{currencyFormatter.format(displayedIncome)}</strong>
        <span>
          {selectedItem
            ? `Vendido de ${selectedItem.range}`
            : "Ingresos totales del día"}
        </span>
      </div>

      <div className="dashboard-performance__chart-container">
        <div className="dashboard-performance__chart">
          {chartData.map((item) => {
            const isSelected = selectedHour === item.label;

            // Altura proporcional a los ingresos.
            // El mínimo evita que los importes pequeños desaparezcan.
            const height =
              maxValue > 0 && item.value > 0
                ? Math.max((item.value / maxValue) * 100, 12)
                : 0;

            return (
              <button
                key={item.label}
                type="button"
                className={`dashboard-performance__bar-item ${
                  isSelected ? "is-selected" : ""
                }`}
                onClick={() =>
                  setSelectedHour((current) =>
                    current === item.label ? null : item.label
                  )
                }
                aria-pressed={isSelected}
                title={`${item.range}: ${currencyFormatter.format(item.value)}`}
              >
                <span className="dashboard-performance__bar-value">
                  {currencyFormatter.format(item.value)}
                </span>

                <div className="dashboard-performance__bar-track">
                  <div
                    className="dashboard-performance__bar"
                    style={{ height: `${height}%` }}
                  />
                </div>

                <span className="dashboard-performance__bar-label">
                  {item.range}
                </span>
              </button>
            );
          })}
        </div>

        <div className="dashboard-performance__chart-navigation">
          <span>7 AM – 9 PM</span>

          {selectedItem && (
            <button
              type="button"
              onClick={() => setSelectedHour(null)}
            >
              Limpiar selección
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-performance__footer">
        <div>
          <span>Citas completadas</span>
          <strong>{stats.completedAppointments}</strong>
        </div>

        <div>
          <span>Rendimiento</span>
          <strong>{performance}%</strong>
        </div>
      </div>

      <div
        className="dashboard-performance__progress"
        role="progressbar"
        aria-valuenow={performance}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Rendimiento"
      >
        <div style={{ width: `${performance}%` }} />
      </div>
    </article>
  );
};

export default DashboardPerformance;
