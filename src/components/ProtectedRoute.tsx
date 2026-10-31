import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../app/features/auth/useAuth";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  allowedRole?: "owner" | "clinic_admin";
}

function getDashboardPath(role?: UserRole): string {
  switch (role) {
    case "owner":
      return "/owner";

    case "clinic_admin":
      return "/dashboard";

    default:
      return "/login";
  }
}

export default function ProtectedRoute({
  allowedRole,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="auth-loading">Verificando sesión...</div>;
  }

  // Si no inició sesión, volver al login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Obtener los roles asignados al usuario.
  const organizationRole = user.organizations?.[0]?.role;
  const clinicRole = user.clinics?.[0]?.role;

  // Solo owner y clinic_admin pueden acceder a los paneles.
  const role: UserRole | undefined =
    organizationRole === "owner"
      ? "owner"
      : clinicRole === "clinic_admin"
        ? "clinic_admin"
        : undefined;

  // Si no tiene un rol autorizado, denegar el acceso.
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Si intenta acceder al panel de otro rol, redirigirlo al suyo.
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return <Outlet />;
}