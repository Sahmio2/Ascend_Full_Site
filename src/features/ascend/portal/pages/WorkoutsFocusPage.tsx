"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ModernClientBottomNav from "../components/ModernClientBottomNav";
import "@/styles/ascend-workouts-focus.css";
import type { PortalScope } from "../data/types";

// SVG Icon paths
const SVGS: Record<string, string> = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="m4 13 5 5 11-12"/>',
  timer: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  swap: '<path d="M4 7h15m-5-4 5 4-5 4M20 17H5m5-4-5 4 5 4"/>',
  expand: '<path d="M8 3H3v5M16 21h5v-5M3 3l7 7m11 11-7-7M16 3h5v5M8 21H3v-5m18-13-7 7M3 21l7-7"/>',
  edit: '<path d="M4 20h4L20 8l-4-4L4 16v4Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-7l-3 3V3M3 8h5M12 7v5l4 2"/>',
  dumbbell: '<path d="M5 10v4m14-4v4M7 8v8m10-8v8M9 12h6M3 9v6m18-6v6"/>',
  cloud: '<path d="M20 16a5 5 0 0 0-4-8 7 7 0 0 0-13 4 4 4 0 0 0 1 8h14"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  skip: '<path d="m5 5 10 7-10 7V5ZM19 5v14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  home: '<path d="m3 11 9-8 9 8v10h-6v-7H9v7H3V11Z"/>',
  chart: '<path d="M4 20V11h4v9M10 20V5h4v15M16 20v-8h4v8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-9h.01"/>',
  save: '<path d="M4 4h14l3 3v13H3V4h1Zm3 0v6h10V4M7 20v-8h10v8"/>',
};

