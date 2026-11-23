"use client";

import React from "react";
import type { PortalScope } from "../data/types";
import { useClientPortalData } from "../data/useClientPortalData";
import { nutritionTotals } from "../data/types";
import PortalBottomNav from "../components/PortalBottomNav";

export default function NutritionPage({ scope = "live" }: { scope?: PortalScope }) {
  const data = useClientPortalData(scope);
  const totals = nutritionTotals(data);
  const targets = data.nutrition.targets;
  const meals = data.nutrition.meals;

  const caloriePercent = Math.min(100, Math.round((totals.calories / (targets.calories || 2400)) * 100));

  return (
    <div className="portal-container">
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <span className="portal-kicker">NUTRITION &amp; FUEL</span>
        <h1 className="portal-hero-title">Daily Nutrition Protocol</h1>
        <p style={{ color: "var(--portal-text-muted)", fontSize: "13px", margin: 0 }}>
          Calibrated energy budget and macro targets prescribed by Coach Sahmi
        </p>
      </div>

      {/* Energy & Macros Bento Card */}
      <section className="portal-card portal-card-elevated" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span className="portal-kicker">CALORIE BUDGET</span>
            <div style={{ fontSize: "36px", fontWeight: 750, color: "#ffffff", letterSpacing: "-0.04em", margin: "4px 0", fontVariantNumeric: "tabular-nums" }}>
              {totals.calories.toLocaleString()} <span style={{ fontSize: "14px", fontWeight: 400, color: "var(--portal-text-muted)" }}>/ {targets.calories.toLocaleString()} kcal</span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--portal-text-muted)" }}>
              {targets.calories - totals.calories > 0 ? `${(targets.calories - totals.calories).toLocaleString()} kcal remaining` : "Daily target reached"}
            </span>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "11px", color: "var(--portal-text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Adherence</span>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--portal-green)", fontVariantNumeric: "tabular-nums" }}>
              {caloriePercent}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "999px", overflow: "hidden", margin: "16px 0 14px" }}>
          <div style={{ height: "100%", width: `${caloriePercent}%`, background: "linear-gradient(90deg, #c7a45b, #dfbf77)", borderRadius: "999px" }} />
        </div>

        {/* Macro Distribution Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", borderTop: "1px solid var(--portal-border)", paddingTop: "14px" }}>
          <div style={{ background: "rgba(223, 191, 119, 0.08)", border: "1px solid rgba(223, 191, 119, 0.2)", borderRadius: "12px", padding: "10px 12px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--portal-gold-light)", textTransform: "uppercase" }}>Protein</span>
            <strong style={{ display: "block", fontSize: "18px", color: "#ffffff", marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>
              {totals.protein}g <small style={{ fontSize: "11px", fontWeight: 400, color: "var(--portal-text-dim)" }}>/ {targets.protein}g</small>
            </strong>
          </div>

          <div style={{ background: "rgba(227, 188, 118, 0.08)", border: "1px solid rgba(227, 188, 118, 0.2)", borderRadius: "12px", padding: "10px 12px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--portal-amber)", textTransform: "uppercase" }}>Carbs</span>
            <strong style={{ display: "block", fontSize: "18px", color: "#ffffff", marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>
              {totals.carbs}g <small style={{ fontSize: "11px", fontWeight: 400, color: "var(--portal-text-dim)" }}>/ {targets.carbs}g</small>
            </strong>
          </div>

          <div style={{ background: "rgba(158, 199, 222, 0.08)", border: "1px solid rgba(158, 199, 222, 0.2)", borderRadius: "12px", padding: "10px 12px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--portal-blue)", textTransform: "uppercase" }}>Fats</span>
            <strong style={{ display: "block", fontSize: "18px", color: "#ffffff", marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>
              {totals.fats}g <small style={{ fontSize: "11px", fontWeight: 400, color: "var(--portal-text-dim)" }}>/ {targets.fats}g</small>
            </strong>
          </div>
        </div>
      </section>

      {/* Meals List */}
      <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", marginBottom: "12px" }}>Recorded Food Entries</h2>
      <div style={{ display: "grid", gap: "12px" }}>
        {meals.map((meal) => (
          <section key={meal.id} className="portal-card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--portal-gold-light)", textTransform: "uppercase" }}>
                  {meal.time}
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: "4px 0 2px" }}>
                  {meal.name}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--portal-text-muted)" }}>
                  P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fats}g
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", fontVariantNumeric: "tabular-nums" }}>
                  {meal.calories}
                </span>
                <span style={{ display: "block", fontSize: "11px", color: "var(--portal-text-dim)" }}>kcal</span>
              </div>
            </div>
          </section>
        ))}
      </div>

      <PortalBottomNav scope={scope} />
    </div>
  );
}
