
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
  date: string;
}

const DashboardStats = ({ stats, date }: Props) => {
  const selectedDate = new Date(`${date}T12:00:00`);

  const currencyFormatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedDate = selectedDate.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const cards = [
    {
      title: "Ingresos",
      value: currencyFormatter.format(stats.monthlyIncome),
      description: `Ingresos registrados el ${formattedDate}`,
      icon: Wallet,
      variant: "blue" as const,
    },
    {
      title: "Rendimiento",
      value: `${stats.performance}%`,
      description: `Cumplimiento de citas del ${formattedDate}`,
      icon: ChartNoAxesCombined,
      variant: "green" as const,
    },
    {
      title: "Citas confirmadas",
      value: stats.confirmedAppointments,
      description: `Citas confirmadas el ${formattedDate}`,
      icon: CalendarCheck,
      variant: "purple" as const,
    },
    {
      title: "Citas pendientes",
      value: stats.pendingAppointments,
      description: `Citas pendientes del ${formattedDate}`,
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
