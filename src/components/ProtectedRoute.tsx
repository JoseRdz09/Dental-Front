
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../app/features/auth/useAuth";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  allowedRole?: UserRole;
}

function getDashboardPath(role: UserRole): string {
  return role === "owner" ? "/owner" : "/admin";
}

export default function ProtectedRoute({
  allowedRole,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="auth-loading">Verificando sesión...</div>;
  }

  // Si no inició sesión, debe entrar por el login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta requiere un rol específico,
  // impedir que entre un usuario con otro rol.
  if (allowedRole && user.role !== allowedRole) {
    return (
      <Navigate
        to={getDashboardPath(user.role)}
        replace
      />
    );
  }

  return <Outlet />;
}
