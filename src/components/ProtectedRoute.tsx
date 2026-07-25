import { ReactNode, useEffect, useState } from "react";
import { authStore, AuthState, UserRole } from "../services/authStore";
import CoachLoginPage from "../pages/CoachLoginPage";

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole: UserRole;
};

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  if (authState.role !== requiredRole) {
    if (requiredRole === "coach") {
      return <CoachLoginPage />;
    }
  }

  return <>{children}</>;
}
