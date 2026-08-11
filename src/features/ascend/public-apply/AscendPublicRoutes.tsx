import { Route, Routes } from "react-router-dom";
import ApplicationPage from "./pages/ApplicationPage";
import HomePage from "./pages/HomePage";

/** Add these route elements inside the target project's existing BrowserRouter. */
export default function AscendPublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/apply" element={<ApplicationPage />} />
    </Routes>
  );
}
