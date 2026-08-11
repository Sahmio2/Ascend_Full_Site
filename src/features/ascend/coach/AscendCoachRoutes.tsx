import { Navigate, Route, Routes } from "react-router-dom";
import CoachPortalPage from "./CoachPortalPage";

/** Register these elements inside the target application's existing router. */
export default function AscendCoachRoutes() {
  return (
    <Routes>
      <Route path="/coach" element={<Navigate to="/coach-portal" replace />} />
      <Route path="/coach-portal" element={<CoachPortalPage />} />
    </Routes>
  );
}
