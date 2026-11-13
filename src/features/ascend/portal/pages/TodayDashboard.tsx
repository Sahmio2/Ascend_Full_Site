"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ModernClientBottomNav from "../components/ModernClientBottomNav";
import { useClientPortalData } from "../data/useClientPortalData";
import { nutritionTotals, type PortalScope } from "../data/types";
import "@/styles/ascend-today-dashboard.css";

// SVG icons matching the approved prototype
const SVGS: Record<string, string> = {
  msg: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.8-5.4a9 9 0 0 1-.8-4.1 8.5 8.5 0 0 1 17 0Z"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><circle cx="12" cy="12" r="9"/><path d="M5.5 18.5c.8-2.5 3-4 6.5-4s5.7 1.5 6.5 4"/>',
  right: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  dumb: '<path d="M3 9v6m3-9v12m3-9v6m6-6v6m3-9v12m3-9v6M9 12h6"/>',
  food: '<path d="M4 3v8m3-8v8m3-8v8m-6 0h6m-3 0v10m11 0V3c-4 0-5 4-5 9h5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h.01m4 0h.01m4 0h.01"/>',
  home: '<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>',
  chart: '<path d="M4 20V9m6 11V4m5 16v-7m5 7V7"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  shield: '<path d="m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6Z"/><path d="M12 7v6m0 3h.01"/>',
};

