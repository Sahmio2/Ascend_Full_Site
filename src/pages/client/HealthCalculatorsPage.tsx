import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import PortalShell from "../../layouts/ClientPortalLayout";
import { authStore } from "../../services/authStore";
import { DEMO_CLIENT } from "../../data/demoSeed";

export default function HealthCalculatorsPage() {
  const location = useLocation();
  const session = authStore.getSession();
  const demo = location.pathname.startsWith("/demo") || session.mode === "demo";
  const clientName = session.clientName || DEMO_CLIENT.full_name;
  const signOutPath = "/login";

  const [calculator, setCalculator] = useState({ sex: "male", age: "30", height: "175", weight: "75", activity: "1.55" });
  const result = useMemo(() => {
    const age = Number(calculator.age), height = Number(calculator.height), weight = Number(calculator.weight), activity = Number(calculator.activity);
    if (!age || !height || !weight) return null;
    const bmi = weight / ((height / 100) ** 2);
    const bmr = 10 * weight + 6.25 * height - 5 * age + (calculator.sex === "male" ? 5 : -161);
    const maintenance = Math.round(bmr * activity);
    return { bmi: bmi.toFixed(1), maintenance, deficit: Math.round(maintenance * .85), surplus: Math.round(maintenance * 1.1) };
  }, [calculator]);

  return (
    <PortalShell clientName={clientName} signOutPath={signOutPath} demo={demo} current="nutrition">
      <section className="portal-page-heading calculator-heading">
        <div><p className="portal-kicker">Body & energy calculator</p>
        <h1>Know your starting numbers.</h1>
        <p>Estimate BMI and daily calorie needs in a focused space. Your assigned nutrition target remains the plan to follow.</p></div>
      </section>
      <section className="calculator-suite calculator-page-suite">
        <div className="calculator-intro"><p className="eyebrow">BMI & calories</p><h2>Enter your details.</h2><p>The calculator updates instantly as you change your numbers.</p><small>General estimate only—not medical advice. Pregnancy, medical conditions, medication and major weight changes can make these formulas less suitable.</small></div>
        <div className="calculator-card">
          <div className="calculator-fields">
            <label><span>Sex used by formula</span><select value={calculator.sex} onChange={(e) => setCalculator({ ...calculator, sex: e.target.value })}><option value="male">Male</option><option value="female">Female</option></select></label>
            <label><span>Age</span><input type="number" min="16" max="90" value={calculator.age} onChange={(e) => setCalculator({ ...calculator, age: e.target.value })} /></label>
            <label><span>Height (cm)</span><input type="number" min="120" max="230" value={calculator.height} onChange={(e) => setCalculator({ ...calculator, height: e.target.value })} /></label>
            <label><span>Weight (kg)</span><input type="number" min="35" max="300" step=".1" value={calculator.weight} onChange={(e) => setCalculator({ ...calculator, weight: e.target.value })} /></label>
            <label className="wide"><span>Activity level</span><select value={calculator.activity} onChange={(e) => setCalculator({ ...calculator, activity: e.target.value })}><option value="1.2">Sedentary — little exercise</option><option value="1.375">Light — 1–3 sessions weekly</option><option value="1.55">Moderate — 3–5 sessions weekly</option><option value="1.725">Very active — 6–7 sessions weekly</option><option value="1.9">Athlete — hard training / physical work</option></select></label>
          </div>
          <div className="calculator-results">
            <article><span>BMI</span><strong>{result?.bmi || "—"}</strong><small>Screening estimate</small></article>
            <article className="featured"><span>Maintenance</span><strong>{result?.maintenance || "—"}</strong><small>kcal / day</small></article>
            <article><span>Deficit</span><strong>{result?.deficit || "—"}</strong><small>15% below maintenance</small></article>
            <article><span>Surplus</span><strong>{result?.surplus || "—"}</strong><small>10% above maintenance</small></article>
          </div>
          <p className="calculator-note">Maintenance uses the Mifflin–St Jeor BMR formula and your selected activity level. Compare the estimate with your bodyweight trend for 2–3 weeks.</p>
        </div>
      </section>
    </PortalShell>
  );
}
