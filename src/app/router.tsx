import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute.tsx";
import { AuthProvider } from "../app/features/auth/AuthContext.tsx";

import LoginPage from "../app/features/auth/pages/LoginPage.tsx";
import DashboardPage from "../app/features/dashboard/DashboardPage.tsx";
import OwnerDashboard from "./features/dashboard-owner/pages/Dashboard-Owner.tsx";
import AdminLayout from "../app/layouts/AdminLayout.tsx";
import OwnerLayout from "./layouts/OwnerLayout.tsx";
import PatientsPage from "../app/features/patients/page/PatientsPage.tsx";
import SettingsPage from "../app/features/settings/pages/SettingsPage.tsx";
import ClinicsPage from "./features/clinics/pages/ClinicsPage.tsx";
import Clinicalteam from "./features/clinical-team/pages/ClinicalteamPage.tsx";
import Billing from "./features/Billing/pages/Billing.tsx";
import TreatmentsPage from "./features/treatments/pages/TreatmentsPage.tsx";
import PaymentsPage from "./features/payment/pages/PaymentsPage.tsx";



export default function AppRouter() {
  return (
    <AuthProvider>
      <Routes>
        {/* Login público */}
        <Route path="/login" element={<LoginPage />} />

        {/* Panel del dueño de la organización */}
        <Route element={<ProtectedRoute allowedRole="owner" />}>
          <Route element={<OwnerLayout />}>
            <Route
              path="/owner-dashboard"
              element={<OwnerDashboard />}
            />
            <Route path="/clinics" element={<ClinicsPage />} />
            <Route path="/team" element={<Clinicalteam />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/treatments" element={<TreatmentsPage />} />
            <Route path="/owner-settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Panel del administrador de clínica */}
        <Route element={<ProtectedRoute allowedRole="clinic_admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/payments" element={<PaymentsPage/>} />
            <Route path="/settings" element={<SettingsPage />} />
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
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </AuthProvider>
  );
}