function WorkoutGlyph({
  name,
  className = "",
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const path = SVGS[name] || SVGS.dumbbell;
  return (
    <svg
      className={`glyph ${className}`}
      style={style}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

// Exercise models
interface ExerciseSwap {
  id: string;
  name: string;
  note: string;
}

interface ExerciseDef {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: number;
  previous: { date: string; rows: [string, string][] };
  swaps: ExerciseSwap[];
}

const EXERCISES_A: ExerciseDef[] = [
  {
    id: "leg",
    name: "Leg Press",
    sets: 3,
    reps: "8–12",
    rest: 120,
    previous: { date: "5 Nov", rows: [["60", "10"], ["60", "10"], ["60", "8"]] },
    swaps: [
      { id: "goblet", name: "Goblet Squat", note: "Approved equivalent when leg press is unavailable" },
      { id: "split", name: "Supported Split Squat", note: "Coach-approved alternative" },
    ],
  },
  {
    id: "rdl",
    name: "Dumbbell Romanian Deadlift",
    sets: 2,
    reps: "8–12",
    rest: 150,
    previous: { date: "3 Nov", rows: [["20", "10"], ["20", "10"]] },
    swaps: [{ id: "extension", name: "Back Extension", note: "Coach-approved alternative" }],
  },
  {
    id: "bench",
    name: "Dumbbell Bench Press",
    sets: 2,
    reps: "8–12",
    rest: 120,
    previous: { date: "4 Nov", rows: [["15", "10"], ["15", "9"]] },
    swaps: [{ id: "machinepress", name: "Machine Chest Press", note: "Coach-approved alternative" }],
  },
  {
    id: "row",
    name: "Seated Cable Row",
    sets: 2,
    reps: "8–12",
    rest: 120,
    previous: { date: "3 Nov", rows: [["32", "11"], ["32", "10"]] },
    swaps: [{ id: "chestrow", name: "Chest-Supported Dumbbell Row", note: "Coach-approved alternative" }],
  },
  {
    id: "lat",
    name: "Lat Pulldown",
    sets: 2,
    reps: "8–12",
    rest: 120,
    previous: { date: "4 Nov", rows: [["35", "10"], ["35", "9"]] },
    swaps: [{ id: "assisted", name: "Assisted Pull-Up", note: "Coach-approved alternative" }],
  },
];

const WORKOUT_PLANS: Record<"a" | "b" | "c", { name: string; exercises: ExerciseDef[] }> = {
  a: { name: "Full Body A", exercises: EXERCISES_A },
  b: {
    name: "Full Body B",
    exercises: [
      { ...EXERCISES_A[2], id: "bbench" },
      { ...EXERCISES_A[0], id: "bleg" },
      { ...EXERCISES_A[3], id: "brow" },
      { ...EXERCISES_A[1], id: "brdl" },
    ],
  },
  c: {
    name: "Full Body C",
    exercises: [
      { ...EXERCISES_A[0], id: "cleg" },
      { ...EXERCISES_A[4], id: "clat" },
      { ...EXERCISES_A[2], id: "cbench" },
      { ...EXERCISES_A[1], id: "crdl" },
    ],
  },
};

interface SetRow {
  load: string;
  reps: string;
  done: boolean;
}

export interface WorkoutsFocusPageProps {
  scope?: PortalScope;
  onSwitchToClassic?: () => void;
}

export default function WorkoutsFocusPage({ scope = "live", onSwitchToClassic }: WorkoutsFocusPageProps) {
  // Navigation & Page State
  const [page, setPage] = useState<"workouts" | "preview" | "logger" | "summary" | "share">("workouts");
  const [selectedWorkoutKey, setSelectedWorkoutKey] = useState<"a" | "b" | "c">("a");
  const [mode, setMode] = useState<"focus" | "session">("focus");
  const [currentExIndex, setCurrentExIndex] = useState(0);

  // Sets state: Record<exerciseId, SetRow[]>
  const [setRows, setSetRows] = useState<Record<string, SetRow[]>>({});
  const [swappedExercises, setSwappedExercises] = useState<Record<string, ExerciseSwap>>({});
  const [warmOpen, setWarmOpen] = useState(false);
  const [swapSheetExId, setSwapSheetExId] = useState<string | null>(null);
  const [mediaEx, setMediaEx] = useState<ExerciseDef | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Rest Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [timerTotal, setTimerTotal] = useState(120);
  const [timerPaused, setTimerPaused] = useState(false);

  // Completed workouts registry
  const [completedWorkouts, setCompletedWorkouts] = useState<Record<string, { duration: number; partial: boolean }>>({
    a: { duration: 52, partial: false },
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const currentWorkout = WORKOUT_PLANS[selectedWorkoutKey];
  const exercises = currentWorkout.exercises;
  const currentEx = exercises[currentExIndex] || exercises[0];

  // Initialize rows for exercises if not present
  useEffect(() => {
    const next: Record<string, SetRow[]> = { ...setRows };
    let changed = false;
    exercises.forEach((ex) => {
      if (!next[ex.id]) {
        next[ex.id] = Array.from({ length: ex.sets }, (_, i) => ({
          load: ex.previous.rows[i]?.[0] || "60",
          reps: ex.previous.rows[i]?.[1] || "10",
          done: false,
        }));
        changed = true;
      }
    });
    if (changed) setSetRows(next);
  }, [selectedWorkoutKey, exercises]);

  // Timer interval countdown
  useEffect(() => {
    if (!timerActive || timerPaused) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          showToast("Rest interval complete · Begin next set");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerPaused]);

  // Statistics
  const getStats = () => {
    let done = 0;
    let total = 0;
    let volume = 0;
    exercises.forEach((ex) => {
      const rows = setRows[ex.id] || [];
      total += ex.sets;
      rows.forEach((r) => {
        if (r.done) {
          done++;
          const l = parseFloat(r.load) || 0;
          const rep = parseFloat(r.reps) || 0;
          volume += l * rep;
        }
      });
    });
    return { done, total, volume: Math.round(volume) };
  };

  const stats = getStats();

  const handleCompleteSet = (exId: string, setIndex: number) => {
    const currentList = setRows[exId] ? [...setRows[exId]] : [];
    const isNowDone = !currentList[setIndex]?.done;
    currentList[setIndex] = { ...currentList[setIndex], done: isNowDone };
    setSetRows({ ...setRows, [exId]: currentList });

    if (isNowDone) {
      showToast(`Set ${setIndex + 1} recorded: ${currentList[setIndex].load} kg × ${currentList[setIndex].reps} reps`);
      // Start rest timer
      setTimerTotal(currentEx.rest);
      setTimerSeconds(currentEx.rest);
      setTimerActive(true);
      setTimerPaused(false);
    }
  };

  const startWorkout = (selectedMode: "focus" | "session") => {
    setMode(selectedMode);
    setCurrentExIndex(0);
    setPage("logger");
  };

  const finishWorkout = () => {
    setTimerActive(false);
    setCompletedWorkouts({
      ...completedWorkouts,
      [selectedWorkoutKey]: { duration: 48, partial: stats.done < stats.total },
    });
    setPage("summary");
  };

  // Figure Illustration SVG
  const renderFigureSvg = (ex: ExerciseDef) => {
    const isLeg = ex.id.toLowerCase().includes("leg");
    const human = (
      <>
        <circle cx="156" cy="47" r="12" fill="#66786a" />
        <path d="M155 60 137 93l-33-4" stroke="#657569" strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M139 93 169 112l29-3" stroke="#657569" strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M103 86 85 80" stroke="#657569" strokeWidth="10" fill="none" strokeLinecap="round" />
      </>
    );
    const scene = isLeg ? (
      <>
        <rect x="37" y="124" width="246" height="8" rx="4" fill="#adb6ad" />
        <path d="M58 35v103M75 63v75M211 28v110" stroke="#b9c3b9" strokeWidth="9" strokeLinecap="round" />
        <path d="M211 32h24v93" stroke="#9ca69d" strokeWidth="7" fill="none" strokeLinecap="round" />
        <g className="motion-weight">
          <rect x="229" y="58" width="35" height="70" rx="8" fill="#bdaa78" />
          <path d="m239 45 18 0m-9-10 9 10-9 10" stroke="#b4975b" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
        {human}
      </>
    ) : (
      <>
        <rect x="39" y="125" width="244" height="8" rx="4" fill="#b3b9b1" />
        <path d="M110 118V48m-11 27h44" stroke="#a5ada3" strokeWidth="7" strokeLinecap="round" />
        <g className="motion-hinge">
          {human}
          <path d="M74 87H195" stroke="#606a60" strokeWidth="7" strokeLinecap="round" />
        </g>
      </>
    );

    return (
      <svg className="illustration" viewBox="0 0 320 165" role="img" aria-label="Exercise technique animation">
        <title>Exercise technique illustration</title>
        {scene}
      </svg>
    );
  };

  return (
    <div className="workouts-focus-root">
      <div className="frame">
        {/* VIEW 1: WORKOUTS PLAN OVERVIEW */}
        {page === "workouts" && (
          <div className="view">
            <div className="topbar">
              <div className="brand">ASCEND</div>
              <div className="topright">
                {onSwitchToClassic && (
                  <button
                    onClick={onSwitchToClassic}
                    className="pill neutral"
                    style={{ cursor: "pointer" }}
                  >
                    Classic Grid
                  </button>
                )}
                <span className="pill">WEEK 02 OF 08</span>
              </div>
            </div>

            <div className="eyebrow">FOUNDATION PHASE</div>
            <h1 className="t1">Your training week</h1>
            <p className="small" style={{ margin: "7px 0 17px" }}>
              Your coach-prescribed sessions, ready when you are.
            </p>

            <div className="card padded" style={{ marginBottom: "17px" }}>
              <div className="row spread">
                <span className="strong">This week</span>
                <span className="small">1 of 3 completed</span>
              </div>
              <div className="progress-track">
                <div style={{ width: "33%" }} />
              </div>
            </div>

            {/* Workouts list */}
            {[
              { key: "a" as const, day: "MON", num: "01", name: "Full Body A", time: "50m · Gym" },
              { key: "b" as const, day: "WED", num: "02", name: "Full Body B", time: "50m · Gym", isToday: true },
              { key: "c" as const, day: "FRI", num: "03", name: "Full Body C", time: "55m · Gym" },
            ].map((w) => {
              const isEnded = !!completedWorkouts[w.key];
              return (
                <button
                  key={w.key}
                  className={`workout-card ${w.isToday ? "is-today" : ""}`}
                  onClick={() => {
                    setSelectedWorkoutKey(w.key);
                    setPage("preview");
                  }}
                >
                  <div className="daybox">
                    <span>{w.day}</span>
                    <span>{w.num}</span>
                  </div>
                  <div className="grow">
                    <div className="workout-title">{w.name}</div>
                    <div className="workout-status">
                      {isEnded
                        ? "Completed · Performance saved"
                        : w.isToday
                        ? "Today’s session · Ready to start"
                        : "Scheduled"}
                    </div>
                  </div>
                  <WorkoutGlyph name={isEnded ? "check" : "chevron"} />
                </button>
              );
            })}

            {/* Bottom App Navigation */}
            <ModernClientBottomNav scope={scope} active="workouts" />
          </div>
        )}

        {/* VIEW 2: WORKOUT PREVIEW */}
        {page === "preview" && (
          <div className="view">
            <div className="topbar tight">
              <button
                className="icon-btn flat"
                onClick={() => setPage("workouts")}
                aria-label="Back to Workouts"
              >
                <WorkoutGlyph name="back" className="lg" />
              </button>
              <div className="eyebrow">WORKOUT PREVIEW</div>
              <button
                className="icon-btn flat"
                onClick={() => setPage("workouts")}
                aria-label="Settings"
              >
                <WorkoutGlyph name="settings" />
              </button>
            </div>

            <section className="hero">
              <div className="eyebrow" style={{ color: "#d2b477" }}>PRE-WORKOUT PREPARATION</div>
              <h1 className="t1" style={{ fontSize: "25px" }}>{currentWorkout.name}</h1>
              <div className="info-strip">
                <span><WorkoutGlyph name="timer" /> 50 min</span>
                <span><WorkoutGlyph name="dumbbell" /> {exercises.length} exercises</span>
                <span><WorkoutGlyph name="calendar" /> Foundation Phase</span>
              </div>
            </section>

            <div className="section-head">
              <h2 className="t2" style={{ fontSize: "16px" }}>Programmed Exercises</h2>
              <span className="small">{exercises.length} movements</span>
            </div>

            {exercises.map((ex, idx) => (
              <div key={ex.id} className="preview-ex">
                <div
                  className="thumb"
                  onClick={() => setMediaEx(ex)}
                  title="View exercise technique"
                >
                  <WorkoutGlyph name="dumbbell" />
                </div>
                <div className="middle">
                  <div className="strong" style={{ fontSize: "14px" }}>{ex.name}</div>
                  <div className="small" style={{ color: "var(--muted)", marginTop: "2px" }}>
                    {ex.sets} sets × {ex.reps} reps · Rest {ex.rest}s
                  </div>
                </div>
                <button
                  className="icon-btn flat"
                  onClick={() => setSwapSheetExId(ex.id)}
                  title="Approved exercise substitutions"
                >
                  <WorkoutGlyph name="swap" className="sm" />
                </button>
              </div>
            ))}

            <div style={{ marginTop: "22px", display: "grid", gap: "9px" }}>
              <button
                className="btn primary"
                style={{
                  background: "var(--gold)",
                  color: "#1a160f",
                  padding: "15px",
                  borderRadius: "14px",
                  fontWeight: 750,
                  fontSize: "15px",
                  border: "none",
                }}
                onClick={() => startWorkout("focus")}
              >
                Start Workout in Focus Mode →
              </button>
              <button
                className="btn"
                style={{
                  background: "#24221f",
                  color: "#e5d3b1",
                  border: "1px solid #4a4133",
                  padding: "13px",
                  borderRadius: "14px",
                  fontWeight: 650,
                  fontSize: "13px",
                }}
                onClick={() => startWorkout("session")}
              >
                Start in Session Mode
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: LIVE WORKOUT LOGGER (FOCUS & SESSION MODES) */}
        {page === "logger" && (
          <div className="view">
            <div className="topbar tight">
              <button
                className="icon-btn flat"
                onClick={() => setPage("preview")}
                aria-label="Back to preview"
              >
                <WorkoutGlyph name="back" className="lg" />
              </button>
              <div className="eyebrow" style={{ fontSize: "10px" }}>YOUR LIVE WORKOUT</div>
              <button
                className="icon-btn flat"
                onClick={finishWorkout}
                title="Finish workout"
              >
                <WorkoutGlyph name="save" />
              </button>
            </div>

            {/* Status Line */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <div className="strong" style={{ fontSize: "15px" }}>{currentWorkout.name}</div>
                <div className="small" style={{ color: "var(--muted)" }}>
                  {stats.done} of {stats.total} working sets recorded
                </div>
              </div>
              <button
                onClick={() => setMode(mode === "focus" ? "session" : "focus")}
                className="pill"
                style={{ cursor: "pointer", background: mode === "focus" ? "#312a1e" : "#282827" }}
              >
                {mode === "focus" ? "FOCUS MODE" : "SESSION MODE"}
              </button>
            </div>

            {/* Active Rest Timer Bar */}
            {timerActive && (
              <div
                style={{
                  background: "#282319",
                  border: "1px solid #6b5535",
                  borderRadius: "14px",
                  padding: "10px 14px",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <WorkoutGlyph name="timer" style={{ color: "var(--gold)" }} />
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                      Rest Interval
                    </div>
                    <strong style={{ fontSize: "19px", color: "#f2d392", fontVariantNumeric: "tabular-nums" }}>
                      {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, "0")}
                    </strong>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => setTimerPaused(!timerPaused)}
                    style={{ background: "#393226", border: "1px solid #57462f", color: "#f1dcba", borderRadius: "8px", padding: "6px 9px", fontSize: "11px" }}
                  >
                    {timerPaused ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={() => setTimerSeconds((prev) => prev + 30)}
                    style={{ background: "#393226", border: "1px solid #57462f", color: "#f1dcba", borderRadius: "8px", padding: "6px 9px", fontSize: "11px" }}
                  >
                    +30s
                  </button>
                  <button
                    onClick={() => setTimerActive(false)}
                    style={{ background: "#393226", border: "1px solid #57462f", color: "#f1dcba", borderRadius: "8px", padding: "6px 9px", fontSize: "11px" }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* FOCUS MODE */}
            {mode === "focus" && (
              <div className="stack">
                <div className="card padded" style={{ background: "#1b1a18" }}>
                  <div className="row spread">
                    <div>
                      <div className="eyebrow">EXERCISE {currentExIndex + 1} OF {exercises.length}</div>
                      <h2 className="t1" style={{ fontSize: "21px", margin: "4px 0" }}>
                        {swappedExercises[currentEx.id]?.name || currentEx.name}
                      </h2>
                      <div className="small" style={{ color: "var(--muted)" }}>
                        Target: {currentEx.sets} sets × {currentEx.reps} reps · Rest {currentEx.rest}s
                      </div>
                    </div>
                    <button
                      className="icon-btn flat"
                      onClick={() => setSwapSheetExId(currentEx.id)}
                      title="Swap exercise"
                    >
                      <WorkoutGlyph name="swap" />
                    </button>
                  </div>

                  {/* Figure Preview */}
                  <div
                    style={{
                      height: "140px",
                      background: "#161715",
                      borderRadius: "14px",
                      margin: "14px 0",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      border: "1px solid #2f342f",
                    }}
                    onClick={() => setMediaEx(currentEx)}
                    title="Tap to enlarge form animation"
                  >
                    {renderFigureSvg(currentEx)}
                  </div>

                  {/* Warm-Up Calculator Trigger */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0" }}>
                    <button
                      onClick={() => setWarmOpen(!warmOpen)}
                      style={{ background: "none", border: "none", color: "var(--gold)", fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0 }}
                    >
                      {warmOpen ? "Hide Warm-Up Sets ▲" : "View Warm-Up Sets ▼"}
                    </button>
                    <span className="small" style={{ color: "var(--muted)" }}>
                      Last: {currentEx.previous.rows[0]?.[0]} kg × {currentEx.previous.rows[0]?.[1]}
                    </span>
                  </div>

                  {warmOpen && (
                    <div style={{ background: "#25231f", padding: "10px", borderRadius: "10px", margin: "8px 0", fontSize: "12px", border: "1px solid #4a3f2f" }}>
                      <div style={{ color: "#d9bc80", fontWeight: 700, marginBottom: "4px" }}>Recommended Warm-Up</div>
                      <div>Set 1: 50% working weight × 8 reps (warm-up)</div>
                      <div>Set 2: 70% working weight × 4 reps (prep)</div>
                      <div>Set 3: 85% working weight × 2 reps (readiness)</div>
                    </div>
                  )}

                  {/* Active Working Sets List */}
                  <div style={{ marginTop: "14px" }}>
                    <div className="set-head">
                      <div>LOAD (KG)</div>
                      <div>REPS</div>
                      <div style={{ textAlign: "right" }}>DONE</div>
                    </div>

                    {(setRows[currentEx.id] || []).map((row, sIdx) => (
                      <div key={sIdx} className="set-row">
                        <input
                          type="number"
                          className="number"
                          aria-label={`Set ${sIdx + 1} Load`}
                          value={row.load}
                          onChange={(e) => {
                            const list = [...(setRows[currentEx.id] || [])];
                            list[sIdx] = { ...list[sIdx], load: e.target.value };
                            setSetRows({ ...setRows, [currentEx.id]: list });
                          }}
                        />
                        <input
                          type="number"
                          className="number"
                          aria-label={`Set ${sIdx + 1} Reps`}
                          value={row.reps}
                          onChange={(e) => {
                            const list = [...(setRows[currentEx.id] || [])];
                            list[sIdx] = { ...list[sIdx], reps: e.target.value };
                            setSetRows({ ...setRows, [currentEx.id]: list });
                          }}
                        />
                        <button
                          className={`set-check ${row.done ? "done" : ""}`}
                          onClick={() => handleCompleteSet(currentEx.id, sIdx)}
                          title="Complete set"
                        >
                          <WorkoutGlyph name={row.done ? "check" : "timer"} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Navigation to next exercise */}
                  <div style={{ marginTop: "16px", display: "flex", gap: "9px" }}>
                    <button
                      disabled={currentExIndex === 0}
                      className="btn"
                      style={{ flex: 1, padding: "11px", background: "#2a2723", color: "#d9cbba", border: "1px solid #484033", borderRadius: "10px" }}
                      onClick={() => setCurrentExIndex((prev) => Math.max(0, prev - 1))}
                    >
                      ← Previous
                    </button>
                    {currentExIndex < exercises.length - 1 ? (
                      <button
                        className="btn primary"
                        style={{ flex: 1, padding: "11px", background: "var(--gold)", color: "#191610", fontWeight: 700, border: "none", borderRadius: "10px" }}
                        onClick={() => setCurrentExIndex((prev) => prev + 1)}
                      >
                        Next Movement →
                      </button>
                    ) : (
                      <button
                        className="btn primary"
                        style={{ flex: 1, padding: "11px", background: "#4c7943", color: "#fff", fontWeight: 700, border: "none", borderRadius: "10px" }}
                        onClick={finishWorkout}
                      >
                        Finish Workout ✓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SESSION MODE */}
            {mode === "session" && (
              <div className="stack">
                {exercises.map((ex, exIdx) => {
                  const rows = setRows[ex.id] || [];
                  return (
                    <div key={ex.id} className="card padded" style={{ background: "#1c1b19" }}>
                      <div className="row spread">
                        <div>
                          <div className="eyebrow">MOVEMENT {exIdx + 1}</div>
                          <h3 style={{ margin: "3px 0", fontSize: "16px" }}>{ex.name}</h3>
                          <div className="small" style={{ color: "var(--muted)" }}>
                            Target: {ex.sets} sets × {ex.reps} reps
                          </div>
                        </div>
                        <button
                          className="icon-btn flat"
                          onClick={() => setSwapSheetExId(ex.id)}
                          title="Swap exercise"
                        >
                          <WorkoutGlyph name="swap" className="sm" />
                        </button>
                      </div>

                      <div style={{ marginTop: "10px" }}>
                        <div className="set-head">
                          <div>LOAD (KG)</div>
                          <div>REPS</div>
                          <div style={{ textAlign: "right" }}>DONE</div>
                        </div>
                        {rows.map((row, sIdx) => (
                          <div key={sIdx} className="set-row">
                            <input
                              type="number"
                              className="number"
                              value={row.load}
                              onChange={(e) => {
                                const list = [...rows];
                                list[sIdx] = { ...list[sIdx], load: e.target.value };
                                setSetRows({ ...setRows, [ex.id]: list });
                              }}
                            />
                            <input
                              type="number"
                              className="number"
                              value={row.reps}
                              onChange={(e) => {
                                const list = [...rows];
                                list[sIdx] = { ...list[sIdx], reps: e.target.value };
                                setSetRows({ ...setRows, [ex.id]: list });
                              }}
                            />
                            <button
                              className={`set-check ${row.done ? "done" : ""}`}
                              onClick={() => handleCompleteSet(ex.id, sIdx)}
                            >
                              <WorkoutGlyph name={row.done ? "check" : "timer"} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <button
                  className="btn primary"
                  style={{
                    background: "var(--gold)",
                    color: "#18150f",
                    padding: "15px",
                    borderRadius: "14px",
                    fontWeight: 750,
                    fontSize: "15px",
                    border: "none",
                    marginTop: "14px",
                  }}
                  onClick={finishWorkout}
                >
                  Complete & Save Session ✓
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: POST-WORKOUT SUMMARY */}
        {page === "summary" && (
          <div className="view">
            <div className="eyebrow" style={{ color: "var(--gold)" }}>PRIVATE WORKOUT SUMMARY</div>
            <h1 className="t1">Workout Completed</h1>
            <p className="small" style={{ color: "var(--muted)" }}>
              {currentWorkout.name} · Foundation Phase · Performance saved
            </p>

            <div className="statgrid">
              <div className="stat">
                <b>{stats.done}</b>
                <div className="small">Working sets recorded</div>
              </div>
              <div className="stat">
                <b>{stats.volume.toLocaleString()}</b>
                <div className="small">Volume load (kg)</div>
              </div>
            </div>

            <div className="card padded" style={{ margin: "14px 0" }}>
              <div className="eyebrow">COACH PERFORMANCE LOG</div>
              <div style={{ marginTop: "8px", fontSize: "13px", lineHeight: "1.6", color: "#ddd3c4" }}>
                Working sets are saved to your athlete performance ledger. Sahmi evaluates total load volume, intensity and technique adherence during your scheduled coaching review.
              </div>
            </div>

            <div style={{ display: "grid", gap: "9px", marginTop: "22px" }}>
              <button
                className="btn primary"
                style={{
                  background: "var(--gold)",
                  color: "#1b1710",
                  padding: "14px",
                  borderRadius: "12px",
                  fontWeight: 750,
                  border: "none",
                }}
                onClick={() => setPage("share")}
              >
                View Shareable Card →
              </button>
              <button
                className="btn"
                style={{
                  background: "#262420",
                  color: "#e5d4bb",
                  border: "1px solid #4a3e2e",
                  padding: "12px",
                  borderRadius: "12px",
                  fontWeight: 650,
                }}
                onClick={() => setPage("workouts")}
              >
                Return to Workouts Hub
              </button>
            </div>
          </div>
        )}

        {/* VIEW 5: SHAREABLE WORKOUT GRAPHIC */}
        {page === "share" && (
          <div className="view">
            <div className="topbar tight">
              <button
                className="icon-btn flat"
                onClick={() => setPage("summary")}
                aria-label="Back to summary"
              >
                <WorkoutGlyph name="back" className="lg" />
              </button>
              <div className="eyebrow">SHARE PERFORMANCE</div>
              <div style={{ width: "42px" }} />
            </div>

            <div className="share-art">
              <div className="eyebrow" style={{ letterSpacing: "4px", color: "var(--gold)" }}>ASCEND</div>
              <div className="t1" style={{ fontSize: "28px", color: "#fff", margin: "4px 0" }}>
                {currentWorkout.name}
              </div>
              <div className="large">{stats.volume.toLocaleString()}</div>
              <div className="small" style={{ letterSpacing: "1px", textTransform: "uppercase", color: "#d9bc80" }}>
                Total KG Volume Moved
              </div>
              <div className="small" style={{ color: "#beb29e", marginTop: "12px" }}>
                {stats.done} working sets · Foundation Phase
              </div>
            </div>

            <button
              className="btn"
              style={{
                width: "100%",
                background: "var(--gold)",
                color: "#17140e",
                padding: "14px",
                borderRadius: "12px",
                fontWeight: 750,
                border: "none",
                marginTop: "16px",
              }}
              onClick={() => {
                showToast("Card copied to clipboard (demo)");
              }}
            >
              Export / Share Graphic
            </button>
          </div>
        )}

        {/* SWAP SHEET MODAL */}
        {swapSheetExId && (() => {
          const targetEx = exercises.find((x) => x.id === swapSheetExId) || currentEx;
          return (
            <div className="sheet-backdrop" onClick={() => setSwapSheetExId(null)}>
              <div className="sheet" onClick={(e) => e.stopPropagation()}>
                <button
                  className="close"
                  onClick={() => setSwapSheetExId(null)}
                  aria-label="Close swaps"
                >
                  <WorkoutGlyph name="close" />
                </button>
                <div className="eyebrow">APPROVED MOVEMENT SWAPS</div>
                <h2>{targetEx.name}</h2>
                <p className="small" style={{ color: "var(--muted)", margin: "4px 0 14px" }}>
                  Select an approved alternative movement. Swaps preserve your coach’s prescribed stimulus.
                </p>

                {targetEx.swaps.map((sw) => (
                  <button
                    key={sw.id}
                    className="option"
                    onClick={() => {
                      setSwappedExercises({ ...swappedExercises, [targetEx.id]: sw });
                      setSwapSheetExId(null);
                      showToast(`Movement swapped to ${sw.name}`);
                    }}
                  >
                    <div>
                      <strong>{sw.name}</strong>
                      <small>{sw.note}</small>
                    </div>
                    <span className="choice">Select →</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* EXPANDED TECHNIQUE MEDIA MODAL */}
        {mediaEx && (
          <div className="mediamodal" onClick={() => setMediaEx(null)}>
            <button
              className="icon-btn dismiss"
              onClick={() => setMediaEx(null)}
              aria-label="Close media preview"
            >
              <WorkoutGlyph name="close" />
            </button>
            <div className="media" onClick={(e) => e.stopPropagation()}>
              {renderFigureSvg(mediaEx)}
              <div className="small" style={{ textAlign: "center", marginTop: "14px", color: "#ddd" }}>
                {mediaEx.name} · Proper setup and controlled cadence
              </div>
            </div>
          </div>
        )}

        {/* Floating Toast */}
        <div className={`toast ${toastMessage ? "show" : ""}`}>
          {toastMessage}
        </div>
      </div>
    </div>
  );
}
