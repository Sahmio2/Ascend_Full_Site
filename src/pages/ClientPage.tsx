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
      return { category: "Enter stats", color: "var(--gd-text-muted)", text: "Fill in your height and weight.", percent: 0 };
    }
    if (bmi < 18.5) {
      return {
        category: "Underweight",
        color: "var(--gd-warning)",
        text: "Below standard weight threshold. Focus on a moderate caloric surplus and progressive strength work.",
        percent: Math.min(100, Math.max(5, ((bmi - 12) / (18.5 - 12)) * 25)),
      };
    }
    if (bmi <= 24.9) {
      return {
        category: "Normal weight (Optimal)",
        color: "var(--gd-success)",
        text: "Optimal baseline state. Ideal for targeted body recomposition or lean muscle development.",
        percent: Math.min(100, Math.max(25, 25 + ((bmi - 18.5) / (24.9 - 18.5)) * 25)),
      };
    }
    if (bmi <= 29.9) {
      return {
        category: "Overweight",
        color: "var(--gd-warning)",
        text: "Above baseline. A structured caloric deficit combined with resistance training will accelerate fat loss.",
        percent: Math.min(100, Math.max(50, 50 + ((bmi - 25) / (29.9 - 25)) * 25)),
      };
    }
    return {
      category: "Obese class",
      color: "var(--gd-danger)",
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
          <div style={{ background: "var(--gd-surface)", border: "1px solid var(--gd-line)", borderRadius: "var(--gd-radius-md)", padding: "40px 32px", backdropFilter: "blur(12px)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <span className="eyebrow" style={{ color: "var(--gd-gold-bright)", fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase" }}>
                Ascension Program
              </span>
              <h1 style={{ fontSize: "1.8rem", margin: "12px 0 8px", fontWeight: "600", letterSpacing: "-0.5px" }}>
                Client Portal Login
              </h1>
              <p style={{ color: "var(--gd-text-muted)", fontSize: "0.9rem" }}>
                Access your training logs, Get Divine plan, and health calculators.
              </p>
            </div>

            {loginError && (
              <div style={{ background: "rgba(200, 113, 98, 0.15)", border: "1px solid var(--gd-danger)", color: "var(--gd-danger)", padding: "12px 16px", borderRadius: "var(--gd-radius-sm)", fontSize: "0.88rem", marginBottom: "20px", textAlign: "center" }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label htmlFor="client-email-input" style={{ display: "block", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--gd-text-muted)", marginBottom: "8px" }}>
                  Client email address
                </label>
                <input
                  id="client-email-input"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. amara@example.com"
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    padding: "12px 16px",
                    background: "var(--gd-ink)",
                    border: "1px solid var(--gd-line-soft)",
                    borderRadius: "var(--gd-radius-sm)",
                    color: "var(--gd-ivory)",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <button
                type="submit"
                className="button button-gold"
                style={{ width: "100%", minHeight: "44px", padding: "12px", fontSize: "0.95rem", justifyContent: "center", cursor: "pointer", marginTop: "4px" }}
              >
                Sign in to portal →
              </button>
            </form>

            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--gd-line-soft)", fontSize: "0.82rem", color: "var(--gd-text-faint)", textAlign: "center" }}>
              <p style={{ margin: 0 }}>Demo client logins:</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => { setLoginEmail("amara@example.com"); authStore.loginAsClient("amara@example.com"); }}
                  style={{ background: "none", border: "none", color: "var(--gd-gold)", textDecoration: "underline", cursor: "pointer", fontSize: "0.82rem", minHeight: "36px" }}
                >
                  Amara O.
                </button>
                <span style={{ alignSelf: "center" }}>·</span>
                <button
                  type="button"
                  onClick={() => { setLoginEmail("david@example.com"); authStore.loginAsClient("david@example.com"); }}
                  style={{ background: "none", border: "none", color: "var(--gd-gold)", textDecoration: "underline", cursor: "pointer", fontSize: "0.82rem", minHeight: "36px" }}
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
              background: "rgba(243, 237, 223, 0.08)",
              border: "1px solid var(--gd-line-soft)",
              color: "var(--gd-ivory)",
              padding: "8px 16px",
              minHeight: "44px",
              borderRadius: "var(--gd-radius-sm)",
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            Sign out
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
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">×</button>
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
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--gd-line-soft)", marginBottom: "28px", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("plan")}
          style={{
            padding: "12px 20px",
            minHeight: "44px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "plan" ? "2px solid var(--gd-gold)" : "2px solid transparent",
            color: activeTab === "plan" ? "var(--gd-gold)" : "var(--gd-text-muted)",
            fontWeight: activeTab === "plan" ? "600" : "400",
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          📋 Get Divine plan
        </button>
        <button
          onClick={() => setActiveTab("calculators")}
          style={{
            padding: "12px 20px",
            minHeight: "44px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "calculators" ? "2px solid var(--gd-gold)" : "2px solid transparent",
            color: activeTab === "calculators" ? "var(--gd-gold)" : "var(--gd-text-muted)",
            fontWeight: activeTab === "calculators" ? "600" : "400",
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🧮 Health & calorie calculators
        </button>
        <button
          onClick={() => setActiveTab("logger")}
          style={{
            padding: "12px 20px",
            minHeight: "44px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "logger" ? "2px solid var(--gd-gold)" : "2px solid transparent",
            color: activeTab === "logger" ? "var(--gd-gold)" : "var(--gd-text-muted)",
            fontWeight: activeTab === "logger" ? "600" : "400",
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🏋️ Workout logger & history
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GET DIVINE PLAN & DOWNLOAD */}
      {/* ========================================================================= */}
      {activeTab === "plan" && (
        <section style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {currentPlan ? (
            <div style={{ background: "var(--gd-surface)", border: "1px solid var(--gd-line)", borderRadius: "var(--gd-radius-md)", padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px", borderBottom: "1px solid var(--gd-line-soft)", paddingBottom: "20px" }}>
                <div>
                  <span className="eyebrow" style={{ color: "var(--gd-gold-bright)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "2px" }}>
                    Official Master Plan
                  </span>
                  <h2 style={{ fontSize: "1.8rem", margin: "6px 0", color: "var(--gd-ivory)", fontWeight: "600" }}>
                    {currentPlan.title}
                  </h2>
                  <p style={{ margin: 0, color: "var(--gd-text-muted)", fontSize: "0.9rem" }}>
                    Assigned for <strong>{currentPlan.full_name}</strong> · Phase: <span style={{ color: "var(--gd-gold)" }}>{currentPlan.phase}</span>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => downloadPlanAsFile(currentPlan)}
                    style={{
                      background: "rgba(199, 164, 91, 0.15)",
                      border: "1px solid var(--gd-line)",
                      color: "var(--gd-gold-bright)",
                      padding: "10px 18px",
                      minHeight: "44px",
                      borderRadius: "var(--gd-radius-sm)",
                      fontSize: "0.88rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    📥 Download plan (.txt)
                  </button>
                  <button
                    onClick={() => window.print()}
                    style={{
                      background: "var(--gd-gold)",
                      border: "none",
                      color: "var(--gd-ink)",
                      padding: "10px 18px",
                      minHeight: "44px",
                      borderRadius: "var(--gd-radius-sm)",
                      fontSize: "0.88rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    🖨️ Print or save as PDF
                  </button>
                </div>
              </div>

              {/* Sub Navigation: Workout Routine vs Nutrition Document */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setPlanSubTab("workout")}
                  style={{
                    padding: "10px 18px",
                    minHeight: "44px",
                    borderRadius: "var(--gd-radius-pill)",
                    background: planSubTab === "workout" ? "var(--gd-gold)" : "rgba(243, 237, 223, 0.06)",
                    color: planSubTab === "workout" ? "var(--gd-ink)" : "var(--gd-ivory)",
                    border: "none",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  🏋️ Workout routine ({currentPlan.workout_days.length} Days)
                </button>
                <button
                  onClick={() => setPlanSubTab("nutrition")}
                  style={{
                    padding: "10px 18px",
                    minHeight: "44px",
                    borderRadius: "var(--gd-radius-pill)",
                    background: planSubTab === "nutrition" ? "var(--gd-gold)" : "rgba(243, 237, 223, 0.06)",
                    color: planSubTab === "nutrition" ? "var(--gd-ink)" : "var(--gd-ivory)",
                    border: "none",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  🥗 Nutrition & caloric document
                </button>
              </div>

              {/* PLAN SUB TAB 1: WORKOUT ROUTINE */}
              {planSubTab === "workout" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {currentPlan.workout_days.map((day, dIdx) => (
                    <article key={dIdx} style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", borderRadius: "var(--gd-radius-sm)", padding: "20px" }}>
                      <div style={{ borderBottom: "1px solid var(--gd-line-soft)", paddingBottom: "12px", marginBottom: "16px" }}>
                        <h3 style={{ margin: "0 0 4px", fontSize: "1.15rem", color: "var(--gd-gold-bright)" }}>{day.day_title}</h3>
                        {day.notes && <p style={{ margin: 0, color: "var(--gd-text-muted)", fontSize: "0.85rem" }}>Note: {day.notes}</p>}
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--gd-line-soft)", color: "var(--gd-text-faint)" }}>
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
                              <tr key={eIdx} style={{ borderBottom: "1px solid rgba(243,237,223,0.04)" }}>
                                <td style={{ padding: "10px 12px", color: "var(--gd-gold)", fontWeight: "600" }}>{eIdx + 1}</td>
                                <td style={{ padding: "10px 12px", color: "var(--gd-ivory)", fontWeight: "500" }}>{ex.name}</td>
                                <td style={{ padding: "10px 12px", color: "var(--gd-ivory-soft)" }}>{ex.sets}</td>
                                <td style={{ padding: "10px 12px", color: "var(--gd-ivory-soft)" }}>{ex.reps}</td>
                                <td style={{ padding: "10px 12px", color: "var(--gd-success)", fontWeight: "500" }}>RIR {ex.rir}</td>
                                <td style={{ padding: "10px 12px", color: "var(--gd-text-muted)", fontSize: "0.82rem" }}>{ex.notes || "—"}</td>
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
                    <div style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line)", borderRadius: "var(--gd-radius-sm)", padding: "18px" }}>
                      <span style={{ color: "var(--gd-gold)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>Daily Target Calories</span>
                      <strong style={{ display: "block", fontSize: "1.8rem", color: "var(--gd-ivory)", margin: "6px 0 2px" }}>
                        {currentPlan.nutrition.target_calories} <span style={{ fontSize: "0.9rem", color: "var(--gd-gold)" }}>kcal/day</span>
                      </strong>
                      <small style={{ color: "var(--gd-text-muted)", fontSize: "0.8rem" }}>Assigned by Coach Sahmi</small>
                    </div>

                    <div style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", borderRadius: "var(--gd-radius-sm)", padding: "18px" }}>
                      <span style={{ color: "var(--gd-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>Maintenance Calories</span>
                      <strong style={{ display: "block", fontSize: "1.5rem", color: "var(--gd-ivory-soft)", margin: "6px 0 2px" }}>
                        {currentPlan.nutrition.maintenance_calories} <span style={{ fontSize: "0.85rem", color: "var(--gd-text-muted)" }}>kcal</span>
                      </strong>
                      <small style={{ color: "var(--gd-text-faint)", fontSize: "0.8rem" }}>Estimated TDEE</small>
                    </div>

                    <div style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", borderRadius: "var(--gd-radius-sm)", padding: "18px" }}>
                      <span style={{ color: "var(--gd-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>Deficit Caloric Floor</span>
                      <strong style={{ display: "block", fontSize: "1.5rem", color: "var(--gd-warning)", margin: "6px 0 2px" }}>
                        {currentPlan.nutrition.deficit_calories} <span style={{ fontSize: "0.85rem", color: "var(--gd-text-muted)" }}>kcal</span>
                      </strong>
                      <small style={{ color: "var(--gd-text-faint)", fontSize: "0.8rem" }}>Fat loss baseline</small>
                    </div>

                    <div style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", borderRadius: "var(--gd-radius-sm)", padding: "18px" }}>
                      <span style={{ color: "var(--gd-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>Surplus Target</span>
                      <strong style={{ display: "block", fontSize: "1.5rem", color: "var(--gd-success)", margin: "6px 0 2px" }}>
                        {currentPlan.nutrition.surplus_calories} <span style={{ fontSize: "0.85rem", color: "var(--gd-text-muted)" }}>kcal</span>
                      </strong>
                      <small style={{ color: "var(--gd-text-faint)", fontSize: "0.8rem" }}>Muscle gain baseline</small>
                    </div>
                  </div>

                  {/* Daily Macro Targets */}
                  <div style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", borderRadius: "var(--gd-radius-sm)", padding: "20px" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "var(--gd-gold-bright)" }}>Macronutrient distribution</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px" }}>
                      <div style={{ background: "rgba(243,237,223,0.03)", padding: "12px 16px", borderRadius: "var(--gd-radius-sm)" }}>
                        <span style={{ color: "var(--gd-text-muted)", fontSize: "0.8rem" }}>Protein</span>
                        <strong style={{ display: "block", fontSize: "1.3rem", color: "var(--gd-ivory)", marginTop: "4px" }}>
                          {currentPlan.nutrition.protein_g}g
                        </strong>
                      </div>
                      <div style={{ background: "rgba(243,237,223,0.03)", padding: "12px 16px", borderRadius: "var(--gd-radius-sm)" }}>
                        <span style={{ color: "var(--gd-text-muted)", fontSize: "0.8rem" }}>Carbohydrates</span>
                        <strong style={{ display: "block", fontSize: "1.3rem", color: "var(--gd-ivory)", marginTop: "4px" }}>
                          {currentPlan.nutrition.carbs_g}g
                        </strong>
                      </div>
                      <div style={{ background: "rgba(243,237,223,0.03)", padding: "12px 16px", borderRadius: "var(--gd-radius-sm)" }}>
                        <span style={{ color: "var(--gd-text-muted)", fontSize: "0.8rem" }}>Healthy fats</span>
                        <strong style={{ display: "block", fontSize: "1.3rem", color: "var(--gd-ivory)", marginTop: "4px" }}>
                          {currentPlan.nutrition.fats_g}g
                        </strong>
                      </div>
                      <div style={{ background: "rgba(243,237,223,0.03)", padding: "12px 16px", borderRadius: "var(--gd-radius-sm)" }}>
                        <span style={{ color: "var(--gd-text-muted)", fontSize: "0.8rem" }}>Hydration</span>
                        <strong style={{ display: "block", fontSize: "1.3rem", color: "var(--gd-info)", marginTop: "4px" }}>
                          {currentPlan.nutrition.hydration_liters} Liters
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Meal Structure & Guidelines */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                    <div style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", borderRadius: "var(--gd-radius-sm)", padding: "20px" }}>
                      <h3 style={{ margin: "0 0 12px", fontSize: "1rem", color: "var(--gd-ivory)" }}>Meal schedule & timing</h3>
                      <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--gd-ivory-soft)", fontSize: "0.88rem", lineHeight: "1.7" }}>
                        {currentPlan.nutrition.meal_structure.map((meal, idx) => (
                          <li key={idx} style={{ marginBottom: "8px" }}>{meal}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", borderRadius: "var(--gd-radius-sm)", padding: "20px" }}>
                      <h3 style={{ margin: "0 0 12px", fontSize: "1rem", color: "var(--gd-ivory)" }}>Supplements & guidelines</h3>
                      <p style={{ margin: "0 0 12px", color: "var(--gd-gold)", fontSize: "0.85rem", fontStyle: "italic" }}>
                        "{currentPlan.nutrition.guidelines}"
                      </p>
                      <h4 style={{ margin: "16px 0 8px", fontSize: "0.88rem", color: "var(--gd-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Supplements Protocol:</h4>
                      <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--gd-ivory-soft)", fontSize: "0.88rem", lineHeight: "1.7" }}>
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
            <div style={{ background: "var(--gd-surface)", border: "1px dashed var(--gd-line)", borderRadius: "var(--gd-radius-md)", padding: "40px 20px", textAlign: "center" }}>
              <h3 style={{ margin: "0 0 8px", color: "var(--gd-ivory)" }}>Master plan pending</h3>
              <p style={{ color: "var(--gd-text-muted)", maxWidth: "480px", margin: "0 auto 20px" }}>
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
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "28px" }}>
          {/* CALCULATOR 1: BMI CALCULATOR */}
          <article style={{ background: "var(--gd-surface)", border: "1px solid var(--gd-line-soft)", borderRadius: "var(--gd-radius-md)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <span className="eyebrow" style={{ color: "var(--gd-gold-bright)", fontSize: "0.72rem" }}>Body Composition</span>
                <h2 style={{ fontSize: "1.3rem", margin: "4px 0 0", color: "var(--gd-ivory)" }}>BMI calculator</h2>
              </div>
              <div style={{ display: "flex", background: "var(--gd-ink)", borderRadius: "var(--gd-radius-pill)", padding: "3px", border: "1px solid var(--gd-line-soft)" }}>
                <button
                  onClick={() => setBmiUnit("metric")}
                  style={{
                    padding: "6px 12px",
                    minHeight: "36px",
                    borderRadius: "var(--gd-radius-pill)",
                    background: bmiUnit === "metric" ? "var(--gd-gold)" : "none",
                    color: bmiUnit === "metric" ? "var(--gd-ink)" : "var(--gd-text-muted)",
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
                    padding: "6px 12px",
                    minHeight: "36px",
                    borderRadius: "var(--gd-radius-pill)",
                    background: bmiUnit === "imperial" ? "var(--gd-gold)" : "none",
                    color: bmiUnit === "imperial" ? "var(--gd-ink)" : "var(--gd-text-muted)",
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
                <label htmlFor="bmi-height-cm" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--gd-text-muted)", textTransform: "uppercase" }}>Height (cm)</span>
                  <input
                    id="bmi-height-cm"
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    min="100"
                    max="230"
                    style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", minHeight: "44px", padding: "10px", borderRadius: "var(--gd-radius-sm)", color: "var(--gd-ivory)" }}
                  />
                </label>
                <label htmlFor="bmi-weight-kg" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--gd-text-muted)", textTransform: "uppercase" }}>Weight (kg)</span>
                  <input
                    id="bmi-weight-kg"
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    min="30"
                    max="220"
                    style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", minHeight: "44px", padding: "10px", borderRadius: "var(--gd-radius-sm)", color: "var(--gd-ivory)" }}
                  />
                </label>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label htmlFor="bmi-height-ft" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--gd-text-muted)", textTransform: "uppercase" }}>Height (ft)</span>
                    <input
                      id="bmi-height-ft"
                      type="number"
                      value={heightFt}
                      onChange={(e) => setHeightFt(Number(e.target.value))}
                      min="3"
                      max="7"
                      style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", minHeight: "44px", padding: "10px", borderRadius: "var(--gd-radius-sm)", color: "var(--gd-ivory)" }}
                    />
                  </label>
                  <label htmlFor="bmi-height-in" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--gd-text-muted)", textTransform: "uppercase" }}>Height (in)</span>
                    <input
                      id="bmi-height-in"
                      type="number"
                      value={heightIn}
                      onChange={(e) => setHeightIn(Number(e.target.value))}
                      min="0"
                      max="11"
                      style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", minHeight: "44px", padding: "10px", borderRadius: "var(--gd-radius-sm)", color: "var(--gd-ivory)" }}
                    />
                  </label>
                </div>
                <label htmlFor="bmi-weight-lbs" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--gd-text-muted)", textTransform: "uppercase" }}>Weight (lbs)</span>
                  <input
                    id="bmi-weight-lbs"
                    type="number"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(Number(e.target.value))}
                    min="60"
                    max="500"
                    style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", minHeight: "44px", padding: "10px", borderRadius: "var(--gd-radius-sm)", color: "var(--gd-ivory)" }}
                  />
                </label>
              </div>
            )}

            {/* BMI Result Display */}
            <div style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", borderRadius: "var(--gd-radius-sm)", padding: "20px", textAlign: "center" }}>
              <span style={{ color: "var(--gd-text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1px" }}>Your calculated BMI</span>
              <div style={{ fontSize: "3rem", fontWeight: "700", color: "var(--gd-ivory)", margin: "4px 0" }}>
                {bmiValue ? bmiValue.toFixed(1) : "0.0"}
              </div>
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 16px",
                  borderRadius: "var(--gd-radius-pill)",
                  background: "rgba(243,237,223,0.06)",
                  color: bmiMeta.color,
                  border: `1px solid ${bmiMeta.color}`,
                  fontWeight: "600",
                  fontSize: "0.82rem",
                  marginBottom: "16px",
                }}
              >
                {bmiMeta.category}
              </span>

              {/* BMI Range Spectrum Bar */}
              <div style={{ position: "relative", height: "10px", borderRadius: "5px", background: "linear-gradient(to right, #d2a85f, #92ad7a 35%, #f97316 70%, #c87162)", margin: "10px 0 20px" }}>
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

              <p style={{ margin: 0, color: "var(--gd-text-muted)", fontSize: "0.83rem", lineHeight: "1.5" }}>
                {bmiMeta.text}
              </p>
            </div>
          </article>

          {/* CALCULATOR 2: MAINTENANCE, DEFICIT & SURPLUS CALORIES CALCULATOR */}
          <article style={{ background: "var(--gd-surface)", border: "1px solid var(--gd-line-soft)", borderRadius: "var(--gd-radius-md)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <span className="eyebrow" style={{ color: "var(--gd-gold-bright)", fontSize: "0.72rem" }}>Energy & TDEE</span>
                <h2 style={{ fontSize: "1.3rem", margin: "4px 0 0", color: "var(--gd-ivory)" }}>Calorie & macro calculator</h2>
              </div>
              <div style={{ display: "flex", background: "var(--gd-ink)", borderRadius: "var(--gd-radius-pill)", padding: "3px", border: "1px solid var(--gd-line-soft)" }}>
                <button
                  onClick={() => setCalUnit("metric")}
                  style={{
                    padding: "6px 12px",
                    minHeight: "36px",
                    borderRadius: "var(--gd-radius-pill)",
                    background: calUnit === "metric" ? "var(--gd-gold)" : "none",
                    color: calUnit === "metric" ? "var(--gd-ink)" : "var(--gd-text-muted)",
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
                    padding: "6px 12px",
                    minHeight: "36px",
                    borderRadius: "var(--gd-radius-pill)",
                    background: calUnit === "imperial" ? "var(--gd-gold)" : "none",
                    color: calUnit === "imperial" ? "var(--gd-ink)" : "var(--gd-text-muted)",
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
              <label htmlFor="cal-gender-select" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--gd-text-muted)", textTransform: "uppercase" }}>Gender</span>
                <select
                  id="cal-gender-select"
                  value={calGender}
                  onChange={(e) => setCalGender(e.target.value as "male" | "female")}
                  style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", minHeight: "44px", padding: "8px", borderRadius: "var(--gd-radius-sm)", color: "var(--gd-ivory)", fontSize: "0.85rem" }}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </label>

              <label htmlFor="cal-age-input" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--gd-text-muted)", textTransform: "uppercase" }}>Age (years)</span>
                <input
                  id="cal-age-input"
                  type="number"
                  value={calAge}
                  onChange={(e) => setCalAge(Number(e.target.value))}
                  min="16"
                  max="90"
                  style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", minHeight: "44px", padding: "8px", borderRadius: "var(--gd-radius-sm)", color: "var(--gd-ivory)", fontSize: "0.85rem" }}
                />
              </label>

              <label htmlFor="cal-weight-input" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--gd-text-muted)", textTransform: "uppercase" }}>Weight ({calUnit === "metric" ? "kg" : "lbs"})</span>
                <input
                  id="cal-weight-input"
                  type="number"
                  value={calWeight}
                  onChange={(e) => setCalWeight(Number(e.target.value))}
                  style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", minHeight: "44px", padding: "8px", borderRadius: "var(--gd-radius-sm)", color: "var(--gd-ivory)", fontSize: "0.85rem" }}
                />
              </label>

              <label htmlFor="cal-height-input" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--gd-text-muted)", textTransform: "uppercase" }}>Height ({calUnit === "metric" ? "cm" : "in"})</span>
                <input
                  id="cal-height-input"
                  type="number"
                  value={calHeight}
                  onChange={(e) => setCalHeight(Number(e.target.value))}
                  style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", minHeight: "44px", padding: "8px", borderRadius: "var(--gd-radius-sm)", color: "var(--gd-ivory)", fontSize: "0.85rem" }}
                />
              </label>
            </div>

            <label htmlFor="cal-activity-select" style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "20px" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--gd-text-muted)", textTransform: "uppercase" }}>Daily activity level</span>
              <select
                id="cal-activity-select"
                value={calActivity}
                onChange={(e) => setCalActivity(Number(e.target.value))}
                style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", minHeight: "44px", padding: "10px", borderRadius: "var(--gd-radius-sm)", color: "var(--gd-ivory)", fontSize: "0.85rem" }}
              >
                <option value={1.2}>Sedentary (desk job, minimal movement)</option>
                <option value={1.375}>Lightly active (1–3 gym sessions / week)</option>
                <option value={1.55}>Moderately active (3–5 intense sessions / week)</option>
                <option value={1.725}>Very active (6–7 sessions / week)</option>
                <option value={1.9}>Extra active (heavy physical job or 2x daily training)</option>
              </select>
            </label>

            {/* Calculated Caloric Tiers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => setCalGoal("deficit")}
                style={{
                  background: calGoal === "deficit" ? "rgba(249, 115, 22, 0.18)" : "var(--gd-ink)",
                  border: calGoal === "deficit" ? "1px solid #f97316" : "1px solid var(--gd-line-soft)",
                  borderRadius: "var(--gd-radius-sm)",
                  padding: "12px 8px",
                  minHeight: "54px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "block", color: "#f97316", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "600" }}>Fat loss (deficit)</span>
                <strong style={{ display: "block", color: "var(--gd-ivory)", fontSize: "1.2rem", marginTop: "2px" }}>{caloriesCalc.deficitMod}</strong>
                <small style={{ color: "var(--gd-text-muted)", fontSize: "0.72rem" }}>kcal/day (-20%)</small>
              </button>

              <button
                type="button"
                onClick={() => setCalGoal("maintenance")}
                style={{
                  background: calGoal === "maintenance" ? "rgba(199, 164, 91, 0.18)" : "var(--gd-ink)",
                  border: calGoal === "maintenance" ? "1px solid var(--gd-gold)" : "1px solid var(--gd-line-soft)",
                  borderRadius: "var(--gd-radius-sm)",
                  padding: "12px 8px",
                  minHeight: "54px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "block", color: "var(--gd-gold)", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "600" }}>Maintenance</span>
                <strong style={{ display: "block", color: "var(--gd-ivory)", fontSize: "1.2rem", marginTop: "2px" }}>{caloriesCalc.tdee}</strong>
                <small style={{ color: "var(--gd-text-muted)", fontSize: "0.72rem" }}>kcal/day (TDEE)</small>
              </button>

              <button
                type="button"
                onClick={() => setCalGoal("surplus")}
                style={{
                  background: calGoal === "surplus" ? "rgba(146, 173, 122, 0.18)" : "var(--gd-ink)",
                  border: calGoal === "surplus" ? "1px solid var(--gd-success)" : "1px solid var(--gd-line-soft)",
                  borderRadius: "var(--gd-radius-sm)",
                  padding: "12px 8px",
                  minHeight: "54px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "block", color: "var(--gd-success)", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "600" }}>Muscle gain (surplus)</span>
                <strong style={{ display: "block", color: "var(--gd-ivory)", fontSize: "1.2rem", marginTop: "2px" }}>{caloriesCalc.surplusLean}</strong>
                <small style={{ color: "var(--gd-text-muted)", fontSize: "0.72rem" }}>kcal/day (+10%)</small>
              </button>
            </div>

            {/* Selected Target Macro Breakdown */}
            <div style={{ background: "var(--gd-ink)", border: "1px solid var(--gd-line-soft)", borderRadius: "var(--gd-radius-sm)", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--gd-text-muted)", textTransform: "uppercase" }}>Recommended macros for {calGoal.toUpperCase()} target</span>
                <strong style={{ color: "var(--gd-gold)", fontSize: "0.95rem" }}>{caloriesCalc.activeTarget} kcal</strong>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", textAlign: "center" }}>
                <div style={{ background: "rgba(243,237,223,0.03)", padding: "10px", borderRadius: "var(--gd-radius-sm)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--gd-text-muted)" }}>Protein</span>
                  <strong style={{ display: "block", color: "var(--gd-ivory)", fontSize: "1.1rem", marginTop: "2px" }}>{caloriesCalc.macros.proteinG}g</strong>
                  <small style={{ color: "var(--gd-text-faint)", fontSize: "0.7rem" }}>{caloriesCalc.macros.proteinKcal} kcal</small>
                </div>
                <div style={{ background: "rgba(243,237,223,0.03)", padding: "10px", borderRadius: "var(--gd-radius-sm)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--gd-text-muted)" }}>Carbs</span>
                  <strong style={{ display: "block", color: "var(--gd-ivory)", fontSize: "1.1rem", marginTop: "2px" }}>{caloriesCalc.macros.carbG}g</strong>
                  <small style={{ color: "var(--gd-text-faint)", fontSize: "0.7rem" }}>{caloriesCalc.macros.carbKcal} kcal</small>
                </div>
                <div style={{ background: "rgba(243,237,223,0.03)", padding: "10px", borderRadius: "var(--gd-radius-sm)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--gd-text-muted)" }}>Fats</span>
                  <strong style={{ display: "block", color: "var(--gd-ivory)", fontSize: "1.1rem", marginTop: "2px" }}>{caloriesCalc.macros.fatG}g</strong>
                  <small style={{ color: "var(--gd-text-faint)", fontSize: "0.7rem" }}>{caloriesCalc.macros.fatKcal} kcal</small>
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
