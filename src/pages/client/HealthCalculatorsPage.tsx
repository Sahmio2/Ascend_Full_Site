import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import PortalShell from "../../layouts/ClientPortalLayout";
import { authStore } from "../../services/authStore";
import { useClientPortalData } from "../../features/get-divine/data/useClientPortalData";

export default function HealthCalculatorsPage() {
  const location = useLocation();
  const session = authStore.getSession();
  const demo = location.pathname.startsWith("/demo") || session.mode === "demo";
  const scope = demo ? "demo" : "live";
  const { clientData } = useClientPortalData(scope);

  const clientName = session.clientName || clientData.person.full_name;
  const signOutPath = "/login";

  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [calculator, setCalculator] = useState({
    sex: "male",
    age: "30",
    heightCm: "175",
    heightFt: "5",
    heightIn: "9",
    weightKg: "75",
    weightLb: "165",
    activity: "1.55",
    goal: "maintenance",
  });

  const result = useMemo(() => {
    const age = Number(calculator.age);
    let heightCm = Number(calculator.heightCm);
    let weightKg = Number(calculator.weightKg);

    if (unitSystem === "imperial") {
      const feet = Number(calculator.heightFt) || 0;
      const inches = Number(calculator.heightIn) || 0;
      const totalInches = feet * 12 + inches;
      heightCm = totalInches * 2.54;
      weightKg = (Number(calculator.weightLb) || 0) * 0.453592;
    }

    if (!age || !heightCm || !weightKg) return null;

    const heightM = heightCm / 100;
    const bmiVal = weightKg / (heightM * heightM);
    const bmi = bmiVal.toFixed(1);

    let classification = "Normal weight";
    if (bmiVal < 18.5) classification = "Underweight";
    else if (bmiVal >= 25 && bmiVal < 30) classification = "Overweight";
    else if (bmiVal >= 30) classification = "Obesity";

    const minNormalKg = 18.5 * (heightM * heightM);
    const maxNormalKg = 24.9 * (heightM * heightM);

    let minWeightStr = `${minNormalKg.toFixed(1)} kg`;
    let maxWeightStr = `${maxNormalKg.toFixed(1)} kg`;

    if (unitSystem === "imperial") {
      minWeightStr = `${(minNormalKg * 2.20462).toFixed(1)} lbs`;
      maxWeightStr = `${(maxNormalKg * 2.20462).toFixed(1)} lbs`;
    }

    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (calculator.sex === "male" ? 5 : -161);
    const maintenance = Math.round(bmr * Number(calculator.activity));
    const deficit = Math.round(maintenance * 0.85);
    const surplus = Math.round(maintenance * 1.1);

    let targetCalories = maintenance;
    if (calculator.goal === "deficit") targetCalories = deficit;
    else if (calculator.goal === "surplus") targetCalories = surplus;

    const proteinG = Math.round(weightKg * 2.0);
    const fatG = Math.round((targetCalories * 0.25) / 9);
    const carbG = Math.round((targetCalories - (proteinG * 4 + fatG * 9)) / 4);

    return {
      bmi,
      classification,
      healthyRange: `${minWeightStr} – ${maxWeightStr}`,
      maintenance,
      deficit,
      surplus,
      targetCalories,
      proteinG,
      fatG,
      carbG,
    };
  }, [calculator, unitSystem]);

  return (
    <PortalShell clientName={clientName} signOutPath={signOutPath} demo={demo} current="nutrition">
      <section className="portal-page-heading calculator-heading">
        <div>
          <p className="portal-kicker">Body & energy calculator</p>
          <h1>Know your starting numbers.</h1>
          <p>Estimate BMI and daily calorie needs in a focused space. Your assigned coach target remains the primary plan to follow.</p>
        </div>
      </section>

      <section className="calculator-suite calculator-page-suite">
        <div className="calculator-intro">
          <p className="eyebrow">BMI & calories</p>
          <h2>Enter your details.</h2>
          <p>The calculator updates instantly as you change your numbers.</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              type="button"
              className={unitSystem === "metric" ? "button button-gold button-small" : "button button-outline button-small"}
              onClick={() => setUnitSystem("metric")}
            >
              Metric (cm/kg)
            </button>
            <button
              type="button"
              className={unitSystem === "imperial" ? "button button-gold button-small" : "button button-outline button-small"}
              onClick={() => setUnitSystem("imperial")}
            >
              Imperial (ft-in/lbs)
            </button>
          </div>
        </div>

        <div className="calculator-card">
          <div className="calculator-fields">
            <label>
              <span>Sex used by formula</span>
              <select value={calculator.sex} onChange={(e) => setCalculator({ ...calculator, sex: e.target.value })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label>
              <span>Age</span>
              <input type="number" min="16" max="90" value={calculator.age} onChange={(e) => setCalculator({ ...calculator, age: e.target.value })} />
            </label>

            {unitSystem === "metric" ? (
              <>
                <label>
                  <span>Height (cm)</span>
                  <input type="number" min="120" max="230" value={calculator.heightCm} onChange={(e) => setCalculator({ ...calculator, heightCm: e.target.value })} />
                </label>
                <label>
                  <span>Weight (kg)</span>
                  <input type="number" min="35" max="300" step=".1" value={calculator.weightKg} onChange={(e) => setCalculator({ ...calculator, weightKg: e.target.value })} />
                </label>
              </>
            ) : (
              <>
                <label>
                  <span>Height (ft & in)</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input type="number" min="3" max="7" value={calculator.heightFt} onChange={(e) => setCalculator({ ...calculator, heightFt: e.target.value })} placeholder="ft" />
                    <input type="number" min="0" max="11" value={calculator.heightIn} onChange={(e) => setCalculator({ ...calculator, heightIn: e.target.value })} placeholder="in" />
                  </div>
                </label>
                <label>
                  <span>Weight (lbs)</span>
                  <input type="number" min="80" max="660" step=".1" value={calculator.weightLb} onChange={(e) => setCalculator({ ...calculator, weightLb: e.target.value })} />
                </label>
              </>
            )}

            <label className="wide">
              <span>Activity level</span>
              <select value={calculator.activity} onChange={(e) => setCalculator({ ...calculator, activity: e.target.value })}>
                <option value="1.2">Sedentary — little exercise</option>
                <option value="1.375">Light — 1–3 sessions weekly</option>
                <option value="1.55">Moderate — 3–5 sessions weekly</option>
                <option value="1.725">Very active — 6–7 sessions weekly</option>
                <option value="1.9">Athlete — hard training / physical work</option>
              </select>
            </label>

            <label className="wide">
              <span>Goal direction</span>
              <select value={calculator.goal} onChange={(e) => setCalculator({ ...calculator, goal: e.target.value })}>
                <option value="maintenance">Maintenance — maintain weight</option>
                <option value="deficit">Fat Loss Deficit (15% below)</option>
                <option value="surplus">Muscle Gain Surplus (10% above)</option>
              </select>
            </label>
          </div>

          <div className="calculator-results">
            <article>
              <span>BMI</span>
              <strong>{result?.bmi || "—"}</strong>
              <small>{result?.classification || "Screening estimate"}</small>
            </article>
            <article className="featured">
              <span>Selected Target</span>
              <strong>{result?.targetCalories || "—"}</strong>
              <small>kcal / day ({calculator.goal})</small>
            </article>
            <article>
              <span>Healthy Weight</span>
              <strong style={{ fontSize: "1.1rem" }}>{result?.healthyRange || "—"}</strong>
              <small>BMI 18.5–24.9 range</small>
            </article>
            <article>
              <span>Macros</span>
              <strong style={{ fontSize: "0.95rem" }}>{result ? `${result.proteinG}g P · ${result.carbG}g C · ${result.fatG}g F` : "—"}</strong>
              <small>Estimated protein / carbs / fat</small>
            </article>
          </div>
          <p className="calculator-note">
            Maintenance uses the Mifflin–St Jeor BMR formula and your selected activity level. Note: Your coach-assigned targets override these estimates during an active phase.
          </p>
        </div>
      </section>
    </PortalShell>
  );
}
