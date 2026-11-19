
import { Outlet } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../features/auth/useAuth";

import "./css/AdminLayout.css";

export default function AdminLayout() {
  const { user } = useAuth();

  const clinic = user?.clinics?.[0];

  return (
    <div className="sidebar-layout">
      <Sidebar
        role="admin"
        name={clinic?.name}
        logo={clinic?.logo}
      />

      <main className="sidebar-content">
        <Outlet />
      </main>
    </div>
  );
}
