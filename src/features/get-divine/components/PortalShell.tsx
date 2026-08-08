import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import type { PortalScope } from "../data/types";

export type PortalSection = "dashboard" | "plan" | "nutrition" | "logger" | "progress";

const navItems: Array<{ id: PortalSection; label: string; path: string; glyph: string }> = [
  { id: "dashboard", label: "Today", path: "dashboard", glyph: "◇" },
  { id: "plan", label: "My plan", path: "plan", glyph: "▤" },
  { id: "nutrition", label: "Nutrition", path: "nutrition", glyph: "◉" },
  { id: "logger", label: "Workout", path: "workout-logger", glyph: "↔" },
  { id: "progress", label: "Progress", path: "progress", glyph: "↗" },
];

export default function PortalShell({ scope, current, clientName, phase, children }: { scope: PortalScope; current: PortalSection; clientName: string; phase: string; children: ReactNode }) {
  const basePath = scope === "demo" ? "/demo" : "/client";
  const initials = clientName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("");
  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <Link className="portal-wordmark" to="/" aria-label="Get Divine home"><span>GET</span> DIVINE</Link>
        <div className="portal-phase-mark"><span>Current phase</span><strong>{phase}</strong></div>
        <nav aria-label="Client portal">
          {navItems.map((item) => <NavLink key={item.id} className={current === item.id ? "active" : ""} to={`${basePath}/${item.path}`}><i aria-hidden="true">{item.glyph}</i><span>{item.label}</span></NavLink>)}
        </nav>
        <div className="portal-sidebar-quote"><span>◆</span><p>Train with intention.<br />Progress with structure.</p></div>
        <Link className="portal-signout" to="/login">{scope === "demo" ? "Exit demo" : "Sign out"} <span>↗</span></Link>
      </aside>
      <div className="portal-frame">
        <header className="portal-topbar">
          <div className="portal-mobile-brand"><Link to="/">GET <span>DIVINE</span></Link>{scope === "demo" && <b>Demo</b>}</div>
          <p>{current === "dashboard" ? "Your command centre" : navItems.find((item) => item.id === current)?.label}</p>
          <div className="portal-profile">{scope === "demo" && <b>Demo mode</b>}<div><span>{initials || "GD"}</span><p><strong>{clientName}</strong><small>Client</small></p></div></div>
        </header>
        <main className="portal-content">{children}</main>
      </div>
      <nav className="portal-bottom-nav" aria-label="Client portal mobile navigation">
        {navItems.map((item) => <NavLink key={item.id} className={current === item.id ? "active" : ""} to={`${basePath}/${item.path}`}><i aria-hidden="true">{item.glyph}</i><span>{item.label}</span></NavLink>)}
      </nav>
    </div>
  );
}
