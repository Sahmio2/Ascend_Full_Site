import { ReactNode, useEffect, useState } from "react";
import { authStore } from "../services/authStore";
import { AuthSession, UserRole } from "../types/getDivine";
import CoachLoginPage from "../pages/auth/CoachLoginPage";

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole: UserRole;
};

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [session, setSession] = useState<AuthSession>(authStore.getSession());

  useEffect(() => {
    return authStore.subscribe(() => {
      setSession(authStore.getSession());
    });
  }, []);

  if (session.role !== requiredRole) {
    if (requiredRole === "coach") {
      return <CoachLoginPage />;
    }
  }

  return <>{children}</>;
}
