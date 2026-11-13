"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/ascend-progress-interactive.css";
import type { PortalScope } from "../data/types";
import type { ProgressRecord, ProgressResponse } from "@/contracts/progress";

interface Achievement {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  state: "progress" | "earned";
  date?: string;
  progress: number;
  detail: string;
}

const CATEGORIES = [
  "All",
  "The Iron Total",
  "Forge",
  "Rise",
  "Balance",
  "Beyond",
  "The Practice",
  "Mastery",
  "The Path",
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "iron",
    category: "The Iron Total",
    title: "Iron Initiate",
    subtitle: "Squat + bench + deadlift · 500 lb combined",
    state: "progress",
    progress: 0,
    detail: "Recorded qualifying singles are needed for the combined-lift total. The qualification window and verification rules still require approval.",
  },
  {
    id: "forge",
    category: "Forge",
    title: "Pillar I",
    subtitle: "Flat barbell bench press · 40 kg",
    state: "progress",
    progress: 87.5,
    detail: "Example: a comparable bench press working set at 35 kg has been logged. Earned only after a qualifying completed repetition at 40 kg, including the bar.",
  },
  {
    id: "rise",
    category: "Rise",
    title: "First Ascent",
    subtitle: "1 strict unassisted pull-up",
    state: "progress",
    progress: 0,
    detail: "Only a clean, unassisted pull-up counts. Machine-assisted variations stay separate.",
  },
  {
    id: "balance",
    category: "Balance",
    title: "Equal Force I",
    subtitle: "Bench press · 0.75 × bodyweight",
    state: "progress",
    progress: 0,
    detail: "Requires a qualifying barbell bench press and a suitably dated measured bodyweight; the exact comparison window still needs product rules.",
  },
  {
    id: "beyond",
    category: "Beyond",
    title: "New Heights",
    subtitle: "Leg Press · new highest comparable load",
    state: "earned",
    date: "8 Nov · demo",
    progress: 100,
    detail: "Fictional example award: a new recorded load for the same equipment and movement, supported by working-set history. Actual award calculations require a verified logger.",
  },
  {
    id: "practice",
    category: "The Practice",
    title: "The Beginning",
    subtitle: "First prescribed workout completed",
    state: "earned",
    date: "21 Oct · demo",
    progress: 100,
    detail: "Fictional example: the first coach-prescribed session was completed. Missed workouts cannot remove earned awards.",
  },
  {
    id: "roots",
    category: "The Practice",
    title: "Roots I",
    subtitle: "10 prescribed workouts · 7 recorded",
    state: "progress",
    progress: 70,
    detail: "7 of 10 planned workouts are completed in this fictional example. Missed sessions do not erase previous progress; rescheduled sessions count once.",
  },
  {
    id: "mastery",
    category: "Mastery",
    title: "Form Established",
    subtitle: "Technique confirmed by Sahmi",
    state: "progress",
    progress: 0,
    detail: "Coach review required. A log or photo alone cannot prove consistent setup, range and controlled execution.",
  },
  {
    id: "path",
    category: "The Path",
    title: "Tame the Flesh",
    subtitle: "Phase I completion · coach confirmed",
    state: "progress",
    progress: 0,
    detail: "Phase completion requires Sahmi’s review of consistency, technique, recovery and independent execution. It is not automatic after a number of workouts.",
  },
];

const INITIAL_WEIGHTS = [79.2, 79.3, 79.0, 79.1, 78.8, 78.7, 78.6, 78.4, 78.2, 78.5, 78.4, 78.4];

const STRENGTH_RECORDS = [
  { name: "Leg Press", detail: "Same machine · working set", prev: "80 kg × 10", current: "90 kg × 10", note: "Most recent 8 Nov" },
  { name: "Dumbbell Romanian Deadlift", detail: "Per dumbbell · working set", prev: "20 kg × 10", current: "24 kg × 10", note: "Most recent 7 Nov" },
  { name: "Lat Pulldown", detail: "Same cable station · working set", prev: "35 kg × 10", current: "40 kg × 10", note: "Most recent 5 Nov" },
];

