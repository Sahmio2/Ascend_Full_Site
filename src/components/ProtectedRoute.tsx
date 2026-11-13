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
      if (process.env.NODE_ENV !== "production") {
        return (
          <>
            <div
              style={{
                background: "#1c2124",
                color: "#d1b588",
                borderBottom: "1px solid rgba(209, 181, 136, 0.25)",
                padding: "6px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "11px",
                zIndex: 99999,
                position: "relative",
              }}
            >
              <span>
                ⚡ <strong>Dev Inspection Mode:</strong> Coach Studio preview active (unauthenticated session bypassed for testing).
              </span>
              <button
                type="button"
                onClick={() => {
                  authStore.setSession({ role: "coach", mode: "live", coachName: "Sahmi El" });
                  setSession(authStore.getSession());
                }}
                style={{
                  background: "#d1b588",
                  color: "#111417",
                  border: "none",
                  borderRadius: "4px",
                  padding: "3px 10px",
                  fontSize: "10.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Set Coach Session Cookie
              </button>
            </div>
            {children}
          </>
        );
      }
      return <CoachLoginPage />;
    }
  }

  return <>{children}</>;
}
