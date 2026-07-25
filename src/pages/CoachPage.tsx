import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { dataStore } from "../services/dataStore";
import { authStore } from "../services/authStore";

type View = "overview" | "people" | "applications" | "checkins" | "delivery" | "workouts" | "system";
type Person = {
  id: string;
  kind: "lead" | "client";
  status: string;
  full_name: string;
  email: string;
  whatsapp: string;
  city_country: string;
  age: string;
  primary_goal: string;
  goal_detail: string;
  goal_urgency: number;
  training_age: string;
  preferred_frequency: string;
  session_length: string;
  access_type: string;
  days_available: string;
  equipment: string;
  pain_context: string;
  consistency_barrier: string;
  tracking_readiness: string;
  phase: string;
  training_level: string;
  next_check_in: string;
  coach_note: string;
  created_at: string;
  updated_at: string;
  sample?: boolean;
};
type Activity = { id: string; person_id: string; type: string; summary: string; created_at: string };
type CheckIn = { id: string; person_id: string; week_of: string; workouts_completed: number; workouts_planned: number; recovery: string; pain_soreness: string; created_at: string };
type Assignment = { id: string; person_id: string; full_name?: string; title: string; phase: string; days_per_week: number; status: string; starts_on: string; ends_on: string; athlete_instructions: string; updated_at: string };
type Workout = { id: string; person_id: string; full_name?: string; workout_date: string; workout_name: string; completion_status: string; duration_minutes: number; effort_rating: number; athlete_note: string; coach_feedback: string; exercise_log: string };

