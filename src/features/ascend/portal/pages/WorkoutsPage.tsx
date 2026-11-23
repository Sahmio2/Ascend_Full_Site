"use client";

import React, { useState } from "react";
import type { PortalScope } from "../data/types";
import { useClientPortalData } from "../data/useClientPortalData";
import PortalBottomNav from "../components/PortalBottomNav";

export default function WorkoutsPage({ scope = "live" }: { scope?: PortalScope }) {
  const data = useClientPortalData(scope);
  const days = data.programme.days;
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const currentDay = days[selectedDayIndex] || days[0];

  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});

  const toggleSet = (setId: string) => {
    setCompletedSets((prev) => ({ ...prev, [setId]: !prev[setId] }));
  };

  return (
    <div className="portal-container">
      {/* Day Selector Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "16px", marginBottom: "16px" }}>
        {days.map((day, idx) => {
          const isActive = idx === selectedDayIndex;
          return (
            <button
              key={day.id}
              onClick={() => setSelectedDayIndex(idx)}
              style={{
                background: isActive ? "rgba(199, 164, 91, 0.14)" : "rgba(255, 255, 255, 0.04)",
                border: isActive ? "1px solid rgba(199, 164, 91, 0.35)" : "1px solid var(--portal-border)",
                color: isActive ? "#ffffff" : "var(--portal-text-muted)",
                borderRadius: "14px",
                padding: "10px 16px",
                fontSize: "12.5px",
                fontWeight: isActive ? 700 : 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Day {idx + 1}: {day.name}
            </button>
          );
        })}
      </div>

      {/* Current Workout Header */}
      <div style={{ marginBottom: "24px" }}>
        <span className="portal-kicker">TRAINING SESSION</span>
        <h1 className="portal-hero-title">{currentDay?.name || "Workout"}</h1>
        <p style={{ color: "var(--portal-text-muted)", fontSize: "13px", margin: 0 }}>
          {currentDay?.estimatedMinutes} · {currentDay?.exercises.length} prescribed movements
        </p>
      </div>

      {/* Exercises List */}
      <div style={{ display: "grid", gap: "16px" }}>
        {currentDay?.exercises.map((ex, exIdx) => (
          <section key={ex.id} className="portal-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "10.5px", color: "var(--portal-gold-light)", fontWeight: 700, letterSpacing: "0.08em" }}>
                  MOVEMENT {exIdx + 1}
                </span>
                <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#ffffff", margin: "4px 0 2px" }}>
                  {ex.name}
                </h2>
                <span style={{ fontSize: "12px", color: "var(--portal-text-dim)" }}>
                  {ex.prescribedSets} sets · {ex.reps} reps · Rest {ex.rest} · Tempo {ex.tempo}
                </span>
              </div>
            </div>

            {/* Set Rows */}
            <div style={{ display: "grid", gap: "8px" }}>
              {Array.from({ length: ex.prescribedSets || 3 }).map((_, sIdx) => {
                const setId = `${ex.id}-set-${sIdx + 1}`;
                const isDone = !!completedSets[setId];
                return (
                  <div
                    key={setId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1fr 1fr 48px",
                      gap: "10px",
                      alignItems: "center",
                      background: isDone ? "rgba(160, 205, 180, 0.08)" : "rgba(255, 255, 255, 0.03)",
                      border: isDone ? "1px solid rgba(160, 205, 180, 0.25)" : "1px solid var(--portal-border)",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700, color: isDone ? "var(--portal-green)" : "var(--portal-text-muted)" }}>
                      Set {sIdx + 1}
                    </span>

                    <input
                      type="number"
                      placeholder="Load kg"
                      defaultValue="60"
                      style={{
                        background: "rgba(0, 0, 0, 0.35)",
                        border: "1px solid var(--portal-border)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        padding: "8px 10px",
                        fontSize: "14px",
                        fontWeight: 600,
                        textAlign: "center",
                        outline: "none",
                      }}
                    />

                    <input
                      type="number"
                      placeholder="Reps"
                      defaultValue={parseInt(ex.reps, 10) || 10}
                      style={{
                        background: "rgba(0, 0, 0, 0.35)",
                        border: "1px solid var(--portal-border)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        padding: "8px 10px",
                        fontSize: "14px",
                        fontWeight: 600,
                        textAlign: "center",
                        outline: "none",
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => toggleSet(setId)}
                      aria-label={`Mark set ${sIdx + 1} ${isDone ? "incomplete" : "complete"}`}
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        border: isDone ? "1px solid #2e624d" : "1px solid var(--portal-border)",
                        background: isDone ? "#142a1e" : "rgba(255, 255, 255, 0.06)",
                        color: isDone ? "var(--portal-green)" : "var(--portal-text-muted)",
                        fontWeight: 700,
                        fontSize: "15px",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isDone ? "✓" : "+"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div style={{ marginTop: "24px" }}>
        <button
          type="button"
          className="portal-btn-primary"
          style={{ width: "100%", minHeight: "52px" }}
          onClick={() => alert("Session recorded!")}
        >
          Save &amp; Complete Workout Session
        </button>
      </div>

      <PortalBottomNav scope={scope} />
    </div>
  );
}
