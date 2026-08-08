import { useState } from "react";
import { Link } from "react-router-dom";
import PortalShell from "../components/PortalShell";
import { clientPortalAdapter } from "../data/clientPortalAdapter";
import { useClientPortalData } from "../data/useClientPortalData";
import { nutritionTotals, type PortalScope } from "../data/types";

export default function NutritionPage({ scope }: { scope: PortalScope }) {
  const data = useClientPortalData(scope);
  const totals = nutritionTotals(data);
  const targets = data.nutrition.targets;
  const basePath = scope === "demo" ? "/demo" : "/client";
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [notice, setNotice] = useState("");

  function addFood() {
    const caloriesNumber = Number(calories);
    if (!name.trim() || !caloriesNumber) { setNotice("Add a food name and calorie value first."); return; }
    clientPortalAdapter.addFood(scope, { name, calories: caloriesNumber });
    setName(""); setCalories(""); setNotice("Food entry added. Your dashboard totals are updated.");
  }

  return (
    <PortalShell scope={scope} current="nutrition" clientName={data.client.fullName} phase={data.client.phaseName}>
      {notice && <div className="portal-notice" role="status"><span>Update</span><p>{notice}</p><button type="button" onClick={() => setNotice("")} aria-label="Dismiss update">×</button></div>}
      <section className="portal-page-heading"><div><p className="portal-kicker">Nutrition</p><h1>Fuel the form.</h1><p>Your daily targets, meals, hydration and coaching guidance in one place.</p></div><Link className="portal-page-action" to={`${basePath}/bmi`}>Open calculators <span>→</span></Link></section>
      <section className="portal-target-grid"><article className="portal-target-primary"><span>Daily target</span><strong>{targets.calories.toLocaleString()}</strong><small>kcal / day</small><p>{Math.max(0, targets.calories - totals.calories).toLocaleString()} calories remaining</p></article><article><span>Maintenance</span><strong>{targets.maintenance.toLocaleString()}</strong><small>kcal / day</small></article><article><span>Deficit</span><strong>{targets.deficit.toLocaleString()}</strong><small>goal estimate</small></article><article><span>Surplus</span><strong>{targets.surplus.toLocaleString()}</strong><small>goal estimate</small></article></section>
      <section className="portal-nutrition-layout">
        <div className="portal-panel portal-food-log"><header><div><p className="portal-kicker">Today’s food log</p><h2>{totals.calories.toLocaleString()} <span>/ {targets.calories.toLocaleString()} kcal</span></h2></div><strong>{data.nutrition.meals.length} entries</strong></header><div className="portal-food-quickadd"><input aria-label="Meal or food" value={name} onChange={(event) => setName(event.target.value)} placeholder="Meal or food" /><input aria-label="Calories" value={calories} onChange={(event) => setCalories(event.target.value)} inputMode="numeric" placeholder="Calories" /><button type="button" onClick={addFood}>+ Add</button></div><div className="portal-meal-list">{data.nutrition.meals.map((meal) => <div key={meal.id}><span>{meal.time}</span><p><strong>{meal.name}</strong><small>{meal.protein ? `${meal.protein}g protein` : "Macros not entered"}</small></p><b>{meal.calories} kcal</b></div>)}</div></div>
        <aside className="portal-nutrition-side"><article className="portal-panel"><p className="portal-kicker">Daily macros</p><div className="portal-target-list"><div><span>Protein</span><strong>{totals.protein} / {targets.protein}g</strong></div><div><span>Carbohydrates</span><strong>{totals.carbs} / {targets.carbs}g</strong></div><div><span>Fats</span><strong>{totals.fats} / {targets.fats}g</strong></div><div><span>Hydration</span><strong>{data.nutrition.hydrationLoggedLitres} / {targets.waterLitres}L</strong></div></div></article><article className="portal-panel"><p className="portal-kicker">Coach guidelines</p><h2>Keep it repeatable.</h2><ul>{data.nutrition.coachGuidelines.map((item) => <li key={item}>{item}</li>)}</ul></article><article className="portal-panel portal-meal-plan"><p className="portal-kicker">Meal timing</p>{data.nutrition.mealTimings.map((timing) => <div key={timing.label}><span>{timing.label}</span><strong>{timing.time}</strong></div>)}</article><article className="portal-panel"><p className="portal-kicker">Supplements</p><ul>{data.nutrition.supplements.map((item) => <li key={item}>{item}</li>)}</ul></article></aside>
      </section>
    </PortalShell>
  );
}
