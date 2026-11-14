"use client";

import { useEffect, useRef, useState } from "react";
import ModernClientBottomNav from "../components/ModernClientBottomNav";
import { useClientPortalData } from "../data/useClientPortalData";
import { clientPortalAdapter } from "../data/clientPortalAdapter";
import "@/styles/ascend-workouts-focus.css";
import type { PortalScope } from "../data/types";

// SVG Icon paths matching approved prototype
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

function Glyph({
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
export interface ExerciseSwap {
  id: string;
  name: string;
  note: string;
}

export interface ExerciseDef {
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
    swaps: [
      { id: "extension", name: "Back Extension", note: "Coach-approved alternative" },
    ],
  },
  {
    id: "bench",
    name: "Dumbbell Bench Press",
    sets: 2,
    reps: "8–12",
    rest: 120,
    previous: { date: "4 Nov", rows: [["15", "10"], ["15", "9"]] },
    swaps: [
      { id: "machinepress", name: "Machine Chest Press", note: "Coach-approved alternative" },
    ],
  },
  {
    id: "row",
    name: "Seated Cable Row",
    sets: 2,
    reps: "8–12",
    rest: 120,
    previous: { date: "3 Nov", rows: [["32", "11"], ["32", "10"]] },
    swaps: [
      { id: "chestrow", name: "Chest-Supported Dumbbell Row", note: "Coach-approved alternative" },
    ],
  },
  {
    id: "lat",
    name: "Lat Pulldown",
    sets: 2,
    reps: "8–12",
    rest: 120,
    previous: { date: "4 Nov", rows: [["35", "10"], ["35", "9"]] },
    swaps: [
      { id: "assisted", name: "Assisted Pull-Up", note: "Coach-approved alternative" },
    ],
  },
];

const EXERCISE_PLAN: Record<string, ExerciseDef[]> = {
  a: EXERCISES_A,
  b: [
    { ...EXERCISES_A[2], id: "bbench" },
    { ...EXERCISES_A[0], id: "bleg" },
    { ...EXERCISES_A[3], id: "brow" },
    { ...EXERCISES_A[1], id: "brdl" },
  ],
  c: [
    { ...EXERCISES_A[0], id: "cleg" },
    { ...EXERCISES_A[4], id: "clat" },
    { ...EXERCISES_A[2], id: "cbench" },
    { ...EXERCISES_A[1], id: "crdl" },
  ],
};

const WEEK_ROUTINES = [
  { id: "a", name: "Full Body A", day: "Monday", short: "MON", num: "16", status: "today" },
  { id: "b", name: "Full Body B", day: "Wednesday", short: "WED", num: "18", status: "upcoming" },
  { id: "c", name: "Full Body C", day: "Friday", short: "FRI", num: "20", status: "upcoming" },
];

export interface WorkoutsFocusPageProps {
  scope?: PortalScope;
  onSwitchToClassic?: () => void;
}

export default function WorkoutsFocusPage({ scope = "live" }: WorkoutsFocusPageProps) {
  const portalData = useClientPortalData(scope);

  // Core navigation view
  const [screen, setScreen] = useState<"workouts" | "preview" | "logger" | "share" | "summary">("workouts");
  const [workoutId, setWorkoutId] = useState<string>("a");
  const [viewMode, setViewMode] = useState<"focus" | "session">("focus");
  const [activeExIndex, setActiveExIndex] = useState<number>(0);

  // Tracking state
  const [started, setStarted] = useState<Record<string, boolean>>({});
  const [ended, setEnded] = useState<Record<string, { partial: boolean; recorded: number } | null>>({});
  const [rows, setRows] = useState<Record<string, Array<{ w: string; r: string; done: boolean }>>>({});
  const [warm, setWarm] = useState<Record<string, Array<{ w: string; r: string; done: boolean }>>>({});
  const [warmOpen, setWarmOpen] = useState<Record<string, boolean>>({});
  const [histOpen, setHistOpen] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [swaps, setSwaps] = useState<Record<string, ExerciseSwap>>({});

  // Rest timer
  const [rest, setRest] = useState<{
    status: "off" | "running" | "paused";
    remaining: number;
    ends: number;
    exerciseId: string | null;
  }>({ status: "off", remaining: 0, ends: 0, exerciseId: null });

  // Share path choice
  const [sharePath, setSharePath] = useState<"preview" | "private">("private");

  // Overlays
  const [mediaExId, setMediaExId] = useState<string | null>(null);
  const [sheetExId, setSheetExId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  // Rest timer recovery from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ascend_rest_timer");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.ends && parsed.ends > Date.now()) {
          const remaining = Math.max(0, Math.ceil((parsed.ends - Date.now()) / 1000));
          setRest({
            status: "running",
            remaining,
            ends: parsed.ends,
            exerciseId: parsed.exerciseId || null,
          });
        } else {
          localStorage.removeItem("ascend_rest_timer");
        }
      }
    } catch {}
  }, []);

  // Rest timer ticker
  useEffect(() => {
    if (rest.status !== "running") return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((rest.ends - Date.now()) / 1000));
      if (left <= 0) {
        setRest({ status: "off", remaining: 0, ends: 0, exerciseId: null });
        try {
          localStorage.removeItem("ascend_rest_timer");
        } catch {}
        showToast("Rest interval complete · Begin next set");
      }
    }, 500);
    return () => clearInterval(interval);
  }, [rest.status, rest.ends]);

  // Live session hydration from /api/client/workouts
  useEffect(() => {
    if (scope !== "live") return;
    async function loadLiveWorkouts() {
      try {
        const res = await fetch("/api/client/workouts");
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && data.activeSession) {
          const s = data.activeSession;
          setSessionId(s.id);
          setWorkoutId(s.workoutId);
          setStarted((prev) => ({ ...prev, [s.workoutId]: true }));
          setScreen("logger");

          const newRows: Record<string, Array<{ w: string; r: string; done: boolean }>> = {};
          const newWarm: Record<string, Array<{ w: string; r: string; done: boolean }>> = {};

          for (const set of s.setLogs || []) {
            const k = `${s.workoutId}-${set.exerciseId}`;
            const targetMap = set.isWarmup ? newWarm : newRows;
            if (!targetMap[k]) targetMap[k] = [];
            while (targetMap[k].length <= set.setIndex) {
              targetMap[k].push({ w: "", r: "", done: false });
            }
            targetMap[k][set.setIndex] = {
              w: set.weightKg || "",
              r: set.reps ? String(set.reps) : "",
              done: Boolean(set.completed),
            };
          }

          if (Object.keys(newRows).length > 0) setRows((prev) => ({ ...prev, ...newRows }));
          if (Object.keys(newWarm).length > 0) setWarm((prev) => ({ ...prev, ...newWarm }));
        }
      } catch {}
    }
    loadLiveWorkouts();
  }, [scope]);

  // Touch gesture tracking for horizontal swipe between Focus and Session modes
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal swipe threshold: distance >= 55px and predominantly horizontal
    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0 && viewMode === "focus") {
        setViewMode("session");
        showToast("Swiped to Session Mode");
      } else if (deltaX > 0 && viewMode === "session") {
        setViewMode("focus");
        showToast("Swiped to Focus Mode");
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Calculations
  const currentWeekObj = WEEK_ROUTINES.find((x) => x.id === workoutId) || WEEK_ROUTINES[0];
  const currentExercises = EXERCISE_PLAN[workoutId] || EXERCISES_A;
  const currentEx = currentExercises[Math.min(activeExIndex, currentExercises.length - 1)] || currentExercises[0];

  const exKey = (x: ExerciseDef) => `${workoutId}:${x.id}`;

  const ensureRowsForEx = (x: ExerciseDef) => {
    const k = exKey(x);
    if (!rows[k]) {
      // Historical loads are referenced, never prefilled into editable inputs
      const initial = Array.from({ length: x.sets }, () => ({
        w: "",
        r: "",
        done: false,
      }));
      setRows((prev) => ({ ...prev, [k]: initial }));
      return initial;
    }
    return rows[k];
  };

  const ensureWarmForEx = (x: ExerciseDef) => {
    const k = exKey(x);
    if (!warm[k]) {
      const initial = [{ w: "", r: "", done: false }];
      setWarm((prev) => ({ ...prev, [k]: initial }));
      return initial;
    }
    return warm[k];
  };

  const getStats = () => {
    let total = 0;
    let done = 0;
    currentExercises.forEach((x) => {
      const r = rows[exKey(x)] || [];
      total += x.sets;
      done += r.filter((row) => row.done).length;
    });
    return { total, done, exercises: currentExercises.length };
  };

  const stats = getStats();

  const fmtTime = (secs: number) => {
    const t = Math.max(0, Math.ceil(secs));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  };

  const restRemaining = () => {
    if (rest.status === "running") {
      return Math.max(0, Math.ceil((rest.ends - Date.now()) / 1000));
    }
    return rest.remaining || 0;
  };

  const isResting = rest.status === "running" || rest.status === "paused";

  const getExName = (x: ExerciseDef) => swaps[exKey(x)]?.name || x.name;

  const getOldSummary = (x: ExerciseDef) => {
    if (swaps[exKey(x)]) return "Not comparable";
    if (!x.previous?.rows?.length) return "No previous record";
    const grouped = x.previous.rows.map((a) => `${a[0]} kg × ${a[1]}`).join(" · ");
    const allSameWeight = x.previous.rows.every((a) => a[0] === x.previous.rows[0][0]);
    return allSameWeight
      ? `${x.previous.rows[0][0]} kg · ${x.previous.rows.map((a) => a[1]).join(", ")}`
      : grouped;
  };

  // Workout Actions
  const handleSelectWorkout = (id: string) => {
    if (!EXERCISE_PLAN[id]) return;
    setWorkoutId(id);
    setActiveExIndex(0);
    setScreen("preview");
  };

  const handleStartWorkout = async () => {
    const isResuming = Boolean(started[workoutId]) && !ended[workoutId];
    if (!isResuming) {
      setActiveExIndex(0);
      setEnded((prev) => ({ ...prev, [workoutId]: null }));
    }
    setStarted((prev) => ({ ...prev, [workoutId]: true }));
    setScreen("logger");

    if (scope === "live") {
      try {
        const res = await fetch("/api/client/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start_or_resume",
            workoutId,
            workoutName: currentWeekObj.name,
          }),
        });
        const data = await res.json();
        if (data.ok && data.session) {
          setSessionId(data.session.id);
        }
      } catch (err) {
        console.error("Failed to start/resume session", err);
      }
    }
  };

  const handleCompleteSet = (x: ExerciseDef, index: number) => {
    const k = exKey(x);
    const currentList = [...(rows[k] || ensureRowsForEx(x))];
    const r = currentList[index];
    if (!r) return;

    if (r.done) {
      currentList[index] = { ...r, done: false };
      setRows((prev) => ({ ...prev, [k]: currentList }));
      showToast("Set reopened for correction.");

      if (scope === "live" && sessionId) {
        fetch("/api/client/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "log_set",
            sessionId,
            exerciseId: x.id,
            exerciseName: getExName(x),
            targetExerciseId: swaps[k]?.id ? x.id : undefined,
            isSwap: Boolean(swaps[k]?.id),
            setIndex: index,
            isWarmup: false,
            weightKg: r.w,
            reps: parseInt(r.r, 10) || 0,
            completed: false,
          }),
        }).catch(() => {});
      }
      return;
    }

    if (!r.w.trim() || !r.r.trim()) {
      showToast("Enter a valid weight and whole-number reps.");
      return;
    }

    currentList[index] = { ...r, done: true };
    setRows((prev) => ({ ...prev, [k]: currentList }));

    // Start rest timer & persist ends to localStorage
    const ends = Date.now() + x.rest * 1000;
    setRest({
      status: "running",
      remaining: x.rest,
      ends,
      exerciseId: x.id,
    });
    try {
      localStorage.setItem(
        "ascend_rest_timer",
        JSON.stringify({ ends, remaining: x.rest, exerciseId: x.id })
      );
    } catch {}

    // Persist set log to server if live
    if (scope === "live" && sessionId) {
      fetch("/api/client/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_set",
          sessionId,
          exerciseId: x.id,
          exerciseName: getExName(x),
          targetExerciseId: swaps[k]?.id ? x.id : undefined,
          isSwap: Boolean(swaps[k]?.id),
          setIndex: index,
          isWarmup: false,
          weightKg: r.w,
          reps: parseInt(r.r, 10) || 0,
          completed: true,
        }),
      }).catch(() => {});
    }

    const doneForExercise = currentList.every((row) => row.done);
    if (doneForExercise && viewMode === "focus" && activeExIndex < currentExercises.length - 1) {
      setActiveExIndex((prev) => prev + 1);
      showToast("Next exercise loaded. Rest timer continues.");
    } else {
      showToast("Working set recorded. Rest started.");
    }
  };

  const handleFinishWorkout = () => {
    const partial = stats.done < stats.total;
    setEnded((prev) => ({ ...prev, [workoutId]: { partial, recorded: stats.done } }));
    setRest({ status: "off", remaining: 0, ends: 0, exerciseId: null });
    try {
      localStorage.removeItem("ascend_rest_timer");
    } catch {}

    // Persist complete to backend API if live
    if (scope === "live" && sessionId) {
      fetch("/api/client/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_session",
          sessionId,
          status: partial ? "PARTIAL" : "COMPLETED",
          notes: `${currentWeekObj.name} ${partial ? "partially" : "fully"} completed`,
        }),
      }).catch(() => {});
    }

    // Auto-save to adapter / database
    try {
      clientPortalAdapter.saveWorkout(scope, {
        programmeDayId: workoutId,
        workoutName: currentWeekObj.name,
        workoutDate: new Date().toISOString().split("T")[0],
        durationMinutes: 50,
        effortRating: 8,
        athleteNote: `${currentWeekObj.name} completed`,
        painNote: "",
        exercises: currentExercises.map((e) => ({
          exerciseId: e.id,
          name: getExName(e),
          sets: (rows[exKey(e)] || []).map((row, idx) => ({
            set: idx + 1,
            load: row.w,
            reps: row.r,
            completed: row.done,
          })),
        })),
      });
    } catch (err) {
      console.error("Failed to auto-save workout", err);
    }

    setScreen("share");
  };

  // Figure Illustration SVG matching prototype
  const renderFigureSvg = (x: ExerciseDef) => {
    const isLeg = x.id.includes("leg");
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
      <svg className="illustration" viewBox="0 0 320 165" role="img" aria-label="Exercise movement animation">
        <title>Exercise movement animation</title>
        {scene}
      </svg>
    );
  };

  const currentExRows = rows[exKey(currentEx)] || ensureRowsForEx(currentEx);
  const nextUnfinishedSetIndex = currentExRows.findIndex((q) => !q.done);
  const allCurrentSetsDone = nextUnfinishedSetIndex < 0;

  return (
    <div className="workouts-focus-root">
      <div className="frame">
        {/* VIEW 1: WORKOUTS LIST */}
        {screen === "workouts" && (
          <div className="view">
            <div className="eyebrow">FOUNDATION PHASE</div>
            <h1 className="t1">Your training week</h1>
            <p className="small" style={{ margin: "7px 0 17px" }}>
              Your approved sessions, ready when you are.
            </p>

            {/* This week consistency progress */}
            <div className="card padded" style={{ marginBottom: "17px" }}>
              <div className="row spread">
                <span className="strong">This week</span>
                <span className="small">
                  {Object.values(ended).filter(Boolean).length} of 3 finished
                </span>
              </div>
              <div className="progress-track">
                <div
                  style={{
                    width: `${Math.round((Object.values(ended).filter(Boolean).length / 3) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* 3 Workout Cards (Desktop 3-Column / Mobile 1-Column) */}
            <div className="workouts-grid">
              {WEEK_ROUTINES.map((x) => {
                const isStarted = !!started[x.id];
                const isEnded = !!ended[x.id];
                const isToday = x.id === "a";
                return (
                  <button
                    key={x.id}
                    className={`workout-card ${isToday ? "is-today" : ""}`}
                    type="button"
                    onClick={() => handleSelectWorkout(x.id)}
                  >
                    <span className="daybox">
                      <span>{x.short}</span>
                      <span>{x.num}</span>
                    </span>
                    <span className="grow">
                      <span className="workout-title">{x.name}</span>
                      <span className="workout-status">
                        {isEnded
                          ? "Completed"
                          : isStarted
                          ? "In progress"
                          : isToday
                          ? "Ready today"
                          : "Scheduled"}{" "}
                        · {EXERCISE_PLAN[x.id]?.length || 5} exercises
                      </span>
                    </span>
                    <Glyph name="arrow" />
                  </button>
                );
              })}
            </div>

            {/* Coach Programme Note */}
            <div className="card padded" style={{ marginTop: "16px" }}>
              <div className="row spread">
                <span className="strong">Your programme</span>
                <span className="pill neutral">Coach-approved</span>
              </div>
              <p className="small" style={{ margin: "10px 0 0" }}>
                Illustrative Full Body A/B/C beginner week. Rescheduling and permanent programme changes remain under the approved coaching rules.
              </p>
            </div>

            {/* Mobile Bottom Dock */}
            <ModernClientBottomNav scope={scope} active="workouts" />
          </div>
        )}

        {/* VIEW 2: WORKOUT PREVIEW */}
        {screen === "preview" && (
          <div className="view">
            <div className="focus-logger-wrap">
              <div className="topbar tight">
                <button
                  className="icon-btn flat"
                  onClick={() => setScreen("workouts")}
                  aria-label="Back to Workouts"
                >
                  <Glyph name="back" className="lg" />
                </button>
                <div className="eyebrow">WORKOUT PREVIEW</div>
                <button
                  className="icon-btn flat"
                  onClick={() => setScreen("workouts")}
                  aria-label="Settings"
                >
                  <Glyph name="settings" />
                </button>
              </div>

              {/* Hero Banner */}
              <section className="hero">
                <div className="eyebrow">FOUNDATION · {currentWeekObj.day.toUpperCase()}</div>
                <h1 className="t1" style={{ marginTop: "8px" }}>
                  {currentWeekObj.name}
                </h1>
                <div className="info-strip">
                  <span>
                    <Glyph name="timer" /> 55–65 min
                  </span>
                  <span>
                    <Glyph name="dumbbell" /> Gym
                  </span>
                  <span>{currentExercises.length} exercises</span>
                </div>
              </section>

              {/* Exercises List */}
              <div className="section-head">
                <span className="t2">Your exercises</span>
                <span className="mini">Coach-approved</span>
              </div>

              {currentExercises.map((e) => (
                <div key={e.id} className="preview-ex">
                  <button
                    className="thumb"
                    onClick={() => setMediaExId(e.id)}
                    aria-label={`Expand animation for ${getExName(e)}`}
                  >
                    <Glyph name="dumbbell" className="lg" />
                  </button>
                  <div className="middle">
                    <div className="name">{getExName(e)}</div>
                    <div className="detail">
                      {e.sets} sets · {e.reps} reps · {fmtTime(e.rest)} rest
                    </div>
                  </div>
                  <button
                    className="small-swap"
                    onClick={() => setSheetExId(e.id)}
                  >
                    Swap
                  </button>
                </div>
              ))}

              {/* Pre-workout Guidance */}
              <div className="card padded" style={{ marginTop: "10px" }}>
                <div className="row">
                  <Glyph name="info" /> <span className="strong">Before you begin</span>
                </div>
                <p className="small" style={{ margin: "8px 0 0" }}>
                  5 minutes of easy movement, then prescribed ramp-up sets where applicable. Log warm-ups separately if you prefer.
                </p>
              </div>

              {/* Start Workout Primary CTA */}
              <div className="bottom-sticky">
                <button className="cta" onClick={handleStartWorkout}>
                  {started[workoutId] ? "Resume Workout" : "Start Workout"} <Glyph name="arrow" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: LIVE WORKOUT LOGGER */}
        {screen === "logger" && (
          <div className="view">
            <div
              className="focus-logger-wrap"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="topbar tight">
                <button
                  className="icon-btn flat"
                  onClick={() => setScreen("preview")}
                  aria-label="Save and leave workout"
                >
                  <Glyph name="back" className="lg" />
                </button>
                <div className="eyebrow" style={{ fontSize: "10px" }}>
                  YOUR LIVE WORKOUT
                </div>
                <button
                  className="icon-btn flat"
                  onClick={() => {
                    setScreen("preview");
                    showToast("Session preserved on this device.");
                  }}
                  aria-label="Leave session, saved on this device"
                  title="Save for later"
                >
                  <Glyph name="save" />
                </button>
              </div>

              {/* Status Line with Mode Indicator & Swipe Affordance */}
              <div className="statusline">
                <div>
                  <div className="session-name">{currentWeekObj.name}</div>
                  <div className="mini">
                    {stats.done} of {stats.total} working sets recorded
                  </div>
                </div>
                <button
                  className="mode-swipe-indicator"
                  onClick={() => setViewMode(viewMode === "focus" ? "session" : "focus")}
                  title="Tap or swipe horizontally to toggle logging mode"
                  aria-label={`Current: ${viewMode === "focus" ? "Focus Mode" : "Session Mode"}. Tap or swipe to switch.`}
                >
                  <span>{viewMode === "focus" ? "Focus Mode" : "Session Mode"}</span>
                  <span className="swipe-arrow">⇄</span>
                </button>
              </div>

              {/* FOCUS MODE */}
              {viewMode === "focus" && (
                <div>
                  {/* Unified Exercise Card */}
                  <article className="card unified">
                    {/* Movement Animated Illustration */}
                    <div
                      className="media"
                      role="button"
                      tabIndex={0}
                      onClick={() => setMediaExId(currentEx.id)}
                      aria-label={`Expand demonstration for ${getExName(currentEx)}`}
                    >
                      {renderFigureSvg(currentEx)}
                      <span className="expand">
                        <Glyph name="expand" />
                      </span>
                      <span className="media-mark">ILLUSTRATIVE MOTION</span>
                    </div>

                    <div className="exercise-info">
                      <div className="name-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="exname">{getExName(currentEx)}</div>
                          <div className="exgoal">
                            {currentEx.sets} sets · {currentEx.reps} reps
                          </div>
                        </div>

                        {/* Inline Previous History Toggle */}
                        <button
                          className="history-mini"
                          type="button"
                          onClick={() => {
                            const k = exKey(currentEx);
                            setHistOpen((prev) => ({ ...prev, [k]: !prev[k] }));
                          }}
                          aria-label={`View previous session details for ${getExName(currentEx)}`}
                        >
                          <div className="histlabel">
                            PREVIOUS{currentEx.previous ? ` · ${currentEx.previous.date}` : ""}
                          </div>
                          <div className="histvalue">{getOldSummary(currentEx)}</div>
                        </button>
                      </div>

                      {histOpen[exKey(currentEx)] && (
                        <div className="hist-detail">
                          {swaps[exKey(currentEx)]
                            ? "A temporary exercise swap is selected. No comparison with the prescribed exercise."
                            : currentEx.previous
                            ? `Previous recorded working sets: ${currentEx.previous.rows
                                .map((row) => `${row[0]} kg × ${row[1]} reps`)
                                .join(" · ")}`
                            : "No previous working sets available."}{" "}
                          These figures are a reference only.
                        </div>
                      )}

                      {/* Unified Tools Bar */}
                      <div className="unified-tools">
                        <span className={`rest-meta ${isResting ? "active" : ""}`}>
                          <Glyph name="timer" className="sm" />{" "}
                          <span>
                            {isResting
                              ? `${rest.status === "paused" ? "Paused " : "Rest "}${fmtTime(restRemaining())}`
                              : `Rest · ${fmtTime(currentEx.rest)}`}
                          </span>
                        </span>

                        <button
                          type="button"
                          className="small-action"
                          onClick={() => {
                            const k = exKey(currentEx);
                            setWarmOpen((prev) => ({ ...prev, [k]: !prev[k] }));
                          }}
                        >
                          Warm-up{" "}
                          <Glyph name={warmOpen[exKey(currentEx)] ? "up" : "chevron"} className="sm" />
                        </button>

                        <button
                          type="button"
                          className="swap-ico"
                          onClick={() => setSheetExId(currentEx.id)}
                          aria-label="Swap Exercise"
                          title="Swap Exercise"
                        >
                          <Glyph name="swap" />
                        </button>
                      </div>

                      {/* Active Rest Countdown Bar */}
                      {isResting && (
                        <div className="rest-expanded">
                          <span className="rest-clock">{fmtTime(restRemaining())}</span>
                          <div className="rest-ctrls">
                            <button
                              type="button"
                              onClick={() => {
                                const diff = -30;
                                if (rest.status === "running") {
                                  const sec = Math.max(0, restRemaining() + diff);
                                  setRest((prev) => ({ ...prev, remaining: sec, ends: Date.now() + sec * 1000 }));
                                } else {
                                  setRest((prev) => ({ ...prev, remaining: Math.max(0, prev.remaining + diff) }));
                                }
                              }}
                            >
                              −30s
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (rest.status === "running") {
                                  setRest((prev) => ({ ...prev, remaining: restRemaining(), status: "paused" }));
                                } else if (rest.status === "paused") {
                                  setRest((prev) => ({ ...prev, ends: Date.now() + prev.remaining * 1000, status: "running" }));
                                }
                              }}
                            >
                              {rest.status === "paused" ? "Resume" : "Pause"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const diff = 30;
                                if (rest.status === "running") {
                                  const sec = Math.max(0, restRemaining() + diff);
                                  setRest((prev) => ({ ...prev, remaining: sec, ends: Date.now() + sec * 1000 }));
                                } else {
                                  setRest((prev) => ({ ...prev, remaining: prev.remaining + diff }));
                                }
                              }}
                            >
                              +30s
                            </button>
                            <button
                              type="button"
                              onClick={() => setRest({ status: "off", remaining: 0, ends: 0, exerciseId: null })}
                            >
                              Skip
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Warm-Up Drawer */}
                      {warmOpen[exKey(currentEx)] && (
                        <div className="warm-panel">
                          <div className="warmhead">
                            <span>Optional warm-up log · separate from working sets</span>
                            <button
                              type="button"
                              className="tiny-link"
                              onClick={() => {
                                const k = exKey(currentEx);
                                const list = warm[k] || [{ w: "", r: "", done: false }];
                                if (list.length < 5) {
                                  setWarm((prev) => ({ ...prev, [k]: [...list, { w: "", r: "", done: false }] }));
                                } else {
                                  showToast("Five warm-up entries is enough for this workout.");
                                }
                              }}
                            >
                              + Add warm-up
                            </button>
                          </div>

                          {(warm[exKey(currentEx)] || ensureWarmForEx(currentEx)).map((r, i) => (
                            <div key={i} className="warm-grid">
                              <input
                                className="number"
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="kg"
                                value={r.w}
                                onChange={(e) => {
                                  const k = exKey(currentEx);
                                  const list = [...(warm[k] || [{ w: "", r: "", done: false }])];
                                  list[i] = { ...list[i], w: e.target.value };
                                  setWarm((prev) => ({ ...prev, [k]: list }));
                                }}
                              />
                              <input
                                className="number"
                                type="number"
                                min="1"
                                step="1"
                                placeholder="reps"
                                value={r.r}
                                onChange={(e) => {
                                  const k = exKey(currentEx);
                                  const list = [...(warm[k] || [{ w: "", r: "", done: false }])];
                                  list[i] = { ...list[i], r: e.target.value };
                                  setWarm((prev) => ({ ...prev, [k]: list }));
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const k = exKey(currentEx);
                                  const list = [...(warm[k] || [{ w: "", r: "", done: false }])];
                                  const nextDone = !list[i].done;
                                  list[i] = { ...list[i], done: nextDone };
                                  setWarm((prev) => ({ ...prev, [k]: list }));
                                  showToast(nextDone ? "Warm-up recorded separately." : "Warm-up reopened.");

                                  if (scope === "live" && sessionId) {
                                    fetch("/api/client/workouts", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        action: "log_set",
                                        sessionId,
                                        exerciseId: currentEx.id,
                                        exerciseName: getExName(currentEx),
                                        setIndex: i,
                                        isWarmup: true,
                                        weightKg: list[i].w || 0,
                                        reps: parseInt(list[i].r, 10) || 0,
                                        completed: nextDone,
                                      }),
                                    }).catch(() => {});
                                  }
                                }}
                              >
                                <Glyph name={r.done ? "check" : "plus"} />
                              </button>
                            </div>
                          ))}
                          <div className="warm-caption">
                            Warm-up entries are optional. They never count toward prescribed working-set totals.
                          </div>
                        </div>
                      )}
                    </div>
                  </article>

                  {/* Focused Working Set Logger Card */}
                  <section className="card logger-card">
                    <div className="logger-head">
                      <span className="eyebrow">WORKING SET</span>
                      <span className="mini">
                        {currentExRows.filter((q) => q.done).length} of {currentExRows.length} recorded
                      </span>
                    </div>

                    {allCurrentSetsDone ? (
                      <div className="complete-banner">
                        <Glyph name="check" className="lg" />
                        <span>All working sets recorded for this exercise.</span>
                      </div>
                    ) : (
                      <>
                        {currentEx.previous?.rows[nextUnfinishedSetIndex] && (
                          <div className="prev-ref-hint">
                            <span>Ref from {currentEx.previous.date}:</span>
                            <strong>
                              {currentEx.previous.rows[nextUnfinishedSetIndex][0]} kg × {currentEx.previous.rows[nextUnfinishedSetIndex][1]} reps
                            </strong>
                          </div>
                        )}
                        <div className="fieldgrid">
                          <label className="field">
                            <span>WEIGHT (KG)</span>
                            <input
                              className="number"
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              min="0"
                              placeholder={currentEx.previous?.rows[nextUnfinishedSetIndex]?.[0] || "0"}
                              value={currentExRows[nextUnfinishedSetIndex]?.w || ""}
                              onChange={(e) => {
                                const k = exKey(currentEx);
                                const list = [...currentExRows];
                                list[nextUnfinishedSetIndex] = {
                                  ...list[nextUnfinishedSetIndex],
                                  w: e.target.value,
                                };
                                setRows((prev) => ({ ...prev, [k]: list }));
                              }}
                            />
                          </label>
                          <label className="field">
                            <span>REPS</span>
                            <input
                              className="number"
                              type="number"
                              inputMode="numeric"
                              min="1"
                              step="1"
                              placeholder={currentEx.previous?.rows[nextUnfinishedSetIndex]?.[1] || "0"}
                              value={currentExRows[nextUnfinishedSetIndex]?.r || ""}
                              onChange={(e) => {
                                const k = exKey(currentEx);
                                const list = [...currentExRows];
                                list[nextUnfinishedSetIndex] = {
                                  ...list[nextUnfinishedSetIndex],
                                  r: e.target.value,
                                };
                                setRows((prev) => ({ ...prev, [k]: list }));
                              }}
                            />
                          </label>
                        </div>

                        <button
                          className="cta"
                          type="button"
                          onClick={() => handleCompleteSet(currentEx, nextUnfinishedSetIndex)}
                        >
                          <Glyph name="check" /> Complete Set
                        </button>
                      </>
                    )}
                  </section>

                  {/* Navigation footer */}
                  <div className="logger-footer">
                    {stats.done === stats.total ? (
                      <button className="cta" onClick={handleFinishWorkout}>
                        Finish Workout <Glyph name="arrow" />
                      </button>
                    ) : (
                      <button className="secondary block" onClick={handleFinishWorkout}>
                        End Workout Early
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* SESSION MODE */}
              {viewMode === "session" && (
                <div>
                  <div className="stack" style={{ gap: "10px" }}>
                    {currentExercises.map((x) => {
                      const k = exKey(x);
                      const exRows = rows[k] || ensureRowsForEx(x);
                      const isCollapsed = !!collapsed[k];
                      return (
                        <section key={x.id} className="session-ex">
                          <div className="session-head">
                            <button
                              className="icon-btn pill"
                              onClick={() => setCollapsed((prev) => ({ ...prev, [k]: !prev[k] }))}
                              aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${getExName(x)}`}
                            >
                              <Glyph name={isCollapsed ? "chevron" : "up"} className="sm" />
                            </button>
                            <div className="part">
                              <button
                                onClick={() => {
                                  setActiveExIndex(currentExercises.findIndex((q) => q.id === x.id));
                                  setViewMode("focus");
                                  showToast("Switched to Focus Mode");
                                }}
                                style={{
                                  background: "none",
                                  border: 0,
                                  textAlign: "left",
                                  color: "inherit",
                                  padding: 0,
                                  width: "100%",
                                  cursor: "pointer",
                                }}
                              >
                                <div className="exname">{getExName(x)}</div>
                                <div className="exgoal">
                                  {x.sets} sets · {x.reps} reps
                                </div>
                                <div className="mini" style={{ marginTop: "4px" }}>
                                  {exRows.filter((r) => r.done).length} of {exRows.length} recorded
                                </div>
                              </button>
                            </div>

                            <button
                              className="history-mini"
                              type="button"
                              onClick={() => setHistOpen((prev) => ({ ...prev, [k]: !prev[k] }))}
                            >
                              <div className="histlabel">
                                PREVIOUS{x.previous ? ` · ${x.previous.date}` : ""}
                              </div>
                              <div className="histvalue">{getOldSummary(x)}</div>
                            </button>
                          </div>

                          <div className="row-controls">
                            <span className="rest-meta">
                              <Glyph name="timer" className="sm" /> Rest {fmtTime(x.rest)}
                            </span>
                            <div className="row" style={{ gap: "5px" }}>
                              <button
                                className="small-action"
                                onClick={() => setWarmOpen((prev) => ({ ...prev, [k]: !prev[k] }))}
                              >
                                Warm-up <Glyph name="chevron" className="sm" />
                              </button>
                              <button
                                className="swap-ico"
                                onClick={() => setSheetExId(x.id)}
                                title="Swap Exercise"
                              >
                                <Glyph name="swap" />
                              </button>
                            </div>
                          </div>

                          {!isCollapsed && (
                            <>
                              <div className="set-head">
                                <span>WEIGHT (KG)</span>
                                <span>REPS</span>
                                <span>DONE</span>
                              </div>
                              {exRows.map((r, i) => (
                                <div key={i}>
                                  <div className="set-row">
                                    <input
                                      className="number"
                                      type="number"
                                      inputMode="decimal"
                                      step="0.5"
                                      min="0"
                                      placeholder={x.previous?.rows[i]?.[0] || "kg"}
                                      value={r.w}
                                      onChange={(e) => {
                                        const list = [...exRows];
                                        list[i] = { ...list[i], w: e.target.value };
                                        setRows((prev) => ({ ...prev, [k]: list }));
                                      }}
                                    />
                                    <input
                                      className="number"
                                      type="number"
                                      inputMode="numeric"
                                      min="1"
                                      step="1"
                                      placeholder={x.previous?.rows[i]?.[1] || "reps"}
                                      value={r.r}
                                      onChange={(e) => {
                                        const list = [...exRows];
                                        list[i] = { ...list[i], r: e.target.value };
                                        setRows((prev) => ({ ...prev, [k]: list }));
                                      }}
                                    />
                                    <button
                                      className={`set-check ${r.done ? "done" : ""}`}
                                      type="button"
                                      onClick={() => handleCompleteSet(x, i)}
                                      aria-label="Complete set"
                                    >
                                      <Glyph name="check" />
                                    </button>
                                  </div>
                                  {x.previous?.rows[i] && (
                                    <div className="set-ref-ghost">
                                      Ref: {x.previous.rows[i][0]} kg × {x.previous.rows[i][1]} ({x.previous.date})
                                    </div>
                                  )}
                                </div>
                              ))}
                            </>
                          )}
                        </section>
                      );
                    })}
                  </div>

                  <div className="logger-footer">
                    {stats.done === stats.total ? (
                      <button className="cta" onClick={handleFinishWorkout}>
                        Finish Workout <Glyph name="arrow" />
                      </button>
                    ) : (
                      <button className="secondary block" onClick={handleFinishWorkout}>
                        End Workout Early
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: OPTIONAL SHARING */}
        {screen === "share" && (
          <div className="view">
            <div className="focus-logger-wrap">
              <div className="topbar">
                <div>
                  <div className="brand">ASCEND</div>
                  <div className="eyebrow" style={{ fontSize: "9px" }}>
                    OPTIONAL SHARING
                  </div>
                </div>
              </div>

              <h1 className="t1">
                {ended[workoutId]?.partial ? "Session ended early" : "Workout completed"}
              </h1>
              <p className="small">
                {stats.done} of {stats.total} working sets recorded. Sharing is entirely optional.
              </p>

              {/* Golden Share Art Badge */}
              <div className="share-art">
                <div className="eyebrow" style={{ letterSpacing: "4px" }}>
                  ASCEND
                </div>
                <div className="t1">{currentWeekObj.name.toUpperCase()}</div>
                <div style={{ fontSize: "38px", color: "#c9ad7c" }}>✦</div>
                <div className="large">
                  {stats.done} / {stats.total}
                </div>
                <div className="small">Working sets recorded</div>
                <div className="mini" style={{ marginTop: "18px" }}>
                  Tame the Flesh. Forge the Form. Ascend.
                </div>
              </div>

              <button
                className="cta"
                onClick={() => {
                  setSharePath("preview");
                  setScreen("summary");
                }}
              >
                Preview Share Path
              </button>
              <button
                className="secondary block"
                style={{ marginTop: "9px" }}
                onClick={() => {
                  setSharePath("private");
                  setScreen("summary");
                }}
              >
                Continue Privately
              </button>
            </div>
          </div>
        )}

        {/* VIEW 5: PRIVATE WORKOUT SUMMARY */}
        {screen === "summary" && (
          <div className="view">
            <div className="focus-logger-wrap">
              <div className="topbar">
                <div>
                  <div className="brand">ASCEND</div>
                  <div className="eyebrow" style={{ fontSize: "9px" }}>
                    PRIVATE WORKOUT SUMMARY
                  </div>
                </div>
              </div>

              <h1 className="t1">Workout Summary</h1>
              <p className="small">
                {currentWeekObj.name} · {ended[workoutId]?.partial ? "Partially completed" : "Completed"}
              </p>

              <div className="statgrid">
                <div className="stat">
                  <b>{stats.done}</b>
                  <div className="small">Working sets recorded</div>
                </div>
                <div className="stat">
                  <b>{stats.exercises}</b>
                  <div className="small">Planned exercises</div>
                </div>
              </div>

              {/* Recorded Exercises Breakdown */}
              {currentExercises.map((e) => {
                const k = exKey(e);
                const records = (rows[k] || []).filter((r) => r.done);
                return (
                  <div key={e.id} className="card padded" style={{ marginBottom: "9px" }}>
                    <div className="strong">{getExName(e)}</div>
                    <div className="small" style={{ marginTop: "6px" }}>
                      {records.length
                        ? records.map((r) => `${r.w} kg × ${r.r} reps`).join(" · ")
                        : "No working sets recorded"}
                    </div>
                  </div>
                );
              })}

              <button
                className="cta"
                style={{ marginTop: "15px" }}
                onClick={() => setScreen("workouts")}
              >
                Back to Workouts <Glyph name="arrow" />
              </button>
            </div>
          </div>
        )}

        {/* OVERLAY: EXERCISE SWAP SHEET */}
        {sheetExId && (
          <div className="sheet-backdrop" onClick={() => setSheetExId(null)}>
            <div
              className="sheet"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close"
                onClick={() => setSheetExId(null)}
                aria-label="Close swaps"
              >
                <Glyph name="close" />
              </button>
              <div className="eyebrow">CURRENT SESSION ONLY</div>
              <h2>Swap Exercise</h2>
              <div className="small">
                {(() => {
                  const x = currentExercises.find((v) => v.id === sheetExId);
                  return x ? `${x.name} · Choose from Sahmi-approved alternatives only.` : "";
                })()}
              </div>

              {(() => {
                const x = currentExercises.find((v) => v.id === sheetExId);
                if (!x) return null;
                const k = exKey(x);
                const sel = swaps[k];
                return (
                  <>
                    <button
                      className="option"
                      onClick={() => {
                        const copy = { ...swaps };
                        delete copy[k];
                        setSwaps(copy);
                        setSheetExId(null);
                        showToast("Prescribed exercise restored.");
                      }}
                    >
                      <span>
                        <b>{x.name}</b>
                        <small>Keep the prescribed exercise</small>
                      </span>
                      <span className="choice">{sel ? "" : "✓"}</span>
                    </button>

                    {x.swaps.map((alt) => (
                      <button
                        key={alt.id}
                        className="option"
                        onClick={() => {
                          setSwaps({ ...swaps, [k]: alt });
                          setSheetExId(null);
                          showToast(`Approved demo swap applied: ${alt.name}`);
                        }}
                      >
                        <span>
                          <b>{alt.name}</b>
                          <small>{alt.note}</small>
                        </span>
                        <span className="choice">{sel?.id === alt.id ? "✓" : "Select"}</span>
                      </button>
                    ))}
                  </>
                );
              })()}

              <div className="message" style={{ marginTop: "12px" }}>
                Changing exercise because of pain or unusual symptoms needs appropriate caution and coach review. This platform does not provide medical clearance.
              </div>

              <button className="secondary block" onClick={() => setSheetExId(null)}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* OVERLAY: EXPANDED MEDIA MODAL */}
        {mediaExId && (
          <div
            className="mediamodal"
            role="dialog"
            aria-modal="true"
            onClick={() => setMediaExId(null)}
          >
            <button
              className="icon-btn dismiss"
              onClick={() => setMediaExId(null)}
              aria-label="Close expanded media"
            >
              <Glyph name="close" />
            </button>
            <div
              className="media"
              style={{ height: "min(66vh, 480px)", width: "min(95vw, 560px)", borderRadius: "19px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const x = currentExercises.find((v) => v.id === mediaExId) || currentEx;
                return renderFigureSvg(x);
              })()}
            </div>
            <div className="small" style={{ textAlign: "center", marginTop: "16px" }}>
              {(() => {
                const x = currentExercises.find((v) => v.id === mediaExId) || currentEx;
                return `${getExName(x)} · Illustrative motion demonstration.`;
              })()}
            </div>
          </div>
        )}

        {/* FLOATING STATUS TOAST */}
        {toastMessage && <div className="toast show">{toastMessage}</div>}
      </div>
    </div>
  );
}
