import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PortalShell from "../../layouts/ClientPortalLayout";
import { parseWorkoutPlan } from "../../types/getDivine";
import { authStore } from "../../services/authStore";
import { useClientPortalData } from "../../features/get-divine/data/useClientPortalData";
import { clientPortalAdapter } from "../../features/get-divine/data/clientPortalAdapter";

function ProgressBar({ value, target }: { value: number; target: number }) {
  const percentage = Math.min(100, Math.round((value / target) * 100));
  return <span className="portal-progress-track"><i style={{ width: `${percentage}%` }} /></span>;
}

export default function ClientDashboardPage() {
  const location = useLocation();
  const session = authStore.getSession();
  const demo = location.pathname.startsWith("/demo") || session.mode === "demo";
  const scope = demo ? "demo" : "live";
  const { clientData, nutrition, streakDays, adherencePercent } = useClientPortalData(scope);

  const clientName = session.clientName || clientData.person.full_name;
  const signOutPath = "/login";
  const [notice, setNotice] = useState("");

  const activeProgramme = clientData.assignments.find((item) => item.status === "active") ?? clientData.assignments[0];
  const completedWorkouts = useMemo(() => clientData.workouts.filter((item) => item.completion_status === "completed"), [clientData.workouts]);
  const programmeDays = useMemo(() => parseWorkoutPlan(activeProgramme?.workout_plan), [activeProgramme?.workout_plan]);
  const todaysWorkout = programmeDays[completedWorkouts.length % Math.max(programmeDays.length, 1)] ?? programmeDays[0];

  const basePath = demo ? "/demo" : "/client";
  const firstName = clientName.split(" ")[0];
  const phaseName = clientData.person.phase || "Forging the Form";
  const phaseRoman = /taming/i.test(phaseName) ? "I" : /ascen/i.test(phaseName) ? "III" : "II";

  const caloriePercent = Math.round((nutrition.calories.logged / nutrition.calories.target) * 100);
  const caloriesRemaining = Math.max(0, nutrition.calories.target - nutrition.calories.logged);

  const latestCoachFeedback = completedWorkouts.find((w) => w.coach_feedback)?.coach_feedback ||
    "Excellent control this week. Keep the squat load, add one clean rep to set three, and let the technique—not ego—decide the progression.";

  return (
    <PortalShell clientName={clientName} signOutPath={signOutPath} demo={demo} current="dashboard" phase={clientData.person.phase}>
      {notice && <div className="portal-notice"><span>Update</span><p>{notice}</p><button onClick={() => setNotice("")} aria-label="Dismiss update">×</button></div>}

      <section className="portal-welcome">
        <div>
          <p className="portal-kicker">Friday, 7 August · The work continues</p>
          <h1>Welcome back, <em>{firstName}.</em></h1>
          <p>{clientData.person.primary_goal || "Every deliberate action becomes part of the form you are building."}</p>
        </div>
      </section>

      <section className="portal-journey-strip" aria-label="Current coaching overview">
        <article className="portal-journey-streak">
          <div className="portal-streak-count">
            <strong>{String(streakDays).padStart(2, "0")}</strong>
            <span>session<br />streak</span>
          </div>
          <p><span>Consistency</span><small>2 this week · {adherencePercent}% adherence</small></p>
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
                <div><span><b>protein</b><small>{nutrition.protein.logged}g / {nutrition.protein.target}g</small></span><ProgressBar value={nutrition.protein.logged} target={nutrition.protein.target} /></div>
                <div><span><b>carbs</b><small>{nutrition.carbs.logged}g / {nutrition.carbs.target}g</small></span><ProgressBar value={nutrition.carbs.logged} target={nutrition.carbs.target} /></div>
                <div><span><b>fats</b><small>{nutrition.fats.logged}g / {nutrition.fats.target}g</small></span><ProgressBar value={nutrition.fats.logged} target={nutrition.fats.target} /></div>
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
          <blockquote>“{latestCoachFeedback}”</blockquote>
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
