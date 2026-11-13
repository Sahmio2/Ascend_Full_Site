"use client";

import { useEffect, useMemo, useState } from "react";
import PortalShell from "../components/PortalShell";
import { clientPortalAdapter } from "../data/clientPortalAdapter";
import { useClientPortalData } from "../data/useClientPortalData";
import type { ExerciseSet, PortalScope } from "../data/types";

import WorkoutsFocusPage from "./WorkoutsFocusPage";

type DraftSet = ExerciseSet & { previousLoad: string; previousReps: string };

export default function WorkoutLoggerPage({ scope }: { scope: PortalScope }) {
  const [viewMode, setViewMode] = useState<"modern" | "classic">("modern");
  const data = useClientPortalData(scope);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<Record<string, DraftSet[]>>({});
  const [duration, setDuration] = useState("60");
  const [effort, setEffort] = useState("8");
  const [note, setNote] = useState("");
  const [painNote, setPainNote] = useState("");
  const [notice, setNotice] = useState("");
  const selectedDay = data.programme.days.find((day) => day.id === selectedId);
  const recordedSets = useMemo(() => Object.values(draft).flat().filter((set) => set.completed || set.load || set.reps).length, [draft]);

  if (viewMode === "modern") {
    return <WorkoutsFocusPage scope={scope} onSwitchToClassic={() => setViewMode("classic")} />;
  }

  useEffect(() => {
    if (!selectedDay) { setDraft({}); return; }
    const next: Record<string, DraftSet[]> = {};
    selectedDay.exercises.forEach((exercise) => {
      const previous = clientPortalAdapter.getLastSets(scope, exercise.name);
      next[exercise.id] = Array.from({ length: exercise.prescribedSets }, (_, index) => ({ set: index + 1, load: "", reps: "", completed: false, previousLoad: previous[index]?.load || "", previousReps: previous[index]?.reps || "" }));
    });
    setDraft(next);
    setNotice("");
  }, [scope, selectedDay]);

  function updateSet(exerciseId: string, setIndex: number, field: "load" | "reps" | "completed", value: string | boolean) {
    setDraft((current) => ({ ...current, [exerciseId]: current[exerciseId].map((set, index) => index === setIndex ? { ...set, [field]: value } : set) }));
  }

  function useLast(exerciseId: string) {
    setDraft((current) => ({ ...current, [exerciseId]: current[exerciseId].map((set) => ({ ...set, load: set.previousLoad || set.load, reps: set.previousReps || set.reps })) }));
  }

  function addSet(exerciseId: string) {
    setDraft((current) => ({ ...current, [exerciseId]: [...current[exerciseId], { set: current[exerciseId].length + 1, load: "", reps: "", completed: false, previousLoad: "", previousReps: "" }] }));
  }

  function saveWorkout() {
    if (!selectedDay) return;
    const exercises = selectedDay.exercises.map((exercise) => ({ exerciseId: exercise.id, name: exercise.name, sets: draft[exercise.id].filter((set) => set.completed || set.load || set.reps).map((set) => ({ set: set.set, load: set.load, reps: set.reps, completed: true })) })).filter((exercise) => exercise.sets.length);
    if (!exercises.length) { setNotice("Record at least one working set before completing the workout."); return; }
    clientPortalAdapter.saveWorkout(scope, { programmeDayId: selectedDay.id, workoutName: selectedDay.name, workoutDate: new Date().toISOString().slice(0, 10), durationMinutes: Number(duration), effortRating: Number(effort), athleteNote: note, painNote, exercises });
    setNotice("Workout saved. These sets are now the latest values shown next time.");
    setSelectedId(""); setNote(""); setPainNote("");
  }

  return (
    <PortalShell scope={scope} current="logger" clientName={data.client.fullName} phase={data.client.phaseName}>
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
          Viewing <strong>Classic Workout Logger</strong>
        </span>
        <button
          onClick={() => setViewMode("modern")}
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
          ← Return to Focus Mode (Approved UX)
        </button>
      </div>
      <section className="portal-page-heading logger-hero"><div><p className="portal-kicker">Programme-powered logger</p><h1>Your workout is already here.</h1><p>Choose today’s programme day. Exercises, targets and last performance load automatically—record only what you do now.</p></div><div className="logger-hero-stat"><span>Current programme</span><strong>{data.programme.title}</strong><small>{data.programme.days.length} workout days loaded</small></div></section>
      {notice && <div className="client-notice" role="status"><span>Update</span><p>{notice}</p><button type="button" onClick={() => setNotice("")} aria-label="Dismiss update">×</button></div>}
      <section className="programme-day-picker" aria-labelledby="programme-day-heading"><div className="client-section-head"><div><p className="eyebrow">Step 01</p><h2 id="programme-day-heading">Select today’s day.</h2><p>Your coach’s programme created this list automatically. No exercise entry is required.</p></div><span>{data.programme.days.length} days</span></div><div className="programme-day-grid">{data.programme.days.map((day, index) => <button key={day.id} type="button" className={selectedId === day.id ? "selected" : ""} onClick={() => setSelectedId(day.id)}><span>Day {String(index + 1).padStart(2, "0")}</span><strong>{day.name}</strong><small>{day.exercises.length} exercises <b>{selectedId === day.id ? "Loaded" : "Open →"}</b></small></button>)}</div></section>
      {selectedDay && <section className="client-grid logger-page-grid"><div className="workout-logger programme-logger"><div className="client-section-head workout-session-head"><div><p className="eyebrow">Step 02 · Today’s session</p><h2>{selectedDay.name}</h2><p>{selectedDay.focus}</p></div><span>{recordedSets} sets recorded</span></div><div className="logger-meta"><label><span>Minutes</span><input type="number" min="1" max="300" value={duration} onChange={(event) => setDuration(event.target.value)} /></label><label><span>Session RPE</span><input type="number" min="1" max="10" value={effort} onChange={(event) => setEffort(event.target.value)} /></label></div>
        <div className="exercise-list prescribed-exercise-list">{selectedDay.exercises.map((exercise, exerciseIndex) => <article className="exercise-entry prescribed-exercise" key={exercise.id}><header><div><span>Exercise {String(exerciseIndex + 1).padStart(2, "0")}</span><h3>{exercise.name}</h3></div><div className="prescription-tags"><span>{exercise.type}</span><span>{exercise.prescribedSets} sets</span><span>{exercise.reps} reps</span><span>{exercise.rest} rest</span><span>Tempo {exercise.tempo}</span></div><p>{exercise.notes}</p><div className="last-performance"><div><span>Last performance</span><strong>{draft[exercise.id]?.some((set) => set.previousLoad || set.previousReps) ? "Loaded from your latest comparable session" : "First recorded session"}</strong></div>{draft[exercise.id]?.some((set) => set.previousLoad || set.previousReps) && <button type="button" onClick={() => useLast(exercise.id)}>Use last numbers</button>}</div></header><div className="set-head"><span>Set</span><span>Last time</span><span>Reps now</span><span>Load now</span><span>Done</span></div>{draft[exercise.id]?.map((set, setIndex) => <div className={`set-row ${set.completed ? "complete" : ""}`} key={set.set}><b>{set.set}</b><span className="previous-set">{set.previousLoad || set.previousReps ? <><strong>{set.previousLoad || "—"} kg</strong><small>{set.previousReps ? ` × ${set.previousReps}` : ""}</small></> : "—"}</span><input aria-label={`${exercise.name} set ${set.set} reps`} value={set.reps} onChange={(event) => updateSet(exercise.id, setIndex, "reps", event.target.value)} inputMode="numeric" placeholder={exercise.reps} /><input aria-label={`${exercise.name} set ${set.set} load`} value={set.load} onChange={(event) => updateSet(exercise.id, setIndex, "load", event.target.value)} inputMode="decimal" placeholder="kg" /><label className="set-complete"><input type="checkbox" checked={set.completed} onChange={(event) => updateSet(exercise.id, setIndex, "completed", event.target.checked)} /><span>✓</span></label></div>)}<button type="button" className="add-set" onClick={() => addSet(exercise.id)}>+ Add an extra set</button></article>)}</div>
        <label className="logger-note"><span>Session notes</span><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What felt strong or needs attention?" /></label><label className="logger-note"><span>Pain or movement concern</span><textarea rows={2} value={painNote} onChange={(event) => setPainNote(event.target.value)} placeholder="Report sharp pain, worsening symptoms or movement concerns." /></label><button className="complete-workout" type="button" onClick={saveWorkout}>Complete {selectedDay.name} <span>→</span></button></div>
        <aside className="client-side"><article><p className="eyebrow">Programme direction</p><h2>{data.programme.title}</h2><p>{data.programme.athleteDirection}</p><small>Week {data.programme.week} of {data.programme.totalWeeks}</small></article><article><p className="eyebrow">Workout history</p><div className="history-list">{data.workouts.slice(0, 8).map((workout) => <div key={workout.id}><span>{new Date(`${workout.workoutDate}T12:00:00`).getDate()}</span><div><strong>{workout.workoutName}</strong><small>{workout.durationMinutes} min · RPE {workout.effortRating}</small>{workout.coachFeedback && <p>Coach: {workout.coachFeedback}</p>}</div></div>)}</div></article></aside>
      </section>}
    </PortalShell>
  );
}
