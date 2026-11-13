"use client";

import { useState } from "react";
import Link from "next/link";
import ModernClientBottomNav from "../components/ModernClientBottomNav";
import { useClientPortalData } from "../data/useClientPortalData";
import { clientPortalAdapter } from "../data/clientPortalAdapter";
import ClearableSearchInput from "@/components/ClearableSearchInput";
import "@/styles/ascend-nutrition-meals.css";
import type { PortalScope } from "../data/types";

interface FoodItem {
  name: string;
  amount: string;
}

interface PlannedMeal {
  id: string;
  label: string;
  name: string;
  foods: FoodItem[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const INITIAL_MEALS: PlannedMeal[] = [
  {
    id: "breakfast",
    label: "Breakfast",
    name: "Oats & boiled eggs",
    foods: [
      { name: "Dry oats", amount: "60 g" },
      { name: "Boiled eggs", amount: "100 g" },
    ],
    kcal: 430,
    protein: 25,
    carbs: 42,
    fat: 17,
  },
  {
    id: "lunch",
    label: "Lunch",
    name: "Rice & grilled fish",
    foods: [
      { name: "Cooked rice", amount: "180 g" },
      { name: "Cooked mackerel", amount: "130 g" },
    ],
    kcal: 610,
    protein: 39,
    carbs: 56,
    fat: 25,
  },
  {
    id: "dinner",
    label: "Dinner",
    name: "Eba & egusi soup",
    foods: [
      { name: "Prepared eba", amount: "220 g" },
      { name: "Finished egusi soup", amount: "250 g" },
    ],
    kcal: 710,
    protein: 23,
    carbs: 83,
    fat: 30,
  },
];

const TARGETS = { kcal: 2200, protein: 135, carbs: 250, fat: 75 };

interface CatalogItem {
  name: string;
  unit: string;
  kcal100: number;
  p100: number;
  c100: number;
  f100: number;
}

const NIGERIAN_CATALOG: CatalogItem[] = [
  { name: "Cooked white rice", unit: "Cooked", kcal100: 130, p100: 2.7, c100: 28, f100: 0.3 },
  { name: "Jollof rice (home style)", unit: "Prepared", kcal100: 160, p100: 3.2, c100: 29, f100: 3.5 },
  { name: "Cooked mackerel", unit: "Cooked", kcal100: 205, p100: 19, c100: 0, f100: 14 },
  { name: "Grilled chicken breast", unit: "Cooked", kcal100: 165, p100: 31, c100: 0, f100: 3.6 },
  { name: "Beans porridge (honey beans)", unit: "Cooked", kcal100: 140, p100: 8, c100: 22, f100: 2.5 },
  { name: "Boiled plantain", unit: "Cooked", kcal100: 122, p100: 1.3, c100: 32, f100: 0.4 },
  { name: "Prepared eba (garri)", unit: "Prepared", kcal100: 135, p100: 1.1, c100: 32, f100: 0.2 },
  { name: "Egusi soup (verified recipe)", unit: "Finished recipe", kcal100: 175, p100: 10, c100: 5, f100: 13 },
  { name: "Boiled white yam", unit: "Cooked", kcal100: 118, p100: 1.5, c100: 28, f100: 0.2 },
  { name: "Dry rolled oats", unit: "Dry", kcal100: 375, p100: 13, c100: 68, f100: 6.5 },
  { name: "Whole boiled eggs", unit: "Cooked", kcal100: 155, p100: 13, c100: 1.1, f100: 11 },
];

export interface NutritionMealsPageProps {
  scope?: PortalScope;
  onSwitchToClassic?: () => void;
}

export default function NutritionMealsPage({ scope = "live", onSwitchToClassic }: NutritionMealsPageProps) {
  const portalData = useClientPortalData(scope);
  const TARGETS = {
    kcal: portalData.nutrition.targets.calories,
    protein: portalData.nutrition.targets.protein,
    carbs: portalData.nutrition.targets.carbs,
    fat: portalData.nutrition.targets.fats,
  };
  const [view, setView] = useState<"today" | "add" | "form" | "weekly" | "shopping">("today");
  const [expanded, setExpanded] = useState<string | null>("lunch");
  const [log, setLog] = useState<Record<string, { kind: "planned" | "skipped" | "changed"; note?: string }>>({
    breakfast: { kind: "planned" },
  });
  const [extras, setExtras] = useState<Array<{ name: string; amount: string; kcal: number }>>([]);
  const [currentMeal, setCurrentMeal] = useState<string | null>(null);
  const [method, setMethod] = useState<"barcode" | "photo" | "search" | "voice" | null>(null);
  const [selectedFood, setSelectedFood] = useState("Cooked white rice");
  const [grams, setGrams] = useState("250");
  const [foodState, setFoodState] = useState("cooked");
  const [searchText, setSearchText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nutritionMode, setNutritionMode] = useState<"structured" | "simple" | "precision">("structured");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculations
  const stats = () => {
    let kcal = 0, p = 0, c = 0, f = 0;
    INITIAL_MEALS.forEach((m) => {
      const entry = log[m.id];
      if (entry && entry.kind === "planned") {
        kcal += m.kcal;
        p += m.protein;
        c += m.carbs;
        f += m.fat;
      }
    });
    extras.forEach((x) => {
      kcal += x.kcal;
    });
    return { kcal, p, c, f };
  };

  const s = stats();
  const rem = Math.max(0, TARGETS.kcal - s.kcal);

  const handleMealStatus = (m: PlannedMeal) => {
    const entry = log[m.id];
    if (!entry) return <span className="status">Not recorded</span>;
    if (entry.kind === "planned") return <span className="status done">✓ Recorded</span>;
    if (entry.kind === "skipped") return <span className="status skipped">— Skipped</span>;
    return <span className="status changed">Changed</span>;
  };

  const recordPlanned = (mealId: string) => {
    setLog({ ...log, [mealId]: { kind: "planned" } });
    showToast("Recorded as planned");
  };

  const recordSkipped = (mealId: string) => {
    setLog({ ...log, [mealId]: { kind: "skipped" } });
    showToast("Marked as not eaten");
  };

  const undoRecord = (mealId: string) => {
    const copy = { ...log };
    delete copy[mealId];
    setLog(copy);
    showToast("Record removed");
  };

  const openAdd = (mealId: string | null, defaultMethod: "barcode" | "photo" | "search" | "voice" = "search") => {
    setCurrentMeal(mealId);
    setMethod(defaultMethod);
    setView("form");
  };

  const submitFoodEntry = () => {
    const found = NIGERIAN_CATALOG.find((x) => x.name.toLowerCase() === selectedFood.toLowerCase()) || {
      name: selectedFood,
      kcal100: 150,
      p100: 5,
      c100: 25,
      f100: 3,
    };
    const g = parseFloat(grams) || 100;
    const computedKcal = Math.round((found.kcal100 * g) / 100);

    if (currentMeal) {
      setLog({ ...log, [currentMeal]: { kind: "changed", note: `${found.name} (${g} g)` } });
      showToast(`Recorded substitution: ${found.name} (${g} g)`);
    } else {
      setExtras([...extras, { name: `${found.name} (${g} g)`, amount: `${g} g`, kcal: computedKcal }]);
      showToast(`Added: ${found.name} (${g} g) · ${computedKcal} kcal`);
    }

    try {
      clientPortalAdapter.addFood(scope, {
        name: `${found.name} (${g} g)`,
        calories: computedKcal,
        protein: Math.round((found.p100 * g) / 100),
        carbs: Math.round((found.c100 * g) / 100),
        fats: Math.round((found.f100 * g) / 100),
      });
    } catch (e) {
      console.error("Failed to save food:", e);
    }

    setView("today");
  };

  return (
    <div className="nutrition-meals-root">
      <div className="app">
        {/* VIEW 1: TODAY'S MEALS */}
        {view === "today" && (
          <div className="screen">
            <div className="row">
              <div>
                <div className="eyebrow">TODAY · NUTRITION</div>
                <h1>Today&apos;s Meals</h1>
                <div className="sub">Record meals against your coach-approved plan.</div>
              </div>
              <div className="hstack">
                {onSwitchToClassic && (
                  <button
                    onClick={onSwitchToClassic}
                    className="mode"
                    style={{ cursor: "pointer" }}
                    title="Switch to classic table view"
                  >
                    Classic Grid
                  </button>
                )}
                <button
                  className="circleBtn"
                  onClick={() => openAdd(null, "search")}
                  title="Add extra food"
                  aria-label="Add extra food"
                >
                  +
                </button>
              </div>
            </div>

            {/* Mode Switcher: Simple, Structured, Precision */}
            <div className="nutrition-mode-switcher" role="tablist" aria-label="Nutrition tracking mode">
              <button
                type="button"
                className={`nutrition-mode-btn ${nutritionMode === "structured" ? "active" : ""}`}
                onClick={() => setNutritionMode("structured")}
                aria-selected={nutritionMode === "structured"}
              >
                Structured (Grams)
              </button>
              <button
                type="button"
                className={`nutrition-mode-btn ${nutritionMode === "simple" ? "active" : ""}`}
                onClick={() => setNutritionMode("simple")}
                aria-selected={nutritionMode === "simple"}
              >
                Simple (Portions)
              </button>
              <button
                type="button"
                className={`nutrition-mode-btn ${nutritionMode === "precision" ? "active" : ""}`}
                onClick={() => setNutritionMode("precision")}
                aria-selected={nutritionMode === "precision"}
              >
                Precision (Macros)
              </button>
            </div>

            {/* Mode-Specific Insight Banner */}
            {nutritionMode === "simple" && (
              <div className="simple-mode-banner">
                <div className="mode-banner-head">
                  <span className="mode-badge">Simple Mode Active</span>
                  <span className="mode-hint-text">For travel, dining out & unweighed meals</span>
                </div>
                <div className="portion-grid">
                  <div className="portion-card">
                    <span className="portion-icon">✋</span>
                    <strong>1 Palm</strong>
                    <small>Protein (~30–35g)</small>
                    <div className="portion-desc">E.g., grilled chicken breast, mackerel filet</div>
                  </div>
                  <div className="portion-card">
                    <span className="portion-icon">✊</span>
                    <strong>1 Fist</strong>
                    <small>Carbohydrates (~40g)</small>
                    <div className="portion-desc">E.g., 1 ladle jollof rice, boiled yam chunk</div>
                  </div>
                  <div className="portion-card">
                    <span className="portion-icon">👍</span>
                    <strong>1 Thumb</strong>
                    <small>Healthy Fats (~12g)</small>
                    <div className="portion-desc">E.g., groundnut oil, palm oil in stew, avocado</div>
                  </div>
                  <div className="portion-card">
                    <span className="portion-icon">🤲</span>
                    <strong>2 Cupped Hands</strong>
                    <small>Vegetables & Fiber</small>
                    <div className="portion-desc">E.g., efo riro, steamed greens, garden salad</div>
                  </div>
                </div>
              </div>
            )}

            {nutritionMode === "precision" && (
              <div className="precision-mode-banner">
                <div className="mode-banner-head">
                  <span className="mode-badge">Precision Mode Active</span>
                  <span className="mode-hint-text">Peak physique & competition macro breakdown</span>
                </div>
                <div className="precision-macro-grid">
                  <div className="precision-metric">
                    <span>Protein Ratio</span>
                    <strong>{Math.round((TARGETS.protein * 4 / TARGETS.kcal) * 100)}%</strong>
                    <small>{TARGETS.protein}g · {TARGETS.protein * 4} kcal</small>
                  </div>
                  <div className="precision-metric">
                    <span>Carbs Ratio</span>
                    <strong>{Math.round((TARGETS.carbs * 4 / TARGETS.kcal) * 100)}%</strong>
                    <small>{TARGETS.carbs}g · {TARGETS.carbs * 4} kcal</small>
                  </div>
                  <div className="precision-metric">
                    <span>Fat Ratio</span>
                    <strong>{Math.round((TARGETS.fat * 9 / TARGETS.kcal) * 100)}%</strong>
                    <small>{TARGETS.fat}g · {TARGETS.fat * 9} kcal</small>
                  </div>
                  <div className="precision-metric">
                    <span>Target Hydration</span>
                    <strong>{portalData.nutrition.targets.waterLitres || 3.5}L</strong>
                    <small>{portalData.nutrition.hydrationLoggedLitres || 2.0}L recorded</small>
                  </div>
                </div>
              </div>
            )}

            {/* STACKED FIRST: Energy Budget Macro Summary Card */}
            <div className="energy-budget-card">
              <div className="summary-top">
                <div>
                  <div className="eyebrow" style={{ color: "#d2b477", letterSpacing: "0.14em" }}>
                    ENERGY BUDGET
                  </div>
                  <div className="budget-pill">
                    <span className="val">{rem}</span>
                    <span className="unit">kcal left</span>
                  </div>
                  <div className="consumed-today">{s.kcal} kcal consumed today</div>
                </div>
                <div className="goalchip-target">
                  <small>Daily target</small>
                  <div style={{ marginTop: "3px" }}>
                    <b>{TARGETS.kcal}</b>{" "}
                    <span style={{ color: "var(--muted)", fontSize: "13px", fontWeight: 400 }}>
                      kcal
                    </span>
                  </div>
                </div>
              </div>

              <div className="progress">
                <span
                  style={{
                    width: `${Math.min(100, Math.round((s.kcal / TARGETS.kcal) * 100))}%`,
                  }}
                />
              </div>

              <div className="metric">
                {[
                  ["Protein", s.p, TARGETS.protein, "#68ba7f"],
                  ["Carbs", s.c, TARGETS.carbs, "#e5b869"],
                  ["Fat", s.f, TARGETS.fat, "#c68766"],
                ].map(([name, val, target, color]) => (
                  <div key={name as string}>
                    <small>
                      <i className="dot" style={{ background: color as string }} />
                      {name}
                    </small>
                    <strong>
                      {val} / {target} g
                    </strong>
                  </div>
                ))}
              </div>

              <div className="infoNote">
                Gram portions and preparation states are coach-prescribed. Unverified foods have no calculated micronutrients.
              </div>
            </div>

            {/* Desktop 2-Column Responsive Layout */}
            <div className="nutrition-grid" style={{ marginTop: "20px" }}>
              {/* Left Column: Prescribed Meals & Logged Extras */}
              <div>
                <div className="row" style={{ marginBottom: "11px" }}>
                  <h2>Prescribed Meals</h2>
                  <span className="tiny">{INITIAL_MEALS.length} planned today</span>
                </div>

                {INITIAL_MEALS.map((m) => {
                  const isOpen = expanded === m.id;
                  const entry = log[m.id];
                  return (
                    <section key={m.id} className="panel meal" style={{ marginTop: "10px" }}>
                      <button
                        className="mealhead"
                        onClick={() => setExpanded(isOpen ? null : m.id)}
                        aria-expanded={isOpen}
                      >
                        <div className="text">
                          <div className="meal-label">{m.label}</div>
                          <div className="meal-title">{m.name}</div>
                        </div>
                        {handleMealStatus(m)}
                        <span className="chev">{isOpen ? "⌃" : "⌄"}</span>
                      </button>

                      {isOpen && (
                        <div className="details">
                          <div className="ingredients">
                            {m.foods.map((f, i) => (
                              <div key={i} className="ingredient">
                                <span>{f.name}</span>
                                <span>{f.amount}</span>
                              </div>
                            ))}
                          </div>

                          {!entry ? (
                            <>
                              <button
                                className="actionPrimary"
                                onClick={() => recordPlanned(m.id)}
                              >
                                ✓ Ate as planned
                              </button>
                              <div className="textActions">
                                <button onClick={() => openAdd(m.id, "search")}>
                                  Log substitute / change
                                </button>
                                <button onClick={() => recordSkipped(m.id)}>
                                  Didn&apos;t eat
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="savedRow">
                              <span>
                                {entry.kind === "planned"
                                  ? "Recorded as planned"
                                  : entry.kind === "skipped"
                                  ? "Marked not eaten"
                                  : `Substituted: ${entry.note || "Custom"}`}
                              </span>
                              <button onClick={() => undoRecord(m.id)}>Undo</button>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  );
                })}

                {/* Extras Section */}
                {extras.length > 0 && (
                  <div className="section" style={{ marginTop: "24px" }}>
                    <h2>Additional Logged Foods</h2>
                    <div className="panel" style={{ marginTop: "8px" }}>
                      {extras.map((x, i) => (
                        <div key={i} className="extra">
                          <span>{x.name}</span>
                          <strong>{x.kcal} kcal</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Quick Entry & Navigation Links */}
              <div>
                {/* Quick Add Food Action Card */}
                <div className="panel" style={{ marginTop: 0 }}>
                  <div className="row">
                    <div>
                      <div style={{ fontWeight: 650, fontSize: "14px" }}>Quick Food Entry</div>
                      <div className="tiny" style={{ marginTop: "2px" }}>Search verified Nigerian ingredients or log custom portions</div>
                    </div>
                    <button
                      className="circleBtn"
                      style={{ width: "34px", height: "34px", fontSize: "18px" }}
                      onClick={() => openAdd(null, "search")}
                      title="Add food"
                      aria-label="Add food"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Navigation Card Links */}
                <div style={{ marginTop: "14px" }}>
                  <button className="cardLink" onClick={() => setView("weekly")}>
                    <div>
                      <strong>Weekly meal plan</strong>
                      <small>Full 7-day schedule, rotation, and coach recipes</small>
                    </div>
                    <span className="arrow">→</span>
                  </button>
                  <button className="cardLink" onClick={() => setView("shopping")}>
                    <div>
                      <strong>Shopping & food stock</strong>
                      <small>Ingredients and purchase quantities for weekly prep</small>
                    </div>
                    <span className="arrow">→</span>
                  </button>
                </div>

                <p className="disclaimer" style={{ padding: "8px 4px 0" }}>
                  ASCEND Nigerian Nutrition · Portions and recipe yields are verified by your coach. Demo values are illustrative.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ADD / LOG FOOD FLOW */}
        {view === "add" && (
          <div className="screen">
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>
              <div className="row" style={{ marginBottom: "22px" }}>
                <button className="iconBtn" onClick={() => setView("today")} aria-label="Go back">
                  ‹
                </button>
                <div style={{ flex: 1 }}>
                  <div className="eyebrow">ASCEND · NUTRITION</div>
                  <h1 style={{ fontSize: "23px" }}>Add Food</h1>
                  <div className="sub">
                    {currentMeal
                      ? `Changing ${INITIAL_MEALS.find((m) => m.id === currentMeal)?.label}`
                      : "Record food outside your meal plan"}
                  </div>
                </div>
              </div>

              <div className="helper">
                Choose how you&apos;d like to record your food. Camera and barcode scanners are simulated for offline development.
              </div>

              <div className="methodGrid">
                {[
                  { id: "barcode" as const, icon: "▦", title: "Scan Barcode", sub: "Packaged foods" },
                  { id: "photo" as const, icon: "📷", title: "Snap Meal", sub: "Photo estimate" },
                  { id: "search" as const, icon: "🔍", title: "Search Food", sub: "Nigerian catalog" },
                  { id: "voice" as const, icon: "🎙", title: "Speak & Weigh", sub: "Voice input" },
                ].map((item) => (
                  <button
                    key={item.id}
                    className="method"
                    onClick={() => {
                      setMethod(item.id);
                      setView("form");
                    }}
                  >
                    <span className="methodIcon">{item.icon}</span>
                    <div className="methodTitle">{item.title}</div>
                    <div className="methodSub">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: FOOD ENTRY FORM (SEARCH & PORTION) */}
        {view === "form" && (
          <div className="screen">
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>
              <div className="row" style={{ marginBottom: "22px" }}>
                <button className="iconBtn" onClick={() => setView("add")} aria-label="Go back">
                  ‹
                </button>
                <div style={{ flex: 1 }}>
                  <div className="eyebrow">ASCEND · NUTRITION</div>
                  <h1 style={{ fontSize: "23px" }}>Record Food</h1>
                  <div className="sub">Specify item, preparation state, and exact grams.</div>
                </div>
              </div>

              <div className="field">
                <label>Search Nigerian Food Catalog</label>
                <ClearableSearchInput
                  value={searchText}
                  onChange={setSearchText}
                  placeholder="Type rice, yam, plantain, egusi..."
                  ariaLabel="Search Nigerian Food Catalog"
                />
                <div className="suggestions">
                  {NIGERIAN_CATALOG.filter((item) =>
                    !searchText || item.name.toLowerCase().includes(searchText.toLowerCase())
                  ).slice(0, 5).map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setSelectedFood(item.name);
                        setSearchText(item.name);
                      }}
                      style={{
                        borderColor: selectedFood === item.name ? "var(--gold)" : undefined,
                        background: selectedFood === item.name ? "var(--goldDark)" : undefined,
                      }}
                    >
                      <strong>{item.name}</strong>
                      <small>{item.unit} · {item.kcal100} kcal / 100g (P: {item.p100}g, C: {item.c100}g, F: {item.f100}g)</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Preparation State</label>
                <select value={foodState} onChange={(e) => setFoodState(e.target.value)}>
                  <option value="cooked">Cooked</option>
                  <option value="raw">Raw / Dry</option>
                  <option value="prepared">Prepared / Finished Recipe</option>
                </select>
              </div>

              <div className="field">
                <label>Measured Portion (Grams)</label>
                <input
                  type="number"
                  min="10"
                  max="2000"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                />
              </div>

              <button
                className="actionPrimary"
                style={{ marginTop: "18px" }}
                onClick={submitFoodEntry}
              >
                ✓ Confirm & Record Entry
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: WEEKLY PLAN */}
        {view === "weekly" && (
          <div className="screen">
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>
              <div className="row" style={{ marginBottom: "22px" }}>
                <button className="iconBtn" onClick={() => setView("today")} aria-label="Go back">
                  ‹
                </button>
                <div style={{ flex: 1 }}>
                  <div className="eyebrow">ASCEND · NUTRITION</div>
                  <h1 style={{ fontSize: "23px" }}>Weekly Meal Plan</h1>
                  <div className="sub">Coach-approved rotation for your active training phase.</div>
                </div>
              </div>

              <div className="helper">
                Your nutrition targets maintain repeatable energy availability across workout days and rest days.
              </div>

              {INITIAL_MEALS.map((m) => (
                <div key={m.id} className="panel" style={{ marginTop: "10px" }}>
                  <div className="meal-label">{m.label}</div>
                  <div className="meal-title">{m.name}</div>
                  <div className="tiny" style={{ marginTop: "6px" }}>
                    {m.foods.map((f) => `${f.name} (${f.amount})`).join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: SHOPPING & GROCERY STOCK */}
        {view === "shopping" && (
          <div className="screen">
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>
              <div className="row" style={{ marginBottom: "22px" }}>
                <button className="iconBtn" onClick={() => setView("today")} aria-label="Go back">
                  ‹
                </button>
                <div style={{ flex: 1 }}>
                  <div className="eyebrow">ASCEND · NUTRITION</div>
                  <h1 style={{ fontSize: "23px" }}>Shopping & Food Stock</h1>
                  <div className="sub">Aggregated weekly ingredient quantities for Nigerian meal prep.</div>
                </div>
              </div>

              <div className="helper">
                Purchase quantities account for cooked yield conversions and weekly training frequency.
              </div>

              <div className="panel" style={{ marginTop: "10px" }}>
                <h2>Essential Pantry & Produce</h2>
                <ul style={{ paddingLeft: "20px", marginTop: "10px", lineHeight: "1.8", fontSize: "13px" }}>
                  <li><strong>Rolled Oats:</strong> ~500 g dry</li>
                  <li><strong>Fresh Eggs:</strong> 1 crate (30 eggs)</li>
                  <li><strong>White / Brown Rice:</strong> 1.5 kg uncooked</li>
                  <li><strong>Fresh / Frozen Mackerel:</strong> 1 kg</li>
                  <li><strong>White Garri (for Eba):</strong> 1 kg</li>
                  <li><strong>Melon Seeds (Egusi):</strong> 500 g ground</li>
                  <li><strong>Ugu / Spinach Leaves:</strong> 3 bunches</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Fixed Global Navigation */}
        <ModernClientBottomNav scope={scope} active="nutrition" />
      </div>

      {/* Floating Toast */}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
}
