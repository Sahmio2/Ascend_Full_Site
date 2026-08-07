import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

export type PortalSection = "dashboard" | "plan" | "nutrition" | "logger" | "progress";

const navItems: { id: PortalSection; label: string; path: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Today",
    path: "",
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>,
  },
  {
    id: "plan",
    label: "My plan",
    path: "/plan",
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 14h14M8 7h8M8 11h6" /></svg>,
  },
  {
    id: "nutrition",
    label: "Nutrition",
    path: "/nutrition",
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21c4-3 6-7 6-11a6 6 0 0 0-12 0c0 4 2 8 6 11Zm0-14v8M8.5 11.5h7" /></svg>,
  },
  {
    id: "logger",
    label: "Workout",
    path: "/workout-logger",
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4M7 7v10M17 7v10M21 10v4M7 12h10" /></svg>,
  },
  {
    id: "progress",
    label: "Progress",
    path: "/progress",
    icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 17 5-5 4 3 7-9M16 6h4v4" /></svg>,
  },
];

export default function PortalShell({
  clientName = "Amara Okeke",
  signOutPath = "/login",
  demo = false,
  current = "dashboard",
  phase = "Phase II — Forging the Form",
  children,
}: {
  clientName?: string;
  signOutPath?: string;
  demo?: boolean;
  current?: PortalSection;
  phase?: string;
  children?: ReactNode;
}) {
  const location = useLocation();
  const isDemoPath = location.pathname.startsWith("/demo") || demo;
  const basePath = isDemoPath ? "/demo" : "/client";
  const dashboardPath = isDemoPath ? "/demo/dashboard" : "/client/dashboard";
  const initials = clientName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("");

  // Determine current active section from location pathname if not explicitly passed
  let activeSection = current;
  if (location.pathname.includes("/plan")) activeSection = "plan";
  else if (location.pathname.includes("/nutrition")) activeSection = "nutrition";
  else if (location.pathname.includes("/workout-logger") || location.pathname.includes("/workout")) activeSection = "logger";
  else if (location.pathname.includes("/progress")) activeSection = "progress";
  else if (location.pathname.includes("/bmi") || location.pathname.includes("/dashboard")) activeSection = "dashboard";

  function destination(path: string) {
    return path ? `${basePath}${path}` : dashboardPath;
  }

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <Link className="portal-wordmark" to="/" aria-label="Get Divine home"><span>GET</span> DIVINE</Link>
        <div className="portal-phase-mark">
          <span>Current phase</span>
          <strong>{phase || "The Ascension Program"}</strong>
        </div>
        <nav aria-label="Client portal">
          {navItems.map((item) => (
            <Link key={item.id} className={activeSection === item.id ? "active" : ""} to={destination(item.path)}>
              {item.icon}<span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="portal-sidebar-quote">
          <span>◆</span>
          <p>Train with intention.<br />Progress with structure.</p>
        </div>
        <Link className="portal-signout" to={signOutPath}>{isDemoPath ? "Exit demo" : "Sign out"} <span>↗</span></Link>
      </aside>

      <div className="portal-frame">
        <header className="portal-topbar">
          <div className="portal-mobile-brand"><Link to="/">GET <span>DIVINE</span></Link>{isDemoPath && <b>Demo</b>}</div>
          <p>{activeSection === "dashboard" ? "Your command centre" : navItems.find((item) => item.id === activeSection)?.label}</p>
          <div className="portal-profile">
            {isDemoPath && <b>Demo mode</b>}
            <div><span>{initials || "GD"}</span><p><strong>{clientName.replace(" — Demo Athlete", "")}</strong><small>Client</small></p></div>
          </div>
        </header>
        <div className="portal-content">{children}</div>
      </div>

      <nav className="portal-bottom-nav" aria-label="Client portal mobile navigation">
        {navItems.map((item) => (
          <Link key={item.id} className={activeSection === item.id ? "active" : ""} to={destination(item.path)}>
            {item.icon}<span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
