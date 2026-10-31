
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  Users,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Building2,
  CreditCard,
  LayoutDashboard,
} from "lucide-react";

import { useAuth } from "../app/features/auth/useAuth";

type UserRole = "owner" | "admin";

interface SidebarProps {
  role: UserRole;
}

const ownerMenuItems = [
  { label: "Inicio", path: "/owner-dashboard", icon: LayoutDashboard },
  { label: "Clínicas", path: "/clinics", icon: Building2 },
  { label: "Equipo Clínico", path: "/team", icon: Users },
  { label: "Facturación", path: "/billing", icon: CreditCard },
  { label: "Configuración", path: "/owner-settings", icon: Settings },
];

const adminMenuItems = [
  { label: "Calendario", path: "/dashboard", icon: CalendarDays },
  { label: "Lista de pacientes", path: "/patients", icon: Users },
  { label: "Ajustes", path: "/settings", icon: Settings },
];

const MOBILE_BREAKPOINT = 768;

export default function Sidebar({ role }: SidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT}px)`
    );

    const handleScreenChange = (event: MediaQueryList | MediaQueryListEvent) => {
      setCollapsed(event.matches);
    };

    // Detectar el tamaño inicial de la pantalla.
    handleScreenChange(mediaQuery);

    // Detectar cuando la ventana cambia de tamaño.
    mediaQuery.addEventListener("change", handleScreenChange);

    return () => {
      mediaQuery.removeEventListener("change", handleScreenChange);
    };
  }, []);

  const menuItems = role === "owner" ? ownerMenuItems : adminMenuItems;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Activity size={24} />
        </div>

        <div className="sidebar-brand-text">
          <h2>Dental SaaS</h2>
          <span>
            {role === "owner"
              ? "Panel del propietario"
              : "Panel de clínica"}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        title={collapsed ? "Expandir menú" : "Contraer menú"}
      >
        {collapsed ? <Menu size={22} /> : <ChevronLeft size={22} />}
        <span>{collapsed ? "" : "Contraer menú"}</span>
      </button>

      <p className="sidebar-section-title">MENÚ PRINCIPAL</p>

      <nav className="sidebar-nav">
        {menuItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/admin" || path === "/owner"}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-link logout-button"
          onClick={handleLogout}
          title={collapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
