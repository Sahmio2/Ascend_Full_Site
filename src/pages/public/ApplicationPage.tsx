import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type FormState = {
  fullName: string;
  email: string;
  whatsapp: string;
  cityCountry: string;
  age: string;
  primaryGoal: string;
  goalDetail: string;
  goalUrgency: number;
  trainingAge: string;
  daysAvailable: string[];
  preferredFrequency: string;
  sessionLength: string;
  accessType: string;
  equipment: string[];
  painContext: string;
  consistencyBarrier: string;
  trackingReadiness: string[];
  consent: boolean;
  website: string;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  whatsapp: "",
  cityCountry: "",
  age: "",
  primaryGoal: "",
  goalDetail: "",
  goalUrgency: 7,
  trainingAge: "",
  daysAvailable: [],
  preferredFrequency: "",
  sessionLength: "",
  accessType: "",
  equipment: [],
  painContext: "",
  consistencyBarrier: "",
  trackingReadiness: [],
  consent: false,
  website: "",
};

const steps = ["Identity", "Direction", "Training reality", "Readiness"];
const goals = [
  "Fat loss",
  "Body recomposition",
  "Lean muscle gain",
  "Glute / lower-body growth",
  "Strength",
  "General fitness",
  "Beginner confidence",
  "Aesthetic physique development",
  "Movement rebuild",
  "Post-break comeback",
];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const equipmentOptions = [
  "Barbell",
  "Dumbbells",
  "Smith machine",
  "Cable machine",
  "Leg press",
  "Leg extension / curl",
  "Chest / row machines",
  "Pull-up / pulldown",
  "Hip thrust setup",
  "Cardio equipment",
  "Bands / kettlebells",
  "Home basics only",
];
const trackingOptions = [
  "Workout loads and reps",
  "Weekly bodyweight average",
  "Progress photos",
  "Protein target days",
  "Sleep and recovery",
  "Pain or soreness",
];

