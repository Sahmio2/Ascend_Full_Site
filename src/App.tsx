import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ApplyPage from "./pages/ApplyPage";
import ClientPage from "./pages/ClientPage";
import CoachPage from "./pages/CoachPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/client" element={<ClientPage />} />
        <Route path="/coach" element={<CoachPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
