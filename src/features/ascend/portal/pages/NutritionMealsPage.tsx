"use client";

import { useState, useEffect } from "react";
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

interface SimplePortionItem {
  item: string;
  portion: string;
}

interface PlannedMeal {
  id: string;
  label: string;
  name: string;
  foods: FoodItem[];
  simplePortion: {
    summary: string;
    items: SimplePortionItem[];
  };
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
    simplePortion: {
      summary: "1 medium bowl warm oats + 2 whole boiled eggs",
      items: [
        { item: "Rolled oats", portion: "1 cupped hand dry (cooked thick with water)" },
        { item: "Whole eggs", portion: "2 whole boiled eggs (or 3 egg whites + 1 whole)" },
      ],
    },
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
    simplePortion: {
      summary: "1 palm grilled mackerel + 1 fist jollof or white rice",
      items: [
        { item: "Grilled mackerel", portion: "1 palm-sized filet (high protein source)" },
        { item: "Cooked rice", portion: "1 tight fist-sized portion (about 1 ladle)" },
      ],
    },
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
    simplePortion: {
      summary: "1 moderate wrap eba + 1 bowl egusi soup with lean beef or fish",
      items: [
        { item: "Prepared eba", portion: "1 medium palm-sized wrap" },
        { item: "Egusi soup & protein", portion: "1 ladle soup with 1-2 palm-sized meat pieces" },
      ],
    },
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ascend_nutrition_mode");
      if (saved === "structured" || saved === "simple" || saved === "precision") {
        setNutritionMode(saved);
      }
    } catch {}
  }, []);

  // Hydrate live meals from /api/client/meals
  useEffect(() => {
    if (scope !== "live") return;
    async function loadLiveMeals() {
      try {
        const res = await fetch("/api/client/meals");
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && Array.isArray(data.loggedMeals)) {
          const newLog: Record<string, { kind: "planned" | "skipped" | "changed"; note?: string }> = {};
          for (const item of data.loggedMeals) {
            const key = item.mealType.toLowerCase();
            if (item.status === "PLANNED") {
              newLog[key] = { kind: "planned" };
            } else if (item.status === "SKIPPED") {
              newLog[key] = { kind: "skipped" };
            } else if (item.status === "CHANGED") {
              newLog[key] = { kind: "changed", note: item.notes || undefined };
            }
          }
          setLog(newLog);
        }
      } catch {}
    }
    loadLiveMeals();
  }, [scope]);

  const handleModeChange = (mode: "structured" | "simple" | "precision") => {
    setNutritionMode(mode);
    try {
      localStorage.setItem("ascend_nutrition_mode", mode);
    } catch {}
    const label =
      mode === "precision"
        ? "Precision Gram View active"
        : mode === "structured"
        ? "Structured Plan active"
        : "Simple Guide active";
    showToast(label);
  };

  const completedMealsCount = INITIAL_MEALS.filter((m) => log[m.id]?.kind === "planned").length;

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

  const mapIdToType = (mealId: string) => {
    const upper = mealId.toUpperCase();
    if (['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].includes(upper)) return upper;
    return 'SNACK';
  };

  const recordPlanned = (mealId: string) => {
    setLog((prev) => ({ ...prev, [mealId]: { kind: "planned" } }));
    showToast("Recorded as planned");

    if (scope === "live") {
      const m = INITIAL_MEALS.find((x) => x.id === mealId);
      fetch("/api/client/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: mapIdToType(mealId),
          mealName: m?.name || mealId,
          status: "PLANNED",
        }),
      }).catch(() => {});
    }
  };

  const recordSkipped = (mealId: string) => {
    setLog((prev) => ({ ...prev, [mealId]: { kind: "skipped" } }));
    showToast("Marked as not eaten");

    if (scope === "live") {
      const m = INITIAL_MEALS.find((x) => x.id === mealId);
      fetch("/api/client/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: mapIdToType(mealId),
          mealName: m?.name || mealId,
          status: "SKIPPED",
        }),
      }).catch(() => {});
    }
  };

  const undoRecord = (mealId: string) => {
    setLog((prev) => {
      const copy = { ...prev };
      delete copy[mealId];
      return copy;
    });
    showToast("Record removed");

    if (scope === "live") {
      const m = INITIAL_MEALS.find((x) => x.id === mealId);
      fetch("/api/client/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: mapIdToType(mealId),
          mealName: m?.name || mealId,
          status: "NOT_RECORDED",
        }),
      }).catch(() => {});
    }
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

      if (scope === "live") {
        const m = INITIAL_MEALS.find((x) => x.id === currentMeal);
        fetch("/api/client/meals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mealType: mapIdToType(currentMeal),
            mealName: m?.name || currentMeal,
            status: "CHANGED",
            customFoods: [{ name: found.name, grams: g, state: foodState }],
            notes: `Swapped with ${found.name} (${g} g)`,
          }),
        }).catch(() => {});
      }
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
                <h1 style={{ margin: "0 0 4px", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.04em" }}>Today&apos;s Meals</h1>
                <div className="sub">
                  {nutritionMode === "structured"
                    ? "Weighing and tracking precise grams, calories & macro targets."
                    : "Simple meal guideline and portion benchmarks for busy days."}
                </div>
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

            {/* Segmented Dual-Mode Switcher */}
            <div className="nutrition-mode-switcher-container">
              <div className="nutrition-mode-switcher" role="tablist" aria-label="Nutrition tracking mode">
                <button
                  type="button"
                  className={`nutrition-mode-btn ${nutritionMode === "structured" ? "active" : ""}`}
                  onClick={() => handleModeChange("structured")}
                  role="tab"
                  aria-selected={nutritionMode === "structured"}
                >
                  <div className="nutrition-mode-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                    </svg>
                    <span>Structured &amp; Macros</span>
                  </div>
                  <div className="nutrition-mode-desc">Exact grams, calories &amp; protein targets</div>
                </button>

                <button
                  type="button"
                  className={`nutrition-mode-btn ${nutritionMode === "simple" ? "active" : ""}`}
                  onClick={() => handleModeChange("simple")}
                  role="tab"
                  aria-selected={nutritionMode === "simple"}
                >
                  <div className="nutrition-mode-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>Simple Guide</span>
                  </div>
                  <div className="nutrition-mode-desc">Portion benchmarks · No macro math</div>
                </button>

                <button
                  type="button"
                  className={`nutrition-mode-btn ${nutritionMode === "precision" ? "active" : ""}`}
                  onClick={() => handleModeChange("precision")}
                  role="tab"
                  aria-selected={nutritionMode === "precision"}
                >
                  <div className="nutrition-mode-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    <span>Precision</span>
                  </div>
                  <div className="nutrition-mode-desc">Exact weighed grams · Variance tracking</div>
                </button>
              </div>
            </div>

            {/* DYNAMIC TOP CARD */}
            {nutritionMode === "simple" ? (
              <div className="simple-summary-card">
                <div className="summary-top">
                  <div>
                    <div className="summary-title-clean">Daily Nutrition Focus</div>
                    <div className="adherence-counter">
                      <span className="adherence-val">{completedMealsCount} of {INITIAL_MEALS.length}</span>
                      <span className="adherence-sub">meals logged on track</span>
                    </div>
                    <div className="adherence-note">
                      {completedMealsCount === INITIAL_MEALS.length
                        ? "All planned meals checked off today · Excellent discipline"
                        : completedMealsCount > 0
                        ? "On track · Consistency beats perfection"
                        : "Start your day by logging Breakfast when ready"}
                    </div>
                  </div>
                  <div className="hydration-badge">
                    <span className="hydration-label">Hydration Target</span>
                    <strong>{portalData.nutrition.targets.waterLitres || 3.5} Litres</strong>
                    <small>1 tall glass with each meal</small>
                  </div>
                </div>

                <div className="progress">
                  <span
                    style={{
                      width: `${Math.round((completedMealsCount / INITIAL_MEALS.length) * 100)}%`,
                    }}
                  />
                </div>

                <div className="simple-coach-principle">
                  <svg className="principle-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <div>
                    <strong>Coach Principle:</strong> Fill your plate with a palm of lean protein first, a fist of whole carbohydrates, and chew unhurriedly. Stop when 80% satisfied. No calorie counting required.
                  </div>
                </div>
              </div>
            ) : (
              <div className="energy-budget-card">
                <div className="summary-top">
                  <div>
                    <div className="summary-title-clean">Energy &amp; Macro Budget</div>
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
            )}

            {/* Desktop 2-Column Responsive Layout */}
            <div className="nutrition-grid" style={{ marginTop: "20px" }}>
              {/* Left Column: Prescribed Meals & Logged Extras */}
              <div>
                <div className="row" style={{ marginBottom: "11px" }}>
                  <h2>{nutritionMode === "structured" ? "Prescribed Meals (Gram Precision)" : "Today's Meal Guidelines"}</h2>
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
                          <div className="meal-title-row">
                            <span className="meal-title">{m.name}</span>
                            {nutritionMode === "structured" ? (
                              <span className="meal-macro-chip">{m.kcal} kcal · {m.protein}g P</span>
                            ) : (
                              <span className="meal-portion-chip">{m.simplePortion.summary.split("+")[0].trim()}</span>
                            )}
                          </div>
                        </div>
                        {handleMealStatus(m)}
                        <span className="chev">{isOpen ? "⌃" : "⌄"}</span>
                      </button>

                      {isOpen && (
                        <div className="details">
                          {nutritionMode === "simple" ? (
                            <div className="simple-meal-content">
                              <div className="simple-guideline-box">
                                <div className="simple-guideline-label">Portion Benchmark</div>
                                <div className="simple-guideline-summary">{m.simplePortion.summary}</div>
                              </div>

                              <div className="simple-portion-list">
                                {m.simplePortion.items.map((it, idx) => (
                                  <div key={idx} className="simple-portion-item">
                                    <div className="simple-item-name">{it.item}</div>
                                    <div className="simple-item-portion">{it.portion}</div>
                                  </div>
                                ))}
                              </div>

                              {!entry ? (
                                <div className="simple-actions">
                                  <button
                                    className="actionPrimary"
                                    onClick={() => recordPlanned(m.id)}
                                  >
                                    ✓ Had this meal
                                  </button>
                                  <div className="textActions">
                                    <button onClick={() => recordSkipped(m.id)}>
                                      Didn&apos;t eat
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="savedRow">
                                  <span>
                                    {entry.kind === "planned"
                                      ? "✓ Logged as eaten"
                                      : entry.kind === "skipped"
                                      ? "Marked not eaten"
                                      : `Substituted: ${entry.note || "Custom"}`}
                                  </span>
                                  <button onClick={() => undoRecord(m.id)}>Undo</button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="meal-macro-bar">
                                <div className="macro-bar-item">
                                  <span>Calories</span>
                                  <strong>{m.kcal} kcal</strong>
                                </div>
                                <div className="macro-bar-item">
                                  <span>Protein</span>
                                  <strong style={{ color: "#68ba7f" }}>{m.protein} g</strong>
                                </div>
                                <div className="macro-bar-item">
                                  <span>Carbs</span>
                                  <strong style={{ color: "#e5b869" }}>{m.carbs} g</strong>
                                </div>
                                <div className="macro-bar-item">
                                  <span>Fat</span>
                                  <strong style={{ color: "#c68766" }}>{m.fat} g</strong>
                                </div>
                              </div>

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
                  <h1 style={{ fontSize: "23px", margin: "0 0 4px" }}>Add Food</h1>
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
                  {
                    id: "barcode" as const,
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M3 5v14M6 5v14M11 5v14M15 5v14M18 5v14M21 5v14" />
                      </svg>
                    ),
                    title: "Scan Barcode",
                    sub: "Packaged foods",
                  },
                  {
                    id: "photo" as const,
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    ),
                    title: "Snap Meal",
                    sub: "Photo estimate",
                  },
                  {
                    id: "search" as const,
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    ),
                    title: "Search Food",
                    sub: "Nigerian catalog",
                  },
                  {
                    id: "voice" as const,
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                      </svg>
                    ),
                    title: "Speak & Weigh",
                    sub: "Voice input",
                  },
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
                  <h1 style={{ fontSize: "23px", margin: "0 0 4px" }}>Record Food</h1>
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
                  <h1 style={{ fontSize: "23px", margin: "0 0 4px" }}>Weekly Meal Plan</h1>
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
                  <h1 style={{ fontSize: "23px", margin: "0 0 4px" }}>Shopping &amp; Food Stock</h1>
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
