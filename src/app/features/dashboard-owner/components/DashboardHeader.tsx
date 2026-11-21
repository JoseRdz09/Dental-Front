
import { Bell, Building2 } from "lucide-react";

interface Props {
  organizationName: string;
}

const DashboardHeader = ({ organizationName }: Props) => {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__brand">
        <div className="dashboard-header__logo">
          <Building2 size={22} />
        </div>

        <div>
          <h1>Dashboard</h1>
          <p>{organizationName}</p>
        </div>
      </div>

      <button
        type="button"
        className="dashboard-header__notification"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        <span />
      </button>
    </header>
  );
};

export default DashboardHeader;
