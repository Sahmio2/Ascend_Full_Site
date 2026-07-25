import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dataStore, Assignment, Workout } from "../services/dataStore";
import { authStore, AuthState } from "../services/authStore";

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
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");

  const [data, setData] = useState<{
    person: { id: string; full_name: string; phase: string; primary_goal: string; next_check_in: string };
    assignments: Assignment[];
    workouts: Workout[];
  } | null>(null);

  const [notice, setNotice] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([newExercise()]);

  useEffect(() => {
    return authStore.subscribe((state) => {
      setAuthState(state);
    });
  }, []);

  function refresh() {
    if (!authState.person) return;
    const currentPersonId = authState.person.id;
    const people = dataStore.getPeople();
    const match = people.find((p) => p.id === currentPersonId) || authState.person;

    const assignments = dataStore.getAssignments().filter((a) => a.person_id === match.id);
    const workouts = dataStore.getWorkouts().filter((w) => w.person_id === match.id);

    setData({
      person: {
        id: match.id,
        full_name: match.full_name,
        phase: match.phase || "Forging the Form",
        primary_goal: match.primary_goal || "Body recomposition",
        next_check_in: match.next_check_in || "2026-07-31",
      },
      assignments,
      workouts,
    });
  }

  useEffect(() => {
    if (authState.role === "client" && authState.person) {
      refresh();
    }
  }, [authState]);

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = authStore.loginAsClient(loginEmail);
    if (!res.success) {
      setLoginError(res.message);
    }
  }

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
      person_id: data?.person.id || "sample-1",
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

  if (authState.role !== "client" || !authState.person) {
    return (
      <main className="public-site" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <header className="public-nav shell" style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
          <Link className="wordmark" to="/">
            <span>GET</span> DIVINE
          </Link>
          <Link className="quiet-link" to="/">
            Return to site
          </Link>
        </header>

        <div className="shell" style={{ maxWidth: "440px", margin: "0 auto", padding: "100px 20px 40px" }}>
          <div style={{ background: "rgba(18, 18, 20, 0.85)", border: "1px solid rgba(212, 175, 55, 0.2)", borderRadius: "12px", padding: "40px 32px", backdropFilter: "blur(12px)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <span className="eyebrow" style={{ color: "#d4af37", fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase" }}>
                Ascension Program
              </span>
              <h1 style={{ fontSize: "1.8rem", margin: "12px 0 8px", fontWeight: "600", letterSpacing: "-0.5px" }}>
                Client Portal Login
              </h1>
              <p style={{ color: "#8a8a93", fontSize: "0.9rem" }}>
                Access your training logs, programme instructions, and check-ins.
              </p>
            </div>

            {loginError && (
              <div style={{ background: "rgba(220, 38, 38, 0.15)", border: "1px solid rgba(220, 38, 38, 0.4)", color: "#f87171", padding: "12px 16px", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "20px", textAlign: "center" }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "1px", color: "#a1a1aa", marginBottom: "8px" }}>
                  Client Email Address
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. amara@example.com"
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "#09090b",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <button
                type="submit"
                className="button button-gold"
                style={{ width: "100%", padding: "14px", fontSize: "0.95rem", justifyContent: "center", cursor: "pointer", marginTop: "4px" }}
              >
                Sign In to Portal →
              </button>
            </form>

            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "0.82rem", color: "#71717a", textAlign: "center" }}>
              <p style={{ margin: 0 }}>Demo Client Logins:</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => { setLoginEmail("amara@example.com"); authStore.loginAsClient("amara@example.com"); }}
                  style={{ background: "none", border: "none", color: "#d4af37", textDecoration: "underline", cursor: "pointer", fontSize: "0.82rem" }}
                >
                  Amara O.
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => { setLoginEmail("david@example.com"); authStore.loginAsClient("david@example.com"); }}
                  style={{ background: "none", border: "none", color: "#d4af37", textDecoration: "underline", cursor: "pointer", fontSize: "0.82rem" }}
                >
                  David K.
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="client-app">
      <header className="client-nav">
        <Link className="wordmark" to="/"><span>GET</span> DIVINE</Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span>{data?.person.full_name || authState.person.full_name}</span>
          <button
            onClick={() => authStore.logout()}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#fff",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
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
