"use client";

import React from "react";
import Link from "next/link";
import type { PortalScope } from "../data/types";
import { useClientPortalData } from "../data/useClientPortalData";
import { nutritionTotals } from "../data/types";
import PortalBottomNav from "../components/PortalBottomNav";

export default function TodayPage({ scope = "live" }: { scope?: PortalScope }) {
  const basePath = scope === "demo" ? "/demo" : "/client";
  const data = useClientPortalData(scope);
  const totals = nutritionTotals(data);
  const targets = data.nutrition.targets;

  const now = new Date();
  const dayName = now.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const dateFormatted = now.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();

  const nextWorkout = data.programme.days[0];
  const caloriePercent = Math.min(100, Math.round((totals.calories / (targets.calories || 2400)) * 100));

  return (
    <div className="portal-container">
      <div className="portal-grid-2">
        {/* Left Column: Hero Action & Direction */}
        <div className="portal-col">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.12em", fontWeight: 700, color: "var(--portal-gold-light)" }}>
              {dayName} · {dateFormatted}
            </span>
            <span style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "4px 10px",
              borderRadius: "999px",
              textTransform: "uppercase",
              background: "rgba(199, 164, 91, 0.12)",
              color: "var(--portal-gold-light)",
              border: "1px solid rgba(199, 164, 91, 0.28)",
            }}>
              Training Day
            </span>
          </div>

          {/* Hero Action Card */}
          <section className="portal-card portal-card-elevated">
            <span className="portal-kicker">YOUR NEXT ACTION</span>
            <h1 className="portal-hero-title">{nextWorkout ? nextWorkout.name : "Active Recovery"}</h1>
            <p style={{ color: "var(--portal-text-muted)", fontSize: "13px", margin: "0 0 20px" }}>
              {nextWorkout
                ? `${nextWorkout.estimatedMinutes} · Gym Floor · ${nextWorkout.exercises.length} prescribed movements`
                : "Prescribed mobility, hydration & active recovery"}
            </p>
            <Link href={`${basePath}/workout-logger`} className="portal-btn-primary">
              <span>Start Workout</span>
              <span>→</span>
            </Link>
          </section>

          {/* Coach Direction */}
          <section className="portal-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "#ffffff" }}>Today&apos;s Direction</h2>
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--portal-gold-light)" }}>
                Coach Prescribed
              </span>
            </div>
            <p style={{ color: "var(--portal-text-muted)", fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>
              {data.programme.athleteDirection ||
                "Execute each repetition with controlled tempo. Focus on progressive overload, log each working set, and observe your prescribed rest intervals."}
            </p>
          </section>
        </div>

        {/* Right Column: Day-at-a-Glance Bento Grid */}
        <div className="portal-col">
          <h2 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "#ffffff" }}>Day at a Glance</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {/* Training Tile */}
            <Link href={`${basePath}/workout-logger`} className="portal-card" style={{ textDecoration: "none", color: "inherit", padding: "18px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--portal-gold-light)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Training
              </span>
              <strong style={{ display: "block", fontSize: "24px", fontWeight: 750, color: "#ffffff", margin: "8px 0 4px", fontVariantNumeric: "tabular-nums" }}>
                {data.programme.week ? `W${data.programme.week}` : "Active"}
              </strong>
              <span style={{ fontSize: "12px", color: "var(--portal-text-muted)" }}>
                {nextWorkout?.name || "Session planned"}
              </span>
            </Link>

            {/* Nutrition Tile */}
            <Link href={`${basePath}/nutrition`} className="portal-card" style={{ textDecoration: "none", color: "inherit", padding: "18px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--portal-gold-light)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Nutrition
              </span>
              <strong style={{ display: "block", fontSize: "24px", fontWeight: 750, color: "#ffffff", margin: "8px 0 4px", fontVariantNumeric: "tabular-nums" }}>
                {totals.calories} <small style={{ fontSize: "12px", fontWeight: 400, color: "var(--portal-text-dim)" }}>/ {targets.calories} kcal</small>
              </strong>
              <span style={{ fontSize: "12px", color: "var(--portal-text-muted)" }}>
                {caloriePercent}% Budget
              </span>
            </Link>
          </div>

          {/* Coaching Review Tile */}
          <Link href={`${basePath}/progress`} className="portal-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit", padding: "18px 20px" }}>
            <div>
              <strong style={{ display: "block", fontSize: "13.5px", color: "#ffffff", fontWeight: 700 }}>
                Next Coaching Review
              </strong>
              <span style={{ fontSize: "12px", color: "var(--portal-text-muted)" }}>
                Scheduled for {data.client.nextCheckIn} with {data.client.coachName}
              </span>
            </div>
            <span style={{ color: "var(--portal-gold-light)", fontSize: "16px" }}>→</span>
          </Link>
        </div>
      </div>

      <PortalBottomNav scope={scope} />
    </div>
  );
}