export default function ApplicationPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleList(key: "daysAvailable" | "equipment" | "trackingReadiness", value: string) {
    setForm((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });
  }

  function validateCurrentStep() {
    if (step === 0 && (!form.fullName || !form.email || !form.whatsapp)) {
      setMessage("Please complete your name, email and WhatsApp number.");
      return false;
    }
    if (step === 1 && (!form.primaryGoal || !form.goalDetail || !form.trainingAge)) {
      setMessage("Choose your main goal and tell us a little about your starting point.");
      return false;
    }
    if (step === 2 && (!form.daysAvailable.length || !form.preferredFrequency || !form.accessType)) {
      setMessage("Add your realistic availability, preferred frequency and training access.");
      return false;
    }
    setMessage("");
    return true;
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(steps.length - 1, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.consent) {
      setMessage("Please confirm the application declaration before submitting.");
      return;
    }
    setStatus("sending");
    setMessage("");
    setTimeout(() => {
      setStatus("success");
      setMessage("GD-APP-" + Math.floor(100000 + Math.random() * 900000));
    }, 600);
  }

  return (
    <main className="public-site">
      <header className="public-nav shell">
        <Link className="wordmark" to="/"><span>GET</span> DIVINE</Link>
        <Link className="quiet-link" to="/">Return to home</Link>
      </header>

      <div className="shell application-shell">
        <div className="application-intro">
          <p className="eyebrow">Coaching intake assessment</p>
          <h1>Start with clarity.<br /><em>Ascend with purpose.</em></h1>
          <p>
            This assessment helps us understand your body, training history, schedule and starting point. Take your time and answer honestly.
          </p>
        </div>

        {status === "success" ? (
          <section className="application-form-card application-success" aria-live="polite">
            <div className="success-mark">◆</div>
            <p className="eyebrow">Application received</p>
            <h2>Your first step<br /><em>is complete.</em></h2>
            <p>
              Thank you, {form.fullName.split(" ")[0]}. Your application is now in review. If there is a strong fit and coaching space is available, you will be contacted using the details you provided.
            </p>
            <div className="reference-card">
              <span>Application reference</span>
              <strong>{message}</strong>
            </div>
            <Link className="button button-gold" to="/">Return to Get Divine</Link>
          </section>
        ) : (
          <section className="application-form-card">
            <div className="form-progress-head">
              <div>
                <span>Step {step + 1} of {steps.length}</span>
                <strong>{steps[step]}</strong>
              </div>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="form-progress-track"><span style={{ width: `${progress}%` }} /></div>

            <form onSubmit={submit}>
              {step === 0 && (
                <div className="form-step">
                  <div className="form-step-heading">
                    <p className="eyebrow">01 / Start with who you are</p>
                    <h2>Tell us where to find you.</h2>
                    <p>Use details you check regularly so no next-step message is missed.</p>
                  </div>
                  <div className="form-grid">
                    <label className="field field-wide">
                      <span>Full name *</span>
                      <input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} autoComplete="name" placeholder="Your full name" />
                    </label>
                    <label className="field">
                      <span>Email *</span>
                      <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} autoComplete="email" placeholder="you@example.com" />
                    </label>
                    <label className="field">
                      <span>WhatsApp *</span>
                      <input value={form.whatsapp} onChange={(e) => setField("whatsapp", e.target.value)} autoComplete="tel" placeholder="Include country code" />
                    </label>
                    <label className="field">
                      <span>City / country</span>
                      <input value={form.cityCountry} onChange={(e) => setField("cityCountry", e.target.value)} placeholder="Lagos, Nigeria" />
                    </label>
                    <label className="field">
                      <span>Age</span>
                      <input type="number" min="16" max="90" value={form.age} onChange={(e) => setField("age", e.target.value)} placeholder="Age" />
                    </label>
                    <label className="honeypot" aria-hidden="true">
                      Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setField("website", e.target.value)} />
                    </label>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="form-step">
                  <div className="form-step-heading">
                    <p className="eyebrow">02 / Name the direction</p>
                    <h2>What are you ready to change?</h2>
                    <p>Choose the single result that matters most right now.</p>
                  </div>
                  <fieldset className="choice-fieldset">
                    <legend>Main goal *</legend>
                    <div className="choice-grid goal-grid">
                      {goals.map((goal) => (
                        <label className={form.primaryGoal === goal ? "choice active" : "choice"} key={goal}>
                          <input type="radio" name="goal" value={goal} checked={form.primaryGoal === goal} onChange={() => setField("primaryGoal", goal)} />
                          <span>{goal}</span><b>◆</b>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="field field-textarea">
                    <span>Describe the result you want *</span>
                    <textarea value={form.goalDetail} onChange={(e) => setField("goalDetail", e.target.value)} rows={4} placeholder="In your own words, what would make this coaching season feel successful?" />
                  </label>
                  <div className="form-grid">
                    <label className="field">
                      <span>Training experience *</span>
                      <select value={form.trainingAge} onChange={(e) => setField("trainingAge", e.target.value)}>
                        <option value="">Choose one</option>
                        <option>Never trained properly</option><option>0–3 months</option><option>3–12 months</option><option>1–2 years</option><option>2+ years</option><option>Returning after a break</option>
                      </select>
                    </label>
                    <label className="field range-field">
                      <span>How important is this now? <b>{form.goalUrgency}/10</b></span>
                      <input type="range" min="1" max="10" value={form.goalUrgency} onChange={(e) => setField("goalUrgency", Number(e.target.value))} />
                      <small><i>Not urgent</i><i>Very urgent</i></small>
                    </label>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="form-step">
                  <div className="form-step-heading">
                    <p className="eyebrow">03 / Build from real life</p>
                    <h2>What can you actually repeat?</h2>
                    <p>Honest availability creates a better plan than ideal availability.</p>
                  </div>
                  <fieldset className="choice-fieldset">
                    <legend>Days available *</legend>
                    <div className="day-grid">
                      {days.map((day) => (
                        <label className={form.daysAvailable.includes(day) ? "day active" : "day"} key={day}>
                          <input type="checkbox" checked={form.daysAvailable.includes(day)} onChange={() => toggleList("daysAvailable", day)} />
                          <span>{day}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="form-grid">
                    <label className="field">
                      <span>Preferred frequency *</span>
                      <select value={form.preferredFrequency} onChange={(e) => setField("preferredFrequency", e.target.value)}>
                        <option value="">Choose one</option><option>2 days per week</option><option>3 days per week</option><option>4 days per week</option><option>5 days per week</option><option>Coach decides</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Maximum session length</span>
                      <select value={form.sessionLength} onChange={(e) => setField("sessionLength", e.target.value)}>
                        <option value="">Choose one</option><option>30 minutes</option><option>45 minutes</option><option>60 minutes</option><option>75+ minutes</option>
                      </select>
                    </label>
                    <label className="field field-wide">
                      <span>Where will you train? *</span>
                      <select value={form.accessType} onChange={(e) => setField("accessType", e.target.value)}>
                        <option value="">Choose one</option><option>Commercial gym</option><option>Home gym</option><option>School gym</option><option>Hotel / travel gym</option><option>Outdoor only</option><option>Mixed access</option>
                      </select>
                    </label>
                  </div>
                  <fieldset className="choice-fieldset">
                    <legend>Equipment you can use</legend>
                    <div className="choice-grid compact-grid">
                      {equipmentOptions.map((item) => (
                        <label className={form.equipment.includes(item) ? "choice active" : "choice"} key={item}>
                          <input type="checkbox" checked={form.equipment.includes(item)} onChange={() => toggleList("equipment", item)} />
                          <span>{item}</span><b>+</b>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}

              {step === 3 && (
                <div className="form-step">
                  <div className="form-step-heading">
                    <p className="eyebrow">04 / Readiness and care</p>
                    <h2>What must coaching respect?</h2>
                    <p>You do not need to sound perfect. Clear information helps us coach responsibly.</p>
                  </div>
                  <label className="field field-textarea">
                    <span>What usually breaks your consistency?</span>
                    <textarea value={form.consistencyBarrier} onChange={(e) => setField("consistencyBarrier", e.target.value)} rows={3} placeholder="Schedule, confidence, pain, motivation, food access, travel…" />
                  </label>
                  <label className="field field-textarea">
                    <span>Any current pain, old injury or movement concern?</span>
                    <textarea value={form.painContext} onChange={(e) => setField("painContext", e.target.value)} rows={3} placeholder="Briefly describe where, what triggers it and whether you have professional guidance." />
                    <small>This does not diagnose pain or replace qualified medical assessment.</small>
                  </label>
                  <fieldset className="choice-fieldset">
                    <legend>What can you track weekly?</legend>
                    <div className="choice-grid compact-grid">
                      {trackingOptions.map((item) => (
                        <label className={form.trackingReadiness.includes(item) ? "choice active" : "choice"} key={item}>
                          <input type="checkbox" checked={form.trackingReadiness.includes(item)} onChange={() => toggleList("trackingReadiness", item)} />
                          <span>{item}</span><b>+</b>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className={form.consent ? "consent-box active" : "consent-box"}>
                    <input type="checkbox" checked={form.consent} onChange={(e) => setField("consent", e.target.checked)} />
                    <span className="consent-check">✓</span>
                    <span>
                      <strong>I confirm that my answers are honest to the best of my knowledge.</strong>
                      I understand this application is not medical diagnosis or emergency support, and submitting does not guarantee admission.
                    </span>
                  </label>
                </div>
              )}

              {message && <p className={status === "error" ? "form-message error" : "form-message"} role="alert">{message}</p>}
              <div className="form-actions">
                {step > 0 ? <button type="button" className="back-button" onClick={() => { setStep(step - 1); setMessage(""); }}>← Back</button> : <span />}
                {step < steps.length - 1 ? (
                  <button key={`continue-${step}`} type="button" className="button button-gold" onClick={(event) => { event.preventDefault(); nextStep(); }}>Continue <span>→</span></button>
                ) : (
                  <button key="submit-application" type="submit" className="button button-gold" disabled={status === "sending"}>{status === "sending" ? "Submitting…" : "Submit application"} <span>→</span></button>
                )}
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
