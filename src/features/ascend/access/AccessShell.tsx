"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import "@/styles/ascend-access.css";

interface AccessShellProps {
  children: React.ReactNode;
  title: string;
  description: string;
  crumb?: string;
  artVariant?: "client" | "coach";
  hideSideArt?: boolean;
}

export default function AccessShell({
  children,
  title,
  description,
  crumb = "ACCOUNT ACCESS",
  artVariant = "client",
  hideSideArt = false,
}: AccessShellProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ascend_access_theme");
      if (saved === "dark" || saved === "light") {
        setTheme(saved);
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("ascend_access_theme", next);
    } catch {}
  };

  const isCoach = artVariant === "coach";

  return (
    <div className="ascend-access-scope" data-theme={theme}>
      <header className="ascend-access-nav">
        <Link className="access-brand" href="/" aria-label="ASCEND home">
          <span className="access-mark">A</span>
          <span>
            <span className="access-brand-name">ASCEND</span>
            <span className="access-brand-sub">BY SAHMI EL</span>
          </span>
        </Link>
        <nav className="access-nav-actions" aria-label="Access navigation">
          <Link className="access-navlink" href="/login">
            Client login
          </Link>
          <Link className="access-navlink" href="/coach/login">
            Coach access
          </Link>
          <button
            type="button"
            className="access-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </nav>
      </header>

      {hideSideArt ? (
        children
      ) : (
        <main className="access-layout">
          <section className="access-form-side">
            <div className="access-crumb">{crumb}</div>
            <h1 className="access-headline">{title}</h1>
            <p className="access-desc">{description}</p>
            {children}
          </section>

          <aside
            className={`access-side-art ${isCoach ? "intro-coach" : ""}`}
            aria-label="ASCEND coaching experience"
          >
            <div>
              <div className="access-art-kicker">
                {isCoach ? "PRIVATE WORKSPACE · COACH" : "ASCEND · PERSONALISED COACHING"}
              </div>
              <h2 className="access-art-title">
                {isCoach ? (
                  <>
                    Less admin. More <em>coaching.</em>
                  </>
                ) : (
                  <>
                    Your training.
                    <br />
                    Your nutrition.
                    <br />
                    <em>One direction.</em>
                  </>
                )}
              </h2>
              <p className="access-art-sub">
                {isCoach
                  ? "One focused workspace for reviews, programmes and coaching decisions."
                  : "A clear system to follow, an experienced coach to guide you, and progress you can understand."}
              </p>
            </div>

            <div className="access-art-bottom">
              <strong>{isCoach ? "Built around Sahmi’s decisions" : "How ASCEND works"}</strong>
              <div className="access-art-steps">
                {isCoach ? (
                  <>
                    <div className="access-art-step">
                      <b>01</b>
                      <span>Review</span>
                    </div>
                    <div className="access-art-step">
                      <b>02</b>
                      <span>Decide</span>
                    </div>
                    <div className="access-art-step">
                      <b>03</b>
                      <span>Publish</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="access-art-step">
                      <b>01</b>
                      <span>Register</span>
                    </div>
                    <div className="access-art-step">
                      <b>02</b>
                      <span>Get your plan</span>
                    </div>
                    <div className="access-art-step">
                      <b>03</b>
                      <span>Progress</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </main>
      )}

      <footer className="access-footer">
        <span>© ASCEND by Sahmi El · Account access</span>
        <div className="access-linkrow">
          <Link href="/login">Login</Link>
          <Link href="/auth/recover">Help accessing account</Link>
          <Link href="/coach/login">Coach</Link>
        </div>
      </footer>
    </div>
  );
}
