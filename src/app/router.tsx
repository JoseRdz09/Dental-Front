
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "../app/features/auth/AuthContext.tsx";
import LoginPage from "../app/features/auth/pages/LoginPage.tsx";

import DashboardPage from "../app/features/dashboard/DashboardPage.tsx";
import OwnerDashboard from "./features/dashboard-owner/pages/Dashboard-Owner.tsx";
import AdminLayout from "../app/layouts/AdminLayout.tsx";
import PatientsPage from "../app/features/patients/page/PatientsPage.tsx";
import SettingsPage from "../app/features/settings/pages/SettingsPage.tsx";
//Owner
import OwnerLayout from "./layouts/OwnerLayout.tsx";
import ClinicsPage from "./features/clinics/pages/ClinicsPage.tsx"
import Clinicalteam from "./features/clinical-team/pages/ClinicalteamPage.tsx"

import ProtectedRoute from "../components/ProtectedRoute.tsx";



export default function AppRouter() {
  return (
    <AuthProvider>
      <Routes>
        {/* Login público */}
        <Route path="/login" element={<LoginPage />} />

        {/* Panel del dueño */}
        <Route element={<ProtectedRoute allowedRole="owner" />}>
          <Route element={<OwnerLayout />}>
            <Route
              path="/owner"
              element={<OwnerDashboard />}
            />
            <Route
              path="/owner/clinics"
              element={<ClinicsPage />}
            />
            <Route
              path="/owner/users"
              element={<Clinicalteam />}
            />
            <Route
              path="/owner/settings"
              element={""}
            />
          </Route>
        </Route>

        {/* Panel del administrador */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
        
          <Route element={<AdminLayout />}>
            <Route
              path="/admin"
              element={<DashboardPage />}
            />
            <Route
              path="/admin/patients"
              element={<PatientsPage />}
            />
            <Route
              path="/admin/settings"
              element={<SettingsPage />}
            />
          </Route>
        </Route>

        {/* Ruta inicial */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Rutas inexistentes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </AuthProvider>
  );
}
