import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import PortalShell from "../../layouts/ClientPortalLayout";
import { ClientData, Exercise, ExerciseSet, ProgrammeExercise, ProgrammeWorkout, Workout, dateLabel, parseWorkoutPlan } from "../../types/getDivine";
import { authStore } from "../../services/authStore";
import { DEMO_CLIENT } from "../../data/demoSeed";

type SavedSet = { set?: number; reps?: string; load?: string };
type SavedExercise = { name?: string; sets?: SavedSet[] };

function exerciseKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function savedExercises(workout: Workout): SavedExercise[] {
  try {
    const result = JSON.parse(workout.exercise_log || "[]");
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

function previousPerformance(workouts: Workout[], exerciseName: string) {
  const key = exerciseKey(exerciseName);
  for (const workout of workouts) {
    const exercise = savedExercises(workout).find((item) => exerciseKey(item.name || "") === key);
    if (exercise?.sets?.length) return { workout, sets: exercise.sets };
  }
  return null;
}

function sessionExercise(exercise: ProgrammeExercise, workouts: Workout[]): Exercise {
  const previous = previousPerformance(workouts, exercise.name);
  const setCount = Math.max(1, Math.min(12, exercise.prescribedSets || 3));
  return {
    ...exercise,
    lastPerformedOn: previous?.workout.workout_date,
    lastWorkoutName: previous?.workout.workout_name,
    sets: Array.from({ length: setCount }, (_, index) => ({
      set: index + 1,
      reps: "",
      load: "",
      completed: false,
      previousReps: previous?.sets[index]?.reps || "",
      previousLoad: previous?.sets[index]?.load || "",
    })),
  };
}

export default function WorkoutLoggerPage() {
  const location = useLocation();
  const session = authStore.getSession();
  const demo = location.pathname.startsWith("/demo") || session.mode === "demo";
  const clientName = session.clientName || DEMO_CLIENT.full_name;
  const signOutPath = "/login";

  const [data, setData] = useState<ClientData | null>({
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
    workouts: [
      { id: "w1", workout_date: "2026-08-04", workout_name: "Upper Body Hypertrophy & Density", completion_status: "completed", duration_minutes: 60, effort_rating: 8, athlete_note: "Felt strong on incline press", coach_feedback: "Great control, let reps dictate progression.", exercise_log: "" },
    ],
    documents: [],
  });

  const [notice, setNotice] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("");
  const activeProgramme = data?.assignments.find((item) => item.status === "active") ?? data?.assignments[0];
  const workoutPlan = useMemo(() => parseWorkoutPlan(activeProgramme?.workout_plan), [activeProgramme?.workout_plan]);
  const selectedWorkout = workoutPlan.find((workout) => workout.id === selectedWorkoutId);
  const recordedSets = exercises.reduce((total, exercise) => total + exercise.sets.filter((set) => set.completed || set.reps || set.load).length, 0);

  function selectWorkout(workout: ProgrammeWorkout) {
    setSelectedWorkoutId(workout.id);
    setExercises(workout.exercises.map((exercise) => sessionExercise(exercise, data?.workouts ?? [])));
    setNotice("");
  }

  function updateSet(exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: string | boolean) {
    setExercises((current) => current.map((exercise, i) => i !== exerciseIndex ? exercise : {
      ...exercise,
      sets: exercise.sets.map((set, j) => j === setIndex ? { ...set, [field]: value } : set),
    }));
  }

  function repeatLast(exerciseIndex: number) {
    setExercises((current) => current.map((exercise, index) => index !== exerciseIndex ? exercise : ({
      ...exercise,
      sets: exercise.sets.map((set) => ({ ...set, reps: set.previousReps || set.reps, load: set.previousLoad || set.load })),
    })));
  }

  function saveWorkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkout) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const completedExercises = exercises.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets.filter((set) => set.completed || set.reps || set.load),
    })).filter((exercise) => exercise.sets.length);
    if (!completedExercises.length) {
      setNotice("Record at least one working set before completing the workout.");
      return;
    }
    const newWorkout: Workout = {
      id: `w-${Date.now()}`,
      workout_date: (form.get("workoutDate") as string) || new Date().toISOString().split("T")[0],
      workout_name: selectedWorkout.name,
      completion_status: "completed",
      duration_minutes: Number(form.get("durationMinutes")) || 60,
      effort_rating: Number(form.get("effortRating")) || 8,
      athlete_note: (form.get("athleteNote") as string) || "",
      coach_feedback: "",
      exercise_log: JSON.stringify(completedExercises),
    };
    setData((current) => current ? { ...current, workouts: [newWorkout, ...current.workouts] } : null);
    setNotice(demo ? "Demo workout completed. No real client record was changed." : "Workout completed and sent to your coach.");
    setExercises([]);
    setSelectedWorkoutId("");
    formElement.reset();
  }

  return (
    <PortalShell clientName={clientName} signOutPath={signOutPath} demo={demo} current="logger" phase={data?.person.phase}>
      <section className="portal-page-heading logger-hero">
        <div><p className="portal-kicker">Programme-powered logger</p><h1>Your workout is already here.</h1><p>Choose today’s programme day. Your exercises, targets and last performance load automatically—record only what you do now.</p></div>
        <div className="logger-hero-stat"><span>Current programme</span><strong>{activeProgramme?.title || "Awaiting upload"}</strong><small>{workoutPlan.length ? `${workoutPlan.length} workout days loaded` : "Your coach will load this"}</small></div>
      </section>
      {notice && <div className="client-notice"><span>Update</span><p>{notice}</p><button onClick={() => setNotice("")} aria-label="Dismiss update">×</button></div>}

      <section className="programme-day-picker" aria-labelledby="programme-day-heading">
        <div className="client-section-head"><div><p className="eyebrow">Step 01</p><h2 id="programme-day-heading">Select today’s day.</h2><p>The programme upload creates this list automatically. No exercise entry is required.</p></div><span>{workoutPlan.length} days</span></div>
        {workoutPlan.length ? <div className="programme-day-grid">
          {workoutPlan.map((workout, index) => <button key={workout.id} type="button" className={selectedWorkoutId === workout.id ? "selected" : ""} onClick={() => selectWorkout(workout)}>
            <span>Day {String(index + 1).padStart(2, "0")}{workout.optional ? " · Optional" : ""}</span>
            <strong>{workout.name}</strong>
            <small>{workout.exercises.length} exercises <b>{selectedWorkoutId === workout.id ? "Loaded" : "Open →"}</b></small>
          </button>)}
        </div> : <div className="programme-empty"><span>Programme required</span><h3>No workout days have been loaded yet.</h3><p>Your coach can upload the completed Get Divine Training Plan as a DOCX. Its workout tables will become selectable days here automatically.</p></div>}
      </section>

      {selectedWorkout && <section className="client-grid logger-page-grid">
        <form className="workout-logger programme-logger" onSubmit={saveWorkout}>
          <div className="client-section-head workout-session-head"><div><p className="eyebrow">Step 02 · Today’s session</p><h2>{selectedWorkout.name}</h2><p>{selectedWorkout.focus}</p></div><span>{recordedSets} sets recorded</span></div>
          <div className="logger-meta">
            <label><span>Date</span><input name="workoutDate" type="date" required defaultValue={new Date().toISOString().slice(0,10)} /></label>
            <label><span>Minutes</span><input name="durationMinutes" type="number" min="1" max="300" placeholder="60" /></label>
            <label><span>Session RPE</span><input name="effortRating" type="number" min="1" max="10" placeholder="8" /></label>
          </div>
          <div className="exercise-list prescribed-exercise-list">
            {exercises.map((exercise, exerciseIndex) => <article className="exercise-entry prescribed-exercise" key={exercise.id}>
              <header>
                <div><span>Exercise {String(exerciseIndex + 1).padStart(2, "0")}</span><h3>{exercise.name}</h3></div>
                <div className="prescription-tags">{exercise.type && <span>{exercise.type}</span>}<span>{exercise.setPrescription || exercise.prescribedSets} sets</span>{exercise.reps && <span>{exercise.reps} reps</span>}{exercise.rest && <span>{exercise.rest} rest</span>}{exercise.tempo && <span>Tempo {exercise.tempo}</span>}</div>
                {exercise.notes && <p>{exercise.notes}</p>}
                <div className="last-performance">
                  <div><span>Last performance</span><strong>{exercise.lastPerformedOn ? `${dateLabel(exercise.lastPerformedOn)} · ${exercise.lastWorkoutName}` : "First recorded session"}</strong></div>
                  {exercise.sets.some((set) => set.previousLoad || set.previousReps) && <button type="button" onClick={() => repeatLast(exerciseIndex)}>Use last numbers</button>}
                </div>
              </header>
              <div className="set-head"><span>Set</span><span>Last time</span><span>Reps now</span><span>Load now</span><span>Done</span></div>
              {exercise.sets.map((set, setIndex) => <div className={`set-row ${set.completed ? "complete" : ""}`} key={setIndex}>
                <b>{set.set}</b>
                <span className="previous-set">{set.previousLoad || set.previousReps ? <><strong>{set.previousLoad || "—"}</strong><small>{set.previousReps ? ` × ${set.previousReps}` : ""}</small></> : "—"}</span>
                <input aria-label={`${exercise.name} set ${set.set} reps`} value={set.reps} onChange={(event) => updateSet(exerciseIndex, setIndex, "reps", event.target.value)} inputMode="numeric" placeholder={exercise.reps || "reps"} />
                <input aria-label={`${exercise.name} set ${set.set} load`} value={set.load} onChange={(event) => updateSet(exerciseIndex, setIndex, "load", event.target.value)} placeholder="kg" inputMode="decimal" />
                <label className="set-complete"><input type="checkbox" checked={Boolean(set.completed)} onChange={(event) => updateSet(exerciseIndex, setIndex, "completed", event.target.checked)} /><span>✓</span></label>
              </div>)}
              <button type="button" className="add-set" onClick={() => setExercises((current) => current.map((item, index) => index === exerciseIndex ? { ...item, sets: [...item.sets, { set: item.sets.length + 1, reps: "", load: "", completed: false }] } : item))}>+ Add an extra set</button>
            </article>)}
          </div>
          <label className="logger-note"><span>Session notes, pain or recovery</span><textarea name="athleteNote" rows={4} placeholder="Tell your coach what changed, felt strong or needs attention." /></label>
          <button className="complete-workout" type="submit">Complete {selectedWorkout.name} <span>→</span></button>
        </form>
        <aside className="client-side">
          <article><p className="eyebrow">Programme direction</p><h2>{activeProgramme?.title || "Your programme"}</h2><p>{activeProgramme?.athlete_instructions || "Move with control, record every working set and stop any movement that creates sharp pain."}</p>{activeProgramme && <small>{dateLabel(activeProgramme.starts_on)} — {dateLabel(activeProgramme.ends_on)}</small>}</article>
          <article><p className="eyebrow">Workout history</p><div className="history-list">{data?.workouts.slice(0, 8).map((workout) => <div key={workout.id}><span>{new Date(workout.workout_date).getDate()}</span><div><strong>{workout.workout_name}</strong><small>{dateLabel(workout.workout_date)} · RPE {workout.effort_rating || "—"}</small>{workout.coach_feedback && <p>Coach: {workout.coach_feedback}</p>}</div></div>)}{!data?.workouts.length && <p className="client-empty">Your completed workouts will appear here.</p>}</div></article>
        </aside>
      </section>}
    </PortalShell>
  );
}
