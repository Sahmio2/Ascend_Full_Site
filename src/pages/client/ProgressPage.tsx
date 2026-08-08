import { useState } from "react";
import { useLocation } from "react-router-dom";
import PortalShell from "../../layouts/ClientPortalLayout";
import { dateLabel } from "../../types/getDivine";
import { authStore } from "../../services/authStore";
import { useClientPortalData } from "../../features/get-divine/data/useClientPortalData";

export default function ProgressPage() {
  const location = useLocation();
  const session = authStore.getSession();
  const demo = location.pathname.startsWith("/demo") || session.mode === "demo";
  const scope = demo ? "demo" : "live";
  const { clientData, bodyweightHistory, adherencePercent } = useClientPortalData(scope);

  const clientName = session.clientName || clientData.person.full_name;
  const signOutPath = "/login";

  const [notice, setNotice] = useState("");
  const completed = clientData.workouts.filter((workout) => workout.completion_status === "completed");

  return (
    <PortalShell clientName={clientName} signOutPath={signOutPath} demo={demo} current="progress" phase={clientData.person.phase}>
      {notice && <div className="portal-notice"><span>Update</span><p>{notice}</p><button onClick={() => setNotice("")} aria-label="Dismiss update">×</button></div>}
      <section className="portal-page-heading"><div><p className="portal-kicker">Progress & check-ins</p><h1>Proof of the work.</h1><p>See training consistency, strength progress and the feedback guiding your next week.</p></div><button className="portal-page-action" type="button" onClick={() => setNotice(demo ? "Demo check-in opened for inspection." : "Your next check-in is being prepared.")}>Prepare check-in <span>→</span></button></section>
      <section className="portal-overview portal-page-overview"><article><span>Completed workouts</span><strong>{String(completed.length).padStart(2, "0")}</strong><small>All recorded sessions</small></article><article><span>Training adherence</span><strong>{adherencePercent}%</strong><small>Current block</small></article><article><span>Next check-in</span><strong>{dateLabel(clientData.person.next_check_in || "")}</strong><small>Weight, photos and reflection</small></article></section>
      <section className="portal-progress-layout">
        <div className="portal-panel portal-progress-chart"><header><div><p className="portal-kicker">Bodyweight trend</p><h2>Moving with control.</h2></div><strong>−1.8 kg</strong></header><div className="portal-chart-bars">{bodyweightHistory.map((item, index) => <span key={index} style={{ height: `${(item.weight / 80) * 100}%` }}><i>{item.weight.toFixed(1)} kg</i></span>)}</div><div className="portal-chart-labels"><span>{bodyweightHistory[0]?.week || "Week 1"}</span><span>{bodyweightHistory[bodyweightHistory.length - 1]?.week || "Week 8"}</span></div></div>
        <aside className="portal-panel portal-checkin-summary"><p className="portal-kicker">Check-in readiness</p><h2>Sunday, 10 August</h2><div><span>Bodyweight</span><b>Ready</b></div><div><span>Progress photos</span><b>Due</b></div><div><span>Recovery reflection</span><b>Due</b></div><div><span>Nutrition review</span><b>Ready</b></div><button type="button" onClick={() => setNotice(demo ? "Demo check-in opened for inspection." : "Your next check-in is being prepared.")}>Open check-in <span>→</span></button></aside>
      </section>
      <section className="portal-panel portal-history-panel"><header><div><p className="portal-kicker">Training history</p><h2>Recent sessions</h2></div><strong>{completed.length} logged</strong></header><div className="portal-history-table">{completed.map((workout) => <article key={workout.id}><span>{dateLabel(workout.workout_date)}</span><p><strong>{workout.workout_name}</strong><small>{workout.duration_minutes || "—"} minutes · Session RPE {workout.effort_rating || "—"}</small>{workout.coach_feedback && <em>“{workout.coach_feedback}”</em>}</p><b>Complete</b></article>)}{!completed.length && <p className="portal-empty-copy">Completed workouts will appear here.</p>}</div></section>
    </PortalShell>
  );
}
