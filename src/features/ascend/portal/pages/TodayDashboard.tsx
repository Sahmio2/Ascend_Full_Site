"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "@/styles/ascend-today-dashboard.css";
import type { PortalScope } from "../data/types";

// SVG icons matching the approved prototype
const SVGS: Record<string, string> = {
  msg: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.8-5.4a9 9 0 0 1-.8-4.1 8.5 8.5 0 0 1 17 0Z"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><circle cx="12" cy="12" r="9"/><path d="M5.5 18.5c.8-2.5 3-4 6.5-4s5.7 1.5 6.5 4"/>',
  right: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  dumb: '<path d="M3 9v6m3-9v12m3-9v6m6-6v6m3-9v12m3-9v6M9 12h6"/>',
  food: '<path d="M4 3v8m3-8v8m3-8v8m-6 0h6m-3 0v10m11 0V3c-4 0-5 4-5 9h5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h.01m4 0h.01m4 0h.01"/>',
  home: '<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>',
  chart: '<path d="M4 20V9m6 11V4m5 16v-7m5 7V7"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  shield: '<path d="m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6Z"/><path d="M12 7v6m0 3h.01"/>',
};

function TodayIcon({ name, className = "svg" }: { name: string; className?: string }) {
  const path = SVGS[name] || SVGS.home;
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

// Scenarios definition
type ScenarioKey = "training" | "rest" | "checkin" | "missed" | "building" | "assessment" | "safety";

interface ScenarioConfig {
  day: string;
  lead: string;
  name: string;
  meta: string;
  cta: string;
  direction: string;
  target: "workout" | "direction" | "checkin" | "building" | "assessment" | "safety";
}

const SCENARIOS: Record<ScenarioKey, ScenarioConfig> = {
  training: {
    day: "WEDNESDAY · TRAINING DAY",
    lead: "Today’s session is ready",
    name: "Full Body B",
    meta: "50 min · Gym",
    cta: "Start Workout",
    direction: "Focus on controlled repetitions. Keep your technique consistent throughout the session.",
    target: "workout",
  },
  rest: {
    day: "TUESDAY · RECOVERY DAY",
    lead: "Recovery is part of the work",
    name: "Rest & Recovery",
    meta: "Rest day · No gym session",
    cta: "View Today’s Direction",
    direction: "Follow only the recovery steps prescribed in your active programme. Your nutrition plan remains available.",
    target: "direction",
  },
  checkin: {
    day: "FRIDAY · COACHING CHECK-IN",
    lead: "Your next adjustment begins here",
    name: "Midpoint Check-In",
    meta: "Scheduled coaching review",
    cta: "Complete Check-In",
    direction: "Record the week as it happened. Sahmi will use your check-in and saved logs during your scheduled review.",
    target: "checkin",
  },
  missed: {
    day: "THURSDAY · TRAINING DAY",
    lead: "Today’s session is ready",
    name: "Full Body C",
    meta: "55 min · Gym",
    cta: "Start Workout",
    direction: "Follow today’s approved session. A previously missed workout remains missed unless you choose to reschedule it.",
    target: "workout",
  },
  building: {
    day: "PROGRAMME PREPARATION",
    lead: "Your direction is taking shape",
    name: "Programme Under Review",
    meta: "After complete assessment · Up to 5 business days",
    cta: "View Review Status",
    direction: "Your training and nutrition plans are being prepared. They will appear when approved.",
    target: "building",
  },
  assessment: {
    day: "YOUR STARTING POINT",
    lead: "Complete your foundation",
    name: "Private Assessment",
    meta: "Your answers are saved as you progress",
    cta: "Continue Assessment",
    direction: "Complete the remaining assessment so Sahmi can prepare your individual plan.",
    target: "assessment",
  },
  safety: {
    day: "PERSONAL REVIEW REQUIRED",
    lead: "A personal review is required",
    name: "Review Required",
    meta: "Training action unavailable during review",
    cta: "View Required Action",
    direction: "An individual safety review is needed before affected coaching instructions can be used.",
    target: "safety",
  },
};

const MEALS = [
  { id: "breakfast", name: "Breakfast", food: "Oats and boiled eggs", portion: "Oats 60 g (dry) · Eggs 100 g (boiled)" },
  { id: "lunch", name: "Lunch", food: "Rice and fish", portion: "Rice 180 g (cooked) · Fish 130 g (cooked)" },
  { id: "dinner", name: "Dinner", food: "Eba and egusi soup", portion: "Eba 200 g (prepared) · Egusi 160 g (finished recipe)" },
];

export interface TodayDashboardProps {
  scope?: PortalScope;
  onSwitchToClassic?: () => void;
}

export default function TodayDashboard({ scope = "live", onSwitchToClassic }: TodayDashboardProps) {
  const router = useRouter();
  const basePath = scope === "demo" ? "/demo" : "/client";

  // Navigation & Simulation State
  type ScreenTab = "today" | "workouts" | "nutrition" | "progress";
  const [activeTab, setActiveTab] = useState<ScreenTab>("today");
  const [scenario, setScenario] = useState<ScenarioKey>("training");
  const [mealLogs, setMealLogs] = useState<Record<string, "as-planned" | "changed" | "skipped">>({
    breakfast: "as-planned",
  });
  const [workoutStatus, setWorkoutStatus] = useState<"scheduled" | "active">("scheduled");

  // Modal State
  const [modalData, setModalData] = useState<{
    title: string;
    body: string;
    actionLabel?: string;
    actionHref?: string;
  } | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalData(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const s = SCENARIOS[scenario];
  const hasPlan = !["building", "assessment", "safety"].includes(scenario);
  const recordedMealsCount = Object.values(mealLogs).filter(Boolean).length;

  const handleMealAction = (mealId: string, action: "as-planned" | "changed" | "skipped" | "clear") => {
    if (action === "clear") {
      const copy = { ...mealLogs };
      delete copy[mealId];
      setMealLogs(copy);
    } else if (action === "changed") {
      setMealLogs({ ...mealLogs, [mealId]: "changed" });
      setModalData({
        title: "Changed meal · demo",
        body: "A production logger records actual foods, grams and preparation states. No macros are invented here.",
        actionLabel: "Open Nigerian Meal Plan",
        actionHref: `${basePath}/nutrition`,
      });
    } else {
      setMealLogs({ ...mealLogs, [mealId]: action });
    }
  };

  const handleMainAction = () => {
    const target = s.target;
    if (target === "workout") {
      setActiveTab("workouts");
    } else if (target === "direction") {
      setModalData({
        title: "Today’s direction",
        body: "Prescribed recovery guidance appears here. No unverified advice is generated automatically.",
      });
    } else if (target === "checkin") {
      setModalData({
        title: "Coaching check-in",
        body: "Your midpoint check-in is scheduled for Friday. Record the week as it happened.",
        actionLabel: "Prepare Check-In in Progress",
        actionHref: `${basePath}/progress`,
      });
    } else if (target === "building") {
      setModalData({
        title: "Programme review status",
        body: "Your assessment answers have been received. Sahmi prepares your plan within 5 business days after full submission.",
      });
    } else if (target === "assessment") {
      setModalData({
        title: "Continue your assessment",
        body: "Complete your 9-stage intake foundation so your personalised coaching track can be calibrated.",
        actionLabel: "Open 9-Stage Assessment",
        actionHref: "/apply",
      });
    } else {
      setModalData({
        title: "Safety review",
        body: "An individual safety review is required before affected coaching instructions can be activated. Sahmi reviews clinical flags personally.",
      });
    }
  };

  return (
    <div className="today-dashboard-root">
      <main className="workspace">
        {/* Top interactive simulator testbar */}
        <div className="testbar">
          <div>
            <span>INTERACTIVE DEMO <span className="demoPill">· Fictional client</span></span>
            {onSwitchToClassic && (
              <button
                onClick={onSwitchToClassic}
                style={{
                  display: "block",
                  background: "transparent",
                  border: "none",
                  color: "var(--gold)",
                  fontSize: "11px",
                  padding: "2px 0 0 0",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Switch to Classic Portal Grid →
              </button>
            )}
          </div>
          <select
            id="scenario"
            aria-label="Choose Today dashboard scenario"
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value as ScenarioKey);
              setActiveTab("today");
            }}
          >
            <option value="training">Training day</option>
            <option value="rest">Recovery day</option>
            <option value="checkin">Check-in due</option>
            <option value="missed">Previous workout missed</option>
            <option value="building">Programme being built</option>
            <option value="assessment">Assessment incomplete</option>
            <option value="safety">Safety review hold</option>
          </select>
        </div>

        {/* Mobile/Tablet Phone Shell */}
        <div className="shell">
          <div className="screen" id="screen">
            {/* Header Brand Bar */}
            <header className="brand">
              <div>
                <div className="brandname">ASCEND</div>
                <div className="eyebrow">YOUR DAILY DIRECTION</div>
              </div>
              <div className="headBtns">
                <button
                  className="iconBtn"
                  onClick={() =>
                    setModalData({
                      title: "Coach inbox",
                      body: "Normal questions are queued for the next scheduled review. Dated coach updates and priority tickets are handled here.",
                    })
                  }
                  aria-label="Coach inbox"
                >
                  <TodayIcon name="msg" />
                </button>
                <button
                  className="iconBtn"
                  onClick={() =>
                    setModalData({
                      title: "Client profile",
                      body: "Account settings, membership standing, payment history and coaching track details are managed in Account Overview.",
                      actionLabel: "Open Account Overview",
                      actionHref: "/account",
                    })
                  }
                  aria-label="Profile"
                >
                  <TodayIcon name="user" />
                </button>
              </div>
            </header>

            {/* TAB 1: TODAY */}
            {activeTab === "today" && (
              <>
                <div className="daylabel">{s.day}</div>

                <section className="primary">
                  <div className="kicker">YOUR NEXT ACTION</div>
                  <h1>{s.name}</h1>
                  <div className="meta">{s.meta}</div>
                  <button className="primaryAction" onClick={handleMainAction}>
                    <span>{s.cta}</span>
                    <TodayIcon name="right" />
                  </button>
                </section>

                <section className="direction">
                  <h2>Today&apos;s direction</h2>
                  <p>{s.direction}</p>
                </section>

                <div className="divider" />

                <section>
                  <h2 className="sectionHeader">Your day at a glance</h2>
                  <div className="statgrid">
                    <button
                      className="stat"
                      onClick={() => setActiveTab("workouts")}
                    >
                      <span className="statTitle">
                        <TodayIcon name="dumb" /> Training
                      </span>
                      <strong>{hasPlan ? "1 / 3" : "—"}</strong>
                      <div className="small">
                        {hasPlan ? "Workouts completed this week" : "Plan not yet active"}
                      </div>
                    </button>

                    <button
                      className="stat"
                      onClick={() => setActiveTab("nutrition")}
                    >
                      <span className="statTitle">
                        <TodayIcon name="food" /> Nutrition
                      </span>
                      <strong>{hasPlan ? `${recordedMealsCount} / ${MEALS.length}` : "—"}</strong>
                      <div className="small">
                        {hasPlan ? "Meal updates recorded today" : "Meal plan not yet active"}
                      </div>
                      {hasPlan && (
                        <div className="next">Next planned: Lunch · View meals →</div>
                      )}
                    </button>
                  </div>
                </section>

                <section className="under">
                  <div>
                    <strong>Next coaching check-in</strong>
                    <small>{hasPlan ? "Friday · Example schedule" : "Shown after your programme is active"}</small>
                  </div>
                  <span className="right">
                    <TodayIcon name="calendar" />
                  </span>
                </section>

                {hasPlan && (
                  <section className="update">
                    <strong>Latest coach update · Example</strong>
                    <p>5 Nov · Your approved programme is active. View changes in the coaching inbox.</p>
                  </section>
                )}

                <p className="mini">
                  Illustrative information and dates. Nutrition logging and full programme details live in their own tabs.
                </p>
              </>
            )}

            {/* TAB 2: WORKOUTS */}
            {activeTab === "workouts" && (
              <>
                <div className="pageHeader">
                  <h1>Workouts</h1>
                  <p>Foundation · 1 of 3 sessions completed this example week</p>
                </div>

                {[
                  { day: "MON", n: "Full Body A", st: "Completed" as const },
                  { day: "WED", n: "Full Body B", st: workoutStatus === "active" ? ("In progress" as const) : ("Scheduled" as const) },
                  { day: "FRI", n: "Full Body C", st: "Scheduled" as const },
                ].map((item, idx) => (
                  <section key={idx} className="meal">
                    <div className="mealhead">
                      <div>
                        <strong>{item.day} · {item.n}</strong>
                        <br />
                        <span>{item.st}</span>
                      </div>
                      {item.st === "Completed" ? (
                        <TodayIcon name="check" />
                      ) : (
                        <TodayIcon name="dumb" />
                      )}
                    </div>
                    <div className="actions">
                      {item.st === "Completed" ? (
                        <button
                          className="smallBtn"
                          onClick={() =>
                            setModalData({
                              title: "Completed Session",
                              body: "Your completed workout metrics are preserved in Workout History.",
                            })
                          }
                        >
                          View summary
                        </button>
                      ) : (
                        <>
                          <button
                            className="smallBtn fill"
                            onClick={() => router.push(`${basePath}/workout-logger`)}
                          >
                            Open Workout Logger →
                          </button>
                          <button
                            className="smallBtn"
                            onClick={() =>
                              setModalData({
                                title: "Workout preview",
                                body: "This Today preview displays programmed volume: 3 sets Leg Press, 2 sets Romanian Deadlift, 3 sets Seated Row.",
                                actionLabel: "Start Workout in Logger",
                                actionHref: `${basePath}/workout-logger`,
                              })
                            }
                          >
                            View details
                          </button>
                        </>
                      )}
                    </div>
                  </section>
                ))}

                <div className="summary">
                  <h2>Missed workouts have no penalty</h2>
                  <p>
                    Optional rescheduling stays in Workouts. A missed session does not interrupt the next Today action.
                  </p>
                </div>
              </>
            )}

            {/* TAB 3: NUTRITION */}
            {activeTab === "nutrition" && (
              <>
                <div className="pageHeader">
                  <h1>Today&apos;s Meals</h1>
                  <p>Open a meal to record it. This is the Nutrition screen, not Today.</p>
                </div>

                <div className="summary">
                  <h2>{recordedMealsCount} of {MEALS.length} meal updates recorded</h2>
                  <p>Recorded does not automatically mean eaten as prescribed.</p>
                </div>

                {MEALS.map((m) => {
                  const logStatus = mealLogs[m.id];
                  return (
                    <section key={m.id} className="meal">
                      <div className="mealhead">
                        <div>
                          <strong>{m.name}</strong>
                          <br />
                          <span>{m.food}</span>
                        </div>
                        <span className="mealstatus">
                          {logStatus === "as-planned"
                            ? "Reported as planned"
                            : logStatus === "skipped"
                            ? "Did not eat"
                            : logStatus === "changed"
                            ? "Changed (example)"
                            : "Not recorded"}
                        </span>
                      </div>
                      <div className="foodlist">{m.portion}</div>
                      <div className="actions">
                        <button
                          className={`smallBtn ${logStatus === "as-planned" ? "fill" : ""}`}
                          onClick={() => handleMealAction(m.id, "as-planned")}
                        >
                          Ate as planned
                        </button>
                        <button
                          className="smallBtn"
                          onClick={() => handleMealAction(m.id, "changed")}
                        >
                          Changed
                        </button>
                        <button
                          className="smallBtn"
                          onClick={() => handleMealAction(m.id, "skipped")}
                        >
                          Didn&apos;t eat
                        </button>
                        {logStatus && (
                          <button
                            className="smallBtn"
                            onClick={() => handleMealAction(m.id, "clear")}
                          >
                            Undo
                          </button>
                        )}
                      </div>
                    </section>
                  );
                })}

                <div style={{ marginTop: "12px", textAlign: "center" }}>
                  <Link
                    href={`${basePath}/nutrition`}
                    style={{
                      color: "var(--gold)",
                      fontSize: "12px",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Open Full Nigerian Nutrition Plan →
                  </Link>
                </div>

                <p className="mini">Demo logging only. No nutritional values have been verified or saved to a server.</p>
              </>
            )}

            {/* TAB 4: PROGRESS */}
            {activeTab === "progress" && (
              <>
                <div className="pageHeader">
                  <h1>Progress</h1>
                  <p>Private coaching progress and trend review</p>
                </div>

                <div className="summary">
                  <h2>1 workout completed this week</h2>
                  <p>
                    Bodyweight trends, optional measurements and coach-approved milestones will appear here. The Today dashboard only shows a compact summary.
                  </p>
                </div>

                <div style={{ marginTop: "18px" }}>
                  <Link
                    href={`${basePath}/progress`}
                    className="primaryAction"
                    style={{ textDecoration: "none" }}
                  >
                    <span>Open Comprehensive Progress Portal</span>
                    <TodayIcon name="right" />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Sticky Bottom Navigation */}
          <nav id="nav" className="nav" aria-label="Primary navigation">
            {[
              { id: "today" as const, name: "Today", icon: "home" },
              { id: "workouts" as const, name: "Workouts", icon: "dumb" },
              { id: "nutrition" as const, name: "Nutrition", icon: "food" },
              { id: "progress" as const, name: "Progress", icon: "chart" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <TodayIcon name={tab.icon} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Prototype Footer Note */}
        <p className="note">
          ASCEND · Approved Today dashboard direction · Prototype uses simulated data and local interaction only. No accounts, payments, food logs or workouts are saved.
        </p>
      </main>

      {/* Interactive Modal */}
      {modalData && (
        <div className="overlay" onClick={() => setModalData(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{modalData.title}</h2>
            <p>{modalData.body}</p>

            {modalData.actionHref && modalData.actionLabel && (
              <button
                onClick={() => {
                  setModalData(null);
                  router.push(modalData.actionHref!);
                }}
                style={{
                  marginBottom: "8px",
                  background: "var(--gold)",
                  color: "#201b12",
                }}
              >
                {modalData.actionLabel} →
              </button>
            )}

            <button
              onClick={() => setModalData(null)}
              style={{
                background: "transparent",
                border: "1px solid #4a453b",
                color: "var(--text)",
              }}
            >
              Return to Today Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
