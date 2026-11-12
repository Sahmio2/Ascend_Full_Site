"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type PortalSection = "dashboard" | "plan" | "nutrition" | "logger" | "progress" | "bmi";
export type PortalScope = "live" | "demo";

const navItems: Array<{ id: PortalSection; label: string; path: string; glyph: string }> = [
  { id: "dashboard", label: "Today", path: "dashboard", glyph: "◇" },
  { id: "plan", label: "My plan", path: "plan", glyph: "▤" },
  { id: "nutrition", label: "Nutrition", path: "nutrition", glyph: "◉" },
  { id: "logger", label: "Workout", path: "workout-logger", glyph: "↔" },
  { id: "progress", label: "Progress", path: "progress", glyph: "↗" },
  { id: "bmi", label: "Calculators", path: "bmi", glyph: "⚖" },
];

export default function PortalShell({
  scope,
  clientName = "Amara Okeke",
  phase = "Phase II — Forging the Form",
  children,
}: {
  scope: PortalScope;
  current?: PortalSection;
  clientName?: string;
  phase?: string;
  children: ReactNode;
}) {
  const pathname = usePathname() || "";
  const basePath = scope === "demo" ? "/demo" : "/client";
  const initials = clientName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  const currentSection: PortalSection = pathname.includes("/plan")
    ? "plan"
    : pathname.includes("/nutrition")
    ? "nutrition"
    : pathname.includes("/workout-logger")
    ? "logger"
    : pathname.includes("/progress")
    ? "progress"
    : pathname.includes("/bmi")
    ? "bmi"
    : "dashboard";

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <Link className="portal-wordmark" href="/" aria-label="Get Divine home">
          <span>GET</span> DIVINE
        </Link>
        <div className="portal-phase-mark">
          <span>Current phase</span>
          <strong>{phase}</strong>
        </div>
        <nav aria-label="Client portal">
          {navItems.map((item) => {
            const itemHref = `${basePath}/${item.path}`;
            const isActive = currentSection === item.id;
            return (
              <Link
                key={item.id}
                className={isActive ? "active" : ""}
                href={itemHref}
              >
                <i aria-hidden="true">{item.glyph}</i>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="portal-sidebar-quote">
          <span>◆</span>
          <p>
            Train with intention.
            <br />
            Progress with structure.
          </p>
        </div>
        <Link className="portal-signout" href="/login">
          {scope === "demo" ? "Exit demo" : "Sign out"} <span>↗</span>
        </Link>
      </aside>

      <div className="portal-frame">
        <header className="portal-topbar">
          <div className="portal-mobile-brand">
            <Link href="/">
              GET <span>DIVINE</span>
            </Link>
            {scope === "demo" && <b>Demo</b>}
          </div>
          <p>
            {currentSection === "dashboard"
              ? "Your command centre"
              : navItems.find((item) => item.id === currentSection)?.label}
          </p>
          <div className="portal-profile">
            {scope === "demo" && <b>Demo mode</b>}
            <div>
              <span>{initials || "GD"}</span>
              <p>
                <strong>{clientName.replace(" — Demo Athlete", "")}</strong>
                <small>Client</small>
              </p>
            </div>
          </div>
        </header>
        <main className="portal-content">{children}</main>
      </div>

      <nav className="portal-bottom-nav" aria-label="Client portal mobile navigation">
        {navItems.map((item) => {
          const itemHref = `${basePath}/${item.path}`;
          const isActive = currentSection === item.id;
          return (
            <Link
              key={item.id}
              className={isActive ? "active" : ""}
              href={itemHref}
            >
              <i aria-hidden="true">{item.glyph}</i>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