function TodayIcon({ name, className = "svg" }: { name: string; className?: string }) {
  const path = SVGS[name] || SVGS.home;
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

export interface TodayDashboardProps {
  scope?: PortalScope;
}

export default function TodayDashboard({ scope = "live" }: TodayDashboardProps) {
  const router = useRouter();
  const basePath = scope === "demo" ? "/demo" : "/client";
  const data = useClientPortalData(scope);
  const totals = nutritionTotals(data);
  const targets = data.nutrition.targets;

  // Active programme days
  const days = data.programme.days;

  // Current formatted date
  const now = new Date();
  const dayName = now.toLocaleDateString("en-NG", { weekday: "long" }).toUpperCase();
  const dateFormatted = now.toLocaleDateString("en-NG", { day: "numeric", month: "short" }).toUpperCase();
  const todayIso = now.toISOString().split("T")[0];

  // Detect if a workout session was completed today
  const completedTodayWorkout = data.workouts.find(
    (w) =>
      w.completionStatus === "completed" &&
      (w.workoutDate === todayIso || w.workoutDate.startsWith(todayIso))
  );

  // Compute metrics for today's completed workout
  const completedSetsCount =
    completedTodayWorkout?.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
      0
    ) || 0;

  const totalTonnageKg =
    completedTodayWorkout?.exercises.reduce((acc, ex) => {
      return (
        acc +
        ex.sets.reduce((setAcc, s) => {
          if (!s.completed) return setAcc;
          const loadNum = parseFloat(s.load) || 0;
          const repsNum = parseInt(s.reps, 10) || 0;
          return setAcc + loadNum * repsNum;
        }, 0)
      );
    }, 0) || 0;

  // Calendar-aware Monday-Sunday weekly workouts count
  const currentWeekWorkoutsCompleted = (() => {
    const current = new Date(now);
    const day = current.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return data.workouts.filter((w) => {
      if (w.completionStatus !== "completed") return false;
      const d = new Date(w.workoutDate);
      return d >= monday && d <= sunday;
    }).length;
  })();

  const prescribedDaysPerWeek = days.length || 3;

  // Next workout calculation: if today's session is done, cycle to next programme day
  const lastCompletedIndex = completedTodayWorkout
    ? days.findIndex((d) => d.id === completedTodayWorkout.programmeDayId)
    : -1;

  const nextWorkoutIndex = completedTodayWorkout
    ? (lastCompletedIndex + 1) % (days.length || 1)
    : data.workouts.filter((w) => w.completionStatus === "completed").length % (days.length || 1);

  const nextWorkout = days[nextWorkoutIndex] || days[0];

  // Dynamic status pill
  let statusPillText = "REST & RECOVERY";
  let statusPillClass = "pill-recovery";
  if (completedTodayWorkout) {
    statusPillText = "SESSION COMPLETED";
    statusPillClass = "pill-completed";
  } else if (nextWorkout) {
    statusPillText = "TRAINING DAY";
    statusPillClass = "pill-training";
  }

  // Modal State
  const [modalData, setModalData] = useState<{
    title: string;
    body: string;
    actionLabel?: string;
    actionHref?: string;
  } | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalData(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const latestCoachFeedback = data.coachFeedback[0];

  return (
    <div className="today-dashboard-root">
      <main className="today-container">
        {/* Responsive 2-Column Dashboard Grid */}
        <div className="today-grid">
          {/* Left Column: Next Action, Direction & Updates */}
          <div className="today-col">
            <div className="dayheader-row">
              <div className="daylabel">{dayName}, {dateFormatted}</div>
              <span className={`daystatus-pill ${statusPillClass}`}>{statusPillText}</span>
            </div>

            {/* Primary Action / Session Completed Hero Card */}
            {completedTodayWorkout ? (
              <section className="primary primary--completed">
                <div className="kicker kicker--completed">
                  <span className="kicker-dot" /> SESSION COMPLETED TODAY
                </div>
                <h1>{completedTodayWorkout.workoutName}</h1>
                <div className="meta">
                  <span>{completedTodayWorkout.durationMinutes || 60} min duration</span>
                  <span className="dot-sep">·</span>
                  <span>{completedSetsCount} working sets recorded</span>
                  {totalTonnageKg > 0 && (
                    <>
                      <span className="dot-sep">·</span>
                      <span>{totalTonnageKg.toLocaleString()} kg total volume</span>
                    </>
                  )}
                </div>

                <div className="completed-recovery-box">
                  <div className="recovery-lead">Focus until tomorrow: Active recovery & refuel</div>
                  <p className="recovery-sub">
                    Prioritise your prescribed protein ({targets.protein}g) and hydration. Give your neuromuscular system adequate rest before your next session.
                  </p>
                </div>

                <div className="completed-actions">
                  <Link href={`${basePath}/nutrition`} className="primaryAction">
                    <span>Log Nutrition</span>
                    <TodayIcon name="food" />
                  </Link>
                  <Link href={`${basePath}/workout-logger`} className="secondaryAction">
                    <span>Review Session Sets</span>
                    <TodayIcon name="right" />
                  </Link>
                </div>
              </section>
            ) : (
              <section className="primary">
                <div className="kicker">YOUR NEXT ACTION</div>
                <h1>{nextWorkout ? nextWorkout.name : "Active Recovery & Mobility"}</h1>
                <div className="meta">
                  {nextWorkout
                    ? `${nextWorkout.estimatedMinutes} · Gym · ${nextWorkout.exercises.length} prescribed exercises`
                    : "Prescribed hydration, mobility & nutrition recovery"}
                </div>
                <Link
                  href={`${basePath}/workout-logger`}
                  className="primaryAction"
                >
                  <span>{nextWorkout ? "Start Workout" : "Review Programme"}</span>
                  <TodayIcon name="right" />
                </Link>
              </section>
            )}

            {/* Today's Direction */}
            <section className="direction">
              <h2>Today&apos;s direction</h2>
              <p>
                {data.programme.athleteDirection ||
                  "Execute each repetition with controlled tempo. Focus on progressive overload, log each working set, and observe your prescribed rest intervals."}
              </p>
            </section>

            {/* Latest Coach Update */}
            {latestCoachFeedback && (
              <section className="update">
                <div className="update-header">
                  <strong>Latest coach update · {latestCoachFeedback.date}</strong>
                  <Link href={`${basePath}/progress`} className="coach-reply-link">
                    Message Sahmi →
                  </Link>
                </div>
                <p>{latestCoachFeedback.message}</p>
              </section>
            )}
          </div>

          {/* Right Column: Day at a Glance Stats & Schedule */}
          <div className="today-col">
            <section>
              <h2 className="sectionHeader">Your day at a glance</h2>
              <div className="statgrid">
                <Link
                  href={`${basePath}/workout-logger`}
                  className="stat"
                  aria-label="View training details"
                >
                  <span className="statTitle">
                    <TodayIcon name="dumb" /> Training
                  </span>
                  <strong>{`${currentWeekWorkoutsCompleted} / ${prescribedDaysPerWeek}`}</strong>
                  <div className="small">Workouts completed this week</div>
                  {completedTodayWorkout ? (
                    <div className="next next--done">✓ Done today · {nextWorkout.name} next →</div>
                  ) : (
                    <div className="next">{nextWorkout.name} up next →</div>
                  )}
                </Link>

                <Link
                  href={`${basePath}/nutrition`}
                  className="stat"
                  aria-label="View nutrition meals and targets"
                >
                  <span className="statTitle">
                    <TodayIcon name="food" /> Nutrition
                  </span>
                  <strong>{`${totals.calories.toLocaleString()} / ${targets.calories.toLocaleString()} kcal`}</strong>
                  <div className="small">{data.nutrition.meals.length} meal entries recorded today</div>
                  <div className="next">Open Meal Plan →</div>
                </Link>
              </div>
            </section>

            {/* Coaching Review Schedule */}
            <Link
              href={`${basePath}/progress`}
              className="under"
              aria-label="View next coaching review schedule"
            >
              <div>
                <strong>Next coaching review</strong>
                <small>Scheduled for {data.client.nextCheckIn} · with {data.client.coachName}</small>
              </div>
              <span className="right">
                <TodayIcon name="calendar" />
              </span>
            </Link>

            {/* Programme Phase Progression Card (Luxury Coaching Tone) */}
            <section className="programme-phase-card">
              <div className="phase-card-top">
                <div>
                  <div className="phase-kicker">ACTIVE ATHLETE</div>
                  <strong className="phase-athlete-name">{data.client.fullName}</strong>
                  <p className="phase-details">
                    {data.client.phaseName} · {data.client.primaryGoal || "Physique progression"}
                  </p>
                </div>
                <div className="phase-block-stat">
                  <div className="phase-week-val">
                    Week {data.programme.week || 3}
                    <span className="phase-week-total">/{data.programme.totalWeeks || 8}</span>
                  </div>
                  <div className="phase-block-label">
                    Block Cadence
                  </div>
                </div>
              </div>

              <div className="phase-card-footer">
                <div className="adherence-badge">
                  <span className="adherence-dot" />
                  <span>{data.client.adherencePercent || 94}% Target Adherence</span>
                </div>
                <span className="phase-status-text">Coach Monitored</span>
              </div>
            </section>
          </div>
        </div>

        {/* Mobile Sticky Bottom Navigation */}
        <ModernClientBottomNav scope={scope} active="today" />
      </main>

      {/* Interactive Modal */}
      {modalData && (
        <div className="overlay" onClick={() => setModalData(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{modalData.title}</h2>
            <p>{modalData.body}</p>
            {modalData.actionLabel && modalData.actionHref ? (
              <button
                onClick={() => {
                  setModalData(null);
                  router.push(modalData.actionHref!);
                }}
              >
                {modalData.actionLabel}
              </button>
            ) : (
              <button onClick={() => setModalData(null)}>Close</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
