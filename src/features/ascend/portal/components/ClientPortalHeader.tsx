"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClientPortalData } from "../data/useClientPortalData";
import type { PortalScope } from "../data/types";

interface ClientPortalHeaderProps {
  scope?: PortalScope;
}

export default function ClientPortalHeader({ scope = "live" }: ClientPortalHeaderProps) {
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
    <header className="client-portal-header">
      {/* Brand & Client Phase */}
      <div className="client-header-left">
        <Link href={`${basePath}/dashboard`} className="client-header-brand">
          ASCEND
        </Link>
        <span className="client-header-phase">
          {data.client.phaseName || "Phase 1"}
        </span>
      </div>

      {/* Center Nav (Desktop / Tablet) */}
      <nav className="client-portal-top-nav" aria-label="Client Portal Navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`client-nav-link ${item.active ? "active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right: Coach Status & Account Access */}
      <div className="client-header-right">
        <Link
          href={`${basePath}/progress`}
          className="header-coach-pill"
          title="Direct message Coach Sahmi"
        >
          <span className="coach-dot" />
          <span>Coach Sahmi</span>
          <span className="priority-msg-badge">2 msgs</span>
        </Link>

        <Link href="/account" className="client-account-link" title="Account Overview">
          <div className="client-avatar">
            {initials || "AS"}
          </div>
          <span className="client-header-username">
            {data.client.fullName}
          </span>
        </Link>
      </div>
    </header>
  );
}
