import { Navigate, Route, Routes } from "react-router-dom";
import CalculatorPage from "./pages/CalculatorPage";
import DashboardPage from "./pages/DashboardPage";
import DemoLoginPage from "./pages/DemoLoginPage";
import NutritionPage from "./pages/NutritionPage";
import PlanPage from "./pages/PlanPage";
import ProgressPage from "./pages/ProgressPage";
import WorkoutLoggerPage from "./pages/WorkoutLoggerPage";

export default function GetDivinePortalRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<DemoLoginPage />} />
      <Route path="/demo" element={<Navigate to="/demo/dashboard" replace />} />
      <Route path="/demo/dashboard" element={<DashboardPage scope="demo" />} />
      <Route path="/demo/plan" element={<PlanPage scope="demo" />} />
      <Route path="/demo/nutrition" element={<NutritionPage scope="demo" />} />
      <Route path="/demo/bmi" element={<CalculatorPage scope="demo" />} />
      <Route path="/demo/calculators/bmi" element={<Navigate to="/demo/bmi" replace />} />
      <Route path="/demo/calculators/calories" element={<Navigate to="/demo/bmi" replace />} />
      <Route path="/demo/workout-logger" element={<WorkoutLoggerPage scope="demo" />} />
      <Route path="/demo/progress" element={<ProgressPage scope="demo" />} />
      <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />
      <Route path="/client/dashboard" element={<DashboardPage scope="live" />} />
      <Route path="/client/plan" element={<PlanPage scope="live" />} />
      <Route path="/client/nutrition" element={<NutritionPage scope="live" />} />
      <Route path="/client/bmi" element={<CalculatorPage scope="live" />} />
      <Route path="/client/calculators/bmi" element={<Navigate to="/client/bmi" replace />} />
      <Route path="/client/calculators/calories" element={<Navigate to="/client/bmi" replace />} />
      <Route path="/client/workout-logger" element={<WorkoutLoggerPage scope="live" />} />
      <Route path="/client/progress" element={<ProgressPage scope="live" />} />
    </Routes>
  );
}
