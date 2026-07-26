import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dataStore, Assignment, Workout, PlanDocument } from "../services/dataStore";
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

function downloadPlanAsFile(plan: PlanDocument) {
  const content = `
====================================================
               GET DIVINE MASTER PLAN
====================================================
Athlete: ${plan.full_name}
Phase: ${plan.phase}
Title: ${plan.title}
Date Updated: ${new Date(plan.updated_at).toLocaleDateString()}

----------------------------------------------------
1. NUTRITION & CALORIC TARGETS
----------------------------------------------------
Daily Target Calories: ${plan.nutrition.target_calories} kcal
Maintenance Calories: ${plan.nutrition.maintenance_calories} kcal
Deficit Calories (Fat Loss): ${plan.nutrition.deficit_calories} kcal
Surplus Calories (Muscle Gain): ${plan.nutrition.surplus_calories} kcal

Daily Macronutrients:
- Protein: ${plan.nutrition.protein_g}g
- Carbohydrates: ${plan.nutrition.carbs_g}g
- Fats: ${plan.nutrition.fats_g}g
- Hydration Target: ${plan.nutrition.hydration_liters} Liters / day

Meal Structure:
${plan.nutrition.meal_structure.map((m) => `* ${m}`).join("\n")}

Supplements Protocol:
${plan.nutrition.supplements.map((s) => `* ${s}`).join("\n")}

Coach Guidelines:
${plan.nutrition.guidelines}

----------------------------------------------------
2. WORKOUT ROUTINES & EXERCISES
----------------------------------------------------
${plan.workout_days
  .map(
    (day, i) => `
${day.day_title}
Notes: ${day.notes || "None"}
Exercises:
${day.exercises
  .map((ex, j) => `  ${j + 1}. ${ex.name} — ${ex.sets} Sets x ${ex.reps} Reps (RIR ${ex.rir}) ${ex.notes ? `[Note: ${ex.notes}]` : ""}`)
  .join("\n")}
`
  )
  .join("\n")}

====================================================
           GET DIVINE — STANDARD OF EXCELLENCE
====================================================
`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Get_Divine_Plan_${plan.full_name.replace(/\s+/g, "_")}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ClientPage() {
  const [authState, setAuthState] = useState<AuthState>(authStore.getState());
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<"plan" | "calculators" | "logger">("plan");
  const [planSubTab, setPlanSubTab] = useState<"workout" | "nutrition">("workout");

  const [data, setData] = useState<{
    person: { id: string; full_name: string; phase: string; primary_goal: string; next_check_in: string };
    assignments: Assignment[];
    workouts: Workout[];
    plan: PlanDocument | undefined;
  } | null>(null);

  const [notice, setNotice] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([newExercise()]);

  // --- BMI Calculator State ---
  const [bmiUnit, setBmiUnit] = useState<"metric" | "imperial">("metric");
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(9);
  const [weightLbs, setWeightLbs] = useState<number>(154);

  // --- Calories Calculator State ---
  const [calUnit, setCalUnit] = useState<"metric" | "imperial">("metric");
  const [calGender, setCalGender] = useState<"male" | "female">("female");
  const [calAge, setCalAge] = useState<number>(28);
  const [calWeight, setCalWeight] = useState<number>(70);
  const [calHeight, setCalHeight] = useState<number>(170);
  const [calActivity, setCalActivity] = useState<number>(1.55);
  const [calGoal, setCalGoal] = useState<"deficit" | "maintenance" | "surplus">("deficit");

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
    const plan = dataStore.getPlanByPersonId(match.id);

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
      plan,
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

  // --- BMI Calculation Logic ---
  const bmiValue = useMemo(() => {
    let heightM = 0;
    let weightInKg = 0;

    if (bmiUnit === "metric") {
      heightM = (heightCm || 170) / 100;
      weightInKg = weightKg || 70;
    } else {
      const totalInches = (heightFt || 5) * 12 + (heightIn || 0);
      heightM = totalInches * 0.0254;
      weightInKg = (weightLbs || 154) * 0.45359237;
    }

    if (heightM <= 0 || weightInKg <= 0) return 0;
    return weightInKg / (heightM * heightM);
  }, [bmiUnit, heightCm, weightKg, heightFt, heightIn, weightLbs]);

  const bmiMeta = useMemo(() => {
    const bmi = bmiValue;
    if (!bmi || isNaN(bmi)) {
      return { category: "Enter stats", color: "#a1a1aa", text: "Fill in your height and weight.", percent: 0 };
    }
    if (bmi < 18.5) {
      return {
        category: "Underweight",
        color: "#f59e0b",
        text: "Below standard weight threshold. Focus on a moderate caloric surplus and progressive strength work.",
        percent: Math.min(100, Math.max(5, ((bmi - 12) / (18.5 - 12)) * 25)),
      };
    }
    if (bmi <= 24.9) {
      return {
        category: "Normal weight (Optimal)",
        color: "#10b981",
        text: "Optimal baseline state. Ideal for targeted body recomposition or lean muscle development.",
        percent: Math.min(100, Math.max(25, 25 + ((bmi - 18.5) / (24.9 - 18.5)) * 25)),
      };
    }
    if (bmi <= 29.9) {
      return {
        category: "Overweight",
        color: "#f97316",
        text: "Above baseline. A structured caloric deficit combined with resistance training will accelerate fat loss.",
        percent: Math.min(100, Math.max(50, 50 + ((bmi - 25) / (29.9 - 25)) * 25)),
      };
    }
    return {
      category: "Obese class",
      color: "#ef4444",
      text: "Substantial body weight surplus. Prioritize daily step goals, caloric control, and guided resistance work.",
      percent: Math.min(100, Math.max(75, 75 + ((bmi - 30) / (40 - 30)) * 25)),
    };
  }, [bmiValue]);

  // --- Calories Calculation Logic ---
  const caloriesCalc = useMemo(() => {
    let wKg = calUnit === "metric" ? calWeight || 70 : (calWeight || 154) * 0.45359237;
    let hCm = calUnit === "metric" ? calHeight || 170 : (calHeight || 67) * 2.54;
    let age = calAge || 28;

    let bmr = 0;
    if (calGender === "male") {
      bmr = 10 * wKg + 6.25 * hCm - 5 * age + 5;
    } else {
      bmr = 10 * wKg + 6.25 * hCm - 5 * age - 161;
    }

    const tdee = Math.round(bmr * calActivity);
    const deficitMild = Math.round(tdee * 0.85);
    const deficitMod = Math.round(tdee * 0.80);
    const deficitAgg = Math.round(tdee * 0.75);

    const surplusLean = Math.round(tdee * 1.10);
    const surplusGrowth = Math.round(tdee * 1.15);

    let activeTarget = tdee;
    if (calGoal === "deficit") activeTarget = deficitMod;
    if (calGoal === "surplus") activeTarget = surplusLean;

    const proteinG = Math.round(wKg * 2.2);
    const proteinKcal = proteinG * 4;
    const fatKcal = Math.round(activeTarget * 0.25);
    const fatG = Math.round(fatKcal / 9);
    const carbKcal = Math.max(0, activeTarget - (proteinKcal + fatKcal));
    const carbG = Math.round(carbKcal / 4);

    return {
      bmr: Math.round(bmr),
      tdee,
      deficitMild,
      deficitMod,
      deficitAgg,
      surplusLean,
      surplusGrowth,
      activeTarget,
      macros: { proteinG, fatG, carbG, proteinKcal, fatKcal, carbKcal },
    };
  }, [calUnit, calGender, calAge, calWeight, calHeight, calActivity, calGoal]);

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
                Access your training logs, Get Divine plan, and health calculators.
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

  const currentPlan = data?.plan;

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

      {/* --- MAIN CLIENT PORTAL TABS --- */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "28px" }}>
        <button
          onClick={() => setActiveTab("plan")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "plan" ? "2px solid #d4af37" : "2px solid transparent",
            color: activeTab === "plan" ? "#d4af37" : "#a1a1aa",
            fontWeight: activeTab === "plan" ? "600" : "400",
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          📋 Get Divine Plan
        </button>
        <button
          onClick={() => setActiveTab("calculators")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "calculators" ? "2px solid #d4af37" : "2px solid transparent",
            color: activeTab === "calculators" ? "#d4af37" : "#a1a1aa",
            fontWeight: activeTab === "calculators" ? "600" : "400",
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🧮 Health & Calorie Calculators
        </button>
        <button
          onClick={() => setActiveTab("logger")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "logger" ? "2px solid #d4af37" : "2px solid transparent",
            color: activeTab === "logger" ? "#d4af37" : "#a1a1aa",
            fontWeight: activeTab === "logger" ? "600" : "400",
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🏋️ Workout Logger & History
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GET DIVINE PLAN & DOWNLOAD */}
      {/* ========================================================================= */}
      {activeTab === "plan" && (
        <section style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {currentPlan ? (
            <div style={{ background: "#121214", border: "1px solid rgba(212, 175, 55, 0.25)", borderRadius: "12px", padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "20px" }}>
                <div>
                  <span className="eyebrow" style={{ color: "#d4af37", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "2px" }}>
                    Official Master Plan
                  </span>
                  <h2 style={{ fontSize: "1.8rem", margin: "6px 0", color: "#fff", fontWeight: "600" }}>
                    {currentPlan.title}
                  </h2>
                  <p style={{ margin: 0, color: "#8a8a93", fontSize: "0.9rem" }}>
                    Assigned for <strong>{currentPlan.full_name}</strong> · Phase: <span style={{ color: "#d4af37" }}>{currentPlan.phase}</span>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => downloadPlanAsFile(currentPlan)}
                    style={{
                      background: "rgba(212, 175, 55, 0.15)",
                      border: "1px solid rgba(212, 175, 55, 0.4)",
                      color: "#d4af37",
                      padding: "10px 18px",
                      borderRadius: "6px",
                      fontSize: "0.88rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    📥 Download Plan (.txt)
                  </button>
                  <button
                    onClick={() => window.print()}
                    style={{
                      background: "#d4af37",
                      border: "none",
                      color: "#000",
                      padding: "10px 18px",
                      borderRadius: "6px",
                      fontSize: "0.88rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    🖨️ Print / Save as PDF
                  </button>
                </div>
              </div>

              {/* Sub Navigation: Workout Routine vs Nutrition Document */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                <button
                  onClick={() => setPlanSubTab("workout")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    background: planSubTab === "workout" ? "#d4af37" : "rgba(255,255,255,0.06)",
                    color: planSubTab === "workout" ? "#000" : "#fff",
                    border: "none",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  🏋️ Workout Routine ({currentPlan.workout_days.length} Days)
                </button>
                <button
                  onClick={() => setPlanSubTab("nutrition")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    background: planSubTab === "nutrition" ? "#d4af37" : "rgba(255,255,255,0.06)",
                    color: planSubTab === "nutrition" ? "#000" : "#fff",
                    border: "none",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  🥗 Nutrition & Caloric Document
                </button>
              </div>

              {/* PLAN SUB TAB 1: WORKOUT ROUTINE */}
              {planSubTab === "workout" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {currentPlan.workout_days.map((day, dIdx) => (
                    <article key={dIdx} style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "20px" }}>
                      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px", marginBottom: "16px" }}>
                        <h3 style={{ margin: "0 0 4px", fontSize: "1.15rem", color: "#d4af37" }}>{day.day_title}</h3>
                        {day.notes && <p style={{ margin: 0, color: "#a1a1aa", fontSize: "0.85rem" }}>Note: {day.notes}</p>}
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#71717a" }}>
                              <th style={{ padding: "8px 12px" }}>#</th>
                              <th style={{ padding: "8px 12px" }}>Exercise Name</th>
                              <th style={{ padding: "8px 12px" }}>Sets</th>
                              <th style={{ padding: "8px 12px" }}>Reps</th>
                              <th style={{ padding: "8px 12px" }}>Target RIR</th>
                              <th style={{ padding: "8px 12px" }}>Execution Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {day.exercises.map((ex, eIdx) => (
                              <tr key={eIdx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <td style={{ padding: "10px 12px", color: "#d4af37", fontWeight: "600" }}>{eIdx + 1}</td>
                                <td style={{ padding: "10px 12px", color: "#fff", fontWeight: "500" }}>{ex.name}</td>
                                <td style={{ padding: "10px 12px", color: "#e4e4e7" }}>{ex.sets}</td>
                                <td style={{ padding: "10px 12px", color: "#e4e4e7" }}>{ex.reps}</td>
                                <td style={{ padding: "10px 12px", color: "#10b981", fontWeight: "500" }}>RIR {ex.rir}</td>
                                <td style={{ padding: "10px 12px", color: "#a1a1aa", fontSize: "0.82rem" }}>{ex.notes || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* PLAN SUB TAB 2: NUTRITION & CALORIC DOCUMENT */}
              {planSubTab === "nutrition" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* Calorie Cards Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <div style={{ background: "#09090b", border: "1px solid rgba(212, 175, 55, 0.4)", borderRadius: "8px", padding: "18px" }}>
                      <span style={{ color: "#d4af37", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>Daily Target Calories</span>
                      <strong style={{ display: "block", fontSize: "1.8rem", color: "#fff", margin: "6px 0 2px" }}>
                        {currentPlan.nutrition.target_calories} <span style={{ fontSize: "0.9rem", color: "#d4af37" }}>kcal/day</span>
                      </strong>
                      <small style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>Assigned by Coach Sahmi</small>
                    </div>

                    <div style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "18px" }}>
                      <span style={{ color: "#a1a1aa", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>Maintenance Calories</span>
                      <strong style={{ display: "block", fontSize: "1.5rem", color: "#e4e4e7", margin: "6px 0 2px" }}>
                        {currentPlan.nutrition.maintenance_calories} <span style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>kcal</span>
                      </strong>
                      <small style={{ color: "#71717a", fontSize: "0.8rem" }}>Estimated TDEE</small>
                    </div>

                    <div style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "18px" }}>
                      <span style={{ color: "#a1a1aa", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>Deficit Caloric Floor</span>
                      <strong style={{ display: "block", fontSize: "1.5rem", color: "#f97316", margin: "6px 0 2px" }}>
                        {currentPlan.nutrition.deficit_calories} <span style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>kcal</span>
                      </strong>
                      <small style={{ color: "#71717a", fontSize: "0.8rem" }}>Fat loss baseline</small>
                    </div>

                    <div style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "18px" }}>
                      <span style={{ color: "#a1a1aa", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>Surplus Target</span>
                      <strong style={{ display: "block", fontSize: "1.5rem", color: "#10b981", margin: "6px 0 2px" }}>
                        {currentPlan.nutrition.surplus_calories} <span style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>kcal</span>
                      </strong>
                      <small style={{ color: "#71717a", fontSize: "0.8rem" }}>Muscle gain baseline</small>
                    </div>
                  </div>

                  {/* Daily Macro Targets */}
                  <div style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "20px" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "#d4af37" }}>Macronutrient Distribution</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px" }}>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "6px" }}>
                        <span style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>Protein</span>
                        <strong style={{ display: "block", fontSize: "1.3rem", color: "#fff", marginTop: "4px" }}>
                          {currentPlan.nutrition.protein_g}g
                        </strong>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "6px" }}>
                        <span style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>Carbohydrates</span>
                        <strong style={{ display: "block", fontSize: "1.3rem", color: "#fff", marginTop: "4px" }}>
                          {currentPlan.nutrition.carbs_g}g
                        </strong>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "6px" }}>
                        <span style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>Healthy Fats</span>
                        <strong style={{ display: "block", fontSize: "1.3rem", color: "#fff", marginTop: "4px" }}>
                          {currentPlan.nutrition.fats_g}g
                        </strong>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "6px" }}>
                        <span style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>Hydration</span>
                        <strong style={{ display: "block", fontSize: "1.3rem", color: "#38bdf8", marginTop: "4px" }}>
                          {currentPlan.nutrition.hydration_liters} Liters
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Meal Structure & Guidelines */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                    <div style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "20px" }}>
                      <h3 style={{ margin: "0 0 12px", fontSize: "1rem", color: "#fff" }}>Meal Schedule & Timing</h3>
                      <ul style={{ margin: 0, paddingLeft: "20px", color: "#d4d4d8", fontSize: "0.88rem", lineHeight: "1.7" }}>
                        {currentPlan.nutrition.meal_structure.map((meal, idx) => (
                          <li key={idx} style={{ marginBottom: "8px" }}>{meal}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "20px" }}>
                      <h3 style={{ margin: "0 0 12px", fontSize: "1rem", color: "#fff" }}>Supplements & Guidelines</h3>
                      <p style={{ margin: "0 0 12px", color: "#d4af37", fontSize: "0.85rem", fontStyle: "italic" }}>
                        "{currentPlan.nutrition.guidelines}"
                      </p>
                      <h4 style={{ margin: "16px 0 8px", fontSize: "0.88rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "1px" }}>Supplements Protocol:</h4>
                      <ul style={{ margin: 0, paddingLeft: "20px", color: "#d4d4d8", fontSize: "0.88rem", lineHeight: "1.7" }}>
                        {currentPlan.nutrition.supplements.map((supp, idx) => (
                          <li key={idx}>{supp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: "#121214", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "12px", padding: "40px 20px", textAlign: "center" }}>
              <h3 style={{ margin: "0 0 8px", color: "#fff" }}>Master Plan Pending</h3>
              <p style={{ color: "#8a8a93", maxWidth: "480px", margin: "0 auto 20px" }}>
                Your coach has not yet finalized your custom Get Divine Workout & Nutrition Plan Document. Once uploaded by Coach Sahmi, it will appear here for instant viewing and downloading.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HEALTH & CALORIE CALCULATORS */}
      {/* ========================================================================= */}
      {activeTab === "calculators" && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "28px" }}>
          {/* CALCULATOR 1: BMI CALCULATOR */}
          <article style={{ background: "#121214", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <span className="eyebrow" style={{ color: "#d4af37", fontSize: "0.72rem" }}>Body Composition</span>
                <h2 style={{ fontSize: "1.3rem", margin: "4px 0 0", color: "#fff" }}>BMI Calculator</h2>
              </div>
              <div style={{ display: "flex", background: "#09090b", borderRadius: "20px", padding: "3px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <button
                  onClick={() => setBmiUnit("metric")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "16px",
                    background: bmiUnit === "metric" ? "#d4af37" : "none",
                    color: bmiUnit === "metric" ? "#000" : "#a1a1aa",
                    border: "none",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Metric (kg/cm)
                </button>
                <button
                  onClick={() => setBmiUnit("imperial")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "16px",
                    background: bmiUnit === "imperial" ? "#d4af37" : "none",
                    color: bmiUnit === "imperial" ? "#000" : "#a1a1aa",
                    border: "none",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Imperial (lbs/ft)
                </button>
              </div>
            </div>

            {bmiUnit === "metric" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase" }}>Height (cm)</span>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    min="100"
                    max="230"
                    style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", padding: "10px", borderRadius: "6px", color: "#fff" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase" }}>Weight (kg)</span>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    min="30"
                    max="220"
                    style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", padding: "10px", borderRadius: "6px", color: "#fff" }}
                  />
                </label>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase" }}>Height (ft)</span>
                    <input
                      type="number"
                      value={heightFt}
                      onChange={(e) => setHeightFt(Number(e.target.value))}
                      min="3"
                      max="7"
                      style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", padding: "10px", borderRadius: "6px", color: "#fff" }}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase" }}>Height (in)</span>
                    <input
                      type="number"
                      value={heightIn}
                      onChange={(e) => setHeightIn(Number(e.target.value))}
                      min="0"
                      max="11"
                      style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", padding: "10px", borderRadius: "6px", color: "#fff" }}
                    />
                  </label>
                </div>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase" }}>Weight (lbs)</span>
                  <input
                    type="number"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(Number(e.target.value))}
                    min="60"
                    max="500"
                    style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", padding: "10px", borderRadius: "6px", color: "#fff" }}
                  />
                </label>
              </div>
            )}

            {/* BMI Result Display */}
            <div style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
              <span style={{ color: "#a1a1aa", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1px" }}>Your Calculated BMI</span>
              <div style={{ fontSize: "3rem", fontWeight: "700", color: "#fff", margin: "4px 0" }}>
                {bmiValue ? bmiValue.toFixed(1) : "0.0"}
              </div>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 14px",
                  borderRadius: "12px",
                  background: `${bmiMeta.color}22`,
                  color: bmiMeta.color,
                  border: `1px solid ${bmiMeta.color}44`,
                  fontWeight: "600",
                  fontSize: "0.82rem",
                  marginBottom: "16px",
                }}
              >
                {bmiMeta.category}
              </span>

              {/* BMI Range Spectrum Bar */}
              <div style={{ position: "relative", height: "10px", borderRadius: "5px", background: "linear-gradient(to right, #f59e0b, #10b981 35%, #f97316 70%, #ef4444)", margin: "10px 0 20px" }}>
                <div
                  style={{
                    position: "absolute",
                    left: `${bmiMeta.percent}%`,
                    top: "-4px",
                    width: "6px",
                    height: "18px",
                    background: "#fff",
                    borderRadius: "3px",
                    boxShadow: "0 0 10px rgba(0,0,0,0.8)",
                    transform: "translateX(-50%)",
                  }}
                />
              </div>

              <p style={{ margin: 0, color: "#a1a1aa", fontSize: "0.83rem", lineHeight: "1.5" }}>
                {bmiMeta.text}
              </p>
            </div>
          </article>

          {/* CALCULATOR 2: MAINTENANCE, DEFICIT & SURPLUS CALORIES CALCULATOR */}
          <article style={{ background: "#121214", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <span className="eyebrow" style={{ color: "#d4af37", fontSize: "0.72rem" }}>Energy & TDEE</span>
                <h2 style={{ fontSize: "1.3rem", margin: "4px 0 0", color: "#fff" }}>Calorie & Macro Calculator</h2>
              </div>
              <div style={{ display: "flex", background: "#09090b", borderRadius: "20px", padding: "3px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <button
                  onClick={() => setCalUnit("metric")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "16px",
                    background: calUnit === "metric" ? "#d4af37" : "none",
                    color: calUnit === "metric" ? "#000" : "#a1a1aa",
                    border: "none",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Metric
                </button>
                <button
                  onClick={() => setCalUnit("imperial")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "16px",
                    background: calUnit === "imperial" ? "#d4af37" : "none",
                    color: calUnit === "imperial" ? "#000" : "#a1a1aa",
                    border: "none",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Imperial
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.78rem", color: "#a1a1aa", textTransform: "uppercase" }}>Gender</span>
                <select
                  value={calGender}
                  onChange={(e) => setCalGender(e.target.value as "male" | "female")}
                  style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", padding: "8px", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.78rem", color: "#a1a1aa", textTransform: "uppercase" }}>Age (years)</span>
                <input
                  type="number"
                  value={calAge}
                  onChange={(e) => setCalAge(Number(e.target.value))}
                  min="16"
                  max="90"
                  style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", padding: "8px", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.78rem", color: "#a1a1aa", textTransform: "uppercase" }}>Weight ({calUnit === "metric" ? "kg" : "lbs"})</span>
                <input
                  type="number"
                  value={calWeight}
                  onChange={(e) => setCalWeight(Number(e.target.value))}
                  style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", padding: "8px", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.78rem", color: "#a1a1aa", textTransform: "uppercase" }}>Height ({calUnit === "metric" ? "cm" : "in"})</span>
                <input
                  type="number"
                  value={calHeight}
                  onChange={(e) => setCalHeight(Number(e.target.value))}
                  style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", padding: "8px", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
                />
              </label>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "20px" }}>
              <span style={{ fontSize: "0.78rem", color: "#a1a1aa", textTransform: "uppercase" }}>Daily Activity Level</span>
              <select
                value={calActivity}
                onChange={(e) => setCalActivity(Number(e.target.value))}
                style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", padding: "10px", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
              >
                <option value={1.2}>Sedentary (desk job, minimal movement)</option>
                <option value={1.375}>Lightly Active (1–3 gym sessions / week)</option>
                <option value={1.55}>Moderately Active (3–5 intense sessions / week)</option>
                <option value={1.725}>Very Active (6–7 sessions / week)</option>
                <option value={1.9}>Extra Active (heavy physical job or 2x daily training)</option>
              </select>
            </label>

            {/* Calculated Caloric Tiers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => setCalGoal("deficit")}
                style={{
                  background: calGoal === "deficit" ? "rgba(249, 115, 22, 0.18)" : "#09090b",
                  border: calGoal === "deficit" ? "1px solid #f97316" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "12px 8px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "block", color: "#f97316", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "600" }}>Fat Loss (Deficit)</span>
                <strong style={{ display: "block", color: "#fff", fontSize: "1.2rem", marginTop: "2px" }}>{caloriesCalc.deficitMod}</strong>
                <small style={{ color: "#a1a1aa", fontSize: "0.72rem" }}>kcal/day (-20%)</small>
              </button>

              <button
                type="button"
                onClick={() => setCalGoal("maintenance")}
                style={{
                  background: calGoal === "maintenance" ? "rgba(212, 175, 55, 0.18)" : "#09090b",
                  border: calGoal === "maintenance" ? "1px solid #d4af37" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "12px 8px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "block", color: "#d4af37", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "600" }}>Maintenance</span>
                <strong style={{ display: "block", color: "#fff", fontSize: "1.2rem", marginTop: "2px" }}>{caloriesCalc.tdee}</strong>
                <small style={{ color: "#a1a1aa", fontSize: "0.72rem" }}>kcal/day (TDEE)</small>
              </button>

              <button
                type="button"
                onClick={() => setCalGoal("surplus")}
                style={{
                  background: calGoal === "surplus" ? "rgba(16, 185, 129, 0.18)" : "#09090b",
                  border: calGoal === "surplus" ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "12px 8px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "block", color: "#10b981", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "600" }}>Muscle Gain (Surplus)</span>
                <strong style={{ display: "block", color: "#fff", fontSize: "1.2rem", marginTop: "2px" }}>{caloriesCalc.surplusLean}</strong>
                <small style={{ color: "#a1a1aa", fontSize: "0.72rem" }}>kcal/day (+10%)</small>
              </button>
            </div>

            {/* Selected Target Macro Breakdown */}
            <div style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase" }}>Recommended Macros for {calGoal.toUpperCase()} Target</span>
                <strong style={{ color: "#d4af37", fontSize: "0.95rem" }}>{caloriesCalc.activeTarget} kcal</strong>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", textAlign: "center" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>Protein</span>
                  <strong style={{ display: "block", color: "#fff", fontSize: "1.1rem", marginTop: "2px" }}>{caloriesCalc.macros.proteinG}g</strong>
                  <small style={{ color: "#71717a", fontSize: "0.7rem" }}>{caloriesCalc.macros.proteinKcal} kcal</small>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>Carbs</span>
                  <strong style={{ display: "block", color: "#fff", fontSize: "1.1rem", marginTop: "2px" }}>{caloriesCalc.macros.carbG}g</strong>
                  <small style={{ color: "#71717a", fontSize: "0.7rem" }}>{caloriesCalc.macros.carbKcal} kcal</small>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>Fats</span>
                  <strong style={{ display: "block", color: "#fff", fontSize: "1.1rem", marginTop: "2px" }}>{caloriesCalc.macros.fatG}g</strong>
                  <small style={{ color: "#71717a", fontSize: "0.7rem" }}>{caloriesCalc.macros.fatKcal} kcal</small>
                </div>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WORKOUT LOGGER & HISTORY */}
      {/* ========================================================================= */}
      {activeTab === "logger" && (
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
      )}
    </main>
  );
}
