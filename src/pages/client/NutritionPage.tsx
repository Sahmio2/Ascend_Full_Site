import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PortalShell from "../../layouts/ClientPortalLayout";
import { authStore } from "../../services/authStore";
import { useClientPortalData } from "../../features/get-divine/data/useClientPortalData";
import { clientPortalAdapter } from "../../features/get-divine/data/clientPortalAdapter";

export default function NutritionPage() {
  const location = useLocation();
  const session = authStore.getSession();
  const demo = location.pathname.startsWith("/demo") || session.mode === "demo";
  const scope = demo ? "demo" : "live";
  const { clientData, nutrition, meals } = useClientPortalData(scope);

  const clientName = session.clientName || clientData.person.full_name;
  const signOutPath = "/login";

  const [notice, setNotice] = useState("");
  const [mealName, setMealName] = useState("");
  const [mealCalories, setMealCalories] = useState("");
  const basePath = demo ? "/demo" : "/client";

  const totals = useMemo(() => ({
    calories: meals.reduce((sum, meal) => sum + meal.calories, 0),
    protein: meals.reduce((sum, meal) => sum + meal.protein, 0),
  }), [meals]);

  function addMeal() {
    if (!mealName.trim() || !Number(mealCalories)) {
      setNotice("Add a meal name and calorie estimate first.");
      return;
    }
    clientPortalAdapter.addFood(scope, {
      name: mealName.trim(),
      calories: Number(mealCalories),
      protein: 0,
    });
    setMealName("");
    setMealCalories("");
    setNotice(demo ? "Demo meal added and dashboard updated." : "Meal added to today’s food log.");
  }

  return (
    <PortalShell clientName={clientName} signOutPath={signOutPath} demo={demo} current="nutrition" phase={clientData.person.phase}>
      {notice && <div className="portal-notice"><span>Update</span><p>{notice}</p><button onClick={() => setNotice("")} aria-label="Dismiss update">×</button></div>}
      <section className="portal-page-heading"><div><p className="portal-kicker">Nutrition</p><h1>Fuel the form.</h1><p>Your daily targets, meals, hydration and coaching guidance in one place.</p></div><Link className="portal-page-action" to={`${basePath}/bmi`}>Open calculators <span>→</span></Link></section>

      <section className="portal-target-grid">
        <article className="portal-target-primary"><span>Daily target</span><strong>{nutrition.calories.target.toLocaleString()}</strong><small>kcal / day</small><p>{Math.max(0, nutrition.calories.target - totals.calories).toLocaleString()} calories remaining</p></article>
        <article><span>Maintenance</span><strong>{nutrition.maintenance.toLocaleString()}</strong><small>kcal / day</small></article>
        <article><span>Deficit</span><strong>{nutrition.deficit.toLocaleString()}</strong><small>15% below</small></article>
        <article><span>Surplus</span><strong>{nutrition.surplus.toLocaleString()}</strong><small>10% above</small></article>
      </section>

      <section className="portal-nutrition-layout">
        <div className="portal-panel portal-food-log">
          <header><div><p className="portal-kicker">Today’s food log</p><h2>{totals.calories.toLocaleString()} <span>/ {nutrition.calories.target.toLocaleString()} kcal</span></h2></div><strong>{meals.length} entries</strong></header>
          <div className="portal-food-quickadd"><input aria-label="Meal or food" value={mealName} onChange={(event) => setMealName(event.target.value)} placeholder="Meal or food" /><input aria-label="Calories" value={mealCalories} onChange={(event) => setMealCalories(event.target.value)} inputMode="numeric" placeholder="Calories" /><button type="button" onClick={addMeal}>+ Add</button></div>
          <div className="portal-meal-list">{meals.map((meal, index) => <div key={`${meal.time}-${index}`}><span>{meal.time}</span><p><strong>{meal.name}</strong><small>{meal.protein ? `${meal.protein}g protein` : "Protein not entered"}</small></p><b>{meal.calories} kcal</b></div>)}</div>
        </div>

        <aside className="portal-nutrition-side">
          <article className="portal-panel"><p className="portal-kicker">Daily macros</p><div className="portal-target-list"><div><span>Protein</span><strong>{totals.protein} / {nutrition.protein.target}g</strong></div><div><span>Carbohydrates</span><strong>164 / {nutrition.carbs.target}g</strong></div><div><span>Fats</span><strong>54 / {nutrition.fats.target}g</strong></div><div><span>Hydration</span><strong>1.8 / {nutrition.water.target}L</strong></div></div></article>
          <article className="portal-panel"><p className="portal-kicker">Coach guidelines</p><h2>Keep it repeatable.</h2><ul><li>Build every meal around a clear protein source.</li><li>Place most carbohydrates around training.</li><li>Hit hydration before adding supplements.</li></ul></article>
          <article className="portal-panel portal-meal-plan"><p className="portal-kicker">Meal timing</p><div><span>Meal 01</span><strong>08:00–09:00</strong></div><div><span>Meal 02</span><strong>12:30–13:30</strong></div><div><span>Pre-training</span><strong>60–90 min before</strong></div><div><span>Final meal</span><strong>19:00–20:30</strong></div></article>
        </aside>
      </section>
    </PortalShell>
  );
}
