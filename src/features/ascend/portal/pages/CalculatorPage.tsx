"use client";

import { useMemo, useState } from "react";
import PortalShell from "../components/PortalShell";
import { useClientPortalData } from "../data/useClientPortalData";
import type { PortalScope } from "../data/types";

type Unit = "metric" | "imperial";
type Goal = "deficit" | "maintenance" | "surplus";

function bmiClass(value: number) {
  if (value < 18.5) return "Below healthy range";
  if (value < 25) return "Healthy range";
  if (value < 30) return "Above healthy range";
  return "High range";
}

export default function CalculatorPage({ scope }: { scope: PortalScope }) {
  const data = useClientPortalData(scope);
  const [unit, setUnit] = useState<Unit>("metric");
  const [goal, setGoal] = useState<Goal>("maintenance");
  const [values, setValues] = useState({ sex: "female", age: "30", heightCm: "170", weightKg: "75", feet: "5", inches: "7", pounds: "165", activity: "1.55" });

  const result = useMemo(() => {
    const heightCm = unit === "metric" ? Number(values.heightCm) : (Number(values.feet) * 12 + Number(values.inches)) * 2.54;
    const weightKg = unit === "metric" ? Number(values.weightKg) : Number(values.pounds) * 0.45359237;
    const age = Number(values.age);
    if (!heightCm || !weightKg || !age) return null;
    const metres = heightCm / 100;
    const bmi = weightKg / metres ** 2;
    const healthyLowKg = 18.5 * metres ** 2;
    const healthyHighKg = 24.9 * metres ** 2;
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (values.sex === "male" ? 5 : -161);
    const maintenance = Math.round(bmr * Number(values.activity));
    const calorieTarget = goal === "deficit" ? Math.round(maintenance * 0.85) : goal === "surplus" ? Math.round(maintenance * 1.1) : maintenance;
    const protein = Math.round(weightKg * 2);
    const fats = Math.round(weightKg * 0.8);
    const carbs = Math.max(0, Math.round((calorieTarget - protein * 4 - fats * 9) / 4));
    return { bmi, className: bmiClass(bmi), healthyLowKg, healthyHighKg, bmr: Math.round(bmr), maintenance, calorieTarget, protein, fats, carbs };
  }, [goal, unit, values]);

  const set = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <PortalShell scope={scope} current="nutrition" clientName={data.client.fullName} phase={data.client.phaseName}>
      <section className="portal-page-heading calculator-heading"><div><p className="portal-kicker">Body & energy calculator</p><h1>Know your starting numbers.</h1><p>Estimate BMI, healthy-weight bounds, BMR, calories and macros. Your coach-assigned target remains the plan to follow.</p></div></section>
      <section className="calculator-suite calculator-page-suite">
        <div className="calculator-intro"><p className="eyebrow">BMI & calories</p><h2>Enter your details.</h2><p>The calculator updates instantly in metric or imperial units.</p><div className="calculator-unit-switch"><button className={unit === "metric" ? "active" : ""} type="button" onClick={() => setUnit("metric")}>Metric</button><button className={unit === "imperial" ? "active" : ""} type="button" onClick={() => setUnit("imperial")}>Imperial</button></div><small>General estimate only—not medical advice. Assigned coaching targets override calculator estimates.</small></div>
        <div className="calculator-card">
          <div className="calculator-fields">
            <label><span>Sex used by formula</span><select value={values.sex} onChange={(event) => set("sex", event.target.value)}><option value="female">Female</option><option value="male">Male</option></select></label>
            <label><span>Age</span><input type="number" min="16" max="90" value={values.age} onChange={(event) => set("age", event.target.value)} /></label>
            {unit === "metric" ? <><label><span>Height (cm)</span><input type="number" min="120" max="230" value={values.heightCm} onChange={(event) => set("heightCm", event.target.value)} /></label><label><span>Weight (kg)</span><input type="number" min="35" max="300" step=".1" value={values.weightKg} onChange={(event) => set("weightKg", event.target.value)} /></label></> : <><label><span>Height (feet)</span><input type="number" min="3" max="8" value={values.feet} onChange={(event) => set("feet", event.target.value)} /></label><label><span>Height (inches)</span><input type="number" min="0" max="11" value={values.inches} onChange={(event) => set("inches", event.target.value)} /></label><label><span>Weight (lb)</span><input type="number" min="75" max="660" step=".1" value={values.pounds} onChange={(event) => set("pounds", event.target.value)} /></label></>}
            <label className="wide"><span>Activity level</span><select value={values.activity} onChange={(event) => set("activity", event.target.value)}><option value="1.2">Sedentary — little exercise</option><option value="1.375">Light — 1–3 sessions weekly</option><option value="1.55">Moderate — 3–5 sessions weekly</option><option value="1.725">Very active — 6–7 sessions weekly</option><option value="1.9">Athlete — hard training / physical work</option></select></label>
            <label className="wide"><span>Goal</span><select value={goal} onChange={(event) => setGoal(event.target.value as Goal)}><option value="deficit">Deficit</option><option value="maintenance">Maintenance</option><option value="surplus">Surplus</option></select></label>
          </div>
          <div className="calculator-results"><article><span>BMI</span><strong>{result?.bmi.toFixed(1) || "—"}</strong><small>{result?.className || "Screening estimate"}</small></article><article><span>Healthy range</span><strong>{result ? `${result.healthyLowKg.toFixed(1)}–${result.healthyHighKg.toFixed(1)}` : "—"}</strong><small>kg for this height</small></article><article><span>BMR</span><strong>{result?.bmr || "—"}</strong><small>Mifflin–St Jeor</small></article><article className="featured"><span>{goal} target</span><strong>{result?.calorieTarget || "—"}</strong><small>kcal / day</small></article></div>
          <div className="calculator-results calculator-macro-results"><article><span>Protein</span><strong>{result?.protein || "—"}</strong><small>g / day</small></article><article><span>Carbohydrates</span><strong>{result?.carbs || "—"}</strong><small>g / day</small></article><article><span>Fats</span><strong>{result?.fats || "—"}</strong><small>g / day</small></article><article><span>Maintenance</span><strong>{result?.maintenance || "—"}</strong><small>kcal / day</small></article></div>
          <p className="calculator-note">Compare estimates with a consistent 2–3 week bodyweight trend. Follow your assigned {data.nutrition.targets.calories.toLocaleString()} kcal target unless your coach changes it.</p>
        </div>
      </section>
    </PortalShell>
  );
}
