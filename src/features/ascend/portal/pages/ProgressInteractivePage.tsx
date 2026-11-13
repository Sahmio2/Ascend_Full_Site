"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ModernClientBottomNav from "../components/ModernClientBottomNav";
import { useClientPortalData } from "../data/useClientPortalData";
import "@/styles/ascend-progress-interactive.css";
import type { PortalScope } from "../data/types";
import type { ProgressResponse } from "@/contracts/progress";

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
    detail: "Recorded qualifying singles are needed for the combined-lift total. Verified during scheduled coach check-ins.",
  },
  {
    id: "forge",
    category: "Forge",
    title: "Pillar I",
    subtitle: "Flat barbell bench press · 40 kg",
    state: "progress",
    progress: 87.5,
    detail: "Logged comparable working set at 35 kg. Earned after a qualifying completed repetition set at 40 kg, including the barbell.",
  },
  {
    id: "rise",
    category: "Rise",
    title: "First Ascent",
    subtitle: "1 strict unassisted pull-up",
    state: "progress",
    progress: 0,
    detail: "Strict, unassisted pull-up from full dead hang to chin clearly over bar. Machine-assisted variations remain logged separately.",
  },
  {
    id: "balance",
    category: "Balance",
    title: "Equal Force I",
    subtitle: "Bench press · 0.75 × bodyweight",
    state: "progress",
    progress: 0,
    detail: "Requires a qualifying barbell bench press working set aligned with a current verified bodyweight measurement.",
  },
  {
    id: "beyond",
    category: "Beyond",
    title: "New Heights",
    subtitle: "Leg Press · new highest comparable load",
    state: "earned",
    date: "8 Nov",
    progress: 100,
    detail: "A new recorded load for the 45° incline leg press, confirmed by consecutive working-set logging.",
  },
  {
    id: "practice",
    category: "The Practice",
    title: "The Beginning",
    subtitle: "First prescribed workout completed",
    state: "earned",
    date: "21 Oct",
    progress: 100,
    detail: "Your initial coach-prescribed foundation session was completed and logged. Earned milestones never expire or reset.",
  },
  {
    id: "roots",
    category: "The Practice",
    title: "Roots I",
    subtitle: "10 prescribed workouts · 7 recorded",
    state: "progress",
    progress: 70,
    detail: "7 of 10 prescribed workouts logged. Missed days never wipe prior completed sessions.",
  },
  {
    id: "mastery",
    category: "Mastery",
    title: "Form Established",
    subtitle: "Technique confirmed by Sahmi",
    state: "progress",
    progress: 0,
    detail: "Coach review required. Form check video confirms strict eccentric control, setup stability, and full joint range.",
  },
  {
    id: "path",
    category: "The Path",
    title: "Tame the Flesh",
    subtitle: "Phase I completion · coach confirmed",
    state: "progress",
    progress: 0,
    detail: "Phase completion requires Sahmi’s review of training consistency, lifting technique, recovery cadence, and diet compliance.",
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
  const basePath = scope === "demo" ? "/demo" : "/client";
  const portalData = useClientPortalData(scope);

  const [tab, setTab] = useState<"overview" | "achievements">("overview");
  const [weights, setWeights] = useState<number[]>(INITIAL_WEIGHTS);
  const [range, setRange] = useState<number>(8); // 4, 8, 12
  const [chosenCategory, setChosenCategory] = useState("All");
  const [chosenStatus, setChosenStatus] = useState<"all" | "progress" | "earned">("all");

  // Body measurements state
  const [waistVal, setWaistVal] = useState("84");
  const [waistDate, setWaistDate] = useState("Last recorded 6 Nov");

  // Modal State
  type ModalType =
    | { kind: "weight" }
    | { kind: "measurement" }
    | { kind: "photo" }
    | { kind: "achievement"; item: Achievement }
    | null;

  const [modal, setModal] = useState<ModalType>(null);
  const [newWeightInput, setNewWeightInput] = useState("78.4");
  const [newWeightDate, setNewWeightDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [measurementLocation, setMeasurementLocation] = useState("Waist");
  const [measurementValue, setMeasurementValue] = useState("84");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
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
          if (json.records && json.records.length > 0) {
            const sorted = [...json.records].sort(
              (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
            );
            setWeights(sorted.map((r) => Number(r.value)));
            const latest = sorted[sorted.length - 1];
            if (latest) {
              setNewWeightInput(String(latest.value));
            }
          }
        }
      } catch (e) {
        console.error("Live progress sync failed:", e);
      }
    };
    load();
  }, [scope]);

  // Current weight calculations
  const slice = weights.slice(-range);
  const currentWeight = weights[weights.length - 1] || 78.4;
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
  const lineD = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const areaD = lineD ? `${lineD} L${getX(slice.length - 1)} ${h - bottom} L${getX(0)} ${h - bottom} Z` : "";
  const gridYs = [0, 1, 2].map((j) => {
    const v = maxW - ((maxW - minW) * j) / 2;
    return getY(v);
  });
  const lastPt = pts[pts.length - 1] || [0, 0];

  // Handlers
  const handleSaveWeight = async () => {
    const val = parseFloat(newWeightInput);
    if (!val || val < 30 || val > 300) {
      showToast("Please enter a valid weight in kg");
      return;
    }
    setWeights([...weights, val]);
    setModal(null);
    showToast(`Recorded weight: ${val.toFixed(1)} kg`);

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
            measuredAt: new Date(newWeightDate).toISOString(),
          }),
        });
      } catch (err) {
        console.error("Failed to save progress to server", err);
      }
    }
  };

  const handleSaveMeasurement = () => {
    const val = parseFloat(measurementValue);
    if (!val || val < 20 || val > 200) {
      showToast("Please enter a valid measurement in cm");
      return;
    }
    if (measurementLocation.toLowerCase().includes("waist")) {
      setWaistVal(val.toFixed(0));
      setWaistDate("Recorded today");
    }
    setModal(null);
    showToast(`Recorded ${measurementLocation}: ${val} cm`);
  };

  const filteredAchievements = INITIAL_ACHIEVEMENTS.filter((a) => {
    const catMatch = chosenCategory === "All" || a.category === chosenCategory;
    const statusMatch = chosenStatus === "all" || a.state === chosenStatus;
    return catMatch && statusMatch;
  });

  const workoutsCompletedThisWeek = portalData.workouts.length % (portalData.programme.days.length || 3);
  const workoutsTotalWeek = portalData.programme.days.length || 3;

  return (
    <div className="progress-interactive-root">
      <main className="site">
        <div className="wrap">
          {/* Masthead */}
          <section className="mast">
            <div className="eyebrow">YOUR JOURNEY / YOUR EVIDENCE</div>
            <h1>Progress</h1>
            <p>
              See what&apos;s changing over time. Your records stay private, and your coach uses them to guide your next review.
            </p>
          </section>

          {/* Primary View Tabs */}
          <div className="tabrow" role="tablist" aria-label="Progress sections">
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

          {/* TAB 1: OVERVIEW SCREEN */}
          {tab === "overview" && (
            <section id="overviewScreen" className="viewSection" role="tabpanel">
              <div className="gridMain">
                {/* Left Column: Weight Trend, Strength Progression & Coach Context */}
                <div className="column">
                  {/* Bodyweight Trend Card */}
                  <div className="panel" id="weightPanel">
                    <div className="trendTop">
                      <div>
                        <div className="miniTop">BODYWEIGHT TREND</div>
                        <div className="bigValue" id="currentWeight">
                          {currentWeight.toFixed(1)} <small>kg</small>
                        </div>
                        <div className="statTag" id="trendText">
                          Movement over time, not one weigh-in
                        </div>
                      </div>
                      <div className="ranges" role="group" aria-label="Weight chart period">
                        <button
                          className={range === 4 ? "active" : ""}
                          onClick={() => setRange(4)}
                          aria-pressed={range === 4}
                        >
                          4W
                        </button>
                        <button
                          className={range === 8 ? "active" : ""}
                          onClick={() => setRange(8)}
                          aria-pressed={range === 8}
                        >
                          8W
                        </button>
                        <button
                          className={range === 12 ? "active" : ""}
                          onClick={() => setRange(12)}
                          aria-pressed={range === 12}
                        >
                          12W
                        </button>
                      </div>
                    </div>

                    <div className="chartBox">
                      <svg
                        id="weightChart"
                        viewBox={`0 0 ${w} ${h}`}
                        role="img"
                        aria-label={`Bodyweight trend, ${slice.length} readings`}
                      >
                        <defs>
                          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#bfa36f" stopOpacity="0.26" />
                            <stop offset="100%" stopColor="#bfa36f" stopOpacity="0.01" />
                          </linearGradient>
                        </defs>
                        {gridYs.map((gy, idx) => (
                          <line
                            key={idx}
                            x1={left}
                            y1={gy}
                            x2={w - right}
                            y2={gy}
                            stroke="#39352f"
                            strokeWidth="1"
                            strokeDasharray="3 6"
                          />
                        ))}
                        {areaD && <path d={areaD} fill="url(#areaFill)" />}
                        {lineD && (
                          <path
                            d={lineD}
                            fill="none"
                            stroke="#d7bf8f"
                            strokeWidth="2.6"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                        )}
                        <circle
                          cx={lastPt[0]}
                          cy={lastPt[1]}
                          r="5.1"
                          fill="#e9c781"
                          stroke="#191817"
                          strokeWidth="2"
                        />
                        <text x={left} y={h - 3} className="axis-label">
                          {range} weeks ago
                        </text>
                        <text x={w - right} y={h - 3} textAnchor="end" className="axis-label">
                          Latest
                        </text>
                      </svg>
                    </div>

                    <div className="chartFoot">
                      <div>
                        Based on recorded weigh-ins
                        <br />
                        <span className="muted">
                          Net change: {Number(changeFromStart) <= 0 ? changeFromStart : `+${changeFromStart}`} kg from baseline
                        </span>
                      </div>
                      <button className="secondary" onClick={() => setModal({ kind: "weight" })}>
                        + Record weight
                      </button>
                    </div>
                  </div>

                  {/* Strength Progression List Card */}
                  <div className="listCard">
                    <div className="headR">
                      <h2>Strength progression</h2>
                      <span className="smallBadge">Working sets only</span>
                    </div>
                    <p className="sub" style={{ margin: "0 0 5px" }}>
                      Your last recorded comparable working sets, not predicted lifts.
                    </p>
                    <div id="strengthRows">
                      {STRENGTH_RECORDS.map((r, i) => (
                        <div key={i} className="record">
                          <div>
                            <div className="recordName">{r.name}</div>
                            <div className="recordSub">{r.detail}</div>
                          </div>
                          <div className="recordValue">
                            {r.current}
                            <small>{r.note}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`${basePath}/workout-logger`}
                      className="ghost"
                      style={{ marginTop: "12px", display: "inline-block", textDecoration: "none" }}
                    >
                      View exercise history ↗
                    </Link>
                  </div>

                  {/* Coach Review Context Card */}
                  <div className="quietCard">
                    <div className="headR">
                      <h2>What this tells us</h2>
                      <span className="coachMark">✦ COACH REVIEW</span>
                    </div>
                    <p>
                      This is a record of what happened—not an automatic change to your programme. Sahmi reviews the pattern during your scheduled check-in.
                    </p>
                    <div className="inlineNote">
                      Next coaching review · {portalData.client.nextCheckIn || "Scheduled check-in"} with {portalData.client.coachName}
                    </div>
                  </div>
                </div>

                {/* Right Column: Weekly Stats, Measurements, Photos & Milestones */}
                <div className="column">
                  {/* Stats Grid */}
                  <div className="stats">
                    <div className="stat">
                      <div className="miniTop">THIS WEEK</div>
                      <strong>{workoutsCompletedThisWeek} / {workoutsTotalWeek}</strong>
                      <small>Workouts completed</small>
                    </div>
                    <div className="stat">
                      <div className="miniTop">NUTRITION LOGS</div>
                      <strong>5 / 7</strong>
                      <small>Days with entries</small>
                    </div>
                  </div>

                  {/* Body Measurements Card */}
                  <div className="listCard">
                    <div className="headR">
                      <h2>Body measurements</h2>
                      <span className="smallBadge">Optional</span>
                    </div>
                    <div className="record">
                      <div>
                        <div className="recordName">Waist</div>
                        <div className="recordSub">{waistDate}</div>
                      </div>
                      <div className="recordValue" id="waistDisplay">
                        {waistVal} cm
                        <small>Self-recorded</small>
                      </div>
                    </div>
                    <div className="record">
                      <div>
                        <div className="recordName">Other measurements</div>
                        <div className="recordSub">Record only what you want to track</div>
                      </div>
                      <div className="recordValue">
                        <small>Not recorded</small>
                      </div>
                    </div>
                    <button
                      className="ghost"
                      style={{ marginTop: "12px" }}
                      onClick={() => setModal({ kind: "measurement" })}
                    >
                      + Record measurement
                    </button>
                  </div>

                  {/* Progress Photos Card */}
                  <div className="quietCard">
                    <div className="detailRow">
                      <div>
                        <h2 style={{ fontSize: "17px", margin: "0 0 4px" }}>Progress photos</h2>
                        <span className="private">♙ Private · Optional</span>
                      </div>
                      <div className="photoIcon">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        >
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <circle cx="9" cy="10" r="2" />
                          <path d="m4 18 6-6 4 3 2-2 5 5" />
                        </svg>
                      </div>
                    </div>
                    <p>
                      No photos added. You can use private progress photos if you choose. They aren&apos;t public or required to track progress.
                    </p>
                    <button
                      className="secondary"
                      style={{ marginTop: "12px" }}
                      onClick={() => setModal({ kind: "photo" })}
                    >
                      Photo privacy details
                    </button>
                  </div>

                  {/* Recent Recognition Card */}
                  <div className="listCard">
                    <div className="headR">
                      <h2>Recent recognition</h2>
                      <button className="ghost" onClick={() => setTab("achievements")}>
                        See all ↗
                      </button>
                    </div>
                    <div className="record">
                      <div>
                        <div className="recordName" style={{ color: "#edd6a5" }}>
                          The Beginning
                        </div>
                        <div className="recordSub">First prescribed workout completed</div>
                      </div>
                      <div className="recordValue">
                        ✓<small>Earned</small>
                      </div>
                    </div>
                    <div className="record">
                      <div>
                        <div className="recordName">Roots I</div>
                        <div className="recordSub">7 of 10 prescribed workouts</div>
                      </div>
                      <div className="recordValue">
                        7 / 10<small>In progress</small>
                      </div>
                    </div>
                    <div className="littleBar">
                      <i style={{ width: "70%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: ACHIEVEMENTS SCREEN */}
          {tab === "achievements" && (
            <section id="achievementsScreen" className="viewSection achieveWrap" role="tabpanel">
              <div className="achieveIntro">
                <div className="headR">
                  <div>
                    <h2>Achievements</h2>
                    <p className="sectionHint" style={{ margin: "4px 0 0" }}>
                      Earned through recorded work and, where required, confirmed by your coach. Nothing resets when you miss a session.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Filter Tabrow */}
              <div className="tabrow" role="tablist" aria-label="Achievement status">
                <button
                  className={`tab ${chosenStatus === "all" ? "active" : ""}`}
                  onClick={() => setChosenStatus("all")}
                >
                  All
                </button>
                <button
                  className={`tab ${chosenStatus === "earned" ? "active" : ""}`}
                  onClick={() => setChosenStatus("earned")}
                >
                  Earned
                </button>
                <button
                  className={`tab ${chosenStatus === "progress" ? "active" : ""}`}
                  onClick={() => setChosenStatus("progress")}
                >
                  In Progress
                </button>
              </div>

              {/* Category Pills Track */}
              <div className="eyebrow" style={{ margin: "17px 0 8px" }}>
                CATEGORIES
              </div>
              <div className="filterTrack" role="group" aria-label="Achievement category">
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

              {/* Achievements 2-Column Desktop Grid */}
              <div className="achievementList">
                {filteredAchievements.map((item) => (
                  <button
                    key={item.id}
                    className="achievement"
                    onClick={() => setModal({ kind: "achievement", item })}
                  >
                    <div className={`medal ${item.state === "progress" ? "pending" : ""}`}>
                      {item.state === "earned" ? "✓" : "✦"}
                    </div>
                    <div className="achieveTitle">{item.title}</div>
                    <div className="achieveExplain">{item.subtitle}</div>
                    <div className={`status ${item.state === "progress" ? "pending" : ""}`}>
                      {item.state === "earned" ? `Earned · ${item.date || "Completed"}` : `In progress · ${item.progress}%`}
                    </div>
                    {item.state === "progress" && (
                      <div className="tinyProgress">
                        <i style={{ width: `${item.progress}%` }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Bottom Fixed Navigation (Mobile Only) */}
          <ModernClientBottomNav scope={scope} active="progress" />
        </div>
      </main>

      {/* Interactive Modal System */}
      {modal && (
        <div className="modalShade" onClick={() => setModal(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {modal.kind === "weight" && (
              <>
                <h3>Record weight</h3>
                <p>Weigh in under consistent conditions (morning, before food). Fluctuations are normal.</p>
                <div className="formgrid">
                  <div className="field">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newWeightInput}
                      onChange={(e) => setNewWeightInput(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Date</label>
                    <input
                      type="date"
                      value={newWeightDate}
                      onChange={(e) => setNewWeightDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modalButtons">
                  <button className="secondary" onClick={() => setModal(null)}>
                    Cancel
                  </button>
                  <button className="primary" onClick={handleSaveWeight}>
                    Save weight
                  </button>
                </div>
              </>
            )}

            {modal.kind === "measurement" && (
              <>
                <h3>Body measurement</h3>
                <p>Track only what you find useful. Consistency in measuring location matters most.</p>
                <div className="formgrid">
                  <div className="field">
                    <label>Location</label>
                    <input
                      type="text"
                      value={measurementLocation}
                      onChange={(e) => setMeasurementLocation(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Value (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={measurementValue}
                      onChange={(e) => setMeasurementValue(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modalButtons">
                  <button className="secondary" onClick={() => setModal(null)}>
                    Cancel
                  </button>
                  <button className="primary" onClick={handleSaveMeasurement}>
                    Save measurement
                  </button>
                </div>
              </>
            )}

            {modal.kind === "photo" && (
              <>
                <h3>Photo privacy</h3>
                <p style={{ margin: "12px 0", lineHeight: "1.6" }}>
                  Progress photos are completely optional and remain strictly private between you and Sahmi. They are never shared publicly or used in promotional materials without explicit written consent.
                </p>
                <div className="modalButtons">
                  <button className="primary" onClick={() => setModal(null)}>
                    Understood
                  </button>
                </div>
              </>
            )}

            {modal.kind === "achievement" && (
              <>
                <div className="eyebrow">{modal.item.category}</div>
                <h3>{modal.item.title}</h3>
                <p style={{ margin: "8px 0 14px", fontWeight: 500, color: "#ede6da" }}>
                  {modal.item.subtitle}
                </p>
                <p style={{ lineHeight: "1.6", color: "var(--muted)" }}>{modal.item.detail}</p>
                {modal.item.state === "earned" ? (
                  <div className="inlineNote">✓ Earned on {modal.item.date || "recent workout"}</div>
                ) : (
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ fontSize: "11px", color: "var(--soft)", marginBottom: "6px" }}>
                      Progress: {modal.item.progress}%
                    </div>
                    <div className="littleBar">
                      <i style={{ width: `${modal.item.progress}%` }} />
                    </div>
                  </div>
                )}
                <div className="modalButtons" style={{ marginTop: "20px" }}>
                  <button className="secondary" onClick={() => setModal(null)}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Interactive Toast Notification */}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
}
