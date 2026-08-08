import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/public/HomePage";
import ApplicationPage from "./pages/public/ApplicationPage";
import ClientLoginPage from "./pages/auth/ClientLoginPage";
import CoachLoginPage from "./pages/auth/CoachLoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CoachPortalPage from "./pages/coach/CoachPortalPage";

import DashboardPage from "./features/get-divine/pages/DashboardPage";
import PlanPage from "./features/get-divine/pages/PlanPage";
import NutritionPage from "./features/get-divine/pages/NutritionPage";
import CalculatorPage from "./features/get-divine/pages/CalculatorPage";
import WorkoutLoggerPage from "./features/get-divine/pages/WorkoutLoggerPage";
import ProgressPage from "./features/get-divine/pages/ProgressPage";
import DemoLoginPage from "./features/get-divine/pages/DemoLoginPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing & Application */}
        <Route path="/" element={<HomePage />} />
        <Route path="/apply" element={<ApplicationPage />} />
        <Route path="/login" element={<DemoLoginPage />} />
        <Route path="/client-login" element={<ClientLoginPage />} />

        {/* Hidden Coach Login */}
        <Route path="/coach" element={<CoachLoginPage />} />

        {/* Demo Portal Routes */}
        <Route path="/demo" element={<Navigate to="/demo/dashboard" replace />} />
        <Route path="/demo/dashboard" element={<DashboardPage scope="demo" />} />
        <Route path="/demo/plan" element={<PlanPage scope="demo" />} />
        <Route path="/demo/nutrition" element={<NutritionPage scope="demo" />} />
        <Route path="/demo/bmi" element={<CalculatorPage scope="demo" />} />
        <Route path="/demo/calculators/*" element={<Navigate to="/demo/bmi" replace />} />
        <Route path="/demo/workout-logger" element={<WorkoutLoggerPage scope="demo" />} />
        <Route path="/demo/workout" element={<Navigate to="/demo/workout-logger" replace />} />
        <Route path="/demo/progress" element={<ProgressPage scope="demo" />} />

        {/* Live Client Portal Routes */}
        <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />
        <Route path="/client/dashboard" element={<DashboardPage scope="live" />} />
        <Route path="/client/plan" element={<PlanPage scope="live" />} />
        <Route path="/client/nutrition" element={<NutritionPage scope="live" />} />
        <Route path="/client/bmi" element={<CalculatorPage scope="live" />} />
        <Route path="/client/calculators/*" element={<Navigate to="/client/bmi" replace />} />
        <Route path="/client/workout-logger" element={<WorkoutLoggerPage scope="live" />} />
        <Route path="/client/workout" element={<Navigate to="/client/workout-logger" replace />} />
        <Route path="/client/progress" element={<ProgressPage scope="live" />} />

        {/* Protected Coach Command Centre */}
        <Route
          path="/coach-portal/*"
          element={
            <ProtectedRoute requiredRole="coach">
              <CoachPortalPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
