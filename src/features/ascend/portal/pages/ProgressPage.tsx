"use client";

import React from "react";
import type { PortalScope } from "../data/types";
import { useClientPortalData } from "../data/useClientPortalData";
import PortalBottomNav from "../components/PortalBottomNav";

export default function ProgressPage({ scope = "live" }: { scope?: PortalScope }) {
  const data = useClientPortalData(scope);
  const client = data.client;
  const feedback = data.coachFeedback;
  const latestWeight = data.progress.bodyweight[data.progress.bodyweight.length - 1]?.weightKg || 78.4;

  return (
    <div className="portal-container">
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <span className="portal-kicker">ANALYTICS &amp; METRICS</span>
        <h1 className="portal-hero-title">Progress &amp; Athlete Development</h1>
        <p style={{ color: "var(--portal-text-muted)", fontSize: "13px", margin: 0 }}>
          Coached metrics, body composition trends, and verified strength milestones
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div className="portal-card">
          <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--portal-gold-light)", textTransform: "uppercase" }}>Current Weight</span>
          <div style={{ fontSize: "28px", fontWeight: 750, color: "#ffffff", margin: "6px 0 2px", fontVariantNumeric: "tabular-nums" }}>
            {latestWeight} <span style={{ fontSize: "14px", fontWeight: 400, color: "var(--portal-text-muted)" }}>kg</span>
          </div>
          <span style={{ fontSize: "11.5px", color: "var(--portal-green)" }}>-1.2 kg this phase</span>
        </div>

        <div className="portal-card">
          <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--portal-gold-light)", textTransform: "uppercase" }}>Target Adherence</span>
          <div style={{ fontSize: "28px", fontWeight: 750, color: "#ffffff", margin: "6px 0 2px", fontVariantNumeric: "tabular-nums" }}>
            {client.adherencePercent || "94"}%
          </div>
          <span style={{ fontSize: "11.5px", color: "var(--portal-green)" }}>Consistent compliance</span>
        </div>

        <div className="portal-card">
          <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--portal-gold-light)", textTransform: "uppercase" }}>Block Cadence</span>
          <div style={{ fontSize: "28px", fontWeight: 750, color: "#ffffff", margin: "6px 0 2px", fontVariantNumeric: "tabular-nums" }}>
            Week {data.programme.week || 3} <span style={{ fontSize: "14px", fontWeight: 400, color: "var(--portal-text-muted)" }}>/ {data.programme.totalWeeks || 8}</span>
          </div>
          <span style={{ fontSize: "11.5px", color: "var(--portal-gold-light)" }}>{client.phaseName || "Hypertrophy"}</span>
        </div>

        <div className="portal-card">
          <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--portal-gold-light)", textTransform: "uppercase" }}>Next Review</span>
          <div style={{ fontSize: "20px", fontWeight: 750, color: "#ffffff", margin: "10px 0 2px" }}>
            {client.nextCheckIn}
          </div>
          <span style={{ fontSize: "11.5px", color: "var(--portal-text-muted)" }}>with Coach {client.coachName}</span>
        </div>
      </div>

      {/* Coach Feedback History */}
      <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", marginBottom: "12px" }}>Coach Feedback &amp; Notes</h2>
      <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
        {feedback.map((f, i) => (
          <section key={i} className="portal-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--portal-gold-light)" }}>
                Coach Sahmi El
              </span>
              <span style={{ fontSize: "11px", color: "var(--portal-text-dim)" }}>{f.date}</span>
            </div>
            <p style={{ color: "var(--portal-text-muted)", fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>
              {f.message}
            </p>
          </section>
        ))}
      </div>

      <PortalBottomNav scope={scope} />
    </div>
  );
}
