import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ApplyPage from "./pages/ApplyPage";
import ClientPage from "./pages/ClientPage";
import CoachPage from "./pages/CoachPage";
import CoachLoginPage from "./pages/CoachLoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/client" element={<ClientPage />} />
        <Route
          path="/coach"
          element={
            <ProtectedRoute requiredRole="coach">
              <CoachPage />
            </ProtectedRoute>
          }
        />
        <Route path="/coach-portal" element={<CoachLoginPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
