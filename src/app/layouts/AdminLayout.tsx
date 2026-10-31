
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import "./css/AdminLayout.css";

export default function AdminLayout() {
  return (
    <div className="sidebar-layout">
      <Sidebar role="admin" />

      <main className="sidebar-content">
        <Outlet />
      </main>
    </div>
  );
}
