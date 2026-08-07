import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PortalShell from "../../layouts/ClientPortalLayout";
import { ClientData, parseWorkoutPlan } from "../../types/getDivine";
import { authStore } from "../../services/authStore";
import { DEMO_CLIENT } from "../../data/demoSeed";

type MacroItem = { logged: number; target: number; unit: string };
const nutrition: Record<string, MacroItem> = {
  calories: { logged: 1620, target: 2250, unit: "kcal" },
  protein: { logged: 126, target: 170, unit: "g" },
  carbs: { logged: 164, target: 245, unit: "g" },
  fats: { logged: 54, target: 70, unit: "g" },
};

function ProgressBar({ value, target }: { value: number; target: number }) {
  const percentage = Math.min(100, Math.round((value / target) * 100));
  return <span className="portal-progress-track"><i style={{ width: `${percentage}%` }} /></span>;
}

export default function ClientDashboardPage() {
  const location = useLocation();
  const session = authStore.getSession();
  const demo = location.pathname.startsWith("/demo") || session.mode === "demo";
  const clientName = session.clientName || DEMO_CLIENT.full_name;
  const signOutPath = "/login";

  const [data] = useState<ClientData | null>({
    person: {
      full_name: clientName,
      phase: "Phase II — Forging the Form",
      primary_goal: "Build visible shoulder & glute shape while maintaining low body fat.",
      next_check_in: "2026-08-10",
    },
    assignments: [
      {
        id: "assign-1",
        title: "Ascension Block 01 — Hypertrophy & Density",
        phase: "Phase II — Forging the Form",
        days_per_week: 4,
        starts_on: "2026-07-20",
        ends_on: "2026-08-16",
        athlete_instructions: "Record every working set. Control 2-second eccentrics.",
        primary_workouts: "",
        optional_workouts: "",
        workout_plan: JSON.stringify([
          {
            id: "d1",
            name: "Upper Body Hypertrophy & Density",
            focus: "Upper Body (Chest, Back, Delts)",
            optional: false,
            exercises: [
              { id: "e1", name: "Incline Dumbbell Bench Press", type: "Primary Compound", prescribedSets: 4, setPrescription: "4", reps: "8–10", rest: "90s", tempo: "2-0-1-0", notes: "Retract scapula" },
            ],
          },
        ]),
        status: "active",
      },
    ],
    workouts: [
      { id: "w1", workout_date: "2026-08-04", workout_name: "Upper Body", completion_status: "completed", duration_minutes: 60, effort_rating: 8, athlete_note: "", coach_feedback: "", exercise_log: "" },
      { id: "w2", workout_date: "2026-08-06", workout_name: "Lower Body", completion_status: "completed", duration_minutes: 60, effort_rating: 8, athlete_note: "", coach_feedback: "", exercise_log: "" },
    ],
    documents: [],
  });

  const [loading] = useState(false);
  const [notice, setNotice] = useState("");
  const activeProgramme = data?.assignments.find((item) => item.status === "active") ?? data?.assignments[0];
  const completed = useMemo(() => data?.workouts.filter((item) => item.completion_status === "completed").length ?? 0, [data]);
  const programmeDays = useMemo(() => parseWorkoutPlan(activeProgramme?.workout_plan), [activeProgramme?.workout_plan]);
  const todaysWorkout = programmeDays[completed % Math.max(programmeDays.length, 1)] ?? programmeDays[0];
  const basePath = demo ? "/demo" : "/client";
  const firstName = clientName.split(" ")[0];
  const phaseName = data?.person.phase || "Forging the Form";
  const phaseRoman = /taming/i.test(phaseName) ? "I" : /ascen/i.test(phaseName) ? "III" : "II";

  const caloriePercent = Math.round((nutrition.calories.logged / nutrition.calories.target) * 100);
  const caloriesRemaining = nutrition.calories.target - nutrition.calories.logged;

  return (
    <PortalShell clientName={clientName} signOutPath={signOutPath} demo={demo} current="dashboard" phase={data?.person.phase}>
      {notice && <div className="portal-notice"><span>Update</span><p>{notice}</p><button onClick={() => setNotice("")} aria-label="Dismiss update">×</button></div>}

      <section className="portal-welcome">
        <div>
          <p className="portal-kicker">Friday, 7 August · The work continues</p>
          <h1>Welcome back, <em>{firstName}.</em></h1>
          <p>{loading ? "Opening your coaching plan…" : data?.person.primary_goal || "Every deliberate action becomes part of the form you are building."}</p>
        </div>
      </section>

      <section className="portal-journey-strip" aria-label="Current coaching overview">
        <article className="portal-journey-streak">
          <div className="portal-streak-count">
            <strong>{String(completed).padStart(2, "0")}</strong>
            <span>session<br />streak</span>
          </div>
          <p><span>Consistency</span><small>2 this week · 86% adherence</small></p>
        </article>
        <article className="portal-journey-phase">
          <div className="portal-phase-index"><b>Phase {phaseRoman}</b><i aria-hidden="true">◆</i></div>
          <div className="portal-phase-summary">
            <p><span>Current training phase</span><strong>{phaseName}</strong></p>
            <p><span>Active programme</span><strong>{activeProgramme?.title || "Ascension Block 01"}</strong><small>{activeProgramme ? `${activeProgramme.days_per_week} training days · Week 3 of 4` : "Preparing your assignment"}</small></p>
          </div>
        </article>
      </section>

      <section className="portal-dashboard-grid">
        <article className="portal-panel portal-nutrition-card">
          <header><div><p className="portal-kicker">Today’s nutrition</p><h2>Fuel the work.</h2></div><Link to={`${basePath}/nutrition`}>View nutrition <span>→</span></Link></header>
          <div className="portal-nutrition-main">
            <div className="portal-calorie-ring" style={{ "--progress": `${caloriePercent * 3.6}deg` } as React.CSSProperties}>
              <div><strong>{caloriesRemaining}</strong><span>kcal left</span></div>
            </div>
            <div className="portal-nutrition-details">
              <div className="portal-calorie-action"><span>Daily target</span><strong>{nutrition.calories.target.toLocaleString()} kcal</strong><Link to={`${basePath}/nutrition?tab=food-log`}>+ Log food</Link></div>
              <div className="portal-macro-grid">
                {Object.entries(nutrition).filter(([key]) => key !== "calories").map(([key, value]) => (
                  <div key={key}><span><b>{key}</b><small>{value.logged}{value.unit} / {value.target}{value.unit}</small></span><ProgressBar value={value.logged} target={value.target} /></div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="portal-panel portal-workout-card">
          <header><div><p className="portal-kicker">Today’s training</p><h2>{todaysWorkout?.name || "Upper A — Press & Pull"}</h2></div><span className="portal-status"><i /> Scheduled</span></header>
          <div className="portal-workout-meta"><span><b>60–70</b> minutes</span><span><b>{todaysWorkout?.exercises?.length || 4}</b> exercises</span></div>
          <Link className="portal-primary-action" to={`${basePath}/workout-logger`}>Start today’s workout <span>→</span></Link>
        </article>
      </section>

      <section className="portal-lower-grid">
        <article className="portal-panel portal-coach-note">
          <header><p className="portal-kicker">From your coach</p><span>06 Aug</span></header>
          <blockquote>“Excellent control this week. Keep the squat load, add one clean rep to set three, and let the technique—not ego—decide the progression.”</blockquote>
          <div><span>SE</span><p><strong>Sahmi El</strong><small>Coach feedback</small></p></div>
        </article>

        <article className="portal-panel portal-checkin-card">
          <p className="portal-kicker">Next check-in</p>
          <div><strong>10</strong><span>August<br /><small>Sunday</small></span></div>
          <p>Update your weight, photos, recovery and weekly reflection before submission.</p>
          <Link to={`${basePath}/progress`}>Prepare check-in <span>→</span></Link>
        </article>
      </section>
    </PortalShell>
  );
}
