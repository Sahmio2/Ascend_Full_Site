import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PortalShell from "../../layouts/ClientPortalLayout";
import { authStore } from "../../services/authStore";
import { DEMO_CLIENT } from "../../data/demoSeed";

const targets = { calories: 2250, protein: 170, carbs: 245, fats: 70, water: 3 };
const demoMeals = [
  { time: "08:10", name: "Greek yoghurt, oats & berries", calories: 480, protein: 34 },
  { time: "12:45", name: "Jollof rice, grilled chicken & greens", calories: 690, protein: 52 },
  { time: "16:20", name: "Banana & whey shake", calories: 280, protein: 27 },
  { time: "19:30", name: "Salmon, potatoes & vegetables", calories: 170, protein: 13 },
];

export default function NutritionPage() {
  const location = useLocation();
  const session = authStore.getSession();
  const demo = location.pathname.startsWith("/demo") || session.mode === "demo";
  const clientName = session.clientName || DEMO_CLIENT.full_name;
  const signOutPath = "/login";

  const [notice, setNotice] = useState("");
  const [meals, setMeals] = useState(demoMeals);
  const [mealName, setMealName] = useState("");
  const [mealCalories, setMealCalories] = useState("");
  const basePath = demo ? "/demo" : "/client";
  const totals = useMemo(() => ({ calories: meals.reduce((sum, meal) => sum + meal.calories, 0), protein: meals.reduce((sum, meal) => sum + meal.protein, 0) }), [meals]);

  function addMeal() {
    if (!mealName.trim() || !Number(mealCalories)) { setNotice("Add a meal name and calorie estimate first."); return; }
    setMeals((current) => [...current, { time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), name: mealName.trim(), calories: Number(mealCalories), protein: 0 }]);
    setMealName(""); setMealCalories("");
    setNotice(demo ? "Demo meal added for this visit only." : "Meal added to today’s draft.");
  }

  return (
    <PortalShell clientName={clientName} signOutPath={signOutPath} demo={demo} current="nutrition" phase="Phase II — Forging the Form">
      {notice && <div className="portal-notice"><span>Update</span><p>{notice}</p><button onClick={() => setNotice("")} aria-label="Dismiss update">×</button></div>}
      <section className="portal-page-heading"><div><p className="portal-kicker">Nutrition</p><h1>Fuel the form.</h1><p>Your daily targets, meals, hydration and coaching guidance in one place.</p></div><Link className="portal-page-action" to={`${basePath}/bmi`}>Open calculators <span>→</span></Link></section>

      <section className="portal-target-grid">
        <article className="portal-target-primary"><span>Daily target</span><strong>{targets.calories.toLocaleString()}</strong><small>kcal / day</small><p>{Math.max(0, targets.calories - totals.calories).toLocaleString()} calories remaining</p></article>
        <article><span>Maintenance</span><strong>2,470</strong><small>kcal / day</small></article>
        <article><span>Deficit</span><strong>2,100</strong><small>15% below</small></article>
        <article><span>Surplus</span><strong>2,720</strong><small>10% above</small></article>
      </section>

      <section className="portal-nutrition-layout">
        <div className="portal-panel portal-food-log">
          <header><div><p className="portal-kicker">Today’s food log</p><h2>{totals.calories.toLocaleString()} <span>/ {targets.calories.toLocaleString()} kcal</span></h2></div><strong>{meals.length} entries</strong></header>
          <div className="portal-food-quickadd"><input aria-label="Meal or food" value={mealName} onChange={(event) => setMealName(event.target.value)} placeholder="Meal or food" /><input aria-label="Calories" value={mealCalories} onChange={(event) => setMealCalories(event.target.value)} inputMode="numeric" placeholder="Calories" /><button type="button" onClick={addMeal}>+ Add</button></div>
          <div className="portal-meal-list">{meals.map((meal, index) => <div key={`${meal.time}-${index}`}><span>{meal.time}</span><p><strong>{meal.name}</strong><small>{meal.protein ? `${meal.protein}g protein` : "Protein not entered"}</small></p><b>{meal.calories} kcal</b></div>)}</div>
        </div>

        <aside className="portal-nutrition-side">
          <article className="portal-panel"><p className="portal-kicker">Daily macros</p><div className="portal-target-list"><div><span>Protein</span><strong>{totals.protein} / {targets.protein}g</strong></div><div><span>Carbohydrates</span><strong>164 / {targets.carbs}g</strong></div><div><span>Fats</span><strong>54 / {targets.fats}g</strong></div><div><span>Hydration</span><strong>1.8 / {targets.water}L</strong></div></div></article>
          <article className="portal-panel"><p className="portal-kicker">Coach guidelines</p><h2>Keep it repeatable.</h2><ul><li>Build every meal around a clear protein source.</li><li>Place most carbohydrates around training.</li><li>Hit hydration before adding supplements.</li></ul></article>
          <article className="portal-panel portal-meal-plan"><p className="portal-kicker">Meal timing</p><div><span>Meal 01</span><strong>08:00–09:00</strong></div><div><span>Meal 02</span><strong>12:30–13:30</strong></div><div><span>Pre-training</span><strong>60–90 min before</strong></div><div><span>Final meal</span><strong>19:00–20:30</strong></div></article>
        </aside>
      </section>
    </PortalShell>
  );
}
