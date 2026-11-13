"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let initial: "light" | "dark" = "light";
    try {
      const stored = localStorage.getItem("ascend_public_theme");
      if (stored === "dark") {
        initial = "dark";
      }
    } catch {}
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", initial === "dark" ? "#0B0B0A" : "#F4EFE3");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("ascend_public_theme", next);
    } catch {}
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", next === "dark" ? "#0B0B0A" : "#F4EFE3");
    }
  };

  const isDark = mounted && theme === "dark";
  const title = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      id="theme-toggle"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={title}
      title={title}
      aria-pressed={isDark}
    >
      <svg
        className="theme-svg theme-moon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ display: isDark ? "none" : "block" }}
      >
        <path d="M20.985 12.486A9 9 0 0 1 11.5 3.015a9 9 0 1 0 9.485 9.471Z" />
      </svg>
      <svg
        className="theme-svg theme-sun"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ display: isDark ? "block" : "none" }}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </svg>
      <span id="theme-toggle-label">{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
