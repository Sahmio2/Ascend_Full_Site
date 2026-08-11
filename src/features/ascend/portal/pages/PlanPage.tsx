import { Link } from "react-router-dom";
import PortalShell from "../components/PortalShell";
import { useClientPortalData } from "../data/useClientPortalData";
import type { PortalScope } from "../data/types";

export default function PlanPage({ scope }: { scope: PortalScope }) {
  const data = useClientPortalData(scope);
  const basePath = scope === "demo" ? "/demo" : "/client";
  return (
    <PortalShell scope={scope} current="plan" clientName={data.client.fullName} phase={data.client.phaseName}>
      <section className="portal-page-heading"><div><p className="portal-kicker">ASCEND plan</p><h1>Your week, already decided.</h1><p>Follow the programme your coach assigned—sets, reps, rest, tempo and execution notes are all here.</p></div><Link className="portal-page-action" to={`${basePath}/workout-logger`}>Start a workout <span>→</span></Link></section>
      <section className="portal-overview portal-page-overview"><article><span>Active programme</span><strong>{data.programme.title}</strong><small>{data.programme.subtitle}</small></article><article><span>Weekly frequency</span><strong>{data.programme.days.length} days</strong><small>Primary sessions</small></article><article><span>Current phase</span><strong>{data.client.phaseName}</strong><small>Coach assigned</small></article></section>
      <section className="portal-plan-layout">
        <div className="portal-plan-days"><div className="portal-section-heading"><div><p className="portal-kicker">Workout routines</p><h2>Programme days</h2></div><span>{data.programme.days.length} days</span></div>
          {data.programme.days.map((day, dayIndex) => <article className="portal-plan-day" key={day.id}><header><div><span>Day {String(dayIndex + 1).padStart(2, "0")}</span><h3>{day.name}</h3><p>{day.focus}</p></div><strong>{day.exercises.length} exercises</strong></header><div className="portal-plan-exercises">{day.exercises.map((exercise, exerciseIndex) => <div key={exercise.id}><span>{String(exerciseIndex + 1).padStart(2, "0")}</span><p><strong>{exercise.name}</strong><small>{exercise.prescribedSets} sets · {exercise.reps} reps · {exercise.rest}</small><em>{exercise.notes}</em></p><b>{exercise.tempo}</b></div>)}</div></article>)}
        </div>
        <aside className="portal-plan-aside"><article className="portal-panel"><p className="portal-kicker">Coach direction</p><h2>How to use this block.</h2><p>{data.programme.athleteDirection}</p></article><article className="portal-panel"><p className="portal-kicker">Plan documents</p><div className="portal-document-list">{data.documents.map((document) => <div key={document.id}><span>{document.type === "nutrition" ? "N" : "T"}</span><p><strong>{document.title}</strong><small>{document.fileName}</small></p><b>{scope === "demo" ? "Demo" : "Open"}</b></div>)}</div></article></aside>
      </section>
    </PortalShell>
  );
}
