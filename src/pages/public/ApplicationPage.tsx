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

  function validateStep() {
    if (step === 0) {
      if (!form.fullName.trim()) return "Please enter your full name.";
      if (!form.email.trim() || !form.email.includes("@")) return "Please enter a valid email address.";
      if (!form.whatsapp.trim()) return "Please enter your WhatsApp / phone number.";
      if (!form.cityCountry.trim()) return "Please enter your city and country.";
      if (!form.age || Number(form.age) < 16) return "Please enter your age (minimum 16).";
    }
    if (step === 1) {
      if (!form.primaryGoal) return "Please select your primary training goal.";
      if (!form.goalDetail.trim()) return "Please describe what you want to change in your own words.";
    }
    if (step === 2) {
      if (!form.trainingAge) return "Please select how long you have been training.";
      if (!form.daysAvailable.length) return "Please select at least one day you can train.";
      if (!form.preferredFrequency) return "Please select your preferred weekly training frequency.";
      if (!form.sessionLength) return "Please select how long you can train per session.";
      if (!form.accessType) return "Please select your training location / facility type.";
      if (!form.equipment.length) return "Please select the equipment available to you.";
    }
    if (step === 3) {
      if (!form.consistencyBarrier.trim()) return "Please share what usually makes consistency difficult for you.";
      if (!form.trackingReadiness.length) return "Please select at least one item you are ready to track.";
    }
    return null;
  }

  function nextStep() {
    const error = validateStep();
    if (error) {
      setMessage(error);
      return;
    }
    setMessage("");
    setStep((current) => Math.min(steps.length - 1, current + 1));
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

      <div className="shell application-layout">
        {/* Form Card First (Left on desktop, Top/First on mobile) */}
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
            {/* Main Form Card Title directly above Step progress */}
            <div className="form-card-main-header">
              <p className="eyebrow">Coaching intake assessment</p>
            </div>

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
                      <span>WhatsApp / Phone *</span>
                      <input value={form.whatsapp} onChange={(e) => setField("whatsapp", e.target.value)} autoComplete="tel" placeholder="+234..." />
                    </label>
                    <label className="field">
                      <span>City & Country *</span>
                      <input value={form.cityCountry} onChange={(e) => setField("cityCountry", e.target.value)} placeholder="Lagos, Nigeria" />
                    </label>
                    <label className="field">
                      <span>Age *</span>
                      <input type="number" min="16" max="90" value={form.age} onChange={(e) => setField("age", e.target.value)} placeholder="e.g. 28" />
                    </label>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="form-step">
                  <div className="form-step-heading">
                    <p className="eyebrow">02 / What you want to change</p>
                    <h2>Choose your primary direction.</h2>
                    <p>Be clear about what matters most for your next training block.</p>
                  </div>
                  <fieldset className="choice-fieldset">
                    <legend>Primary goal *</legend>
                    <div className="choice-grid">
                      {goals.map((item) => (
                        <label key={item} className={form.primaryGoal === item ? "choice active" : "choice"}>
                          <input type="radio" name="primaryGoal" value={item} checked={form.primaryGoal === item} onChange={() => setField("primaryGoal", item)} />
                          <span>{item}</span>
                          <b>◆</b>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="field field-textarea">
                    <span>What specific outcome do you want in the next 12–16 weeks? *</span>
                    <textarea value={form.goalDetail} onChange={(e) => setField("goalDetail", e.target.value)} placeholder="Describe what progress looks like for you..." />
                  </label>
                  <label className="field range-field">
                    <span>How urgent is this change to you right now? <b>{form.goalUrgency} / 10</b></span>
                    <input type="range" min="1" max="10" value={form.goalUrgency} onChange={(e) => setField("goalUrgency", Number(e.target.value))} />
                    <small><i>1 = Low priority</i><i>10 = Absolute priority</i></small>
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="form-step">
                  <div className="form-step-heading">
                    <p className="eyebrow">03 / Your training reality</p>
                    <h2>Where will the work happen?</h2>
                    <p>We build your plan around your actual gym access and schedule.</p>
                  </div>
                  <fieldset className="choice-fieldset">
                    <legend>Training experience *</legend>
                    <div className="choice-grid">
                      {["Never trained properly", "Under 1 year", "1–2 years", "2+ years", "Returning after a break"].map((item) => (
                        <label key={item} className={form.trainingAge === item ? "choice active" : "choice"}>
                          <input type="radio" name="trainingAge" value={item} checked={form.trainingAge === item} onChange={() => setField("trainingAge", item)} />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="choice-fieldset">
                    <legend>Which days can you consistently train? *</legend>
                    <div className="day-grid">
                      {days.map((item) => (
                        <label key={item} className={form.daysAvailable.includes(item) ? "day active" : "day"}>
                          <input type="checkbox" checked={form.daysAvailable.includes(item)} onChange={() => toggleList("daysAvailable", item)} />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="form-grid">
                    <label className="field">
                      <span>Preferred frequency *</span>
                      <select value={form.preferredFrequency} onChange={(e) => setField("preferredFrequency", e.target.value)}>
                        <option value="">Select frequency</option>
                        <option value="3 days per week">3 days per week</option>
                        <option value="4 days per week">4 days per week</option>
                        <option value="5 days per week">5 days per week</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Session length *</span>
                      <select value={form.sessionLength} onChange={(e) => setField("sessionLength", e.target.value)}>
                        <option value="">Select duration</option>
                        <option value="45 minutes">45 minutes</option>
                        <option value="60 minutes">60 minutes</option>
                        <option value="75+ minutes">75+ minutes</option>
                      </select>
                    </label>
                    <label className="field field-wide">
                      <span>Training location *</span>
                      <select value={form.accessType} onChange={(e) => setField("accessType", e.target.value)}>
                        <option value="">Select facility type</option>
                        <option value="Commercial gym">Commercial gym (full equipment)</option>
                        <option value="Private / Apartment gym">Private / Apartment gym</option>
                        <option value="Home gym">Home gym setup</option>
                        <option value="Mixed access">Mixed access (gym + home)</option>
                      </select>
                    </label>
                  </div>

                  <fieldset className="choice-fieldset" style={{ marginTop: "24px" }}>
                    <legend>Available equipment *</legend>
                    <div className="choice-grid compact-grid">
                      {equipmentOptions.map((item) => (
                        <label key={item} className={form.equipment.includes(item) ? "choice active" : "choice"}>
                          <input type="checkbox" checked={form.equipment.includes(item)} onChange={() => toggleList("equipment", item)} />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}

              {step === 3 && (
                <div className="form-step">
                  <div className="form-step-heading">
                    <p className="eyebrow">04 / Readiness & feedback</p>
                    <h2>What gets in your way?</h2>
                    <p>Honesty here allows your coach to build a plan that survives real life.</p>
                  </div>

                  <label className="field field-textarea">
                    <span>What usually breaks your consistency or stops you from sticking to a plan? *</span>
                    <textarea value={form.consistencyBarrier} onChange={(e) => setField("consistencyBarrier", e.target.value)} placeholder="Work schedule, travel, lack of structure, nutrition slipping..." />
                  </label>

                  <label className="field field-textarea">
                    <span>Any active pain, joint discomfort or old injury we should know about?</span>
                    <textarea value={form.painContext} onChange={(e) => setField("painContext", e.target.value)} placeholder="e.g. Right shoulder discomfort with deep benching, previous lower back strain..." />
                  </label>

                  <fieldset className="choice-fieldset" style={{ marginTop: "24px" }}>
                    <legend>What are you ready to track consistently? *</legend>
                    <div className="choice-grid">
                      {trackingOptions.map((item) => (
                        <label key={item} className={form.trackingReadiness.includes(item) ? "choice active" : "choice"}>
                          <input type="checkbox" checked={form.trackingReadiness.includes(item)} onChange={() => toggleList("trackingReadiness", item)} />
                          <span>{item}</span>
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

        {/* Intro Card Second (Right on desktop, Bottom/Stacked on mobile) */}
        <div className="application-intro">
          <p className="eyebrow">The Ascension Program</p>
          <h1>Start with clarity.<br /><em>Ascend with purpose.</em></h1>
          <p>
            This assessment helps us understand your body, training history, schedule and starting point. Take your time and answer honestly.
          </p>
        </div>
      </div>
    </main>
  );
}
