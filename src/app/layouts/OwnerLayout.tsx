import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import "./css/AdminLayout.css";

export default function OwnerLayout() {
  return (
    <div className="sidebar-layout">
      <Sidebar role="owner" />

      <main className="sidebar-content">
        <Outlet />
      </main>
    </div>
  );
}