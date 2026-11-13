"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import PortalShell from "../components/PortalShell";
import { useClientPortalData } from "../data/useClientPortalData";
import { nutritionTotals, type PortalScope } from "../data/types";
import TodayDashboard from "./TodayDashboard";

function ProgressBar({ value, target }: { value: number; target: number }) {
  const percentage = Math.min(100, Math.round((value / target) * 100));
  return <span className="portal-progress-track"><i style={{ width: `${percentage}%` }} /></span>;
}

export default function DashboardPage({ scope }: { scope: PortalScope }) {
  const [mode, setMode] = useState<"today" | "classic">("today");
  const data = useClientPortalData(scope);
  const basePath = scope === "demo" ? "/demo" : "/client";
  const totals = nutritionTotals(data);
  const targets = data.nutrition.targets;
  const caloriesRemaining = Math.max(0, targets.calories - totals.calories);
  const caloriePercent = Math.min(100, Math.round((totals.calories / targets.calories) * 100));
  const nextWorkout = data.programme.days[data.workouts.length % data.programme.days.length] || data.programme.days[0];
  const coachNote = data.coachFeedback[0];
  const checkIn = new Date(`${data.client.nextCheckIn}T12:00:00`);
  const ringStyle = { "--progress": `${caloriePercent * 3.6}deg` } as CSSProperties;

  if (mode === "today") {
    return <TodayDashboard scope={scope} onSwitchToClassic={() => setMode("classic")} />;
  }

  return (
    <PortalShell scope={scope} current="dashboard" clientName={data.client.fullName} phase={data.client.phaseName}>
      <div style={{
        background: "#1c1c1b",
        border: "1px solid #37342e",
        borderRadius: "12px",
        padding: "10px 16px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "12px", color: "var(--sub, #bcb6ab)" }}>
          Viewing <strong>Classic Portal Grid</strong>
        </span>
        <button
          onClick={() => setMode("today")}
          style={{
            background: "var(--gold, #d6b87a)",
            color: "#1c1913",
            border: "none",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Return to Today Dashboard (Approved UX)
        </button>
      </div>

      <section className="portal-welcome">
        <div>
          <p className="portal-kicker">The work continues</p>
          <h1>Welcome back, <em>{data.client.fullName.split(" ")[0]}.</em></h1>
          <p>{data.client.primaryGoal}</p>
        </div>
      </section>

      <section className="portal-journey-strip" aria-label="Current coaching overview">
        <article className="portal-journey-streak">
          <div className="portal-streak-count">
            <strong>{data.client.streakDays}</strong>
            <span>day<br />streak</span>
          </div>
          <p>
            <span>Consistency</span>
            <small>{data.client.workoutsThisWeek} this week · {data.client.adherencePercent}% adherence</small>
          </p>
        </article>
        <article className="portal-journey-phase">
          <div className="portal-phase-index">
            <b>Phase {data.client.phaseNumber}</b>
            <i aria-hidden="true">◆</i>
          </div>
          <div className="portal-phase-summary">
            <p>
              <span>Current training phase</span>
              <strong>{data.client.phaseName}</strong>
            </p>
            <p>
              <span>Active programme</span>
              <strong>{data.programme.title}</strong>
              <small>{data.programme.days.length} training days · Week {data.programme.week} of {data.programme.totalWeeks}</small>
            </p>
          </div>
        </article>
      </section>

      <section className="portal-dashboard-grid">
        <article className="portal-panel portal-nutrition-card">
          <header>
            <div>
              <p className="portal-kicker">Today’s nutrition</p>
              <h2>Fuel the work.</h2>
            </div>
            <Link href={`${basePath}/nutrition`}>View nutrition <span>→</span></Link>
          </header>
          <div className="portal-nutrition-main">
            <div className="portal-calorie-ring" style={ringStyle}>
              <div>
                <strong>{caloriesRemaining}</strong>
                <span>kcal left</span>
              </div>
            </div>
            <div className="portal-nutrition-details">
              <div className="portal-calorie-action">
                <span>Daily target</span>
                <strong>{targets.calories.toLocaleString()} kcal</strong>
                <Link href={`${basePath}/nutrition`}>+ Log food</Link>
              </div>
              <div className="portal-macro-grid">
                <div>
                  <span><b>Protein</b><small>{totals.protein}g / {targets.protein}g</small></span>
                  <ProgressBar value={totals.protein} target={targets.protein} />
                </div>
                <div>
                  <span><b>Carbs</b><small>{totals.carbs}g / {targets.carbs}g</small></span>
                  <ProgressBar value={totals.carbs} target={targets.carbs} />
                </div>
                <div>
                  <span><b>Fats</b><small>{totals.fats}g / {targets.fats}g</small></span>
                  <ProgressBar value={totals.fats} target={targets.fats} />
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="portal-panel portal-workout-card">
          <header>
            <div>
              <p className="portal-kicker">Today’s training</p>
              <h2>{nextWorkout.name}</h2>
            </div>
            <span className="portal-status"><i /> Scheduled</span>
          </header>
          <div className="portal-workout-meta">
            <span><b>{nextWorkout.estimatedMinutes}</b> minutes</span>
            <span><b>{nextWorkout.exercises.length}</b> exercises</span>
          </div>
          <Link className="portal-primary-action" href={`${basePath}/workout-logger`}>
            Start today’s workout <span>→</span>
          </Link>
        </article>
      </section>

      <section className="portal-lower-grid">
        <article className="portal-panel portal-coach-note">
          <header>
            <p className="portal-kicker">From your coach</p>
            <span>{coachNote?.date}</span>
          </header>
          <blockquote>“{coachNote?.message}”</blockquote>
          <div>
            <span>SE</span>
            <p>
              <strong>{data.client.coachName}</strong>
              <small>Coach feedback</small>
            </p>
          </div>
        </article>
        <article className="portal-panel portal-checkin-card">
          <p className="portal-kicker">Next check-in</p>
          <div>
            <strong>{checkIn.getDate()}</strong>
            <span>
              {checkIn.toLocaleDateString("en", { month: "long" })}<br />
              <small>{checkIn.toLocaleDateString("en", { weekday: "long" })}</small>
            </span>
          </div>
          <p>Update your weight, photos, recovery and weekly reflection before submission.</p>
          <Link href={`${basePath}/progress`}>Prepare check-in <span>→</span></Link>
        </article>
      </section>
    </PortalShell>
  );
}
