"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PortalScope } from "../data/types";
import { useClientPortalData } from "../data/useClientPortalData";

export default function PortalHeader({ scope = "live" }: { scope?: PortalScope }) {
  const pathname = usePathname();
  const basePath = scope === "demo" ? "/demo" : "/client";
  const data = useClientPortalData(scope);

  const navItems = [
    { label: "Today", href: `${basePath}/dashboard`, active: pathname?.includes("/dashboard") },
    { label: "Workouts", href: `${basePath}/workout-logger`, active: pathname?.includes("/workout-logger") },
    { label: "Nutrition", href: `${basePath}/nutrition`, active: pathname?.includes("/nutrition") },
    { label: "Progress", href: `${basePath}/progress`, active: pathname?.includes("/progress") },
  ];

  const initials = (data.client.fullName || "Client")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <header className="portal-header">
      <div style={{ display: "flex", alignItems: "center" }}>
        <Link href={`${basePath}/dashboard`} className="portal-header-brand">
          ASCEND
        </Link>
        <span className="portal-header-phase">
          {data.client.phaseName || "Phase 1"}
        </span>
      </div>

      <nav className="portal-nav-pills" aria-label="Portal Navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`portal-nav-link ${item.active ? "active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href={`${basePath}/progress`} className="portal-coach-pill" title="Coach Sahmi">
          <span className="portal-coach-dot" />
          <span>Coach Sahmi</span>
        </Link>

        <Link href="/account" title="Account Settings" style={{ textDecoration: "none" }}>
          <div className="portal-avatar">{initials || "AS"}</div>
        </Link>
      </div>
    </header>
  );
}
