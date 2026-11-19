import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../features/auth/useAuth";
import "./css/AdminLayout.css";

export default function OwnerLayout() {
  const { user } = useAuth();

  // Obtener la organización del usuario
  const organization = user?.organizations?.[0];

  return (
    <div className="sidebar-layout">
      <Sidebar
        role="owner"
        name={organization?.name}
        logo={organization?.logo}
      />

      <main className="sidebar-content">
        <Outlet />
      </main>
    </div>
  );
}