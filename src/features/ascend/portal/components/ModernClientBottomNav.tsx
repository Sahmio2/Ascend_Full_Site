"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PortalScope } from "../data/types";

interface ModernClientBottomNavProps {
  scope?: PortalScope;
  active?: "today" | "workouts" | "nutrition" | "progress";
}

export default function ModernClientBottomNav({
  scope = "live",
  active,
}: ModernClientBottomNavProps) {
  const pathname = usePathname();
  const basePath = scope === "demo" ? "/demo" : "/client";

  // Derive active tab from pathname if not explicitly passed
  let currentActive = active;
  if (!currentActive && pathname) {
    if (pathname.includes("/workout-logger")) currentActive = "workouts";
    else if (pathname.includes("/nutrition")) currentActive = "nutrition";
    else if (pathname.includes("/progress")) currentActive = "progress";
    else currentActive = "today";
  }

  const navItems = [
    {
      id: "today" as const,
      label: "Today",
      href: `${basePath}/dashboard`,
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" />
        </svg>
      ),
    },
    {
      id: "workouts" as const,
      label: "Workouts",
      href: `${basePath}/workout-logger`,
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6.5 6.5 11 11M4 9l2-2 3 3-2 2zm11 11 2-2 3 3-2 2zM3 12l2-2M19 14l2-2" />
        </svg>
      ),
    },
    {
      id: "nutrition" as const,
      label: "Nutrition",
      href: `${basePath}/nutrition`,
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 3v6a3 3 0 0 1-3 3h-1V3h-2v9H7a3 3 0 0 1-3-3V3H2v6a5 5 0 0 0 4 4.9V21h2v-7h1v7h2v-7.1A5 5 0 0 0 20 9V3z" />
        </svg>
      ),
    },
    {
      id: "progress" as const,
      label: "Progress",
      href: `${basePath}/progress`,
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19h16v2H2V3h2v16zm4-3 3.5-5 3 4L19 7l1.4 1.4-5.9 7.6-3-4L8 16z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (min-width: 769px) {
          .modern-client-bottom-nav {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .modern-client-bottom-nav {
            position: fixed !important;
            bottom: max(12px, env(safe-area-inset-bottom)) !important;
            left: 12px !important;
            right: 12px !important;
            width: calc(100% - 24px) !important;
            max-width: 440px !important;
            margin: 0 auto !important;
            border-radius: 20px !important;
          }
        }
      `,
        }}
      />
      <nav
        className="modern-client-bottom-nav"
        aria-label="Mobile navigation"
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 50,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          background: "rgba(16, 20, 19, 0.88)",
          backdropFilter: "blur(24px) saturate(190%)",
          WebkitBackdropFilter: "blur(24px) saturate(190%)",
          boxShadow:
            "0 12px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.09)",
          padding: "6px",
          marginTop: "auto",
          width: "100%",
        }}
      >
        {navItems.map((item) => {
          const isCurrent = currentActive === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isCurrent ? "page" : undefined}
              style={{
                border: 0,
                background: isCurrent
                  ? "rgba(199, 164, 91, 0.12)"
                  : "transparent",
                color: isCurrent ? "#dfbf77" : "#8f8a80",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                padding: "8px 2px",
                borderRadius: "14px",
                fontSize: "11px",
                fontWeight: isCurrent ? 700 : 500,
                letterSpacing: "-0.01em",
                minHeight: "52px",
                textDecoration: "none",
                transition:
                  "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                position: "relative",
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {isCurrent && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "3px",
                    width: "12px",
                    height: "2.5px",
                    borderRadius: "2px",
                    background: "#c7a45b",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
