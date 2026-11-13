"use client";

import { ReactNode, useEffect, useState } from "react";
import { authStore, type AuthSession, type UserRole } from "../services/authStore";
import CoachLoginPage from "../pages/auth/CoachLoginPage";

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole: NonNullable<UserRole>;
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
