import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dataStore, Assignment, Workout } from "../services/dataStore";

type ExerciseSet = { set: number; reps: string; load: string; rir: string };
type Exercise = { name: string; sets: ExerciseSet[] };

const newExercise = (): Exercise => ({
  name: "",
  sets: [1, 2, 3].map((set) => ({ set, reps: "", load: "", rir: "" })),
});

function dateLabel(value: string) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function ClientPage() {
  const [clientEmail, setClientEmail] = useState("amara@example.com");
  const [data, setData] = useState<{
    person: { full_name: string; phase: string; primary_goal: string; next_check_in: string };
    assignments: Assignment[];
    workouts: Workout[];
  } | null>(null);

  const [notice, setNotice] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([newExercise()]);

  function refresh() {
    const people = dataStore.getPeople();
    const match = people.find((p) => p.email.toLowerCase() === clientEmail.toLowerCase() && p.kind === "client") || people[0];
    const assignments = dataStore.getAssignments().filter((a) => a.person_id === match?.id || a.person_id === "sample-1");
    const workouts = dataStore.getWorkouts().filter((w) => w.person_id === match?.id || w.person_id === "sample-1");

    setData({
      person: {
        full_name: match ? match.full_name : "Amara O.",
        phase: match ? match.phase : "Forging the Form",
        primary_goal: match ? match.primary_goal : "Body recomposition",
        next_check_in: match ? match.next_check_in : "2026-07-31",
      },
      assignments,
      workouts,
    });
  }

  useEffect(() => {
    refresh();
  }, [clientEmail]);

  const activeProgramme = data?.assignments.find((item) => item.status === "active") ?? data?.assignments[0];
  const completed = useMemo(() => data?.workouts.filter((item) => item.completion_status === "completed").length ?? 0, [data]);

  function updateSet(exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: string) {
    setExercises((current) =>
      current.map((exercise, i) =>
        i !== exerciseIndex
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set, j) => (j === setIndex ? { ...set, [field]: value } : set)),
            }
      )
    );
  }

  function saveWorkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const workoutName = (form.get("workoutName") as string) || "";
    const workoutDate = (form.get("workoutDate") as string) || "";
    if (!workoutName || !workoutDate) {
      setNotice("Workout name and date are required.");
      return;
    }
    const validExercises = exercises.filter((e) => e.name.trim());
    if (!validExercises.length) {
      setNotice("Add at least one exercise.");
      return;
    }

    dataStore.addWorkout({
      person_id: "sample-1",
      full_name: data?.person.full_name,
      workout_date: workoutDate,
      workout_name: workoutName,
      completion_status: "completed",
      duration_minutes: Number(form.get("durationMinutes")) || 60,
      effort_rating: Number(form.get("effortRating")) || 8,
      athlete_note: (form.get("athleteNote") as string) || "",
      coach_feedback: "",
      exercise_log: JSON.stringify(validExercises),
    });

    setNotice("Workout completed and sent to your coach.");
    setExercises([newExercise()]);
    event.currentTarget.reset();
    refresh();
  }

  return (
    <main className="client-app">
      <header className="client-nav">
        <Link className="wordmark" to="/"><span>GET</span> DIVINE</Link>
        <div>
          <span>{data?.person.full_name || "Client Portal"}</span>
          <Link to="/" className="quiet-link">Exit</Link>
        </div>
      </header>

      <section className="client-hero">
        <div>
          <p className="eyebrow">Your private training space</p>
          <h1>Train with intention.</h1>
          <p>{data?.person.primary_goal || "Every set is part of the standard you are building."}</p>
        </div>
        <div className="client-phase">
          <span>Current phase</span>
          <strong>{data?.person.phase || "Awaiting assignment"}</strong>
        </div>
      </section>

      {notice && (
        <div className="client-notice">
          <span>Update</span>
          <p>{notice}</p>
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}

      <section className="client-metrics">
        <article>
          <span>Programme</span>
          <strong>{activeProgramme?.title || "Not assigned"}</strong>
          <small>{activeProgramme ? `${activeProgramme.days_per_week} sessions per week` : "Your coach will add this"}</small>
        </article>
        <article>
          <span>Completed logs</span>
          <strong>{completed}</strong>
          <small>All recorded workouts</small>
        </article>
        <article>
          <span>Next check-in</span>
          <strong>{dateLabel(data?.person.next_check_in || "")}</strong>
          <small>Keep your logger current</small>
        </article>
      </section>

      <section className="client-grid">
        <form className="workout-logger" onSubmit={saveWorkout}>
          <div className="client-section-head">
            <div>
              <p className="eyebrow">Workout logger</p>
              <h2>Record today’s work.</h2>
            </div>
            <span>Coach visible</span>
          </div>
          <div className="logger-meta">
            <label>
              <span>Date</span>
              <input name="workoutDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            </label>
            <label>
              <span>Workout</span>
              <input name="workoutName" required placeholder="e.g. Upper A" />
            </label>
            <label>
              <span>Minutes</span>
              <input name="durationMinutes" type="number" min="1" max="300" placeholder="60" />
            </label>
            <label>
              <span>Session RPE</span>
              <input name="effortRating" type="number" min="1" max="10" placeholder="8" />
            </label>
          </div>
          <div className="exercise-list">
            {exercises.map((exercise, exerciseIndex) => (
              <article className="exercise-entry" key={exerciseIndex}>
                <div>
                  <span>Exercise {String(exerciseIndex + 1).padStart(2, "0")}</span>
                  <input
                    aria-label={`Exercise ${exerciseIndex + 1} name`}
                    value={exercise.name}
                    onChange={(event) =>
                      setExercises((current) =>
                        current.map((item, index) => (index === exerciseIndex ? { ...item, name: event.target.value } : item))
                      )
                    }
                    placeholder="Exercise name"
                  />
                </div>
                <div className="set-head">
                  <span>Set</span>
                  <span>Reps</span>
                  <span>Load</span>
                  <span>RIR</span>
                </div>
                {exercise.sets.map((set, setIndex) => (
                  <div className="set-row" key={setIndex}>
                    <b>{set.set}</b>
                    <input
                      aria-label="Reps"
                      value={set.reps}
                      onChange={(event) => updateSet(exerciseIndex, setIndex, "reps", event.target.value)}
                      inputMode="numeric"
                    />
                    <input
                      aria-label="Load"
                      value={set.load}
                      onChange={(event) => updateSet(exerciseIndex, setIndex, "load", event.target.value)}
                      placeholder="kg"
                    />
                    <input
                      aria-label="Reps in reserve"
                      value={set.rir}
                      onChange={(event) => updateSet(exerciseIndex, setIndex, "rir", event.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="add-set"
                  onClick={() => {
                    setExercises((current) =>
                      current.map((item, index) =>
                        index === exerciseIndex
                          ? { ...item, sets: [...item.sets, { set: item.sets.length + 1, reps: "", load: "", rir: "" }] }
                          : item
                      )
                    );
                  }}
                >
                  + Add set
                </button>
              </article>
            ))}
          </div>
          <button type="button" className="add-exercise" onClick={() => setExercises((current) => [...current, newExercise()])}>
            + Add another exercise
          </button>
          <label className="logger-note">
            <span>Session notes, pain or recovery</span>
            <textarea name="athleteNote" rows={4} placeholder="Tell your coach what changed, felt strong or needs attention." />
          </label>
          <button className="complete-workout" type="submit">
            Complete workout <span>→</span>
          </button>
        </form>
        <aside className="client-side">
          <article>
            <p className="eyebrow">Programme direction</p>
            <h2>{activeProgramme?.title || "Your programme"}</h2>
            <p>{activeProgramme?.athlete_instructions || "Your coach’s athlete-facing instructions will appear here once your programme is assigned."}</p>
            {activeProgramme && <small>{dateLabel(activeProgramme.starts_on)} — {dateLabel(activeProgramme.ends_on)}</small>}
          </article>
          <article>
            <p className="eyebrow">Workout history</p>
            <div className="history-list">
              {data?.workouts.slice(0, 6).map((workout) => (
                <div key={workout.id}>
                  <span>{new Date(workout.workout_date).getDate()}</span>
                  <div>
                    <strong>{workout.workout_name}</strong>
                    <small>{dateLabel(workout.workout_date)} · RPE {workout.effort_rating || "—"}</small>
                    {workout.coach_feedback && <p>Coach: {workout.coach_feedback}</p>}
                  </div>
                </div>
              ))}
              {!data?.workouts.length && <p className="client-empty">Your completed workouts will appear here.</p>}
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
