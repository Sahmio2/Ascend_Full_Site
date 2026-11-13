"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ScreenLink {
  label: string;
  href: string;
  icon: string;
  category: "portal" | "access" | "coach";
}

const SCREENS: ScreenLink[] = [
  // Client Portal (New Approved Suite)
  { label: "Today Dashboard", href: "/client/dashboard", icon: "⚡", category: "portal" },
  { label: "Workouts & Focus Mode", href: "/client/workout-logger", icon: "🏋️", category: "portal" },
  { label: "Nigerian Nutrition & Meals", href: "/client/nutrition", icon: "🍲", category: "portal" },
  { label: "Progress & Milestones", href: "/client/progress", icon: "📈", category: "portal" },

  // Account & Access
  { label: "Account Overview", href: "/account", icon: "👤", category: "access" },
  { label: "Membership & Billing", href: "/account/membership", icon: "💳", category: "access" },
  { label: "9-Stage Assessment", href: "/apply", icon: "📝", category: "access" },
  { label: "Waitlist", href: "/waitlist", icon: "⏳", category: "access" },
  { label: "Register (Sign Up)", href: "/register", icon: "✦", category: "access" },
  { label: "Login (OTP)", href: "/login", icon: "🔐", category: "access" },

  // Coach Space
  { label: "Modern Coach Studio", href: "/coach-portal", icon: "👔", category: "coach" },
  { label: "Coach Login", href: "/coach/login", icon: "🔑", category: "coach" },
];

export default function DevScreenNavigator() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"portal" | "access" | "coach">("portal");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = sessionStorage.getItem("ascend_dev_nav_open");
      if (saved === "true") setIsOpen(true);
    } catch {}
  }, []);

  // Update active category based on current pathname
  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/client") || pathname.startsWith("/demo")) {
      setActiveCategory("portal");
    } else if (pathname.startsWith("/coach")) {
      setActiveCategory("coach");
    } else {
      setActiveCategory("access");
    }
  }, [pathname]);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    try {
      sessionStorage.setItem("ascend_dev_nav_open", String(next));
    } catch {}
  };

  if (!isMounted || process.env.NODE_ENV === "production") {
    return null;
  }

  const filteredScreens = SCREENS.filter((s) => s.category === activeCategory);

  return (
    <aside
      aria-label="Development Screen Navigator"
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        zIndex: 9999,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={toggleOpen}
          style={{
            background: "linear-gradient(135deg, #18221d, #0d1210)",
            color: "#dfbf77",
            border: "1px solid rgba(223, 191, 119, 0.45)",
            borderRadius: "999px",
            padding: "9px 16px",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            cursor: "pointer",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.55), 0 0 14px rgba(223, 191, 119, 0.25)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease",
          }}
          title="Open Dev Screen Navigator"
        >
          <span style={{ fontSize: "14px" }}>⚡</span>
          <span>DEV INSPECT SCREENS</span>
          <span
            style={{
              background: "rgba(223, 191, 119, 0.2)",
              color: "#f7f5ed",
              padding: "2px 6px",
              borderRadius: "10px",
              fontSize: "10px",
            }}
          >
            {SCREENS.length}
          </span>
        </button>
      ) : (
        <div
          style={{
            background: "rgba(14, 19, 16, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(223, 191, 119, 0.35)",
            borderRadius: "16px",
            padding: "16px 20px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7), 0 0 25px rgba(223, 191, 119, 0.15)",
            color: "#f7f5ed",
            width: "min(92vw, 480px)",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              paddingBottom: "10px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#dfbf77", fontSize: "15px" }}>⚡</span>
              <strong style={{ fontSize: "13px", letterSpacing: "0.08em", color: "#f7f5ed" }}>
                DEV SCREEN INSPECTOR
              </strong>
            </div>
            <button
              type="button"
              onClick={toggleOpen}
              style={{
                background: "transparent",
                border: "none",
                color: "#8c9489",
                fontSize: "18px",
                lineHeight: 1,
                cursor: "pointer",
                padding: "4px",
              }}
              aria-label="Close Navigator"
            >
              ✕
            </button>
          </div>

          {/* Category Tabs */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "12px",
              background: "rgba(0, 0, 0, 0.3)",
              padding: "4px",
              borderRadius: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveCategory("portal")}
              style={{
                flex: 1,
                padding: "6px 8px",
                fontSize: "11.5px",
                fontWeight: activeCategory === "portal" ? 700 : 500,
                color: activeCategory === "portal" ? "#0c100e" : "#b0b8ac",
                background: activeCategory === "portal" ? "#dfbf77" : "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              🍲 Portal & Meals
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("access")}
              style={{
                flex: 1,
                padding: "6px 8px",
                fontSize: "11.5px",
                fontWeight: activeCategory === "access" ? 700 : 500,
                color: activeCategory === "access" ? "#0c100e" : "#b0b8ac",
                background: activeCategory === "access" ? "#dfbf77" : "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              👤 Account & Intake
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("coach")}
              style={{
                flex: 1,
                padding: "6px 8px",
                fontSize: "11.5px",
                fontWeight: activeCategory === "coach" ? 700 : 500,
                color: activeCategory === "coach" ? "#0c100e" : "#b0b8ac",
                background: activeCategory === "coach" ? "#dfbf77" : "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              👔 Coach
            </button>
          </div>

          {/* Links Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "7px",
              maxHeight: "260px",
              overflowY: "auto",
              paddingRight: "2px",
            }}
          >
            {filteredScreens.map((screen) => {
              const isActive = pathname === screen.href;
              return (
                <Link
                  key={screen.href}
                  href={screen.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 11px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: isActive ? 700 : 550,
                    textDecoration: "none",
                    color: isActive ? "#ffffff" : "#d8ddd5",
                    background: isActive
                      ? "rgba(223, 191, 119, 0.22)"
                      : "rgba(255, 255, 255, 0.04)",
                    border: `1px solid ${
                      isActive ? "rgba(223, 191, 119, 0.5)" : "rgba(255, 255, 255, 0.08)"
                    }`,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      color: isActive ? "#dfbf77" : "#8c9489",
                      fontSize: "12px",
                      lineHeight: 1,
                    }}
                  >
                    {screen.icon}
                  </span>
                  <span
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {screen.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div
            style={{
              marginTop: "12px",
              paddingTop: "8px",
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "10.5px",
              color: "#7e867b",
            }}
          >
            <span>Current: <strong style={{ color: "#b8c0b5" }}>{pathname}</strong></span>
            <span>Local Dev Mode</span>
          </div>
        </div>
      )}
    </aside>
  );
}