const samplePeople: Person[] = [
  {
    id: "sample-1", kind: "client", status: "active", full_name: "Amara O.", email: "amara@example.com", whatsapp: "+234 800 000 0001", city_country: "Lagos, Nigeria", age: "28", primary_goal: "Body recomposition", goal_detail: "Build visible shape and regain consistency after a demanding work season.", goal_urgency: 9, training_age: "1–2 years", preferred_frequency: "4 days per week", session_length: "60 minutes", access_type: "Commercial gym", days_available: '["Mon","Tue","Thu","Sat"]', equipment: '["Barbell","Dumbbells","Cable machine","Leg press"]', pain_context: "No active pain. Previous mild wrist irritation with straight-bar curls.", consistency_barrier: "Late work meetings and missed meal preparation.", tracking_readiness: '["Workout loads and reps","Protein target days","Sleep and recovery"]', phase: "Forging the Form", training_level: "Intermediate", next_check_in: "2026-07-18", coach_note: "Strong start. Keep lower-body volume stable for one more week before adding work.", created_at: "2026-06-03T09:00:00Z", updated_at: "2026-07-16T09:00:00Z", sample: true,
  },
  {
    id: "sample-2", kind: "client", status: "active", full_name: "David K.", email: "david@example.com", whatsapp: "+234 800 000 0002", city_country: "Abuja, Nigeria", age: "34", primary_goal: "Lean muscle gain", goal_detail: "Add size while remaining athletic and improving training discipline.", goal_urgency: 8, training_age: "2+ years", preferred_frequency: "4 days per week", session_length: "75+ minutes", access_type: "Commercial gym", days_available: '["Mon","Wed","Fri","Sat"]', equipment: '["Barbell","Dumbbells","Cable machine"]', pain_context: "Right shoulder becomes uncomfortable at deep pressing ranges.", consistency_barrier: "Travels twice monthly.", tracking_readiness: '["Workout loads and reps","Weekly bodyweight average","Pain or soreness"]', phase: "Taming the Flesh", training_level: "Intermediate — provisional", next_check_in: "2026-07-16", coach_note: "Review pressing range and next-day shoulder response before progressing load.", created_at: "2026-06-22T09:00:00Z", updated_at: "2026-07-16T08:20:00Z", sample: true,
  },
  {
    id: "sample-3", kind: "lead", status: "new", full_name: "Zainab M.", email: "zainab@example.com", whatsapp: "+234 800 000 0003", city_country: "Kano, Nigeria", age: "26", primary_goal: "Beginner confidence", goal_detail: "Learn to use the gym without feeling lost and become stronger.", goal_urgency: 7, training_age: "Never trained properly", preferred_frequency: "3 days per week", session_length: "45 minutes", access_type: "Commercial gym", days_available: '["Tue","Thu","Sat"]', equipment: '["Dumbbells","Cable machine","Cardio equipment"]', pain_context: "None reported.", consistency_barrier: "Does not know what to do in the gym.", tracking_readiness: '["Workout loads and reps","Sleep and recovery"]', phase: "Unassigned", training_level: "To assess", next_check_in: "", coach_note: "", created_at: "2026-07-16T07:40:00Z", updated_at: "2026-07-16T07:40:00Z", sample: true,
  },
  {
    id: "sample-4", kind: "lead", status: "qualified", full_name: "Michael A.", email: "michael@example.com", whatsapp: "+44 7700 900000", city_country: "London, UK", age: "31", primary_goal: "Aesthetic physique development", goal_detail: "Build shoulders, back and legs with a plan that works around travel.", goal_urgency: 8, training_age: "1–2 years", preferred_frequency: "4 days per week", session_length: "60 minutes", access_type: "Mixed access", days_available: '["Mon","Tue","Thu","Fri"]', equipment: '["Dumbbells","Cable machine","Home basics only"]', pain_context: "Occasional knee clicking; no pain or swelling reported.", consistency_barrier: "Frequent hotel stays.", tracking_readiness: '["Workout loads and reps","Weekly bodyweight average","Progress photos"]', phase: "Unassigned", training_level: "To assess", next_check_in: "", coach_note: "Consultation booked; confirm hotel-gym access pattern.", created_at: "2026-07-14T12:00:00Z", updated_at: "2026-07-15T14:00:00Z", sample: true,
  },
  {
    id: "sample-5", kind: "client", status: "paused", full_name: "Nneka P.", email: "nneka@example.com", whatsapp: "+234 800 000 0005", city_country: "Port Harcourt, Nigeria", age: "30", primary_goal: "Glute / lower-body growth", goal_detail: "Return after a break and rebuild lower-body confidence.", goal_urgency: 6, training_age: "Returning after a break", preferred_frequency: "3 days per week", session_length: "60 minutes", access_type: "Commercial gym", days_available: '["Mon","Wed","Sat"]', equipment: '["Smith machine","Dumbbells","Hip thrust setup"]', pain_context: "Knee tolerance currently under review.", consistency_barrier: "Recovery and inconsistent sleep.", tracking_readiness: '["Pain or soreness","Sleep and recovery"]', phase: "Taming the Flesh", training_level: "Beginner — rebuild", next_check_in: "2026-07-19", coach_note: "Paused heavy lower-body work. Awaiting assessment update.", created_at: "2026-05-19T09:00:00Z", updated_at: "2026-07-15T10:00:00Z", sample: true,
  },
];

const sampleActivity: Activity[] = [
  { id: "a1", person_id: "sample-3", type: "application", summary: "Zainab submitted a coaching application.", created_at: "2026-07-16T07:40:00Z" },
  { id: "a2", person_id: "sample-1", type: "checkin", summary: "Amara completed her weekly review — recovery normal.", created_at: "2026-07-15T18:20:00Z" },
  { id: "a3", person_id: "sample-4", type: "status", summary: "Michael moved to qualified; consultation details added.", created_at: "2026-07-15T14:00:00Z" },
];

const navItems: { id: View; label: string; icon: string; badge?: string }[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "people", label: "Athletes", icon: "users" },
  { id: "applications", label: "Applications", icon: "inbox", badge: "new" },
  { id: "checkins", label: "Check-ins", icon: "pulse" },
  { id: "delivery", label: "Programmes", icon: "clipboard" },
  { id: "workouts", label: "Workout logs", icon: "pulse" },
  { id: "system", label: "Program system", icon: "layers" },
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    users: <><path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    inbox: <><path d="M4 4h16v16H4z"/><path d="M4 13h5l2 3h2l2-3h5"/></>,
    pulse: <path d="M3 12h4l2-7 4 14 2-7h6"/>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    close: <path d="M6 6l12 12M18 6 6 18"/>,
    alert: <><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 18h.01"/></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4"/></>,
  };
  return <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const statusLabel: Record<string, string> = { new: "New", qualified: "Qualified", consultation: "Consultation", active: "Active", paused: "Paused", completed: "Completed", declined: "Declined" };
