
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  Activity,
  CalendarDays,
  Users,
  Pill,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Building2,
  CreditCard,
  Banknote,
  LayoutDashboard,
} from "lucide-react";

import { useAuth } from "../app/features/auth/useAuth";

type UserRole = "owner" | "admin";

interface SidebarProps {
  role: UserRole;
  name?: string;
  logo?: string | null;
}

const ownerMenuItems = [
  { label: "Inicio", path: "/owner-dashboard", icon: LayoutDashboard },
  { label: "Clínicas", path: "/clinics", icon: Building2 },
  { label: "Equipo Clínico", path: "/team", icon: Users },
  { label: "Tratamientos", path: "/treatments", icon: Pill },
  { label: "Facturación", path: "/billing", icon: CreditCard },
  { label: "Configuración", path: "/owner-settings", icon: Settings },
];

const adminMenuItems = [
  { label: "Calendario", path: "/dashboard", icon: CalendarDays },
  { label: "Lista de pacientes", path: "/patients", icon: Users },
  { label: "Pagos", path: "/payments", icon: Banknote },
  { label: "Configuración", path: "/settings", icon: Settings },
];

const MOBILE_BREAKPOINT = 768;

export default function Sidebar({
  role,
  name,
  logo,
}: SidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT}px)`
    );

    const handleScreenChange = (
      event: MediaQueryList | MediaQueryListEvent
    ) => {
      setCollapsed(event.matches);
    };

    handleScreenChange(mediaQuery);

    mediaQuery.addEventListener("change", handleScreenChange);

    return () => {
      mediaQuery.removeEventListener("change", handleScreenChange);
    };
  }, []);

  const isOwner = role === "owner";

  const menuItems = isOwner ? ownerMenuItems : adminMenuItems;

  const displayName =
    name || (isOwner ? "Mi organización" : "Mi clínica");

  const subtitle = isOwner
    ? "Panel de organización"
    : "Panel de clínica";

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

      {/* Identidad de organización o clínica */}
      <div className="sidebar-brand">

        <div className="sidebar-logo">
          {logo ? (
            <img
              src={logo}
              alt={`Logo de ${displayName}`}
              className="sidebar-logo-image"
            />
          ) : (
            <Activity size={24} />
          )}
        </div>

        <div className="sidebar-brand-text">
          <h2>{displayName}</h2>
          <span>{subtitle}</span>
        </div>

      </div>

      {/* Contraer menú */}
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-label={
          collapsed ? "Expandir menú" : "Contraer menú"
        }
        title={
          collapsed ? "Expandir menú" : "Contraer menú"
        }
      >
        {collapsed ? (
          <Menu size={22} />
        ) : (
          <ChevronLeft size={22} />
        )}

        <span>{collapsed ? "" : "Contraer menú"}</span>
      </button>

      <p className="sidebar-section-title">
        MENÚ PRINCIPAL
      </p>

      {/* Navegación */}
      <nav className="sidebar-nav">
        {menuItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
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

      {/* Cerrar sesión */}
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
