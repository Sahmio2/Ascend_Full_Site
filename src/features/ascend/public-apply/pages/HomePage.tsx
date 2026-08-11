import { Link } from "react-router-dom";
import { SpecularLink } from "../components/SpecularButton";

const Arrow = ({ diagonal = false }: { diagonal?: boolean }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path
      d={diagonal ? "M7 17 17 7M8 7h9v9" : "M5 12h14m-5-5 5 5-5 5"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const phases = [
  {
    roman: "I",
    name: "Taming the Flesh",
    verb: "Tame",
    copy: "Build command over inconsistency. Establish the habits, movement quality and self-awareness that make progress repeatable.",
  },
  {
    roman: "II",
    name: "Forging the Form",
    verb: "Forge",
    copy: "Turn disciplined action into visible structure through purposeful training, practical nutrition and measurable progression.",
  },
  {
    roman: "III",
    name: "Ascension",
    verb: "Ascend",
    copy: "Refine the details. Train with precision, manage fatigue intelligently and build the autonomy to sustain what you earn.",
  },
];

export default function Home() {
  return (
    <main className="public-site">
      <header className="public-nav shell">
        <Link className="wordmark" to="/" aria-label="ASCEND home">
          <span>ASCEND</span>
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#method">The method</a>
          <a href="#coaching">Coaching</a>
          <a href="#questions">Questions</a>
        </nav>
        <div className="nav-actions">
          <Link className="quiet-link" to="/login">
            Client Login
          </Link>
          <SpecularLink
            className="ascend-specular-cta button-small"
            href="/apply"
            size="sm"
            radius={2}
            tint="#c7a45b"
            tintOpacity={1}
            textColor="#11100d"
            lineColor="#dfbf77"
            baseColor="#80632f"
            intensity={1.25}
            thickness={1.1}
            proximity={220}
          >
            Apply for Coaching <Arrow diagonal />
          </SpecularLink>
        </div>
      </header>

      <section className="hero shell">
        <div className="hero-grid-lines" aria-hidden="true" />
        <div className="hero-eyebrow eyebrow">
          <span>Private physique coaching</span>
          <span>Structured for the individual</span>
        </div>
        <div className="hero-title-wrap">
          <h1>ASCEND</h1>
          <p className="hero-subtitle">The Path to Divinity</p>
          <p className="hero-kicker">Tame the flesh. Forge the form. Ascend.</p>
          <p className="hero-promise">
            A structured guide to an aesthetic, powerful physique.
          </p>
          <p className="hero-founder">by Sahmi El</p>
        </div>
        <div className="hero-bottom">
          <div className="hero-copy">
            <p className="hero-join-title">Ready to join ASCEND?</p>
            <p>
              Coaching is selective and built around your goals, experience
              and circumstances.
            </p>
            <div className="hero-ctas">
              <Link className="button button-ivory" to="/apply">
                Begin Your Assessment <Arrow />
              </Link>
              <a className="text-link" href="#method">
                Explore the Method <span>↓</span>
              </a>
            </div>
          </div>
          <div className="admission-card">
            <span className="pulse" />
            <div>
              <strong>Applications are open</strong>
              <p>Coaching places are intentionally limited.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="principles-strip" aria-label="Program principles">
        <div className="shell principles-grid">
          <p><span>01</span> Individual by design</p>
          <p><span>02</span> Progress you can prove</p>
          <p><span>03</span> Built for longevity</p>
          <p><span>04</span> Coached with intention</p>
        </div>
      </section>

      <section className="method-section shell" id="method">
        <div className="section-heading">
          <p className="eyebrow">The transformation architecture</p>
          <h2>Not another plan.<br /><em>A standard to rise into.</em></h2>
          <p>
            The Path to Divinity meets you where you are, then gives your
            next season a clear mission. You do not graduate because the work
            looks harder. You advance because your body and behaviour are ready.
          </p>
        </div>
        <div className="phase-grid">
          {phases.map((phase) => (
            <article className="phase-card" key={phase.roman}>
              <div className="phase-number">{phase.roman}</div>
              <div>
                <p className="eyebrow">Phase {phase.roman}</p>
                <h3>{phase.name}</h3>
                <p>{phase.copy}</p>
              </div>
              <span className="phase-verb">{phase.verb}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="coaching-section" id="coaching">
        <div className="shell coaching-grid">
          <div className="coaching-manifesto">
            <p className="eyebrow">The ASCEND standard</p>
            <p className="manifesto-quote">
              “The best plan is the one that fits <em>your</em> body, your life
              and the person you are becoming.”
            </p>
            <div className="signature-rule">
              <span />
              <p>ASCEND by Sahmi El</p>
            </div>
          </div>
          <div className="coaching-details">
            <p className="index-label">What coaching holds</p>
            {[
              ["01", "A plan with a reason", "Training shaped around your goal, experience, movement comfort, available equipment and schedule."],
              ["02", "Nutrition made usable", "Clear priorities and flexible meal structure you can apply without turning food into punishment."],
              ["03", "Progress under review", "Your performance, recovery and consistency guide the adjustments—not random weekly changes."],
              ["04", "A coach in the loop", "Regular check-ins, honest feedback and a clear place to report what is working or needs attention."],
            ].map(([number, title, copy]) => (
              <article className="detail-row" key={number}>
                <span>{number}</span>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fit-section shell">
        <div className="fit-card fit-card-dark">
          <p className="eyebrow">This may be for you if</p>
          <h2>You want more than motivation.</h2>
          <ul>
            <li>You are ready to train with structure instead of guessing.</li>
            <li>You value an aesthetic physique without sacrificing your joints.</li>
            <li>You want guidance that respects your schedule and real-life constraints.</li>
            <li>You are willing to log, communicate and take ownership of the work.</li>
          </ul>
        </div>
        <div className="fit-card fit-card-light">
          <p className="eyebrow">How admission works</p>
          <ol>
            <li><span>01</span><div><strong>Assess</strong><p>Complete the coaching assessment.</p></div></li>
            <li><span>02</span><div><strong>Review</strong><p>Sahmi El reviews your goals, readiness and coaching fit.</p></div></li>
            <li><span>03</span><div><strong>Accept</strong><p>Successful applicants receive onboarding and account setup.</p></div></li>
            <li><span>04</span><div><strong>Ascend</strong><p>Enter the client portal and begin your personalised phase.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="faq-section shell" id="questions">
        <div className="faq-heading">
          <p className="eyebrow">Before you apply</p>
          <h2>Questions,<br /><em>answered clearly.</em></h2>
          <Link className="button button-outline" to="/apply">
            Begin Your Assessment <Arrow />
          </Link>
        </div>
        <div className="faq-list">
          <details open>
            <summary>Is this only for advanced lifters?<span>−</span></summary>
            <p>No. The program is adapted to the experience, confidence and capacity you bring. Beginners receive clear, repeatable structure; experienced athletes receive the detail their progress requires.</p>
          </details>
          <details>
            <summary>Do I need a fully equipped gym?<span>+</span></summary>
            <p>No. Your equipment access is reviewed before your plan is built, so unavailable machines are not treated as requirements.</p>
          </details>
          <details>
            <summary>Can I apply if I have pain or an old injury?<span>+</span></summary>
            <p>You can apply and disclose it honestly. Coaching does not diagnose or replace medical care; movement choices can be adapted only within safe professional boundaries.</p>
          </details>
          <details>
            <summary>Is a meal plan included?<span>+</span></summary>
            <p>You receive practical nutrition direction, priorities and flexible meal structure appropriate to your goal. Clinical dietetics and medical nutrition needs require a qualified professional.</p>
          </details>
        </div>
      </section>

      <section className="closing-cta">
        <div className="shell closing-inner">
          <p className="eyebrow">Your next season can be different</p>
          <h2>Tame what is disordered.<br />Forge what is possible.<br /><em>Ascend through mastery.</em></h2>
          <SpecularLink
            className="ascend-specular-cta"
            href="/apply"
            radius={2}
            tint="#c7a45b"
            tintOpacity={1}
            textColor="#11100d"
            lineColor="#dfbf77"
            baseColor="#80632f"
            intensity={1.25}
            thickness={1.1}
            proximity={240}
          >
            Apply for coaching <Arrow diagonal />
          </SpecularLink>
        </div>
      </section>

      <footer className="public-footer shell">
        <div className="footer-brand">
          <Link className="wordmark" to="/"><span>ASCEND</span></Link>
          <p>The Path to Divinity</p>
        </div>
        <div className="footer-links">
          <a href="#method">The method</a>
          <a href="#coaching">Coaching</a>
          <Link to="/apply">Apply for Coaching</Link>
          <Link to="/login">Client Login</Link>
        </div>
        <p className="footer-meta">© 2026 ASCEND by Sahmi El</p>
      </footer>
    </main>
  );
}
