"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "../components/ThemeToggle";
import { RegistrationModal } from "../components/RegistrationModal";
import "@/styles/ascend-homepage-v2.css";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openRegistration = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <div id="top" className="ascend-homepage-v2">
      {/* NAV */}
      <header
        className="site-header"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "25px 32px",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          className="nav-brand"
          href="#home"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "20px",
            letterSpacing: ".22em",
            color: "#7A5F1E",
          }}
          aria-label="ASCEND home"
        >
          ASCEND{" "}
          <span
            style={{
              display: "block",
              letterSpacing: ".16em",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "8px",
              fontWeight: 500,
              color: "#716B5E",
              textAlign: "center",
            }}
          >
            BY SAHMI EL
          </span>
        </Link>
        <nav
          className="nav-items"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 24px",
            alignItems: "center",
            fontSize: "13px",
            letterSpacing: ".02em",
          }}
          aria-label="Primary"
        >
          <a href="#method">The Method</a>
          <a href="#portal">The Portal</a>
          <a href="#how">How It Works</a>
          <a href="#coach">Your Coach</a>
          <Link href="/login" style={{ color: "#7A5F1E", fontWeight: 600 }}>
            Client Login
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="nav-cta"
            onClick={openRegistration}
            aria-label="Register for Coaching"
          >
            Register for Coaching <span aria-hidden="true">↗</span>
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section id="home" className="hero-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px" }}>
        <div
          className="hero"
          style={{
            border: "1px solid #C9A24B",
            padding: "82px 40px 74px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "18px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="micro" style={{ fontFamily: "'Cinzel', serif", fontSize: "12px", letterSpacing: "0.3em", color: "#7A5F1E" }}>
            THE PATH TO DIVINITY
          </div>
          <h1
            className="hero-wordmark"
            style={{
              margin: "2px 0 0",
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 500,
              fontSize: "clamp(86px, 17vw, 190px)",
              lineHeight: ".78",
              letterSpacing: ".055em",
              color: "#0B0B0A",
            }}
          >
            ASCEND
          </h1>
          <div className="hero-line" aria-hidden="true" style={{ height: "1px", width: "70px", background: "#C9A24B", margin: "10px auto 6px" }}></div>
          <h2
            style={{
              margin: 0,
              maxWidth: "850px",
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 500,
              fontSize: "clamp(38px, 5vw, 66px)",
              lineHeight: 1.02,
              color: "#171715",
              letterSpacing: "-.018em",
            }}
          >
            Personalised online coaching<br className="desktop-only" /> for gym beginners.
          </h2>
          <p style={{ margin: "2px 0 0", maxWidth: "620px", fontSize: "17px", lineHeight: 1.7, color: "#47443E" }}>
            Build a stronger physique with a training plan that fits your week and nutrition guidance built around the Nigerian meals you already eat.
          </p>
          <div className="hero-actions" style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
            <button
              type="button"
              className="btn btn-dark"
              onClick={openRegistration}
            >
              REGISTER FOR COACHING <span aria-hidden="true">↗</span>
            </button>
            <a className="btn btn-outline" href="#method">
              EXPLORE THE METHOD <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="hero-cap" style={{ margin: "21px 0 0", fontSize: "12px", letterSpacing: ".045em", color: "#6B675C" }}>
            Founding coaching capacity: 10 active clients. Availability is checked during registration.
          </p>
          <div className="method-lockup" style={{ marginTop: "21px", fontFamily: "'Cinzel', serif", fontSize: "11px", letterSpacing: ".19em", color: "#7A5F1E" }}>
            TAME THE FLESH <span style={{ color: "#B8A98E" }}>·</span> FORGE THE FORM <span style={{ color: "#B8A98E" }}>·</span> ASCEND
          </div>
        </div>
      </section>

      {/* PROMISE / WHY */}
      <section id="why" style={{ maxWidth: "1200px", margin: "0 auto", padding: "115px 32px 0" }}>
        <div className="intro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }}>
          <div>
            <div className="kicker">THE ASCEND SYSTEM</div>
            <h2 className="section-title" style={{ maxWidth: "630px" }}>
              Structure turns effort<br /><em>into form.</em>
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", paddingTop: "29px" }}>
            <p style={{ margin: 0, fontSize: "20px", lineHeight: 1.55, color: "#24221D" }}>
              Build a visibly stronger, better-shaped physique with a personalised training and nutrition system you can consistently follow.
            </p>
            <p style={{ margin: 0, color: "#514D44" }}>
              ASCEND gives complete gym beginners and inconsistent early-stage lifters a personalised system for building a stronger, better-shaped physique. Structured training, practical Nigerian nutrition and progress tracking replace guesswork with a clear direction.
            </p>
            <p style={{ margin: 0, color: "#6B675C", fontSize: "14px" }}>
              Personalised online physique coaching with structured training, practical Nigerian nutrition, progress tracking and two personal reviews each billing month.
            </p>
          </div>
        </div>
      </section>

      {/* METHOD */}
      <section id="method" style={{ maxWidth: "1200px", margin: "0 auto", padding: "124px 32px 0" }}>
        <div style={{ maxWidth: "680px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="kicker">01 / THE METHOD</div>
          <h2 className="section-title">Three phases. One direction.</h2>
          <p style={{ margin: 0, color: "#514D44" }}>
            Your plan evolves with the evidence—not with an arbitrary 30-day transformation promise. Each phase builds on what came before.
          </p>
        </div>
        <div className="phase-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "24px", marginTop: "47px" }}>
          <article className="phase" style={{ borderTop: "2px solid #C9A24B", paddingTop: "23px" }}>
            <div className="phase-index">PHASE I / FOUNDATION</div>
            <h3 className="phase-name">Tame the Flesh</h3>
            <p className="phase-lead">Build control through consistent habits—not punishment.</p>
            <p className="phase-copy">Learn the movements, establish your baseline and make showing up part of your routine.</p>
          </article>
          <article className="phase" style={{ borderTop: "2px solid #C9A24B", paddingTop: "23px" }}>
            <div className="phase-index">PHASE II / PROGRESSION</div>
            <h3 className="phase-name">Forge the Form</h3>
            <p className="phase-lead">Turn consistency into measurable progress.</p>
            <p className="phase-copy">Develop strength, technique and nutritional consistency through structured, reviewed adjustments.</p>
          </article>
          <article className="phase" style={{ borderTop: "2px solid #C9A24B", paddingTop: "23px" }}>
            <div className="phase-index">PHASE III / MASTERY</div>
            <h3 className="phase-name">Ascend</h3>
            <p className="phase-lead">Build confidence in your own process.</p>
            <p className="phase-copy">Refine your physique and develop more independence as your coaching and progress support it.</p>
          </article>
        </div>
      </section>

      {/* PORTAL (Inverted contrast band) */}
      <section id="portal" style={{ marginTop: "126px", background: "#0B0B0A", color: "#F4EFE3" }}>
        <div
          className="portal-grid"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "104px 32px",
            display: "grid",
            gridTemplateColumns: "1fr .9fr",
            gap: "72px",
            alignItems: "center",
          }}
        >
          <div>
            <div className="kicker light-kicker">02 / INSIDE ASCEND</div>
            <h2 className="section-title section-title-light" style={{ marginTop: "18px" }}>
              Your next action.<br /><em>Always clear.</em>
            </h2>
            <p style={{ maxWidth: "510px", margin: "0 0 25px", color: "#CFC8B8", lineHeight: 1.75 }}>
              One private mobile-friendly coaching portal. Your current training plan, Nigerian meal guidance, progress and messages with Sahmi stay together—without competing documents.
            </p>
            <div className="feature-list">
              <div className="feature">
                <span className="feature-num">01</span>
                <div>
                  <strong>Today</strong>
                  <span>Your one most useful action, your coach-approved direction and a calm daily snapshot.</span>
                </div>
              </div>
              <div className="feature">
                <span className="feature-num">02</span>
                <div>
                  <strong>Workouts</strong>
                  <span>Exercise animations, set logging, previous performance, automatic rest and approved swaps.</span>
                </div>
              </div>
              <div className="feature">
                <span className="feature-num">03</span>
                <div>
                  <strong>Nutrition</strong>
                  <span>Nigerian meals and approved swaps in grams, with logging detail suited to your programme.</span>
                </div>
              </div>
              <div className="feature">
                <span className="feature-num">04</span>
                <div>
                  <strong>Progress</strong>
                  <span>See the evidence and understand what changes at your scheduled coaching reviews.</span>
                </div>
              </div>
            </div>
          </div>
          <div className="portal-preview" aria-label="Illustrative private portal preview">
            <div className="device-top">
              <span>ASCEND</span>
              <span>◌ &nbsp; ◯</span>
            </div>
            <div className="device-sub">YOUR DAILY DIRECTION</div>
            <div className="mock-rule"></div>
            <div className="mock-day">MONDAY · EXAMPLE TRAINING DAY</div>
            <div className="mock-card">
              <div className="mock-kicker">YOUR NEXT ACTION</div>
              <div className="mock-title">Full Body A</div>
              <div className="mock-detail">55 min &nbsp;·&nbsp; Gym</div>
              <div className="mock-button">
                Start Workout <span aria-hidden="true">↗</span>
              </div>
            </div>
            <div className="mock-direction">
              <strong>Today&apos;s direction</strong>
              <p>Keep your repetitions controlled. Focus on consistent technique.</p>
            </div>
            <div className="mock-stats">
              <div>
                <span>Training</span>
                <strong>1 / 3</strong>
                <small>Sessions recorded this week</small>
              </div>
              <div>
                <span>Nutrition</span>
                <strong>1 / 3</strong>
                <small>Meal updates recorded today</small>
              </div>
            </div>
            <div className="mock-footer">Today &nbsp; &nbsp; Workouts &nbsp; &nbsp; Nutrition &nbsp; &nbsp; Progress</div>
            <div className="mock-caption">Illustrative client information · not a live account</div>
          </div>
        </div>
      </section>

      {/* NUTRITION */}
      <section id="nutrition" style={{ maxWidth: "1200px", margin: "0 auto", padding: "124px 32px 0" }}>
        <div className="nutrition-grid" style={{ display: "grid", gridTemplateColumns: ".95fr 1.05fr", gap: "80px", alignItems: "start" }}>
          <div>
            <div className="kicker">03 / BUILT FOR YOUR REAL LIFE</div>
            <h2 className="section-title">
              Nigerian food.<br /><em>Actual structure.</em>
            </h2>
          </div>
          <div style={{ paddingTop: "30px" }}>
            <p style={{ fontSize: "19px", color: "#292720", lineHeight: 1.6, margin: "0 0 17px" }}>
              Your meal plan should work with the food you eat—not ask you to live on unfamiliar recipes.
            </p>
            <p style={{ margin: 0, color: "#514D44", lineHeight: 1.8 }}>
              ASCEND builds practical meal plans around familiar Nigerian foods, availability and realistic budgets. Every prescribed portion and approved swap is specified in grams, with its preparation state clearly labelled.
            </p>
            <div className="nutrition-tags">
              <span>Practical protein sources</span>
              <span>Approved food swaps</span>
              <span>Gram-based portions</span>
              <span>Flexible tracking detail</span>
            </div>
            <p className="tiny-note">
              Simple, Structured and Precision are coaching methods—not paid tiers. Sahmi confirms the appropriate tracking approach for each client.
            </p>
          </div>
        </div>
      </section>

      {/* HOW COACHING WORKS */}
      <section id="how" style={{ maxWidth: "1200px", margin: "0 auto", padding: "124px 32px 0" }}>
        <div className="kicker">04 / HOW IT WORKS</div>
        <h2 className="section-title" style={{ maxWidth: "760px" }}>
          Start with clarity.<br /><em>Keep moving with support.</em>
        </h2>
        <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "20px", marginTop: "45px" }}>
          <div className="step">
            <span className="step-index">01</span>
            <h3>Register once</h3>
            <p>Answer ten short, goal-first questions. Registration is not a separate coaching application.</p>
          </div>
          <div className="step">
            <span className="step-index">02</span>
            <h3>Choose your membership</h3>
            <p>If the practical safety, readiness and capacity checks allow it, you&apos;ll see the recurring offer and payment details.</p>
          </div>
          <div className="step">
            <span className="step-index">03</span>
            <h3>Build your foundation</h3>
            <p>Complete your private nine-stage assessment. Sahmi reviews and delivers your plan within five business days of a complete submission.</p>
          </div>
          <div className="step">
            <span className="step-index">04</span>
            <h3>Follow. Log. Review.</h3>
            <p>Use the portal day by day. Sahmi personally reviews your progress twice per billing month and adjusts the plan when needed.</p>
          </div>
        </div>
        <div className="how-note">
          Coaching is limited to 10 active founding clients, with up to three new onboardings each week. If capacity is full, a separate opt-in waitlist may be offered. Safety and guardian requirements can delay coaching activation.
        </div>
      </section>

      {/* COACH */}
      <section
        id="coach"
        className="coach-grid"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "124px 32px 0",
          display: "grid",
          gridTemplateColumns: ".8fr 1.2fr",
          gap: "70px",
          alignItems: "center",
        }}
      >
        <div className="coach-visual" aria-label="Sahmi El founder portrait area">
          <div className="coach-monogram">SE</div>
          <div className="coach-visual-meta">
            FOUNDER &amp; COACH <span>·</span> ASCEND BY SAHMI EL
          </div>
        </div>
        <div>
          <div className="kicker">05 / YOUR COACH</div>
          <h2 className="section-title">Sahmi El</h2>
          <p style={{ margin: "0 0 14px", color: "#26231E", fontSize: "20px", lineHeight: 1.6 }}>
            One coach. A deliberately small client group. A programme built around your actual life.
          </p>
          <p style={{ margin: 0, color: "#514D44", lineHeight: 1.8 }}>
            Sahmi reviews your assessment, personally approves your training and nutrition programme, and uses the evidence you log to decide what to maintain, adjust or progress. AI may help organise information, but it does not independently approve your plan.
          </p>
          <div className="coach-meta">
            <span>2 personal reviews / billing month</span>
            <span>10 founding-client capacity</span>
          </div>
        </div>
      </section>

      {/* EVIDENCE */}
      <section id="evidence" style={{ maxWidth: "1200px", margin: "0 auto", padding: "124px 32px 0" }}>
        <div className="kicker">06 / THE EVIDENCE</div>
        <h2 className="section-title" style={{ maxWidth: "770px" }}>
          Progress you can see.<br /><em>Decisions you can understand.</em>
        </h2>
        <p style={{ maxWidth: "640px", color: "#514D44", margin: "0 0 38px" }}>
          We won&apos;t fill this space with made-up transformations or anonymous testimonials. ASCEND is designed to make progress traceable—from completed training to coaching decisions based on your real records.
        </p>
        <div className="evidence-grid">
          <div>
            <span>01 / TRAINING</span>
            <strong>Log what happened</strong>
            <p>Weights, repetitions, completed sessions and your own notes.</p>
          </div>
          <div>
            <span>02 / NUTRITION</span>
            <strong>Record your reality</strong>
            <p>What you actually ate, including changes and meals you didn&apos;t log.</p>
          </div>
          <div>
            <span>03 / REVIEWS</span>
            <strong>See what changes</strong>
            <p>Sahmi&apos;s dated decisions—and the reasons behind them.</p>
          </div>
        </div>
      </section>

      {/* REGISTER / FINAL CTA */}
      <section id="register" style={{ maxWidth: "1200px", margin: "0 auto", padding: "124px 32px 0" }}>
        <div
          className="final-cta"
          style={{
            border: "1px solid #C9A24B",
            padding: "64px 48px",
            background: "#FBF9F3",
            display: "grid",
            gridTemplateColumns: "1.3fr .7fr",
            gap: "44px",
            alignItems: "center",
          }}
        >
          <div>
            <div className="kicker">07 / BEGIN WITH STRUCTURE</div>
            <h2 className="section-title" style={{ marginBottom: "18px" }}>
              Ready to build<br /><em>with direction?</em>
            </h2>
            <p style={{ margin: 0, maxWidth: "630px", color: "#514D44" }}>
              Register for coaching with a short, one-time questionnaire. Eligible adults can review membership details immediately afterwards; if a place isn&apos;t available, you can choose whether to join the waitlist.
            </p>
          </div>
          <div className="final-cta-action">
            <button
              type="button"
              className="btn btn-dark"
              onClick={openRegistration}
            >
              REGISTER FOR COACHING <span aria-hidden="true">↗</span>
            </button>
            <p style={{ margin: "14px 0 0", fontSize: "12px", color: "#716D63" }}>
              Age and safety safeguards apply. No payment is taken during the registration questions.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="footer"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "37px 32px 56px",
          display: "flex",
          gap: "18px",
          justifyContent: "space-between",
          flexWrap: "wrap",
          alignItems: "center",
          fontSize: "13px",
          color: "#706A5F",
        }}
      >
        <div style={{ fontFamily: "'Cinzel', serif", letterSpacing: ".17em", color: "#7A5F1E" }}>
          ASCEND BY SAHMI EL
        </div>
        <div>Personalised online physique coaching · Nigeria-first</div>
        <div>Training guidance is not medical care.</div>
      </footer>

      {/* INTERACTIVE REGISTRATION MODAL */}
      <RegistrationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
