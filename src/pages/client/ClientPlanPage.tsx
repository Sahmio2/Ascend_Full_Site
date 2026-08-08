import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PortalShell from "../../layouts/ClientPortalLayout";
import { dateLabel, parseWorkoutPlan } from "../../types/getDivine";
import { authStore } from "../../services/authStore";
import { useClientPortalData } from "../../features/get-divine/data/useClientPortalData";

export default function ClientPlanPage() {
  const location = useLocation();
  const session = authStore.getSession();
  const demo = location.pathname.startsWith("/demo") || session.mode === "demo";
  const scope = demo ? "demo" : "live";
  const { clientData } = useClientPortalData(scope);

  const clientName = session.clientName || clientData.person.full_name;
  const signOutPath = "/login";
  const [notice, setNotice] = useState("");

  const activeProgramme = clientData.assignments.find((item) => item.status === "active") ?? clientData.assignments[0];
  const workoutPlan = useMemo(() => parseWorkoutPlan(activeProgramme?.workout_plan), [activeProgramme?.workout_plan]);
  const basePath = demo ? "/demo" : "/client";

  return (
    <PortalShell clientName={clientName} signOutPath={signOutPath} demo={demo} current="plan" phase={clientData.person.phase}>
      {notice && <div className="portal-notice"><span>Update</span><p>{notice}</p><button onClick={() => setNotice("")} aria-label="Dismiss update">×</button></div>}
      <section className="portal-page-heading">
        <div><p className="portal-kicker">Get Divine plan</p><h1>Your week, already decided.</h1><p>Follow the programme your coach assigned—sets, reps, tempo and execution notes are all here.</p></div>
        <Link className="portal-page-action" to={`${basePath}/workout-logger`}>Start a workout <span>→</span></Link>
      </section>

      <section className="portal-overview portal-page-overview">
        <article><span>Active programme</span><strong>{activeProgramme?.title || "Preparing your plan"}</strong><small>{activeProgramme ? `${dateLabel(activeProgramme.starts_on)} — ${dateLabel(activeProgramme.ends_on)}` : "Your coach will publish this"}</small></article>
        <article><span>Weekly frequency</span><strong>{activeProgramme?.days_per_week || workoutPlan.length || "—"} days</strong><small>Primary sessions</small></article>
        <article><span>Current phase</span><strong>{activeProgramme?.phase || clientData.person.phase || "Ascension"}</strong><small>Coach assigned</small></article>
      </section>

      <section className="portal-plan-layout">
        <div className="portal-plan-days">
          <div className="portal-section-heading"><div><p className="portal-kicker">Workout routines</p><h2>Programme days</h2></div><span>{workoutPlan.length} days</span></div>
          {workoutPlan.map((workout, workoutIndex) => (
            <article className="portal-plan-day" key={workout.id}>
              <header><div><span>Day {String(workoutIndex + 1).padStart(2, "0")}</span><h3>{workout.name}</h3><p>{workout.focus}</p></div><strong>{workout.exercises.length} exercises</strong></header>
              <div className="portal-plan-exercises">
                {workout.exercises.map((exercise, exerciseIndex) => (
                  <div key={exercise.id}><span>{String(exerciseIndex + 1).padStart(2, "0")}</span><p><strong>{exercise.name}</strong><small>{exercise.setPrescription || exercise.prescribedSets} sets · {exercise.reps} reps · {exercise.rest}</small>{exercise.notes && <em>{exercise.notes}</em>}</p><b>{exercise.tempo || "Controlled"}</b></div>
                ))}
              </div>
            </article>
          ))}
          {!workoutPlan.length && <div className="portal-empty-state"><span>Plan in preparation</span><h3>Your workout days will appear here.</h3><p>Your coach’s uploaded programme automatically builds this weekly view.</p></div>}
        </div>

        <aside className="portal-plan-aside">
          <article className="portal-panel"><p className="portal-kicker">Coach direction</p><h2>How to use this block.</h2><p>{activeProgramme?.athlete_instructions || "Move with control, record every working set, and stop any movement that creates sharp pain."}</p></article>
          <article className="portal-panel"><p className="portal-kicker">Plan documents</p><div className="portal-document-list">{clientData.documents.map((document) => <div key={document.id}><span>{document.document_type === "nutrition" ? "N" : "T"}</span><p><strong>{document.title}</strong><small>{document.file_name}</small></p>{document.demo ? <b>Demo</b> : <a href={`/api/client/documents/${document.id}`}>↓</a>}</div>)}{!clientData.documents.length && <p className="portal-empty-copy">Published documents will appear here.</p>}</div></article>
        </aside>
      </section>
    </PortalShell>
  );
}
