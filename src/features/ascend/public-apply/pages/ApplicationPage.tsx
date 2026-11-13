"use client";

import Link from "next/link";
import ApplicationForm from "../apply/ApplicationForm";

export default function ApplyPage() {
  return (
    <main className="application-page">
      <header className="application-header">
        <Link className="wordmark" href="/" aria-label="ASCEND home">
          <span>ASCEND</span>
        </Link>
        <Link className="application-back" href="/">← Return home</Link>
      </header>
      <div className="application-layout">
        <ApplicationForm />
        <aside className="application-intro">
          <div className="application-intro-inner">
            <p className="eyebrow">The Path to Divinity</p>
            <h2>Begin with<br /><em>the truth.</em></h2>
            <p className="application-lede">
              Complete the coaching self-assessment used to shape your
              training phase, exercise choices, nutrition direction, recovery
              rules and tracking system before plan design begins.
            </p>
            <div className="application-privacy">
              <span>◆</span>
              <div>
                <strong>Relevant by design</strong>
                <p>Conditional questions keep body, pain and health context out of view unless it is relevant to your answers.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
