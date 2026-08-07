import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/public/HomePage";
import ApplicationPage from "./pages/public/ApplicationPage";
import ClientLoginPage from "./pages/auth/ClientLoginPage";
import CoachLoginPage from "./pages/auth/CoachLoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

import ClientPortalLayout from "./layouts/ClientPortalLayout";
import ClientDashboardPage from "./pages/client/ClientDashboardPage";
import ClientPlanPage from "./pages/client/ClientPlanPage";
import NutritionPage from "./pages/client/NutritionPage";
import HealthCalculatorsPage from "./pages/client/HealthCalculatorsPage";
import WorkoutLoggerPage from "./pages/client/WorkoutLoggerPage";
import ProgressPage from "./pages/client/ProgressPage";

import CoachPortalPage from "./pages/coach/CoachPortalPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/apply" element={<ApplicationPage />} />
        <Route path="/login" element={<ClientLoginPage />} />

        {/* Hidden Coach Auth Route */}
        <Route path="/coach" element={<CoachLoginPage />} />

        {/* Client Portal Sub-routes (/client/*) */}
        <Route path="/client" element={<ClientPortalLayout />}>
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboardPage />} />
          <Route path="plan" element={<ClientPlanPage />} />
          <Route path="nutrition" element={<NutritionPage />} />
          <Route path="bmi" element={<HealthCalculatorsPage />} />
          <Route path="calculators/*" element={<HealthCalculatorsPage />} />
          <Route path="workout-logger" element={<WorkoutLoggerPage />} />
          <Route path="workout" element={<WorkoutLoggerPage />} />
          <Route path="progress" element={<ProgressPage />} />
        </Route>

        {/* Isolated Demo Client Sub-routes (/demo/*) */}
        <Route path="/demo" element={<ClientPortalLayout />}>
          <Route index element={<Navigate to="/demo/dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboardPage />} />
          <Route path="plan" element={<ClientPlanPage />} />
          <Route path="nutrition" element={<NutritionPage />} />
          <Route path="bmi" element={<HealthCalculatorsPage />} />
          <Route path="calculators/*" element={<HealthCalculatorsPage />} />
          <Route path="workout-logger" element={<WorkoutLoggerPage />} />
          <Route path="workout" element={<WorkoutLoggerPage />} />
          <Route path="progress" element={<ProgressPage />} />
        </Route>

        {/* Protected Coach Portal (/coach-portal/*) */}
        <Route
          path="/coach-portal/*"
          element={
            <ProtectedRoute requiredRole="coach">
              <CoachPortalPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
