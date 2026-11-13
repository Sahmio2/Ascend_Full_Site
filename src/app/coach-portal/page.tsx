import ProtectedRoute from "@/components/ProtectedRoute";
import CoachPortalPage from "@/pages/coach/CoachPortalPage";

export default function Page() {
  return (
    <ProtectedRoute requiredRole="coach">
      <CoachPortalPage />
    </ProtectedRoute>
  );
}

