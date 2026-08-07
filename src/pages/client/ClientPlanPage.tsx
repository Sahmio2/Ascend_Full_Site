import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PortalShell from "../../layouts/ClientPortalLayout";
import { ClientData, dateLabel, parseWorkoutPlan } from "../../types/getDivine";
import { authStore } from "../../services/authStore";
import { DEMO_CLIENT } from "../../data/demoSeed";

export default function ClientPlanPage() {
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
              { id: "e2", name: "Chest Supported Row", type: "Primary Compound", prescribedSets: 4, setPrescription: "4", reps: "10–12", rest: "90s", tempo: "2-0-1-0", notes: "Pause at contraction" },
              { id: "e3", name: "Standing Cable Lateral Raise", type: "Accessory", prescribedSets: 4, setPrescription: "4", reps: "12–15", rest: "60s", tempo: "1-0-1-0", notes: "Lead with elbows" },
            ],
          },
          {
            id: "d2",
            name: "Lower Body Quad & Glute Focus",
            focus: "Lower Body (Quads, Glutes, Calves)",
            optional: false,
            exercises: [
              { id: "e4", name: "Barbell Back Squat", type: "Primary Compound", prescribedSets: 4, setPrescription: "4", reps: "6–8", rest: "120s", tempo: "3-0-1-0", notes: "Hit parallel with balance" },
              { id: "e5", name: "Romanian Deadlift", type: "Posterior Chain", prescribedSets: 3, setPrescription: "3", reps: "8–10", rest: "90s", tempo: "3-1-1-0", notes: "Push hips back to wall" },
            ],
          },
        ]),
        status: "active",
      },
    ],
    workouts: [],
    documents: [
      { id: "doc-1", title: "Master Training Prescription", document_type: "training", file_name: "Ascension_Block_01.pdf", file_size: 2048, updated_at: "2026-07-20", demo: true },
      { id: "doc-2", title: "Nutrition Protocol & Refeed Framework", document_type: "nutrition", file_name: "Nutrition_Guidelines.pdf", file_size: 1024, updated_at: "2026-07-20", demo: true },
    ],
  });

  const [notice, setNotice] = useState("");
  const activeProgramme = data?.assignments.find((item) => item.status === "active") ?? data?.assignments[0];
  const workoutPlan = useMemo(() => parseWorkoutPlan(activeProgramme?.workout_plan), [activeProgramme?.workout_plan]);
  const basePath = demo ? "/demo" : "/client";

  return (
    <PortalShell clientName={clientName} signOutPath={signOutPath} demo={demo} current="plan" phase={data?.person.phase}>
      {notice && <div className="portal-notice"><span>Update</span><p>{notice}</p><button onClick={() => setNotice("")} aria-label="Dismiss update">×</button></div>}
      <section className="portal-page-heading">
        <div><p className="portal-kicker">Get Divine plan</p><h1>Your week, already decided.</h1><p>Follow the programme your coach assigned—sets, reps, tempo and execution notes are all here.</p></div>
        <Link className="portal-page-action" to={`${basePath}/workout-logger`}>Start a workout <span>→</span></Link>
      </section>

      <section className="portal-overview portal-page-overview">
        <article><span>Active programme</span><strong>{activeProgramme?.title || "Preparing your plan"}</strong><small>{activeProgramme ? `${dateLabel(activeProgramme.starts_on)} — ${dateLabel(activeProgramme.ends_on)}` : "Your coach will publish this"}</small></article>
        <article><span>Weekly frequency</span><strong>{activeProgramme?.days_per_week || workoutPlan.length || "—"} days</strong><small>Primary sessions</small></article>
        <article><span>Current phase</span><strong>{activeProgramme?.phase || data?.person.phase || "Ascension"}</strong><small>Coach assigned</small></article>
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
          <article className="portal-panel"><p className="portal-kicker">Plan documents</p><div className="portal-document-list">{data?.documents.map((document) => <div key={document.id}><span>{document.document_type === "nutrition" ? "N" : "T"}</span><p><strong>{document.title}</strong><small>{document.file_name}</small></p>{document.demo ? <b>Demo</b> : <a href={`/api/client/documents/${document.id}`}>↓</a>}</div>)}{!data?.documents.length && <p className="portal-empty-copy">Published documents will appear here.</p>}</div></article>
        </aside>
      </section>
    </PortalShell>
  );
}
