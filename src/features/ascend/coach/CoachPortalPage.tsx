"use client";

import { useState } from "react";
import CoachStudio from "./CoachStudio";
import CoachDashboard from "./CoachDashboard";

export default function CoachPortalPage() {
  const [viewMode, setViewMode] = useState<"modern" | "legacy">("modern");

  if (viewMode === "legacy") {
    return (
      <div>
        <div
          style={{
            background: "#1e2327",
            color: "#e3cda3",
            padding: "8px 20px",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span>Viewing <strong>Legacy Coach Dashboard</strong></span>
          <button
            onClick={() => setViewMode("modern")}
            style={{
              background: "#d1b588",
              color: "#111417",
              border: "none",
              padding: "5px 14px",
              borderRadius: "6px",
              fontWeight: 650,
              cursor: "pointer",
              fontSize: "11.5px",
            }}
          >
            ← Return to Modern SaaS Coach Studio
          </button>
        </div>
        <CoachDashboard coachName="Sahmi El" signOutPath="/login" />
      </div>
    );
  }

  return (
    <CoachStudio
      coachName="Sahmi El"
      signOutPath="/login"
      onSwitchToLegacy={() => setViewMode("legacy")}
    />
  );
}
