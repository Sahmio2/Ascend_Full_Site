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
    <header
      className="client-portal-header"
      style={{
        height: "56px",
        background: "rgba(18, 17, 16, 0.95)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid #2e2b26",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 640px) {
          .client-portal-top-nav { display: none !important; }
          .client-header-username { display: none !important; }
        }
      `,
        }}
      />
      {/* Brand & Client Phase */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <Link
          href={`${basePath}/dashboard`}
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "18px",
            letterSpacing: "0.18em",
            fontWeight: 600,
            color: "#f5f0e9",
            textDecoration: "none",
          }}
        >
          ASCEND
        </Link>
        <span
          style={{
            fontSize: "11px",
            letterSpacing: "0.06em",
            color: "#d6b87a",
            background: "rgba(214, 184, 122, 0.12)",
            border: "1px solid rgba(214, 184, 122, 0.3)",
            padding: "2px 8px",
            borderRadius: "12px",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {data.client.phaseName || "Phase 1"}
        </span>
      </div>

      {/* Center Nav (Desktop / Tablet) */}
      <nav
        className="client-portal-top-nav"
        style={{
          display: "flex",
          gap: "4px",
          background: "#121110",
          padding: "3px",
          borderRadius: "10px",
          border: "1px solid #343029",
        }}
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              padding: "6px 14px",
              borderRadius: "7px",
              fontSize: "12px",
              fontWeight: item.active ? 700 : 500,
              textDecoration: "none",
              color: item.active ? "#151412" : "#b8b2a5",
              background: item.active ? "#d6b87a" : "transparent",
              transition: "all 0.15s ease",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right User & Account Access */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link
          href="/account"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            color: "#f5f0e9",
            fontSize: "12px",
          }}
          title="Account Overview"
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#2a2723",
              border: "1px solid #453e33",
              color: "#d6b87a",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              fontSize: "11px",
            }}
          >
            {initials || "AS"}
          </div>
          <span className="client-header-username" style={{ fontWeight: 600 }}>
            {data.client.fullName}
          </span>
        </Link>
      </div>
    </header>
  );
}
