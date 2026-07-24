import type { Metadata } from "next";
import Link from "next/link";
import ApplicationForm from "./ApplicationForm";

export const metadata: Metadata = {
  title: "Apply for Coaching",
  description: "Apply for the Get Divine Ascension Program with Sahmi El.",
};

export default function ApplyPage() {
  return (
    <main className="application-page">
      <header className="application-header">
        <Link className="wordmark" href="/" aria-label="Get Divine home">
          <span>GET</span> DIVINE
        </Link>
        <p>Confidential coaching application</p>
        <Link className="application-back" href="/">← Return home</Link>
      </header>
      <div className="application-layout">
        <ApplicationForm />
        <aside className="application-intro">
          <p className="eyebrow">The Ascension Program</p>
          <h1>Begin with<br /><em>the truth.</em></h1>
          <p className="application-lede">
            Your first application helps us understand your goal, training
            reality and readiness for coaching. It is intentionally concise;
            accepted applicants complete the deeper confidential assessment.
          </p>
          <div className="application-privacy">
            <span>◆</span>
            <div>
              <strong>Private by design</strong>
              <p>Your answers are used only to review your application and shape the next step.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
