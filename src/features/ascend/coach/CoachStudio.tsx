"use client";

import { useEffect, useRef, useState } from "react";
import ClearableSearchInput from "@/components/ClearableSearchInput";
import "@/styles/ascend-coach-studio.css";

// SVG icon library from prototype
const SVGS: Record<string, string> = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  clients: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  assessments: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3V2h6v1M9 11l2 2 4-4M9 17h6"/>',
  programmes: '<path d="M6.5 6.5h11m-11 11h11M4 5v3m-2-2h4m14-1v3m-2-2h4M4 16v3m-2-2h4m14-1v3m-2-2h4"/>',
  reviews: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 5 2 2 5-5"/>',
  inbox: '<path d="M4 4h16v12H5l-3 4V6a2 2 0 0 1 2-2Z"/><path d="M8 9h8m-8 4h5"/>',
  operations: '<path d="M3 3v18h18M7 15l4-4 3 3 6-7"/>',
  settings: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-3v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2-2 .1-.1A1.7 1.7 0 0 0 7.2 15a1.7 1.7 0 0 0-1.6-1H5v-3h.6a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-2 .1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V4h3v.8a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.4v3H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 8v5m0 3h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9M15 5l4 4M4 16l11-11 4 4-11 11H4v-4Z"/>',
  file: '<path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v6h6M8 13h8m-8 4h8"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
  arrow: '<path d="M4 12h16m-7-7 7 7-7 7"/>',
  filter: '<path d="M4 7h16M7 12h10m-7 5h4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 11v5m0-8h.01"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 8a3 3 0 1 1 0 6M18 21v-2a4 4 0 0 0-2-3.46"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  trending: '<path d="m3 18 7-7 4 4 7-8M16 7h5v5"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5M5.3 8a8 8 0 0 1 13.5-1.7L20 12M4 12l1.2 5.7A8 8 0 0 0 18.7 16"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 4 5 5-5 5m5-5H9"/>',
};

