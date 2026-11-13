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

  // Next workout calculation from active programme
  const days = data.programme.days;
  const nextWorkoutIndex = data.workouts.length % (days.length || 1);
  const nextWorkout = days[nextWorkoutIndex] || days[0];

  // Current formatted date
  const now = new Date();
  const dayName = now.toLocaleDateString("en-NG", { weekday: "long" }).toUpperCase();
  const dateFormatted = now.toLocaleDateString("en-NG", { day: "numeric", month: "short" }).toUpperCase();
  const todayLabel = `${dayName}, ${dateFormatted} · ${nextWorkout ? "TRAINING DAY" : "REST & RECOVERY"}`;

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
            <div className="daylabel">{todayLabel}</div>

            {/* Next Action Primary Hero Card */}
            <section className="primary">
              <div className="kicker">YOUR NEXT ACTION</div>
              <h1>{nextWorkout ? nextWorkout.name : "Active Recovery & Mobility"}</h1>
              <div className="meta">
                {nextWorkout
                  ? `${nextWorkout.estimatedMinutes} · Gym · ${nextWorkout.exercises.length} prescribed exercises`
                  : "Prescribed hydration, mobility & nutrition recovery"}
              </div>
              <button
                className="primaryAction"
                onClick={() => router.push(`${basePath}/workout-logger`)}
              >
                <span>{nextWorkout ? "Start Workout" : "Review Programme"}</span>
                <TodayIcon name="right" />
              </button>
            </section>

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
                <strong>Latest coach update · {latestCoachFeedback.date}</strong>
                <p>{latestCoachFeedback.message}</p>
              </section>
            )}
          </div>

          {/* Right Column: Day at a Glance Stats & Schedule */}
          <div className="today-col">
            <section>
              <h2 className="sectionHeader">Your day at a glance</h2>
              <div className="statgrid">
                <button
                  className="stat"
                  onClick={() => router.push(`${basePath}/workout-logger`)}
                  style={{ cursor: "pointer" }}
                >
                  <span className="statTitle">
                    <TodayIcon name="dumb" /> Training
                  </span>
                  <strong>{`${data.workouts.length % (days.length || 3)} / ${days.length || 3}`}</strong>
                  <div className="small">Workouts completed this week</div>
                  {nextWorkout && (
                    <div className="next">{nextWorkout.name} up next →</div>
                  )}
                </button>

                <button
                  className="stat"
                  onClick={() => router.push(`${basePath}/nutrition`)}
                  style={{ cursor: "pointer" }}
                >
                  <span className="statTitle">
                    <TodayIcon name="food" /> Nutrition
                  </span>
                  <strong>{`${totals.calories.toLocaleString()} / ${targets.calories.toLocaleString()} kcal`}</strong>
                  <div className="small">{data.nutrition.meals.length} meal entries recorded today</div>
                  <div className="next">Open Meal Plan →</div>
                </button>
              </div>
            </section>

            {/* Coaching Review Schedule */}
            <section
              className="under"
              onClick={() => router.push(`${basePath}/progress`)}
              style={{ cursor: "pointer" }}
            >
              <div>
                <strong>Next coaching review</strong>
                <small>Scheduled for {data.client.nextCheckIn} · with {data.client.coachName}</small>
              </div>
              <span className="right">
                <TodayIcon name="calendar" />
              </span>
            </section>

            {/* Quick Profile / Streak Summary Card */}
            <section className="direction" style={{ background: "#151413" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="daylabel" style={{ fontSize: "10px", marginBottom: "4px" }}>ACTIVE ATHLETE</div>
                  <strong style={{ fontSize: "15px", color: "#f5f0e9" }}>{data.client.fullName}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--sub)" }}>
                    {data.client.phaseName} · {data.client.primaryGoal || "Physique progression"}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--gold)" }}>
                    {data.client.streakDays}d
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Active Streak
                  </div>
                </div>
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
