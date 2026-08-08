import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { GetDivineIcon, GetDivineIconName } from "../components/GetDivineIcons";

export type PortalSection = "dashboard" | "plan" | "nutrition" | "logger" | "progress";

const navItems: { id: PortalSection; label: string; path: string; icon: GetDivineIconName }[] = [
  { id: "dashboard", label: "Today", path: "", icon: "today" },
  { id: "plan", label: "My plan", path: "/plan", icon: "plan" },
  { id: "nutrition", label: "Nutrition", path: "/nutrition", icon: "nutrition" },
  { id: "logger", label: "Workout", path: "/workout-logger", icon: "workout" },
  { id: "progress", label: "Progress", path: "/progress", icon: "progress" },
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
              <GetDivineIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="portal-sidebar-quote">
          <span>◆</span>
          <p>Train with intention.<br />Progress with structure.</p>
        </div>
        <Link className="portal-signout" to={signOutPath}>{isDemoPath ? "Exit demo" : "Sign out"} <GetDivineIcon name="arrow-up-right" width={14} height={14} /></Link>
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
            <GetDivineIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