function SvgIcon({
  name,
  className = "ui-icon",
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const path = SVGS[name] || SVGS.info;
  return (
    <svg
      className={className}
      style={style}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

// Data models
export interface ClientRecord {
  id: string;
  name: string;
  short: string;
  variant: "rose" | "green" | "violet" | "blue" | "orange";
  goal: string;
  phase: string;
  status: string;
  statusTone: "red" | "amber" | "green" | "neutral";
  plan: string;
  review: string;
  kind: string;
  days: string;
}

export interface TaskRecord {
  id: "safety" | "plan" | "review" | "message" | "renewal";
  priority: number;
  label: string;
  desc: string;
  client: string;
  due: string;
  dueTone: "red" | "amber" | "blue" | "neutral";
  section: "assessments" | "programmes" | "reviews" | "inbox";
  kind: "Safety" | "Programme" | "Review" | "Message";
}

export interface MessageRecord {
  id: string;
  client: string;
  priority: boolean;
  subject: string;
  when: string;
  body: string;
  reply: string;
  status: string;
}

export interface TrainingItem {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  swap: string;
}

export interface NutritionItem {
  meal: string;
  food: string;
  amount: string;
  other: string;
}

const INITIAL_CLIENTS: ClientRecord[] = [
  { id: "amara", name: "Amara Okafor", short: "AO", variant: "rose", goal: "Build muscle", phase: "Foundation", status: "Safety hold", statusTone: "red", plan: "Not active", review: "—", kind: "Private assessment", days: "—" },
  { id: "tunde", name: "Tunde Adebayo", short: "TA", variant: "green", goal: "Build muscle", phase: "Foundation", status: "Plan pending", statusTone: "amber", plan: "Draft v1", review: "After activation", kind: "Assessment complete", days: "—" },
  { id: "zara", name: "Zara Bello", short: "ZB", variant: "violet", goal: "Recomposition", phase: "Tame the Flesh", status: "Active", statusTone: "green", plan: "Training v2 · Nutrition v2", review: "13 Nov", kind: "Midpoint review due", days: "2/3 this week" },
  { id: "femi", name: "Femi Adeyemi", short: "FA", variant: "blue", goal: "Lose fat", phase: "Tame the Flesh", status: "Active", statusTone: "green", plan: "Training v1 · Nutrition v1", review: "16 Nov", kind: "Renewal review due", days: "3/3 this week" },
  { id: "kemi", name: "Kemi Musa", short: "KM", variant: "orange", goal: "Build strength", phase: "Tame the Flesh", status: "Active", statusTone: "green", plan: "Training v3 · Nutrition v2", review: "20 Nov", kind: "Normal", days: "2/3 this week" },
  { id: "dara", name: "Dara Nwosu", short: "DN", variant: "violet", goal: "Recomposition", phase: "Tame the Flesh", status: "Active", statusTone: "green", plan: "Training v1 · Nutrition v1", review: "24 Nov", kind: "Normal", days: "3/3 this week" },
];

const INITIAL_TASKS: TaskRecord[] = [
  { id: "safety", priority: 0, label: "Safety review", desc: "Private assessment requires restricted review", client: "amara", due: "Review required", dueTone: "red", section: "assessments", kind: "Safety" },
  { id: "plan", priority: 1, label: "Programme approval", desc: "Draft training and nutrition awaiting review", client: "tunde", due: "Due in 1 day", dueTone: "amber", section: "programmes", kind: "Programme" },
  { id: "review", priority: 2, label: "Midpoint review", desc: "Client check-in submitted", client: "zara", due: "Due today", dueTone: "amber", section: "reviews", kind: "Review" },
  { id: "message", priority: 3, label: "Priority message", desc: "Equipment change needs timely reply", client: "kemi", due: "Coaching window", dueTone: "blue", section: "inbox", kind: "Message" },
  { id: "renewal", priority: 4, label: "Renewal summary", desc: "End-of-month coaching decision", client: "femi", due: "16 Nov", dueTone: "neutral", section: "reviews", kind: "Review" },
];

const INITIAL_MESSAGES: MessageRecord[] = [
  { id: "kemi", client: "kemi", priority: true, subject: "Equipment change", when: "Today · 08:35", body: "The cable station is unavailable for the next two weeks. Can I use an alternative for my programmed row?", reply: "", status: "Open" },
  { id: "zara", client: "zara", priority: false, subject: "Question about meal timing", when: "Yesterday · 18:10", body: "If my lunch is delayed, should I still record it under lunch?", reply: "", status: "At next review" },
  { id: "femi", client: "femi", priority: false, subject: "Progress photo question", when: "11 Nov · 09:20", body: "Is a progress picture compulsory each month?", reply: "", status: "At next review" },
];

const INITIAL_TRAINING: TrainingItem[] = [
  { name: "Leg Press", sets: "3", reps: "8–12", rest: "120 s", swap: "Goblet Squat" },
  { name: "DB Romanian Deadlift", sets: "2", reps: "8–12", rest: "150 s", swap: "Back Extension" },
  { name: "Seated Row", sets: "3", reps: "10–12", rest: "90 s", swap: "Cable Row" },
];

const INITIAL_NUTRITION: NutritionItem[] = [
  { meal: "Breakfast", food: "Oats · dry", amount: "70 g", other: "Boiled eggs · 100 g" },
  { meal: "Lunch", food: "Rice · cooked", amount: "180 g", other: "Fish · cooked 130 g" },
  { meal: "Dinner", food: "Eba · prepared", amount: "180 g", other: "Egusi soup · verified recipe 200 g" },
];

export interface CoachStudioProps {
  coachName?: string;
  signOutPath?: string;
  onSwitchToLegacy?: () => void;
}

export default function CoachStudio({
  coachName = "Sahmi El",
  signOutPath = "/login",
  onSwitchToLegacy,
}: CoachStudioProps) {
  // Navigation & Theme
  type PageKey = "overview" | "clients" | "assessments" | "programmes" | "reviews" | "inbox" | "operations";
  const [page, setPage] = useState<PageKey>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Overview
  const [queueFilter, setQueueFilter] = useState<"All" | "Due soon" | "Safety" | "Reviews">("All");

  // Clients
  const [clientSearch, setClientSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<"All clients" | "Active" | "Needs setup">("All clients");

  // Assessments
  const [assess, setAssess] = useState("amara");
  const [assessTab, setAssessTab] = useState<"facts" | "safety" | "interpretation">("facts");
  const [coachNotes, setCoachNotes] = useState<Record<string, string>>({ amara: "", tunde: "" });
  const [documentRequested, setDocumentRequested] = useState(false);

  // Programmes
  const [programme, setProgramme] = useState("tunde");
  const [programTab, setProgramTab] = useState<"training" | "nutrition" | "versions">("training");
  const [planEdit, setPlanEdit] = useState(false);
  const [planDraftDirty, setPlanDraftDirty] = useState(false);
  const [planApproved, setPlanApproved] = useState(false);
  const [planVersion, setPlanVersion] = useState("Draft v1");
  const [training, setTraining] = useState<TrainingItem[]>(INITIAL_TRAINING);
  const [nutrition, setNutrition] = useState<NutritionItem[]>(INITIAL_NUTRITION);

  // Reviews
  const [review, setReview] = useState("zara");
  const [reviewDecision, setReviewDecision] = useState("Hold plan");
  const [reviewDraft, setReviewDraft] = useState("");
  const [reviewSaved, setReviewSaved] = useState(false);

  // Inbox
  const [inbox, setInbox] = useState("kemi");
  const [messages, setMessages] = useState<MessageRecord[]>(INITIAL_MESSAGES);

  // Drawers & Modals
  const [clientDrawer, setClientDrawer] = useState<string | null>(null);
  const [modal, setModal] = useState<"publish" | "review" | "programme-preview" | "review-summary" | null>(null);
  const [publishChecks, setPublishChecks] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3300);
  };

  // Theme initialization & sync
  useEffect(() => {
    let t: "light" | "dark" = "light";
    try {
      const stored = localStorage.getItem("ascend_coach_theme");
      if (stored === "dark" || stored === "light") t = stored;
    } catch {}
    setTheme(t);
    document.documentElement.dataset.theme = t;
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("ascend_coach_theme", next);
    } catch {}
  };

  // Keyboard shortcut for Command+K & Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setMobileNav(false);
      } else if (e.key === "Escape") {
        setModal(null);
        setSearchOpen(false);
        setClientDrawer(null);
        setMobileNav(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Helper getters
  const getClient = (id: string): ClientRecord => INITIAL_CLIENTS.find((c) => c.id === id) || INITIAL_CLIENTS[0];

  // Quick jump actions
  const handleOpenTask = (taskId: string) => {
    if (taskId === "safety") {
      setAssess("amara");
      setAssessTab("safety");
      setPage("assessments");
    } else if (taskId === "plan") {
      setProgramme("tunde");
      setProgramTab("training");
      setPage("programmes");
    } else if (taskId === "review") {
      setReview("zara");
      setPage("reviews");
    } else if (taskId === "message") {
      setInbox("kemi");
      setPage("inbox");
    } else if (taskId === "renewal") {
      setReview("femi");
      setPage("reviews");
    }
  };

  const handleResetData = () => {
    setCoachNotes({ amara: "", tunde: "" });
    setDocumentRequested(false);
    setPlanApproved(false);
    setPlanVersion("Draft v1");
    setPlanEdit(false);
    setPlanDraftDirty(false);
    setTraining(INITIAL_TRAINING);
    setNutrition(INITIAL_NUTRITION);
    setReviewSaved(false);
    setReviewDraft("");
    setMessages(INITIAL_MESSAGES);
    setPublishChecks([false, false, false]);
    showToast("Example studio data reset");
  };

  return (
    <div className="app">
      {/* Mobile Backdrop */}
      <div
        className={`mobile-backdrop ${mobileNav ? "active" : ""}`}
        onClick={() => setMobileNav(false)}
      />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`} id="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-word">ASCEND</div>
            <div className="brand-sub">BY SAHMI EL</div>
          </div>
        </div>

        <div className="side-workspace">
          <SvgIcon name="spark" />
          <div>
            <strong>Coach Studio</strong>
            <small>Private workspace</small>
          </div>
          <span className="workspace-pill">OWNER</span>
        </div>

        <div className="nav-label">Workspace</div>
        <nav className="nav-group" aria-label="Coach workspace">
          {[
            { id: "overview", name: "Overview", icon: "overview", count: null },
            { id: "clients", name: "Clients", icon: "clients", count: null },
            { id: "assessments", name: "Assessments", icon: "assessments", count: 2 },
            { id: "programmes", name: "Programmes", icon: "programmes", count: null },
            { id: "reviews", name: "Check-ins", icon: "reviews", count: null },
            { id: "inbox", name: "Inbox", icon: "inbox", count: 1 },
          ].map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => {
                setPage(item.id as PageKey);
                setMobileNav(false);
              }}
              aria-current={page === item.id ? "page" : undefined}
            >
              <SvgIcon name={item.icon} />
              <span>{item.name}</span>
              {item.count && <b className="count">{item.count}</b>}
            </button>
          ))}
        </nav>

        <div className="nav-divider" />

        <div className="nav-label">Management</div>
        <div className="nav-group">
          <button
            className={`nav-item ${page === "operations" ? "active" : ""}`}
            onClick={() => {
              setPage("operations");
              setMobileNav(false);
            }}
          >
            <SvgIcon name="operations" />
            <span>Operations</span>
          </button>
          {onSwitchToLegacy && (
            <button
              className="nav-item"
              onClick={onSwitchToLegacy}
              title="Switch to original coach portal"
            >
              <SvgIcon name="settings" />
              <span>Legacy View</span>
            </button>
          )}
        </div>

        <div className="sidebar-spacer" />

        <div className="sidebar-lower">
          <button className="nav-item" onClick={toggleTheme}>
            <SvgIcon name={theme === "dark" ? "sun" : "moon"} />
            <span>{theme === "dark" ? "Light appearance" : "Dark appearance"}</span>
          </button>
          <button className="nav-item" onClick={handleResetData}>
            <SvgIcon name="refresh" />
            <span>Reset example data</span>
          </button>
          <div className="coach-profile">
            <span className="avatar">SE</span>
            <div>
              <strong>{coachName}</strong>
              <small>Coach · Owner</small>
            </div>
            <a
              href={signOutPath}
              className="icon-btn"
              style={{ width: "26px", height: "26px", marginLeft: "auto" }}
              title="Sign out"
            >
              <SvgIcon name="logout" style={{ width: "13px", height: "13px" }} />
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="bread">
            <button
              className="icon-btn menu-toggle"
              aria-label="Open navigation"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <SvgIcon name="menu" />
            </button>
            <span>Coach Studio</span>
            <SvgIcon name="chevron" />
            <strong>
              {page === "overview" && "Overview"}
              {page === "clients" && "Clients"}
              {page === "assessments" && "Assessments"}
              {page === "programmes" && "Programmes"}
              {page === "reviews" && "Check-ins"}
              {page === "inbox" && "Inbox"}
              {page === "operations" && "Operations"}
            </strong>
          </div>

          <div className="top-actions">
            <button
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
              aria-label="Search clients and tasks"
            >
              <SvgIcon name="search" />
              <span>Search clients or tasks</span>
              <span className="kbd">⌘ K</span>
            </button>

            <button
              className="icon-btn"
              onClick={() => setPage("inbox")}
              aria-label="Inbox notifications"
            >
              <SvgIcon name="bell" />
              <span className="dot" />
            </button>

            <span className="avatar" style={{ width: "31px", height: "31px", borderRadius: "50%" }}>
              SE
            </span>
          </div>
        </header>

        {/* Content Page Body */}
        <div className="content">
          {/* 1. OVERVIEW VIEW */}
          {page === "overview" && (
            <>
              <div className="title-row">
                <div>
                  <div className="eyebrow">Workspace / Overview</div>
                  <h1 className="page-title">Your coaching desk</h1>
                  <p className="page-desc">A focused view of what needs action, not another activity feed.</p>
                </div>
                <div className="top-buttons">
                  <span className="statusline">Demo workspace · 13 November 2026</span>
                </div>
              </div>

              <div className="kpi-grid">
                <div className="card kpi">
                  <div className="kpi-head">Active membership <SvgIcon name="clients" /></div>
                  <div className="kpi-val mono">6 / 10</div>
                  <div className="kpi-foot">4 remaining places</div>
                  <div className="progress-track"><span style={{ width: "60%" }} /></div>
                </div>

                <div className="card kpi">
                  <div className="kpi-head">Weekly onboardings <SvgIcon name="people" /></div>
                  <div className="kpi-val mono">2 / 3</div>
                  <div className="kpi-foot">1 remaining this week</div>
                  <div className="progress-track"><span style={{ width: "66.7%" }} /></div>
                </div>

                <div className="card kpi">
                  <div className="kpi-head">Items to address <SvgIcon name="file" /></div>
                  <div className="kpi-val mono">4</div>
                  <div className="kpi-foot">1 safety-related</div>
                </div>

                <div className="card kpi">
                  <div className="kpi-head">Next programme deadline <SvgIcon name="clock" /></div>
                  <div className="kpi-val mono">1 day</div>
                  <div className="kpi-foot">Five-business-day promise</div>
                </div>
              </div>

              <div className="columns">
                <div className="stack">
                  <div className="card">
                    <div className="panel-head">
                      <div>
                        <div className="panel-title">Priority work queue</div>
                        <div className="panel-sub">Only coaching decisions that need your attention</div>
                      </div>
                      <div className="statusline">Demo tasks</div>
                    </div>

                    <div className="tabs">
                      {(["All", "Due soon", "Safety", "Reviews"] as const).map((filter) => (
                        <button
                          key={filter}
                          className={`tab ${queueFilter === filter ? "active" : ""}`}
                          onClick={() => setQueueFilter(filter)}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>

                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Work item</th>
                            <th>Client</th>
                            <th className="hide-mobile">Due</th>
                            <th style={{ textAlign: "right" }}>Open</th>
                          </tr>
                        </thead>
                        <tbody>
                          {INITIAL_TASKS.filter((t) => {
                            if (queueFilter === "All") return true;
                            if (queueFilter === "Safety") return t.kind === "Safety";
                            if (queueFilter === "Due soon") return ["safety", "plan", "review", "message"].includes(t.id);
                            if (queueFilter === "Reviews") return t.kind === "Review";
                            return true;
                          }).map((t) => {
                            const c = getClient(t.client);
                            return (
                              <tr
                                key={t.id}
                                className="hoverable"
                                onClick={() => handleOpenTask(t.id)}
                              >
                                <td>
                                  <div className="queue-cell">
                                    <div className="queue-icon">
                                      <SvgIcon
                                        name={
                                          t.id === "safety"
                                            ? "shield"
                                            : t.id === "message"
                                            ? "inbox"
                                            : t.id === "plan"
                                            ? "programmes"
                                            : "reviews"
                                        }
                                      />
                                    </div>
                                    <div>
                                      <strong>{t.label}</strong>
                                      <small>{t.desc}</small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="person">
                                    <span className={`avatar ${c.variant}`}>{c.short}</span>
                                    <div>
                                      <strong>{c.name}</strong>
                                      <small>{c.phase}</small>
                                    </div>
                                  </div>
                                </td>
                                <td className="hide-mobile">
                                  <span className={`tag ${t.dueTone}`}>{t.due}</span>
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  <button
                                    className="queue-action"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenTask(t.id);
                                    }}
                                  >
                                    Open →
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="panel-foot">
                      Ordinary missed workouts do not create queue tasks. Safety concerns are handled separately.
                    </div>
                  </div>

                  <div className="card">
                    <div className="panel-head">
                      <div>
                        <div className="panel-title">Client signals</div>
                        <div className="panel-sub">A quick overview, not automated coaching judgments</div>
                      </div>
                      <button className="btn small" onClick={() => setPage("clients")}>
                        All clients <SvgIcon name="arrow" />
                      </button>
                    </div>
                    <div className="block-grid" style={{ padding: "15px" }}>
                      <div className="mini-stat">
                        <strong>4 / 6</strong>
                        <span>Example clients with active plans</span>
                      </div>
                      <div className="mini-stat">
                        <strong>2</strong>
                        <span>Upcoming scheduled check-ins</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stack">
                  <div className="card">
                    <div className="panel-head">
                      <div>
                        <div className="panel-title">Upcoming deadlines</div>
                        <div className="panel-sub">Within the current coaching window</div>
                      </div>
                      <SvgIcon name="calendar" />
                    </div>
                    {[
                      { d: "Today", n: "Zara Bello", sub: "Midpoint review", target: "reviews", client: "zara" },
                      { d: "Tomorrow", n: "Tunde Adebayo", sub: "Programme delivery", target: "programmes", client: "tunde" },
                      { d: "16 Nov", n: "Femi Adeyemi", sub: "Renewal review", target: "reviews", client: "femi" },
                    ].map((item, idx) => (
                      <div key={idx} className="list-row">
                        <div className="list-left">
                          <span className="queue-icon"><SvgIcon name="clock" /></span>
                          <div>
                            <strong>{item.n}</strong>
                            <small>{item.sub}</small>
                          </div>
                        </div>
                        <div className="list-right">
                          <small>{item.d}</small>
                          <button
                            style={{ display: "block", marginLeft: "auto", marginTop: "4px" }}
                            className="queue-action"
                            onClick={() => {
                              if (item.target === "reviews") setReview(item.client);
                              if (item.target === "programmes") setProgramme(item.client);
                              setPage(item.target as PageKey);
                            }}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card">
                    <div className="panel-head">
                      <div>
                        <div className="panel-title">Delivery rhythm</div>
                        <div className="panel-sub">What the service promises</div>
                      </div>
                      <SvgIcon name="trending" />
                    </div>
                    <div className="section">
                      <div className="summary-line">
                        <strong>Initial plan</strong>
                        <span>Within 5 business days of complete assessment</span>
                      </div>
                      <div className="summary-line">
                        <strong>Personal reviews</strong>
                        <span>2 per billing month</span>
                      </div>
                      <div className="summary-line">
                        <strong>Priority messaging</strong>
                        <span>2 per billing month · Mon–Sat</span>
                      </div>
                      <div className="notice">
                        Messages and plans require Sahmi’s decisions. ASCEND never publishes a draft automatically.
                      </div>
                    </div>
                  </div>

                  <div className="info-banner">
                    <SvgIcon name="info" />
                    <div>
                      <strong>Design boundary.</strong> This screen only creates work from submitted assessments, legitimate safety conditions, scheduled reviews, priority messages and material-change requests. Routine meal or workout logs are reviewed at scheduled check-ins.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 2. CLIENTS VIEW */}
          {page === "clients" && (
            <>
              <div className="title-row">
                <div>
                  <div className="eyebrow">Workspace / Clients</div>
                  <h1 className="page-title">Your athletes</h1>
                  <p className="page-desc">Every client has one record, one active plan per type and a traceable review history.</p>
                </div>
                <div className="top-buttons">
                  <button className="btn" onClick={() => setSearchOpen(true)}>
                    <SvgIcon name="search" /> Find client
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="list-toolbar">
                  <ClearableSearchInput
                    inputClassName="search-input"
                    value={clientSearch}
                    onChange={setClientSearch}
                    ariaLabel="Search clients"
                    placeholder="Search by client, goal or phase"
                  />
                  <select
                    className="select"
                    aria-label="Filter clients"
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value as any)}
                  >
                    <option value="All clients">All clients</option>
                    <option value="Active">Active</option>
                    <option value="Needs setup">Needs setup</option>
                  </select>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Coaching goal</th>
                        <th className="hide-mobile">Programme / Phase</th>
                        <th>Status</th>
                        <th className="hide-mobile">Next review</th>
                        <th>Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {INITIAL_CLIENTS.filter((c) => {
                        const matchesFilter =
                          clientFilter === "All clients" ||
                          (clientFilter === "Active" && c.status === "Active") ||
                          (clientFilter === "Needs setup" && c.status !== "Active");
                        const matchesSearch = `${c.name} ${c.goal} ${c.phase} ${c.status}`
                          .toLowerCase()
                          .includes(clientSearch.toLowerCase());
                        return matchesFilter && matchesSearch;
                      }).map((c) => (
                        <tr
                          key={c.id}
                          className="hoverable"
                          onClick={() => setClientDrawer(c.id)}
                        >
                          <td>
                            <div className="person">
                              <span className={`avatar ${c.variant}`}>{c.short}</span>
                              <div>
                                <strong>{c.name}</strong>
                                <small>{c.kind}</small>
                              </div>
                            </div>
                          </td>
                          <td>{c.goal}</td>
                          <td className="hide-mobile">
                            <div>{c.plan}</div>
                            <div className="subtle" style={{ marginTop: "4px" }}>{c.phase}</div>
                          </td>
                          <td>
                            <span className={`tag ${c.statusTone}`}>{c.status}</span>
                          </td>
                          <td className="hide-mobile muted">{c.review}</td>
                          <td>
                            <button
                              className="queue-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                setClientDrawer(c.id);
                              }}
                            >
                              View →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="panel-foot">
                  Client photos and private health disclosures are not displayed on the roster.
                </div>
              </div>
            </>
          )}

          {/* 3. ASSESSMENTS VIEW */}
          {page === "assessments" && (() => {
            const currentClient = getClient(assess);
            const isSafetyFlagged = assess === "amara";

            return (
              <>
                <div className="title-row">
                  <div>
                    <div className="eyebrow">Workspace / Assessments</div>
                    <h1 className="page-title">Assessment review</h1>
                    <p className="page-desc">Review submitted private intake and separate confirmed facts from coaching interpretation.</p>
                  </div>
                  <div className="top-buttons">
                    <button className="btn" onClick={() => setPage("programmes")}>
                      <SvgIcon name="programmes" /> Programme drafts
                    </button>
                  </div>
                </div>

                <div className="split">
                  {/* Left Column: List */}
                  <div className="card">
                    <div className="panel-head">
                      <div>
                        <div className="panel-title">Submitted assessments</div>
                        <div className="panel-sub">Registration itself does not require coach approval</div>
                      </div>
                      <span className="tag amber">2 for review</span>
                    </div>

                    <div className="mini-list">
                      {["amara", "tunde"].map((id) => {
                        const a = getClient(id);
                        return (
                          <button
                            key={id}
                            className={`mini-row ${assess === id ? "selected" : ""}`}
                            onClick={() => {
                              setAssess(id);
                              setAssessTab("facts");
                            }}
                          >
                            <span className={`avatar ${a.variant}`}>{a.short}</span>
                            <span>
                              <strong>{a.name}</strong>
                              <small>
                                {id === "amara"
                                  ? "Safety review required"
                                  : "Complete · awaiting coach interpretation"}
                              </small>
                            </span>
                            <SvgIcon name="chevron" />
                          </button>
                        );
                      })}
                    </div>

                    <div className="panel-foot">
                      Incomplete private assessments remain with the client until submitted or a real safety condition requires attention.
                    </div>
                  </div>

                  {/* Right Column: Selected Assessment Details */}
                  <div className="card">
                    <div className="panel-head">
                      <div className="person">
                        <span className={`avatar ${currentClient.variant}`}>{currentClient.short}</span>
                        <div>
                          <div className="panel-title">{currentClient.name}</div>
                          <div className="panel-sub">Nine-stage private assessment · Example</div>
                        </div>
                      </div>
                      <span className={`tag ${isSafetyFlagged ? "red" : "green"}`}>
                        {isSafetyFlagged ? "Programme activation held" : "Assessment complete"}
                      </span>
                    </div>

                    <div className="tabs">
                      {[
                        { id: "facts", label: "Intake facts" },
                        { id: "safety", label: "Safety & scope" },
                        { id: "interpretation", label: "Coach interpretation" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          className={`tab ${assessTab === t.id ? "active" : ""}`}
                          onClick={() => setAssessTab(t.id as any)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {assessTab === "facts" && (
                      <>
                        <div className="section">
                          <div className="definition-grid">
                            <div>
                              <div className="field-label">Primary goal</div>
                              <div className="field-val">{currentClient.goal}</div>
                            </div>
                            <div>
                              <div className="field-label">Training access</div>
                              <div className="field-val">{isSafetyFlagged ? "Home gym, dumbbells" : "Commercial gym"}</div>
                            </div>
                            <div>
                              <div className="field-label">Available sessions</div>
                              <div className="field-val">3 days / week</div>
                            </div>
                            <div>
                              <div className="field-label">Nutrition preference</div>
                              <div className="field-val">{isSafetyFlagged ? "Simple (client preference)" : "Structured (client preference)"}</div>
                            </div>
                            <div>
                              <div className="field-label">Assessment status</div>
                              <div className="field-val">Submitted · 12 Nov</div>
                            </div>
                            <div>
                              <div className="field-label">Delivery window</div>
                              <div className="field-val">Five business days after complete assessment, subject to safety</div>
                            </div>
                          </div>
                        </div>

                        <div className="section">
                          <div className="section-title">Client-reported context</div>
                          <div className="step-list">
                            <div className="step">
                              <span className="step-number">1</span>
                              <div>
                                <strong>Training experience</strong>
                                <small>Inconsistent early-stage gym experience; prefers repeatable schedule.</small>
                              </div>
                            </div>
                            <div className="step">
                              <span className="step-number">2</span>
                              <div>
                                <strong>Food environment</strong>
                                <small>Everyday Nigerian meals; limited weekday meal-prep time.</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {assessTab === "safety" && (
                      <div className="section">
                        <div className={`info-banner ${isSafetyFlagged ? "danger" : ""}`}>
                          <SvgIcon name="shield" />
                          <div>
                            <strong>{isSafetyFlagged ? "Further professional advice required" : "No open flag shown in this demo"}.</strong>{" "}
                            {isSafetyFlagged
                              ? "A submitted PAR-Q+ record indicates further guidance is needed before training or nutrition activation. Sahmi must not provide medical clearance."
                              : "Programme activation still requires a completed, versioned pre-participation assessment and applicable safeguards."}
                          </div>
                        </div>
                        <div className="rule" />
                        <div className="definition-grid">
                          <div>
                            <div className="field-label">PAR-Q+ status</div>
                            <div className="field-val">{isSafetyFlagged ? "Further advice required" : "No flagged response in example"}</div>
                          </div>
                          <div>
                            <div className="field-label">Programme activation</div>
                            <div className="field-val">{isSafetyFlagged ? "Blocked" : "Eligible for coach approval after checks"}</div>
                          </div>
                        </div>
                        <div className="rule" />
                        <div className="section-title">Allowed next step</div>
                        <p className="workspace-hint">
                          {isSafetyFlagged
                            ? "Request relevant professional advice or restrictions. Save a coaching note and continue the safety hold; do not clear or prescribe automatically."
                            : "Continue coach interpretation. No automated publication."}
                        </p>
                        {isSafetyFlagged && (
                          <button
                            className="btn"
                            style={{ marginTop: "12px" }}
                            onClick={() => {
                              setDocumentRequested(true);
                              showToast("Request recorded locally in demo · no message sent");
                            }}
                          >
                            <SvgIcon name="file" /> {documentRequested ? "Request noted (demo)" : "Request relevant documentation"}
                          </button>
                        )}
                      </div>
                    )}

                    {assessTab === "interpretation" && (
                      <div className="section">
                        <div className="section-title">Confirmed facts vs coaching judgment</div>
                        <p className="workspace-hint">
                          Assessment answers remain the client's statements. Record your interpretation separately, including the rationale, uncertainty and what requires follow-up.
                        </p>
                        <label className="input-label" htmlFor="coach-interpret" style={{ marginTop: "14px" }}>
                          Coach interpretation
                        </label>
                        <textarea
                          id="coach-interpret"
                          className="text-field"
                          placeholder="Write evidence-led interpretation, constraints and review questions..."
                          value={coachNotes[assess] || ""}
                          onChange={(e) => setCoachNotes({ ...coachNotes, [assess]: e.target.value })}
                        />
                        <div className="info-banner" style={{ marginTop: "12px" }}>
                          <SvgIcon name="info" />
                          <div>All data here is fictional. Saving does not notify a client or change safety eligibility.</div>
                        </div>
                      </div>
                    )}

                    <div className="save-row">
                      <span className="audit-note">Source: private assessment · read-only facts</span>
                      <button
                        className="btn"
                        onClick={() => showToast("Coaching note saved in demo only")}
                      >
                        Save coaching note
                      </button>
                      <button
                        className="btn primary"
                        disabled={isSafetyFlagged}
                        title={isSafetyFlagged ? "Safety hold blocks programme activation" : undefined}
                        onClick={() => {
                          if (isSafetyFlagged) {
                            showToast("Safety hold remains active");
                            return;
                          }
                          setProgramme(assess);
                          setPage("programmes");
                        }}
                      >
                        {isSafetyFlagged ? "Activation blocked" : "Open programme builder"} <SvgIcon name="arrow" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* 4. PROGRAMMES VIEW */}
          {page === "programmes" && (() => {
            const currentClient = getClient(programme);
            const isBlocked = programme === "amara";

            return (
              <>
                <div className="title-row">
                  <div>
                    <div className="eyebrow">Workspace / Programmes</div>
                    <h1 className="page-title">Programme builder</h1>
                    <p className="page-desc">Draft the plan, review its evidence, then publish a new version deliberately.</p>
                  </div>
                  <div className="top-buttons">
                    <button className="btn" onClick={() => setModal("programme-preview")}>
                      <SvgIcon name="eye" /> Preview client view
                    </button>
                  </div>
                </div>

                <div className="split">
                  {/* Left Column */}
                  <div className="stack">
                    <div className="card">
                      <div className="panel-head">
                        <div>
                          <div className="panel-title">Programme workflow</div>
                          <div className="panel-sub">One active version of training and nutrition per client</div>
                        </div>
                      </div>
                      <div className="mini-list">
                        {[
                          { id: "tunde", label: planVersion, tone: planApproved ? "green" : "amber" },
                          { id: "zara", label: "Active v2", tone: "green" },
                          { id: "amara", label: "Safety hold", tone: "red" },
                        ].map((item) => {
                          const a = getClient(item.id);
                          return (
                            <button
                              key={item.id}
                              className={`mini-row ${programme === item.id ? "selected" : ""}`}
                              onClick={() => {
                                setProgramme(item.id);
                                setProgramTab("training");
                                setPlanEdit(false);
                              }}
                            >
                              <span className={`avatar ${a.variant}`}>{a.short}</span>
                              <span>
                                <strong>{a.name}</strong>
                                <small>{item.label}</small>
                              </span>
                              <span className={`tag ${item.tone}`}>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="card">
                      <div className="panel-head">
                        <div className="panel-title">Publication policy</div>
                        <SvgIcon name="lock" />
                      </div>
                      <div className="section">
                        <div className="step-list">
                          {[
                            ["Draft", "Prepare and revise the programme."],
                            ["Review", "Verify safety, equipment, exercise prescription and recipe values."],
                            ["Publish", "Sahmi explicitly approves the version; prior Active is retained as Superseded."],
                          ].map(([a, b], i) => (
                            <div key={i} className="step">
                              <span className="step-number">{i + 1}</span>
                              <div>
                                <strong>{a}</strong>
                                <small>{b}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Programme Details */}
                  <div className="card">
                    <div className="panel-head">
                      <div className="person">
                        <span className={`avatar ${currentClient.variant}`}>{currentClient.short}</span>
                        <div>
                          <div className="panel-title">{currentClient.name}</div>
                          <div className="panel-sub">
                            {isBlocked
                              ? "No active plan · safety hold"
                              : programme === "tunde"
                              ? `${planVersion} · created 12 Nov`
                              : "Active v2 · prior version preserved"}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`tag ${
                          isBlocked
                            ? "red"
                            : programme === "tunde"
                            ? planApproved
                              ? "green"
                              : "amber"
                            : "green"
                        }`}
                      >
                        {isBlocked ? "Safety hold" : programme === "tunde" ? planVersion : "Active"}
                      </span>
                    </div>

                    <div className="tabs">
                      {[
                        { id: "training", label: "Training" },
                        { id: "nutrition", label: "Nutrition" },
                        { id: "versions", label: "Version history" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          className={`tab ${programTab === t.id ? "active" : ""}`}
                          onClick={() => setProgramTab(t.id as any)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {isBlocked ? (
                      <div className="section">
                        <div className="info-banner danger">
                          <SvgIcon name="shield" />
                          <div>
                            <strong>Publication blocked.</strong> Assessment requires professional advice before activation. Coach notes can be recorded in Assessments. A programme draft does not override the hold.
                          </div>
                        </div>
                        <button
                          style={{ marginTop: "14px" }}
                          className="btn"
                          onClick={() => {
                            setAssess("amara");
                            setPage("assessments");
                          }}
                        >
                          Open assessment <SvgIcon name="arrow" />
                        </button>
                      </div>
                    ) : programTab === "training" ? (
                      <div className="section">
                        <div className="summary-line">
                          <strong>Full Body A · 3 days/week</strong>
                          <span className={`tag ${programme === "tunde" ? (planApproved ? "green" : "amber") : "green"}`}>
                            {programme === "tunde" ? (planApproved ? "Active" : "Draft") : "Active"}
                          </span>
                        </div>
                        <div className="editor-row">
                          <div className="editor-head">EXERCISE</div>
                          <div className="editor-head">SETS</div>
                          <div className="editor-head">REPS</div>
                          <div className="editor-head">REST</div>
                        </div>
                        {training.map((item, idx) => {
                          const isEditable = planEdit && programme === "tunde" && !planApproved;
                          return (
                            <div key={idx} className="editor-row">
                              <div className="editor-label">
                                {item.name}
                                <small>Approved swap: {item.swap}</small>
                              </div>
                              <input
                                className="small-field"
                                aria-label={`${item.name} sets`}
                                value={item.sets}
                                disabled={!isEditable}
                                onChange={(e) => {
                                  const updated = [...training];
                                  updated[idx].sets = e.target.value;
                                  setTraining(updated);
                                  setPlanDraftDirty(true);
                                }}
                              />
                              <input
                                className="small-field"
                                aria-label={`${item.name} reps`}
                                value={item.reps}
                                disabled={!isEditable}
                                onChange={(e) => {
                                  const updated = [...training];
                                  updated[idx].reps = e.target.value;
                                  setTraining(updated);
                                  setPlanDraftDirty(true);
                                }}
                              />
                              <input
                                className="small-field"
                                aria-label={`${item.name} rest`}
                                value={item.rest}
                                disabled={!isEditable}
                                onChange={(e) => {
                                  const updated = [...training];
                                  updated[idx].rest = e.target.value;
                                  setTraining(updated);
                                  setPlanDraftDirty(true);
                                }}
                              />
                            </div>
                          );
                        })}
                        <div className="rule" />
                        <div className="info-banner">
                          <SvgIcon name="info" />
                          <div>Working sets and rest are coach-prescribed. Client Focus/Session modes read the same approved record. No client RIR field and no unapproved substitutions.</div>
                        </div>
                      </div>
                    ) : programTab === "nutrition" ? (
                      <div className="section">
                        <div className="summary-line">
                          <strong>Nutrition · Structured</strong>
                          <span className="tag gold">Grams-only</span>
                        </div>
                        <div className="editor-row" style={{ gridTemplateColumns: "90px minmax(120px,1fr) 85px minmax(110px,1fr)" }}>
                          <div className="editor-head">MEAL</div>
                          <div className="editor-head">FOOD / STATE</div>
                          <div className="editor-head">GRAMS</div>
                          <div className="editor-head">SECOND ITEM</div>
                        </div>
                        {nutrition.map((item, idx) => {
                          const isEditable = planEdit && programme === "tunde" && !planApproved;
                          return (
                            <div key={idx} className="editor-row" style={{ gridTemplateColumns: "90px minmax(120px,1fr) 85px minmax(110px,1fr)" }}>
                              <div className="editor-label">{item.meal}</div>
                              <div className="editor-label">{item.food}</div>
                              <input
                                className="small-field"
                                value={item.amount}
                                disabled={!isEditable}
                                onChange={(e) => {
                                  const updated = [...nutrition];
                                  updated[idx].amount = e.target.value;
                                  setNutrition(updated);
                                  setPlanDraftDirty(true);
                                }}
                              />
                              <div className="editor-label" style={{ fontWeight: 500 }}>{item.other}</div>
                            </div>
                          );
                        })}
                        <div className="rule" />
                        <div className="info-banner warn">
                          <SvgIcon name="info" />
                          <div>
                            <strong>Example foods only.</strong> Gram quantities and recipes in this demo have no verified nutritional calculation. Production publishing requires traceable source values, preparation state, recipe yield and approved swaps.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="section">
                        <div className="timeline">
                          {[
                            ["Draft v1", "Training and nutrition draft · not visible to client"],
                            ["Active", "Only one Active training plan and one Active nutrition plan are permitted"],
                            ["Superseded", "Prior plans and connected logs remain unmodified"],
                          ].map(([a, b], idx) => (
                            <div key={idx} className="timeline-item">
                              <span className="timeline-dot" />
                              <div>
                                <strong>{a}</strong>
                                <small>{b}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="save-row">
                      <span className="audit-note">
                        {programme === "tunde"
                          ? planDraftDirty
                            ? "Unsaved demo edits"
                            : "Coach review required before publish"
                          : "Read-only approved programme preview"}
                      </span>

                      {programme === "tunde" && !planApproved && programTab !== "versions" && (
                        <>
                          <button
                            className="btn"
                            onClick={() => setPlanEdit(!planEdit)}
                          >
                            <SvgIcon name="edit" /> {planEdit ? "Stop editing" : "Edit draft"}
                          </button>
                          <button
                            className="btn"
                            onClick={() => {
                              setPlanDraftDirty(false);
                              setPlanEdit(false);
                              showToast("Draft saved in this prototype · not shared with client");
                            }}
                          >
                            Save draft
                          </button>
                        </>
                      )}

                      {programme === "tunde" && planApproved && (
                        <button
                          className="btn"
                          onClick={() => {
                            setPlanApproved(false);
                            setPlanVersion("Draft v2 (demo)");
                            setPlanEdit(false);
                            setPlanDraftDirty(false);
                            showToast("New revision created in demo; previous Active version is preserved");
                          }}
                        >
                          New revision draft
                        </button>
                      )}

                      <button
                        className="btn primary"
                        disabled={programme !== "tunde" || planApproved}
                        onClick={() => {
                          if (programme !== "tunde" || planApproved) {
                            showToast("Cannot publish this programme in the demo");
                            return;
                          }
                          setPublishChecks([false, false, false]);
                          setModal("publish");
                        }}
                      >
                        <SvgIcon name="check" /> Review & publish
                      </button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* 5. REVIEWS / CHECK-INS VIEW */}
          {page === "reviews" && (() => {
            const currentClient = getClient(review);
            return (
              <>
                <div className="title-row">
                  <div>
                    <div className="eyebrow">Workspace / Check-ins</div>
                    <h1 className="page-title">Scheduled coaching reviews</h1>
                    <p className="page-desc">Two personal reviews per billing month. Assess evidence and publish considered decisions.</p>
                  </div>
                  <div className="top-buttons">
                    <button className="btn" onClick={() => setModal("review-summary")}>
                      <SvgIcon name="file" /> Review summary
                    </button>
                  </div>
                </div>

                <div className="split">
                  {/* Left Column */}
                  <div className="card">
                    <div className="panel-head">
                      <div>
                        <div className="panel-title">Review queue</div>
                        <div className="panel-sub">No daily intervention for ordinary missed workouts</div>
                      </div>
                      <span className="tag gold">2 scheduled</span>
                    </div>

                    <div className="mini-list">
                      {[
                        { id: "zara", sub: "Midpoint · Due today" },
                        { id: "femi", sub: "Renewal · 16 Nov" },
                      ].map((item) => {
                        const a = getClient(item.id);
                        return (
                          <button
                            key={item.id}
                            className={`mini-row ${item.id === review ? "selected" : ""}`}
                            onClick={() => {
                              setReview(item.id);
                              setReviewSaved(false);
                              setReviewDraft("");
                            }}
                          >
                            <span className={`avatar ${a.variant}`}>{a.short}</span>
                            <span>
                              <strong>{a.name}</strong>
                              <small>{item.sub}</small>
                            </span>
                            <SvgIcon name="chevron" />
                          </button>
                        );
                      })}
                    </div>

                    <div className="panel-head" style={{ borderTop: "1px solid var(--line)" }}>
                      <div>
                        <div className="panel-title">Review signals</div>
                        <div className="panel-sub">Facts first, decisions second</div>
                      </div>
                      <SvgIcon name="trending" />
                    </div>

                    <div className="section">
                      <div className="summary-line">
                        <strong>Training completed</strong>
                        <span>{review === "zara" ? "5 of 6 planned sessions" : "6 of 6 planned sessions"}</span>
                      </div>
                      <div className="summary-line">
                        <strong>Nutrition updates</strong>
                        <span>{review === "zara" ? "10 recorded · 4 not recorded" : "13 recorded · 1 not recorded"}</span>
                      </div>
                      <div className="summary-line">
                        <strong>Bodyweight trend</strong>
                        <span>{review === "zara" ? "−0.3 kg over 2 weeks" : "−0.5 kg over 4 weeks"} (example)</span>
                      </div>
                      <div className="summary-line">
                        <strong>Recovery and pain</strong>
                        <span>{review === "zara" ? "Client reports normal recovery" : "No new issues reported"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="card">
                    <div className="panel-head">
                      <div className="person">
                        <span className={`avatar ${currentClient.variant}`}>{currentClient.short}</span>
                        <div>
                          <div className="panel-title">
                            {currentClient.name} · {review === "zara" ? "Midpoint" : "Renewal"} check-in
                          </div>
                          <div className="panel-sub">Scheduled coaching review · Example evidence</div>
                        </div>
                      </div>
                      <span className="tag amber">{review === "zara" ? "Due today" : "16 Nov"}</span>
                    </div>

                    <div className="section">
                      <div className="section-title">Client-reported summary</div>
                      <div className="notice">
                        “I completed most sessions. The evening meal was difficult on two workdays. Recovery feels manageable.”
                      </div>
                      <p className="workspace-hint" style={{ marginTop: "12px" }}>
                        Unrecorded meals are unknown—not automatically missed or non-adherent. A missed gym session carries no penalty and creates no extra review.
                      </p>
                    </div>

                    <div className="section">
                      <div className="section-title">Coach decision</div>
                      <div className="pillbox" style={{ marginBottom: "12px" }}>
                        {[
                          "Hold plan",
                          "Minor adjustment",
                          "Major redesign",
                          "Clarification",
                          "Referral/outside scope",
                        ].map((v) => (
                          <label key={v} className="radio-choice">
                            <input
                              type="radio"
                              name="review-decision"
                              value={v}
                              checked={reviewDecision === v}
                              onChange={() => setReviewDecision(v)}
                            />{" "}
                            {v}
                          </label>
                        ))}
                      </div>

                      <label className="input-label">Coaching interpretation and rationale</label>
                      <textarea
                        className="text-field"
                        placeholder="Explain what the records support, what is uncertain, and the next coaching decision..."
                        value={reviewDraft}
                        onChange={(e) => setReviewDraft(e.target.value)}
                      />

                      <div className="info-banner" style={{ marginTop: "13px" }}>
                        <SvgIcon name="info" />
                        <div>
                          A major redesign is limited to one per billing month when materially justified. A saved review does not silently publish a changed plan.
                        </div>
                      </div>
                    </div>

                    <div className="save-row">
                      <span className="audit-note">
                        {reviewSaved ? "Review saved in this demo session" : "Personal approval required"}
                      </span>
                      <button
                        className="btn"
                        onClick={() => {
                          setReviewSaved(true);
                          showToast("Review draft saved locally in demo");
                        }}
                      >
                        Save review draft
                      </button>
                      <button
                        className="btn primary"
                        onClick={() => {
                          if (reviewDraft.trim().length < 12) {
                            showToast("Add a brief coaching rationale before recording");
                            return;
                          }
                          setModal("review");
                        }}
                      >
                        Record coach review <SvgIcon name="check" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* 6. INBOX VIEW */}
          {page === "inbox" && (() => {
            const currentMessage = messages.find((m) => m.id === inbox) || messages[0];
            const currentClient = getClient(currentMessage.client);

            return (
              <>
                <div className="title-row">
                  <div>
                    <div className="eyebrow">Workspace / Inbox</div>
                    <h1 className="page-title">Client messages</h1>
                    <p className="page-desc">Priority coaching concerns are handled within the stated service window; routine questions wait for review.</p>
                  </div>
                  <div className="top-buttons">
                    <span className="tag neutral">Mon–Sat coaching days</span>
                  </div>
                </div>

                <div className="split">
                  {/* Left Column */}
                  <div className="stack">
                    <div className="card">
                      <div className="panel-head">
                        <div>
                          <div className="panel-title">Conversations</div>
                          <div className="panel-sub">One example priority message</div>
                        </div>
                      </div>
                      <div className="mini-list">
                        {messages.map((m) => {
                          const c = getClient(m.client);
                          return (
                            <button
                              key={m.id}
                              className={`mini-row ${inbox === m.id ? "selected" : ""}`}
                              onClick={() => setInbox(m.id)}
                            >
                              <span className={`avatar ${c.variant}`}>{c.short}</span>
                              <span>
                                <strong>{c.name}</strong>
                                <small>{m.subject}</small>
                              </span>
                              {m.priority ? <span className="tag amber">Priority</span> : <span className="tag neutral">Normal</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="card">
                      <div className="panel-head">
                        <div className="panel-title">Message policy</div>
                        <SvgIcon name="info" />
                      </div>
                      <div className="section">
                        <div className="summary-line">
                          <strong>High-priority allowance</strong>
                          <span>2 per client per billing month</span>
                        </div>
                        <div className="summary-line">
                          <strong>Response commitment</strong>
                          <span>Within 24 hours during coaching days</span>
                        </div>
                        <div className="summary-line">
                          <strong>Ordinary messages</strong>
                          <span>Addressed at scheduled review</span>
                        </div>
                        <div className="notice">The inbox is coaching support, not emergency or medical care.</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Conversation view */}
                  <div className="card">
                    <div className="panel-head">
                      <div className="person">
                        <span className={`avatar ${currentClient.variant}`}>{currentClient.short}</span>
                        <div>
                          <div className="panel-title">
                            {currentClient.name} · {currentMessage.subject}
                          </div>
                          <div className="panel-sub">
                            {currentMessage.when} · {currentMessage.priority ? "High priority" : "Routine message"}
                          </div>
                        </div>
                      </div>
                      <span className={`tag ${currentMessage.priority ? "amber" : "neutral"}`}>
                        {currentMessage.status}
                      </span>
                    </div>

                    <div className="section">
                      <div className="output-preview">
                        <strong>Client message</strong>
                        <p>{currentMessage.body}</p>
                      </div>

                      <label className="input-label" style={{ marginTop: "18px" }}>
                        {currentMessage.priority ? "Coach reply" : "Note for the next scheduled review"}
                      </label>
                      <textarea
                        className="text-field"
                        placeholder="Write a concise, practical response..."
                        value={currentMessage.reply}
                        onChange={(e) => {
                          const updated = messages.map((m) =>
                            m.id === currentMessage.id ? { ...m, reply: e.target.value } : m
                          );
                          setMessages(updated);
                        }}
                      />

                      <p className="workspace-hint" style={{ margin: "10px 0 0" }}>
                        {currentMessage.priority
                          ? "Replying to an equipment problem may require a new approved substitute or programme change. A message alone cannot update the active programme."
                          : "Routine questions are collected for the next scheduled review. No new immediate response promise is created."}
                      </p>
                    </div>

                    <div className="save-row">
                      <span className="audit-note">Private coach-client correspondence · demo only</span>
                      <button
                        className="btn primary"
                        onClick={() => {
                          if (!currentMessage.reply.trim()) {
                            showToast("Write a message first");
                            return;
                          }
                          const updated = messages.map((m) =>
                            m.id === currentMessage.id
                              ? { ...m, status: m.priority ? "Reply drafted" : "Note saved" }
                              : m
                          );
                          setMessages(updated);
                          showToast(
                            currentMessage.priority
                              ? "Demo reply captured · not delivered"
                              : "Saved for next review · demo only"
                          );
                        }}
                      >
                        {currentMessage.priority ? "Simulate reply" : "Save review note"} <SvgIcon name="arrow" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* 7. OPERATIONS VIEW */}
          {page === "operations" && (
            <>
              <div className="title-row">
                <div>
                  <div className="eyebrow">Management / Operations</div>
                  <h1 className="page-title">Service operations</h1>
                  <p className="page-desc">Keep coaching delivery reliable before increasing capacity.</p>
                </div>
                <div className="top-buttons">
                  <button className="btn" onClick={handleResetData}>
                    <SvgIcon name="refresh" /> Reset demo
                  </button>
                </div>
              </div>

              <div className="kpi-grid">
                <div className="card kpi">
                  <div className="kpi-head">Founding capacity <SvgIcon name="clients" /></div>
                  <div className="kpi-val mono">6 / 10</div>
                  <div className="kpi-foot">Hard limit: 10 active</div>
                  <div className="progress-track"><span style={{ width: "60%" }} /></div>
                </div>

                <div className="card kpi">
                  <div className="kpi-head">Weekly onboarding <SvgIcon name="people" /></div>
                  <div className="kpi-val mono">2 / 3</div>
                  <div className="kpi-foot">Hard limit: three new</div>
                  <div className="progress-track"><span style={{ width: "66%" }} /></div>
                </div>

                <div className="card kpi">
                  <div className="kpi-head">Programme deadlines <SvgIcon name="clock" /></div>
                  <div className="kpi-val mono">1</div>
                  <div className="kpi-foot">Five business days after complete assessment</div>
                </div>

                <div className="card kpi">
                  <div className="kpi-head">Support workload <SvgIcon name="inbox" /></div>
                  <div className="kpi-val mono">1</div>
                  <div className="kpi-foot">High-priority issue open</div>
                </div>
              </div>

              <div className="columns">
                <div className="card">
                  <div className="panel-head">
                    <div>
                      <div className="panel-title">Operational safeguards</div>
                      <div className="panel-sub">Must be enforced by a real backend</div>
                    </div>
                    <SvgIcon name="shield" />
                  </div>
                  <div className="section">
                    <div className="step-list">
                      {[
                        ["One active version", "Programmes have Draft, Active and Superseded versions; publication requires explicit coach approval."],
                        ["Safety before activation", "The safety hold remains blocking until professionally appropriate requirements are resolved."],
                        ["Membership capacity", "Capacity and weekly onboarding limits are validated atomically server-side, never by client-visible counters."],
                        ["Coaching records", "Review, messaging and publishing actions create dated audit records and retain historic programme versions."],
                      ].map(([title, desc], i) => (
                        <div key={i} className="step">
                          <span className="step-number">{i + 1}</span>
                          <div>
                            <strong>{title}</strong>
                            <small>{desc}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="stack">
                  <div className="card">
                    <div className="panel-head">
                      <div className="panel-title">Time commitments</div>
                    </div>
                    <div className="section">
                      <div className="summary-line">
                        <strong>Initial programme delivery</strong>
                        <span>5 business days</span>
                      </div>
                      <div className="summary-line">
                        <strong>Personal reviews</strong>
                        <span>2 / billing month</span>
                      </div>
                      <div className="summary-line">
                        <strong>High-priority allowances</strong>
                        <span>2 / billing month</span>
                      </div>
                      <div className="summary-line">
                        <strong>Priority reply</strong>
                        <span>24h during Mon–Sat coaching days</span>
                      </div>
                    </div>
                  </div>

                  <div className="info-banner">
                    <SvgIcon name="info" />
                    <div>
                      Billing, real client count, response timestamps, permissions and labour tracking require server-side integration. This is a demonstration of information layout.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ATHLETE SLIDE-OVER DRAWER */}
      {clientDrawer && (() => {
        const c = getClient(clientDrawer);
        return (
          <div className="drawer-shade" onClick={() => setClientDrawer(null)}>
            <div
              className="drawer"
              role="dialog"
              aria-label={`${c.name} client record`}
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-header">
                <button
                  className="icon-btn drawer-close"
                  onClick={() => setClientDrawer(null)}
                  aria-label="Close client details"
                >
                  <SvgIcon name="close" />
                </button>
                <div className="eyebrow">Private client record</div>
                <div className="person" style={{ marginTop: "15px" }}>
                  <span className={`avatar ${c.variant}`}>{c.short}</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "22px", letterSpacing: "-.5px" }}>{c.name}</h2>
                    <div className="subtle" style={{ marginTop: "5px" }}>{c.goal} · {c.phase}</div>
                  </div>
                </div>
                <div style={{ marginTop: "15px" }}>
                  <span className={`tag ${c.statusTone}`}>{c.status}</span>
                </div>
              </div>

              <div className="drawer-body">
                <div className="section-title">Client snapshot</div>
                <div className="definition-grid">
                  <div>
                    <div className="field-label">Coaching direction</div>
                    <div className="field-val">{c.goal}</div>
                  </div>
                  <div>
                    <div className="field-label">Current plan</div>
                    <div className="field-val">{c.plan}</div>
                  </div>
                  <div>
                    <div className="field-label">Next scheduled review</div>
                    <div className="field-val">{c.review}</div>
                  </div>
                  <div>
                    <div className="field-label">Training</div>
                    <div className="field-val">{c.days}</div>
                  </div>
                </div>

                <div className="rule" />

                <div className="section-title">Relevant record</div>
                <div className="step-list">
                  <div className="step">
                    <span className="step-number">1</span>
                    <div>
                      <strong>Assessment and safety</strong>
                      <small>Specific health records open only through protected review actions—not shown in the roster.</small>
                    </div>
                  </div>
                  <div className="step">
                    <span className="step-number">2</span>
                    <div>
                      <strong>Active plan versions</strong>
                      <small>Training and nutrition histories stay linked to the version in effect when the activity was logged.</small>
                    </div>
                  </div>
                  <div className="step">
                    <span className="step-number">3</span>
                    <div>
                      <strong>Coaching decisions</strong>
                      <small>Approved changes, scheduled check-ins and reason for adjustments are tracked as separate records.</small>
                    </div>
                  </div>
                </div>

                <div className="rule" />

                <div className="pillbox">
                  <button
                    className="btn"
                    onClick={() => {
                      if (!["amara", "tunde"].includes(c.id)) {
                        showToast("Only two sample assessments are available");
                        return;
                      }
                      setAssess(c.id);
                      setAssessTab("facts");
                      setClientDrawer(null);
                      setPage("assessments");
                    }}
                  >
                    Assessment
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      setProgramme(c.id);
                      setProgramTab("training");
                      setClientDrawer(null);
                      setPage("programmes");
                    }}
                  >
                    Programmes
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      if (!["zara", "femi"].includes(c.id)) {
                        showToast("No scheduled example review for this client");
                        return;
                      }
                      setReview(c.id);
                      setClientDrawer(null);
                      setPage("reviews");
                    }}
                  >
                    Check-in
                  </button>
                </div>

                <p className="caption" style={{ marginTop: "22px" }}>
                  Fictional client details. This demo has no login, encrypted client store, consent ledger or legal safety decisions.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODALS */}
      {modal === "publish" && (
        <div className="modal-shade" onClick={() => setModal(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="eyebrow">Publication checkpoint</div>
            <div id="modal-title" className="modal-title">Review before publishing</div>
            <p className="modal-desc">
              Publishing a plan would create an Active version visible to the client, retain earlier versions and change the live source of truth. In this prototype, it only updates mock UI state.
            </p>
            <div className="rule" />

            <label className="check-row">
              <input
                type="checkbox"
                className="publish-check"
                checked={publishChecks[0]}
                onChange={(e) => setPublishChecks([e.target.checked, publishChecks[1], publishChecks[2]])}
              />
              I reviewed the exercise prescription, rest and approved swaps.
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                className="publish-check"
                checked={publishChecks[1]}
                onChange={(e) => setPublishChecks([publishChecks[0], e.target.checked, publishChecks[2]])}
              />
              I verified the nutrition quantities, preparation states and recipe evidence.
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                className="publish-check"
                checked={publishChecks[2]}
                onChange={(e) => setPublishChecks([publishChecks[0], publishChecks[1], e.target.checked])}
              />
              Relevant safety and consent requirements are satisfied.
            </label>

            <div className="info-banner warn" style={{ marginTop: "10px" }}>
              <SvgIcon name="info" />
              <div>These checks are illustrative. They do not constitute an actual medical or nutrition clearance.</div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setModal(null)}>Cancel</button>
              <button
                className="btn primary"
                disabled={!publishChecks.every(Boolean)}
                onClick={() => {
                  setPlanVersion("Active v1 (demo)");
                  setPlanApproved(true);
                  setPlanEdit(false);
                  setModal(null);
                  showToast("Publication simulated only · no real plan changed");
                }}
              >
                Simulate publish
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "review" && (
        <div className="modal-shade" onClick={() => setModal(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="eyebrow">Review decision</div>
            <div className="modal-title">Record this coaching review?</div>
            <p className="modal-desc">
              Decision: <strong>{reviewDecision}</strong>. Your explanation will be recorded in this demo. Any training or nutrition changes must still be drafted and approved separately.
            </p>
            <div className="modal-footer">
              <button className="btn" onClick={() => setModal(null)}>Cancel</button>
              <button
                className="btn primary"
                onClick={() => {
                  setModal(null);
                  setReviewSaved(true);
                  showToast("Coach review recorded in demo · no actual client update");
                }}
              >
                Record review (demo)
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "programme-preview" && (
        <div className="modal-shade" onClick={() => setModal(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="eyebrow">Client-facing preview</div>
            <div className="modal-title">What your client would see</div>
            <div className="output-preview">
              <strong>Training · Full Body A</strong>
              <p>
                Leg Press: {training[0].sets} sets × {training[0].reps} reps · Rest {training[0].rest}. Approved swap: {training[0].swap}.
              </p>
            </div>
            <div className="output-preview" style={{ marginTop: "10px" }}>
              <strong>Nutrition · Structured</strong>
              <p>
                Rice: {nutrition[1].amount} cooked, paired with a coach-approved protein portion. Gram amounts and preparation states remain visible.
              </p>
            </div>
            <p className="modal-desc" style={{ marginTop: "12px" }}>
              Mock client preview; not a verified, published or nutritionally calculated plan.
            </p>
            <div className="modal-footer">
              <button className="btn" onClick={() => setModal(null)}>Close preview</button>
            </div>
          </div>
        </div>
      )}

      {modal === "review-summary" && (
        <div className="modal-shade" onClick={() => setModal(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="eyebrow">Review summary</div>
            <div className="modal-title">A coach-authored decision</div>
            <p className="modal-desc">
              At renewal, the real output will include a concise progress summary, the evidence-led coaching decision, three priorities for the next billing month and the dates of the next two personal reviews. The programme remains unchanged until any necessary new draft is approved.
            </p>
            <div className="modal-footer">
              <button className="btn" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ⌘K GLOBAL SEARCH MODAL */}
      {searchOpen && (
        <div className="search-shade" onClick={() => setSearchOpen(false)}>
          <div
            className="search-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
            onClick={(e) => e.stopPropagation()}
          >
            <ClearableSearchInput
              id="global-search"
              autoFocus
              placeholder="Search clients, programmes or reviews..."
              value={searchQuery}
              onChange={setSearchQuery}
              ariaLabel="Search clients, programmes or reviews"
            />
            <div className="search-results" id="search-results">
              {INITIAL_CLIENTS.filter((c) => {
                const q = searchQuery.trim().toLowerCase();
                return !q || `${c.name} ${c.goal} ${c.status}`.toLowerCase().includes(q);
              }).length === 0 ? (
                <div className="empty">No matching client.</div>
              ) : (
                INITIAL_CLIENTS.filter((c) => {
                  const q = searchQuery.trim().toLowerCase();
                  return !q || `${c.name} ${c.goal} ${c.status}`.toLowerCase().includes(q);
                }).map((c) => (
                  <button
                    key={c.id}
                    className="search-result"
                    onClick={() => {
                      setSearchOpen(false);
                      setClientDrawer(c.id);
                    }}
                  >
                    <span className={`avatar ${c.variant}`}>{c.short}</span>
                    <span>{c.name}</span>
                    <small>{c.status}</small>
                    <SvgIcon name="chevron" />
                  </button>
                ))
              )}
            </div>
            <div className="panel-foot">Search sample client records; no external service connected. Esc to close.</div>
          </div>
        </div>
      )}

      {/* FLOATING PROTOTYPE RIBBON */}
      <div className="prototype-ribbon">
        Modern SaaS Coach Studio · ASCEND 1-on-1 Physique Coaching
      </div>

      {/* TOAST NOTIFICATION */}
      <div className={`toast ${toastMessage ? "show" : ""}`} id="toast">
        {toastMessage}
      </div>
    </div>
  );
}
