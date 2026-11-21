
import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

interface Props {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  variant: "blue" | "green" | "orange" | "purple";
  trend?: string;
}

const DashboardStatCard = ({
  title,
  value,
  description,
  icon: Icon,
  variant,
  trend,
}: Props) => {
  return (
    <article className={`dashboard-stat-card dashboard-stat-card--${variant}`}>
      <div className="dashboard-stat-card__top">
        <div className="dashboard-stat-card__icon">
          <Icon size={21} />
        </div>

        {trend && (
          <span className="dashboard-stat-card__trend">
            <TrendingUp size={13} />
            {trend}
          </span>
        )}
      </div>

      <div className="dashboard-stat-card__content">
        <h3>{title}</h3>
        <strong>{value}</strong>
        <p>{description}</p>
      </div>
    </article>
  );
};

export default DashboardStatCard;