export interface ProgressInteractivePageProps {
  scope?: PortalScope;
  onSwitchToClassic?: () => void;
}

export default function ProgressInteractivePage({ scope = "live", onSwitchToClassic }: ProgressInteractivePageProps) {
  const [tab, setTab] = useState<"overview" | "achievements">("overview");
  const [weights, setWeights] = useState<number[]>(INITIAL_WEIGHTS);
  const [range, setRange] = useState<number>(8); // 4, 8, 12, or weights.length
  const [chosenCategory, setChosenCategory] = useState("All");
  const [chosenStatus, setChosenStatus] = useState<"all" | "progress" | "earned">("all");

  // Modal State
  const [modalData, setModalData] = useState<{
    title: string;
    info: string;
    body: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  const [newWeightInput, setNewWeightInput] = useState("78.4");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync live progress if in live scope
  useEffect(() => {
    if (scope !== "live") return;
    const load = async () => {
      try {
        const res = await fetch("/api/progress?metric=BODYWEIGHT_KG&period=12w", {
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        });
        if (res.ok) {
          const json: ProgressResponse = await res.json();
          if (json.records?.length > 0) {
            const sorted = [...json.records].sort(
              (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
            );
            setWeights(sorted.map((r) => Number(r.value)));
          }
        }
      } catch (e) {
        console.error("Live progress sync", e);
      }
    };
    load();
  }, [scope]);

  // Current calculations
  const slice = weights.slice(-range);
  const currentWeight = weights[weights.length - 1] || 78.4;
  const recentSlice = weights.slice(-7);
  const sevenDayAvg = recentSlice.length ? (recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length).toFixed(1) : currentWeight.toFixed(1);
  const baseline = weights[0] || currentWeight;
  const changeFromStart = (currentWeight - baseline).toFixed(1);

  // SVG Chart Dimensions
  const w = 540, h = 175, top = 18, bottom = 22, left = 14, right = 18;
  let minW = Math.min(...slice), maxW = Math.max(...slice);
  const marginW = Math.max((maxW - minW) * 0.35, 0.2);
  minW -= marginW;
  maxW += marginW;

  const getX = (i: number) => left + (i * (w - left - right)) / Math.max(1, slice.length - 1);
  const getY = (v: number) => top + ((maxW - v) * (h - top - bottom)) / (maxW - minW);

  const pts = slice.map((v, i) => [getX(i), getY(v)]);
  const lineD = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const areaD = lineD ? `${lineD} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z` : "";

  // Handlers
  const handleSaveWeight = async () => {
    const val = parseFloat(newWeightInput);
    if (!val || val < 30 || val > 300) {
      showToast("Please enter a valid weight in kg");
      return;
    }
    setWeights([...weights, val]);
    setModalData(null);
    showToast(`Recorded: ${val.toFixed(1)} kg`);

    // In live scope, POST to DB
    if (scope === "live") {
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            metric: "BODYWEIGHT_KG",
            value: val,
            unit: "kg",
            measuredAt: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error("Failed to save progress to server", err);
      }
    }
  };

  const filteredAchievements = INITIAL_ACHIEVEMENTS.filter((a) => {
    const catMatch = chosenCategory === "All" || a.category === chosenCategory;
    const statusMatch = chosenStatus === "all" || a.state === chosenStatus;
    return catMatch && statusMatch;
  });

  return (
    <div className="progress-interactive-root">
      <div className="app">
        {/* Navigation Tabs Header */}
        <header className="pageHead">
          <div className="row">
            <div>
              <div className="eyebrow">ASCEND · ATHLETE PROGRESS</div>
              <h1 style={{ margin: "5px 0 0", fontSize: "28px", fontWeight: 720 }}>Progress & Review</h1>
            </div>
            {onSwitchToClassic && (
              <button
                onClick={onSwitchToClassic}
                className="chip"
                style={{ cursor: "pointer", background: "transparent", color: "var(--gold)" }}
              >
                Classic Grid
              </button>
            )}
          </div>
          <div className="sub" style={{ marginTop: "7px" }}>
            Track bodyweight trend, qualified working sets, and coach milestone approvals.
          </div>

          <div className="tabs" role="tablist" style={{ marginTop: "18px" }}>
            <button
              className={`tab ${tab === "overview" ? "active" : ""}`}
              onClick={() => setTab("overview")}
              role="tab"
              aria-selected={tab === "overview"}
            >
              Overview
            </button>
            <button
              className={`tab ${tab === "achievements" ? "active" : ""}`}
              onClick={() => setTab("achievements")}
              role="tab"
              aria-selected={tab === "achievements"}
            >
              Achievements
            </button>
          </div>
        </header>

        {/* TAB 1: OVERVIEW SCREEN */}
        {tab === "overview" && (
          <div className="screen">
            {/* Bodyweight Trend Card */}
            <section className="card">
              <div className="row">
                <div>
                  <div className="label">MEASURED BODYWEIGHT</div>
                  <div className="value">
                    {currentWeight.toFixed(1)} <span style={{ fontSize: "16px", color: "var(--muted)", fontWeight: 500 }}>kg</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="label">7-DAY AVERAGE</div>
                  <div className="chip" style={{ marginTop: "4px" }}>
                    <b>{sevenDayAvg}</b> kg
                  </div>
                </div>
              </div>

              {/* Chart range controls */}
              <div className="chartActions">
                {[
                  { label: "4 weeks", count: 4 },
                  { label: "8 weeks", count: 8 },
                  { label: "12 weeks", count: 12 },
                  { label: "All time", count: weights.length },
                ].map((item) => (
                  <button
                    key={item.label}
                    className={`rangeBtn ${range === item.count ? "active" : ""}`}
                    onClick={() => setRange(item.count)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* SVG Weight Chart */}
              <div className="chartWrapper">
                <svg className="weightChart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d9bc80" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#d9bc80" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1={left} y1={top} x2={w - right} y2={top} stroke="#2c2822" strokeDasharray="3 3" />
                  <line x1={left} y1={h / 2} x2={w - right} y2={h / 2} stroke="#2c2822" strokeDasharray="3 3" />
                  <line x1={left} y1={h - bottom} x2={w - right} y2={h - bottom} stroke="#2c2822" strokeDasharray="3 3" />

                  {/* Shaded Area */}
                  {areaD && <path d={areaD} fill="url(#areaGradient)" />}

                  {/* Trend Line */}
                  {lineD && <path d={lineD} fill="none" stroke="#d9bc80" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}

                  {/* Data Points */}
                  {pts.map((p, idx) => (
                    <circle key={idx} cx={p[0]} cy={p[1]} r="3" fill="#1b1a17" stroke="#d9bc80" strokeWidth="1.8" />
                  ))}
                </svg>
              </div>

              <div className="row" style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                <span className="tiny">
                  Net change: <strong>{Number(changeFromStart) <= 0 ? changeFromStart : `+${changeFromStart}`} kg</strong> from starting baseline.
                </span>
                <button
                  className="btn"
                  onClick={() =>
                    setModalData({
                      title: "Log Bodyweight",
                      info: "Record your morning weighed measurement under consistent conditions.",
                      body: (
                        <div style={{ marginTop: "14px" }}>
                          <label className="label">Weight (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            className="textInput"
                            value={newWeightInput}
                            onChange={(e) => setNewWeightInput(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "12px",
                              background: "#24221e",
                              border: "1px solid #554938",
                              borderRadius: "10px",
                              color: "#fff",
                              fontSize: "18px",
                              fontWeight: 700,
                              marginTop: "6px",
                            }}
                          />
                        </div>
                      ),
                      actionLabel: "Save Measurement",
                      onAction: handleSaveWeight,
                    })
                  }
                >
                  + Log Weight
                </button>
              </div>
            </section>

            {/* Strength Progression Records */}
            <section className="card" style={{ marginTop: "14px" }}>
              <div className="row" style={{ marginBottom: "12px" }}>
                <div>
                  <div className="eyebrow" style={{ color: "#d2b477" }}>PERFORMANCE SIGNAL</div>
                  <h2 style={{ margin: "2px 0 0", fontSize: "17px" }}>Key Lift Progression</h2>
                </div>
                <Link
                  href="/client/workout-logger"
                  className="tiny"
                  style={{ color: "var(--gold)", textDecoration: "none" }}
                >
                  View all sessions →
                </Link>
              </div>

              <div className="recordsGrid">
                {STRENGTH_RECORDS.map((r, i) => (
                  <div key={i} className="record">
                    <div>
                      <div className="recordName">{r.name}</div>
                      <div className="recordSub">{r.detail} · {r.note}</div>
                    </div>
                    <div className="recordValue">
                      <span>{r.current}</span>
                      <small>Baseline: {r.prev}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Coaching Review Status */}
            <section className="card" style={{ marginTop: "14px" }}>
              <div className="row">
                <div>
                  <div className="eyebrow">COACHING CADENCE</div>
                  <h2 style={{ margin: "3px 0 0", fontSize: "16px" }}>Scheduled Reviews</h2>
                  <div className="sub" style={{ marginTop: "4px" }}>
                    Two personal reviews per billing month. Sahmi assesses full workout compliance and nutrition logs.
                  </div>
                </div>
                <span className="chip">Next: 16 Nov</span>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: ACHIEVEMENTS SCREEN */}
        {tab === "achievements" && (
          <div className="screen">
            {/* Category Filter Track */}
            <div className="categoryTrack">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={chosenCategory === cat ? "active" : ""}
                  onClick={() => setChosenCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Status Filter Row */}
            <div className="row" style={{ margin: "16px 0 12px" }}>
              <span className="tiny">{filteredAchievements.length} milestone badges</span>
              <div className="hstack">
                {(["all", "progress", "earned"] as const).map((st) => (
                  <button
                    key={st}
                    className={`rangeBtn ${chosenStatus === st ? "active" : ""}`}
                    onClick={() => setChosenStatus(st)}
                  >
                    {st === "all" ? "All" : st === "progress" ? "In Progress" : "Earned"}
                  </button>
                ))}
              </div>
            </div>

            {/* Achievement Cards Grid */}
            <div className="achievementsGrid">
              {filteredAchievements.map((item) => (
                <div
                  key={item.id}
                  className="achievementCard"
                  onClick={() =>
                    setModalData({
                      title: item.title,
                      info: `${item.category} · ${item.subtitle}`,
                      body: (
                        <div style={{ marginTop: "12px", lineHeight: "1.6", color: "var(--sub)" }}>
                          <p>{item.detail}</p>
                          {item.state === "earned" ? (
                            <div className="chip" style={{ background: "#283827", borderColor: "#557752", color: "#b8dcb3", marginTop: "12px" }}>
                              ✓ Unlocked ({item.date})
                            </div>
                          ) : (
                            <div style={{ marginTop: "12px" }}>
                              <div className="label">Current progress: {item.progress}%</div>
                              <div className="progressTrack" style={{ marginTop: "6px" }}>
                                <span style={{ width: `${item.progress}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      ),
                    })
                  }
                >
                  <div className="badgeCircle">
                    {item.state === "earned" ? "✓" : `${Math.round(item.progress)}%`}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="categoryPill">{item.category}</div>
                    <div className="achievementTitle">{item.title}</div>
                    <div className="achievementSub">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Modal */}
      {modalData && (
        <div className="modalShade" onClick={() => setModalData(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="eyebrow" style={{ letterSpacing: "1.2px", color: "var(--gold)" }}>
              PROGRESS / COACHING
            </div>
            <h2 style={{ margin: "7px 0 3px", fontSize: "20px" }}>{modalData.title}</h2>
            <div className="tiny" style={{ color: "var(--muted)" }}>{modalData.info}</div>
            {modalData.body}

            <div style={{ marginTop: "20px", display: "flex", gap: "9px" }}>
              {modalData.actionLabel && modalData.onAction && (
                <button
                  className="btn primary"
                  onClick={modalData.onAction}
                  style={{ flex: 1 }}
                >
                  {modalData.actionLabel}
                </button>
              )}
              <button
                className="btn"
                onClick={() => setModalData(null)}
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
}