const phaseShort: Record<string, string> = { "Taming the Flesh": "Taming", "Forging the Form": "Forging", Ascension: "Ascension", Unassigned: "Unassigned" };

function formatDate(value: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
function initials(name: string) { return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function hasPainFlag(person: Person) {
  const note = person.pain_context.trim().toLowerCase();
  if (!note) return false;
  return !/^(none|none reported|no current pain|no pain(\.|$)|no active pain)/.test(note);
}

export default function CoachDashboard({ coachName = "Sahmi El" }: { coachName?: string; signOutPath?: string }) {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Person | null>(null);
  const [people, setPeople] = useState<Person[]>(samplePeople);
  const [activities, setActivities] = useState<Activity[]>(sampleActivity);
  const [usingSamples, setUsingSamples] = useState(true);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [addingProgramme, setAddingProgramme] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const storedPeople = dataStore.getPeople();
    const storedAssignments = dataStore.getAssignments();
    const storedWorkouts = dataStore.getWorkouts();
    if (storedPeople.length) {
      setPeople(storedPeople);
      setUsingSamples(false);
    }
    setAssignments(storedAssignments);
    setWorkouts(storedWorkouts);
    setLoading(false);
  }, []);



  const filteredPeople = useMemo(() => {
    const query = search.toLowerCase().trim();
    return people.filter((person) => {
      const matchesSearch = !query || [person.full_name, person.email, person.primary_goal, person.phase].join(" ").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || person.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [people, search, statusFilter]);

  const active = people.filter((p) => p.status === "active");
  const applications = people.filter((p) => p.kind === "lead" && !["declined", "active"].includes(p.status));
  const due = people.filter((p) => p.next_check_in && new Date(p.next_check_in) <= new Date("2026-07-20"));
  const painFlags = people.filter(hasPainFlag);

  function openPerson(person: Person) { setSelected({ ...person }); }

  async function savePerson() {
    if (!selected) return;
    if (selected.sample) {
      setPeople((current) => current.map((person) => person.id === selected.id ? selected : person));
      setNotice("Sample record updated for this review session.");
      setSelected(null);
      return;
    }
    const response = await fetch(`/api/coach/people/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: selected.status,
        kind: selected.kind,
        phase: selected.phase,
        trainingLevel: selected.training_level,
        nextCheckIn: selected.next_check_in,
        coachNote: selected.coach_note,
      }),
    });
    const result = (await response.json()) as { person?: Person; error?: string };
    if (!response.ok || !result.person) { setNotice(result.error || "Could not save changes."); return; }
    setPeople((current) => current.map((person) => person.id === result.person?.id ? result.person : person));
    setSelected(null);
    setNotice("Athlete record saved.");
  }

  async function addClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/coach/people", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = (await response.json()) as { person?: Person; error?: string };
    if (!response.ok || !result.person) { setNotice(result.error || "Could not add athlete."); return; }
    setPeople((current) => [result.person as Person, ...current.filter((person) => !person.sample)]);
    setUsingSamples(false);
    setAdding(false);
    setNotice("Athlete added to the active roster.");
  }

  async function addProgramme(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/coach/operations", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const result = (await response.json()) as { assignment?: Assignment; error?: string };
    if (!response.ok || !result.assignment) { setNotice(result.error || "Could not create programme."); return; }
    const athlete = people.find((person) => person.id === result.assignment?.person_id);
    setAssignments((current) => [{ ...result.assignment as Assignment, full_name: athlete?.full_name }, ...current]);
    setAddingProgramme(false);
    setNotice("Programme created and saved.");
  }

  return (
    <main className="coach-app">
      <aside className="coach-sidebar">
        <Link className="coach-wordmark" to="/"><span>GET</span> DIVINE<small>Coach command</small></Link>
        <nav aria-label="Coach workspace">
          <p>Workspace</p>
          {navItems.map((item) => (
            <button className={view === item.id ? "active" : ""} onClick={() => setView(item.id)} key={item.id}>
              <Icon name={item.icon} /><span>{item.label}</span>
              {item.id === "applications" && applications.length > 0 && <b>{applications.length}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="coach-profile-mini"><span>{initials(coachName)}</span><div><strong>{coachName}</strong><small>Head coach</small></div></div>
          <button
            type="button"
            onClick={() => {
              authStore.logout();
              navigate("/");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#a1a1aa",
              cursor: "pointer",
              fontSize: "0.85rem",
              padding: 0,
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <section className="coach-main">
        <header className="coach-topbar">
          <div className="coach-mobile-brand">GD</div>
          <div className="global-search"><Icon name="search" /><input aria-label="Search athletes and applications" placeholder="Search athletes, goals or phases…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="top-actions"><button aria-label="Notifications"><Icon name="bell" /><span /></button><button className="coach-avatar">{initials(coachName)}</button></div>
        </header>

        <div className="coach-content">
          {(notice || usingSamples) && (
            <div className="workspace-notice"><span>{usingSamples ? "Preview data" : "Update"}</span><p>{notice || "Sample records are shown so you can inspect the full management experience. Real applications replace them automatically."}</p><button onClick={() => { setNotice(""); if (!usingSamples) setUsingSamples(false); }}>×</button></div>
          )}

          <div className="workspace-heading">
            <div>
              <p className="dashboard-eyebrow">Private coaching operations</p>
              <h1>{view === "overview" ? "Command centre" : navItems.find((item) => item.id === view)?.label}</h1>
              <p>{view === "overview" ? "See what needs your decision, not just what exists." : view === "people" ? "Manage every active, paused and completed coaching relationship." : view === "applications" ? "Move the right prospects from interest to a clear coaching decision." : view === "checkins" ? "Review the signals that should change a coaching decision." : view === "delivery" ? "Assign the clear training experience each athlete receives." : view === "workouts" ? "Review completed work, reported effort and anything needing your attention." : "The private operating logic behind every client experience."}</p>
            </div>
            <div className="heading-actions">
              <span className="last-sync">{loading ? "Syncing…" : "Workspace current"}</span>
              <button className="coach-primary" onClick={() => setAdding(true)}><Icon name="plus" /> Add athlete</button>
            </div>
          </div>

          {view === "overview" && (
            <>
              <section className="metric-grid">
                <article><div><span>Active athletes</span><strong>{active.length}</strong></div><span className="metric-icon gold"><Icon name="users" /></span><p><b>↑</b> Structured roster</p></article>
                <article><div><span>New applications</span><strong>{applications.filter((p) => p.status === "new").length}</strong></div><span className="metric-icon ivory"><Icon name="inbox" /></span><p>{applications.length} open pipeline records</p></article>
                <article><div><span>Check-ins due</span><strong>{due.length}</strong></div><span className="metric-icon green"><Icon name="pulse" /></span><p>{Math.max(0, due.length - 1)} need review today</p></article>
                <article><div><span>Attention flags</span><strong>{painFlags.length}</strong></div><span className="metric-icon red"><Icon name="alert" /></span><p>Pain or tolerance notes</p></article>
              </section>

              <section className="overview-grid">
                <article className="coach-panel applications-panel">
                  <div className="panel-head"><div><p>Requires your decision</p><h2>Application queue</h2></div><button onClick={() => setView("applications")}>View pipeline <Icon name="arrow" /></button></div>
                  <div className="application-rows">
                    {applications.slice(0, 4).map((person) => (
                      <button className="application-row" key={person.id} onClick={() => openPerson(person)}>
                        <span className="person-avatar">{initials(person.full_name)}</span>
                        <div className="person-main"><strong>{person.full_name}</strong><span>{person.primary_goal}</span></div>
                        <div className="person-meta"><span>{person.city_country || "Location not provided"}</span><small>{formatDate(person.created_at)}</small></div>
                        <span className={`status-pill status-${person.status}`}>{statusLabel[person.status]}</span>
                        <Icon name="arrow" />
                      </button>
                    ))}
                    {!applications.length && <div className="empty-state">No open applications. New submissions will appear here.</div>}
                  </div>
                </article>

                <article className="coach-panel attention-panel">
                  <div className="panel-head"><div><p>Coach attention</p><h2>What needs care</h2></div></div>
                  <div className="attention-list">
                    {painFlags.slice(0, 3).map((person, index) => (
                      <button key={person.id} onClick={() => openPerson(person)}>
                        <span className={index === 0 ? "attention-mark red" : "attention-mark amber"}><Icon name="alert" /></span>
                        <div><strong>{person.full_name}</strong><p>{person.pain_context}</p></div><span>Review</span>
                      </button>
                    ))}
                  </div>
                </article>
              </section>

              <section className="overview-lower">
                <article className="coach-panel phase-panel">
                  <div className="panel-head"><div><p>Active roster</p><h2>Phase distribution</h2></div><span className="period-chip">Current cycle</span></div>
                  {["Taming the Flesh", "Forging the Form", "Ascension"].map((phase, index) => {
                    const count = active.filter((person) => person.phase === phase).length;
                    const percent = active.length ? Math.round((count / active.length) * 100) : 0;
                    return <div className="phase-bar-row" key={phase}><span className={`phase-dot phase-${index + 1}`} /><strong>{phaseShort[phase]}</strong><div><span style={{ width: `${percent}%` }} /></div><b>{count}</b><small>{percent}%</small></div>;
                  })}
                </article>
                <article className="coach-panel activity-panel">
                  <div className="panel-head"><div><p>Latest movement</p><h2>Activity</h2></div></div>
                  <div className="activity-list">
                    {activities.slice(0, 4).map((activity) => <div key={activity.id}><span>◆</span><p>{activity.summary}<small>{formatDate(activity.created_at)}</small></p></div>)}
                    {!activities.length && <div className="empty-state">Activity will appear as the roster changes.</div>}
                  </div>
                </article>
              </section>
            </>
          )}

          {view === "people" && (
            <section className="coach-panel data-panel">
              <div className="data-toolbar">
                <div className="inline-search"><Icon name="search" /><input aria-label="Filter athlete table" placeholder="Filter this roster…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                <span>{filteredPeople.length} records</span>
              </div>
              <div className="people-table-wrap"><table className="people-table"><thead><tr><th>Athlete</th><th>Goal</th><th>Phase / level</th><th>Next check-in</th><th>Status</th><th /></tr></thead><tbody>
                {filteredPeople.map((person) => <tr key={person.id} onClick={() => openPerson(person)}><td><span className="person-avatar">{initials(person.full_name)}</span><div><strong>{person.full_name}</strong><small>{person.email}</small></div></td><td><strong>{person.primary_goal || "Not recorded"}</strong><small>{person.preferred_frequency || person.city_country}</small></td><td><strong>{phaseShort[person.phase] || person.phase}</strong><small>{person.training_level}</small></td><td><strong>{formatDate(person.next_check_in)}</strong><small>{person.next_check_in ? "Scheduled" : "Needs date"}</small></td><td><span className={`status-pill status-${person.status}`}>{statusLabel[person.status]}</span></td><td><Icon name="arrow" /></td></tr>)}
              </tbody></table></div>
            </section>
          )}

          {view === "applications" && (
            <section className="pipeline-grid">
              {["new", "qualified", "consultation"].map((status) => {
                const column = applications.filter((person) => person.status === status);
                return <article className="pipeline-column" key={status}><header><div><span className={`pipeline-dot status-${status}`} />{statusLabel[status]}</div><b>{column.length}</b></header><div className="pipeline-stack">
                  {column.map((person) => <button className="lead-card" key={person.id} onClick={() => openPerson(person)}><div><span className="person-avatar">{initials(person.full_name)}</span><span className="urgency">{person.goal_urgency}/10 priority</span></div><h3>{person.full_name}</h3><p>{person.primary_goal}</p><ul><li>{person.preferred_frequency || "Frequency not set"}</li><li>{person.city_country || "Location not set"}</li></ul>{hasPainFlag(person) && <span className="pain-chip"><Icon name="alert" /> Movement note</span>}<footer><span>{formatDate(person.created_at)}</span><Icon name="arrow" /></footer></button>)}
                  {!column.length && <div className="pipeline-empty">No {statusLabel[status].toLowerCase()} applications</div>}
                </div></article>;
              })}
            </section>
          )}

          {view === "checkins" && (
            <section className="checkin-layout">
              <article className="coach-panel checkin-queue">
                <div className="panel-head"><div><p>Weekly review</p><h2>Check-in queue</h2></div><span className="period-chip">This week</span></div>
                {(due.length ? due : active).map((person) => <button className="checkin-row" key={person.id} onClick={() => openPerson(person)}><span className="person-avatar">{initials(person.full_name)}</span><div><strong>{person.full_name}</strong><small>{person.primary_goal}</small></div><div><span>Due</span><strong>{formatDate(person.next_check_in)}</strong></div><div><span>Phase</span><strong>{phaseShort[person.phase]}</strong></div><span className={hasPainFlag(person) ? "signal alert" : "signal good"}>{hasPainFlag(person) ? "Review pain" : "On track"}</span><Icon name="arrow" /></button>)}
              </article>
              <aside className="coach-panel signals-panel"><div className="panel-head"><div><p>Decision standard</p><h2>Review signals</h2></div></div>{["Workouts completed", "Bodyweight trend", "Protein target days", "Sleep and recovery", "Pain / soreness", "Performance quality"].map((signal, index) => <div className="signal-rule" key={signal}><span>0{index + 1}</span><p>{signal}</p></div>)}<p className="signal-foot">Track only what can change progression, substitutions, recovery or coaching action.</p></aside>
            </section>
          )}

          {view === "delivery" && (
            <section className="delivery-workspace">
              <article className="coach-panel programme-list">
                <div className="panel-head"><div><p>Client delivery</p><h2>Assigned programmes</h2></div><button onClick={() => setAddingProgramme(true)}><Icon name="plus" /> New programme</button></div>
                <div className="programme-table">
                  {assignments.map((assignment) => <div className="programme-row" key={assignment.id}>
                    <span className="person-avatar">{initials(assignment.full_name || "Athlete")}</span>
                    <div><strong>{assignment.title}</strong><small>{assignment.full_name || "Assigned athlete"}</small></div>
                    <div><span>Phase</span><strong>{phaseShort[assignment.phase] || assignment.phase}</strong></div>
                    <div><span>Frequency</span><strong>{assignment.days_per_week} days / week</strong></div>
                    <span className={`status-pill status-${assignment.status === "active" ? "active" : "paused"}`}>{assignment.status}</span>
                  </div>)}
                  {!assignments.length && <div className="empty-state large">No live programmes yet. Create the first assignment for an active athlete.</div>}
                </div>
              </article>
              <aside className="coach-panel delivery-readiness">
                <div className="panel-head"><div><p>Backend coverage</p><h2>Delivery system</h2></div></div>
                {[
                  ["Programmes", "Assign phases, schedule dates and separate private notes from athlete instructions."],
                  ["Workout logs", "Store sets, reps, loads, completion, effort and coach feedback."],
                  ["Progress", "Record measurements and dated progress entries."],
                  ["Billing", "Track plan, status, amount, currency and renewal date."],
                  ["Access", "Coach operations remain protected by server-side authorisation."],
                ].map(([title, copy], index) => <div className="delivery-capability" key={title}><span>0{index + 1}</span><div><strong>{title}</strong><p>{copy}</p></div></div>)}
              </aside>
            </section>
          )}

          {view === "workouts" && (
            <section className="coach-panel data-panel">
              <div className="panel-head"><div><p>Athlete performance</p><h2>Completed workout logs</h2></div><span className="period-chip">{workouts.length} records</span></div>
              <div className="people-table-wrap">
                <table className="people-table workout-review-table">
                  <thead><tr><th>Athlete</th><th>Workout</th><th>Date</th><th>Duration</th><th>RPE</th><th>Signal</th></tr></thead>
                  <tbody>
                    {workouts.map((workout) => (
                      <tr key={workout.id}>
                        <td><span className="person-avatar">{initials(workout.full_name || "Athlete")}</span><div><strong>{workout.full_name || "Athlete"}</strong><small>{workout.completion_status}</small></div></td>
                        <td><strong>{workout.workout_name}</strong><small>{(() => { try { return `${JSON.parse(workout.exercise_log || "[]").length} exercises`; } catch { return "Log recorded"; } })()}</small></td>
                        <td><strong>{formatDate(workout.workout_date)}</strong></td>
                        <td><strong>{workout.duration_minutes ? `${workout.duration_minutes} min` : "—"}</strong></td>
                        <td><strong>{workout.effort_rating || "—"} / 10</strong></td>
                        <td><span className={workout.athlete_note ? "signal alert" : "signal good"}>{workout.athlete_note ? "Review note" : "Logged"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!workouts.length && <div className="empty-state large">No completed workout logs yet. Client entries will appear here automatically.</div>}
            </section>
          )}

          {view === "system" && (
            <section className="system-layout">
              <article className="system-hero"><p className="dashboard-eyebrow">Internal operating system</p><h2>Deep logic.<br /><em>Simple client action.</em></h2><p>This workspace holds the coaching reasoning. Athletes receive only the clear instruction they need at the moment they need it.</p><div><span>Brand creates belief</span><span>Phase creates direction</span><span>Level creates dosage</span><span>Profile creates fit</span></div></article>
              <article className="coach-panel system-flow"><div className="panel-head"><div><p>Profile-first architecture</p><h2>Decision chain</h2></div></div>{[["01","Client fact","What is true now?"],["02","Coach interpretation","Why does it matter?"],["03","Programming response","What changes because of it?"],["04","Review condition","What justifies the next change?"]].map(([n,title,copy]) => <div className="system-step" key={n}><span>{n}</span><div><strong>{title}</strong><p>{copy}</p></div></div>)}</article>
              <article className="coach-panel delivery-panel"><div className="panel-head"><div><p>Client delivery</p><h2>Four-file experience</h2></div></div>{["Start Here","Training Plan","Macros and Nutrition","Workout Logger"].map((file, index) => <div key={file}><span>0{index + 1}</span><strong>{file}</strong><b>Client-facing</b></div>)}</article>
            </section>
          )}
        </div>
      </section>

      {selected && (
        <div className="drawer-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <aside className="person-drawer" role="dialog" aria-modal="true" aria-label={`${selected.full_name} record`}>
            <header><div><span className="person-avatar large">{initials(selected.full_name)}</span><div><p>{selected.kind === "lead" ? "Application record" : "Athlete profile"}</p><h2>{selected.full_name}</h2></div></div><button aria-label="Close record" onClick={() => setSelected(null)}><Icon name="close" /></button></header>
            <div className="drawer-contact"><a href={`mailto:${selected.email}`}>{selected.email}</a><a href={`tel:${selected.whatsapp}`}>{selected.whatsapp}</a><span>{selected.city_country}</span></div>
            <div className="drawer-scroll">
              <section className="drawer-section"><p>Coaching direction</p><h3>{selected.primary_goal || "Goal not recorded"}</h3><blockquote>{selected.goal_detail || "No goal description provided."}</blockquote><div className="drawer-facts"><div><span>Experience</span><strong>{selected.training_age || "Not provided"}</strong></div><div><span>Availability</span><strong>{selected.preferred_frequency || "Not provided"}</strong></div><div><span>Training access</span><strong>{selected.access_type || "Not provided"}</strong></div><div><span>Priority</span><strong>{selected.goal_urgency}/10</strong></div></div></section>
              <section className="drawer-section"><p>Movement and adherence context</p><div className="context-card"><span className="attention-mark amber"><Icon name="alert" /></span><div><strong>Pain / movement note</strong><p>{selected.pain_context || "None reported."}</p></div></div><div className="context-card"><span className="attention-mark neutral"><Icon name="pulse" /></span><div><strong>Consistency barrier</strong><p>{selected.consistency_barrier || "Not provided."}</p></div></div></section>
              <section className="drawer-section"><p>Private coaching decision</p><div className="drawer-form-grid"><label><span>Status</span><select value={selected.status} onChange={(e) => setSelected({ ...selected, status: e.target.value })}>{Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>Record type</span><select value={selected.kind} onChange={(e) => setSelected({ ...selected, kind: e.target.value as "lead" | "client" })}><option value="lead">Lead</option><option value="client">Client</option></select></label><label><span>Ascension phase</span><select value={selected.phase} onChange={(e) => setSelected({ ...selected, phase: e.target.value })}><option>Unassigned</option><option>Taming the Flesh</option><option>Forging the Form</option><option>Ascension</option></select></label><label><span>Training level</span><select value={selected.training_level} onChange={(e) => setSelected({ ...selected, training_level: e.target.value })}><option>To assess</option><option>Beginner</option><option>Intermediate — provisional</option><option>Intermediate</option><option>Advanced</option><option>Beginner — rebuild</option></select></label><label className="wide"><span>Next check-in</span><input type="date" value={selected.next_check_in} onChange={(e) => setSelected({ ...selected, next_check_in: e.target.value })} /></label><label className="wide"><span>Coach note — never client-facing</span><textarea rows={4} value={selected.coach_note} onChange={(e) => setSelected({ ...selected, coach_note: e.target.value })} placeholder="Decision, reason, next review condition…" /></label></div></section>
            </div>
            <footer><button className="drawer-secondary" onClick={() => setSelected(null)}>Cancel</button><button className="coach-primary" onClick={savePerson}>Save record</button></footer>
          </aside>
        </div>
      )}

      {adding && (
        <div className="drawer-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setAdding(false); }}>
          <form className="add-modal" onSubmit={addClient}><header><div><p className="dashboard-eyebrow">Private roster</p><h2>Add an athlete</h2></div><button type="button" aria-label="Close" onClick={() => setAdding(false)}><Icon name="close" /></button></header><div className="add-form-grid"><label><span>Full name *</span><input name="fullName" required /></label><label><span>Email *</span><input name="email" type="email" required /></label><label><span>WhatsApp</span><input name="whatsapp" /></label><label><span>Main goal</span><input name="primaryGoal" /></label><label><span>Ascension phase</span><select name="phase"><option>Unassigned</option><option>Taming the Flesh</option><option>Forging the Form</option><option>Ascension</option></select></label><label><span>Training level</span><select name="trainingLevel"><option>To assess</option><option>Beginner</option><option>Intermediate — provisional</option><option>Intermediate</option><option>Advanced</option></select></label><label><span>Next check-in</span><input name="nextCheckIn" type="date" /></label><label className="wide"><span>Private coach note</span><textarea name="coachNote" rows={4} /></label></div><footer><button type="button" className="drawer-secondary" onClick={() => setAdding(false)}>Cancel</button><button className="coach-primary" type="submit">Add to roster</button></footer></form>
        </div>
      )}

      {addingProgramme && (
        <div className="drawer-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setAddingProgramme(false); }}>
          <form className="add-modal" onSubmit={addProgramme}>
            <header><div><p className="dashboard-eyebrow">Athlete delivery</p><h2>Create a programme</h2></div><button type="button" aria-label="Close" onClick={() => setAddingProgramme(false)}><Icon name="close" /></button></header>
            <div className="add-form-grid">
              <label className="wide"><span>Athlete *</span><select name="personId" required defaultValue=""><option value="" disabled>Select an active athlete</option>{active.filter((person) => !person.sample).map((person) => <option value={person.id} key={person.id}>{person.full_name}</option>)}</select></label>
              <label className="wide"><span>Programme title *</span><input name="title" required placeholder="e.g. Ascension Block 01" /></label>
              <label><span>Phase</span><select name="phase"><option>Taming the Flesh</option><option>Forging the Form</option><option>Ascension</option></select></label>
              <label><span>Days per week</span><input name="daysPerWeek" type="number" min="1" max="7" defaultValue="4" /></label>
              <label><span>Starts on</span><input name="startsOn" type="date" /></label>
              <label><span>Ends on</span><input name="endsOn" type="date" /></label>
              <label><span>Status</span><select name="status"><option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option></select></label>
              <label className="wide"><span>Athlete instructions</span><textarea name="athleteInstructions" rows={4} placeholder="Only the clear guidance the athlete should see." /></label>
              <label className="wide"><span>Private coach instructions</span><textarea name="coachInstructions" rows={4} placeholder="Internal progression logic, tolerances and review conditions." /></label>
            </div>
            <footer><button type="button" className="drawer-secondary" onClick={() => setAddingProgramme(false)}>Cancel</button><button className="coach-primary" type="submit">Create programme</button></footer>
          </form>
        </div>
      )}
    </main>
  );
}
