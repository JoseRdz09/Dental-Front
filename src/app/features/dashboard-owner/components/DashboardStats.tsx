
import {
  Wallet,
  ChartNoAxesCombined,
  CalendarCheck,
  Clock,
} from "lucide-react";

import DashboardStatCard from "./DashboardStatCard";
import type { DashboardStatsData } from "../types/dashboard";

interface Props {
  stats: DashboardStatsData;
}

const DashboardStats = ({ stats }: Props) => {
  const cards = [
    {
      title: "Ingresos del mes",
      value: `$${stats.monthlyIncome.toLocaleString("es-MX")}`,
      description: "Ingresos registrados",
      icon: Wallet,
      variant: "blue" as const,
    },
    {
      title: "Rendimiento mensual",
      value: `${stats.performance}%`,
      description: "Cumplimiento de citas",
      icon: ChartNoAxesCombined,
      variant: "green" as const,
    },
    {
      title: "Citas confirmadas",
      value: stats.confirmedAppointments.toString(),
      description: "Citas de este mes",
      icon: CalendarCheck,
      variant: "purple" as const,
    },
    {
      title: "Citas pendientes",
      value: stats.pendingAppointments.toString(),
      description: "Por confirmar",
      icon: Clock,
      variant: "orange" as const,
    },
  ];

  return (
    <section className="dashboard-stats">
      {cards.map((card) => (
        <DashboardStatCard
          key={card.title}
          {...card}
        />
      ))}
    </section>
  );
};

export default DashboardStats;
