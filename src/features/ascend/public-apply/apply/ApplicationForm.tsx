import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AscendIcon from "../components/AscendIcon";
import SpecularButton from "../components/SpecularButton";
import {
  accessOptions,
  buildSubmissionPayload,
  cardioChoices,
  createInitialState,
  days,
  equipmentOptions,
  goals,
  kneeQuestions,
  makeSafeDraft,
  movementNames,
  nonNegotiableOptions,
  nutritionDirections,
  painAreas,
  redFlagOptions,
  restoreSafeDraft,
  reviewSections,
  safetyStatus,
  shoulderQuestions,
  slug,
  startingStatuses,
  steps,
  structureOptions,
  trackingOptions,
  trainingStyles,
  validateStep,
  type CheckValue,
  type ErrorMap,
  type FormState,
  type MovementName,
  type MovementValue,
  type PainArea,
  type PainValue,
  type SafeDraft,
} from "./assessment-model";
import {
  ChoiceGroup,
  ConditionalPanel,
  ErrorSummary,
  FieldError,
  FieldPair,
  FieldStatus,
  InlineChoice,
  ScaleField,
  StepActions,
  StepProgress,
  TextField,
  UnitField,
} from "./form-primitives";
import { submitAscendApplication } from "../data/applicationAdapter";
import { ascendDraftAdapter } from "../data/draftAdapter";

function formatDraftDate(value: string) {
  try { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
  catch { return "recently"; }
}

export default function ApplicationForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => createInitialState());
  const [errors, setErrors] = useState<ErrorMap>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [safeDraft, setSafeDraft] = useState<SafeDraft | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [started, setStarted] = useState(false);
  const [focusTarget, setFocusTarget] = useState("");
  const [movementNotesOpen, setMovementNotesOpen] = useState<MovementName[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const idempotencyKey = useRef("");
  const progress = useMemo(() => (step / steps.length) * 100, [step]);
  const currentStep = steps[Math.max(0, step - 1)];
  const under14 = Boolean(form.age && Number(form.age) < 14);
  const hasPainDetails = form.anyCurrentPain === "Yes" || form.anyCurrentPain === "Not sure";
  const activePainAreas = painAreas.filter((area) => form.painMap[area].severity && form.painMap[area].severity !== "None");
  const kneeBranch = form.selectedGoals.includes("Knee ability / movement rebuild") || Boolean(form.painMap.Knee.severity && form.painMap.Knee.severity !== "None");
  const shoulderBranch = form.selectedGoals.includes("Shoulder-safe pressing rebuild") || Boolean(form.painMap.Shoulder.severity && form.painMap.Shoulder.severity !== "None");
  const safetyReview = safetyStatus(form) === "review_required";

  useEffect(() => {
    let active = true;
    void ascendDraftAdapter.load().then((draft) => {
      if (active) setSafeDraft(draft);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!started || step < 2 || status === "success") return;
    const savingTimer = window.setTimeout(() => setSaveStatus("saving"), 0);
    const timer = window.setTimeout(() => {
      const draft = makeSafeDraft(form, step);
      void ascendDraftAdapter.save(draft)
        .then(() => {
          setSafeDraft(draft);
          setSaveStatus("saved");
        })
        .catch(() => setSaveStatus("error"));
    }, 700);
    return () => { window.clearTimeout(savingTimer); window.clearTimeout(timer); };
  }, [form, started, status, step]);

  useEffect(() => {
    if (!started) return;
    window.setTimeout(() => {
      const target = focusTarget ? document.getElementById(focusTarget) : headingRef.current;
      target?.focus();
      setFocusTarget("");
    }, 0);
  }, [focusTarget, started, step]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!Object.keys(current).length) return current;
      return {};
    });
  }

  type ListKey = "selectedGoals" | "startingStatus" | "structureNotes" | "daysAvailable" | "accessTypes" | "equipment" | "trainingStyle" | "redFlags" | "cookingAccess" | "nutritionGoalDirection" | "cardioOptions" | "cardioPainIssues" | "trackingReadiness" | "nonNegotiables";
  function toggleList(key: ListKey, value: string, exclusiveValue?: string) {
    setForm((current) => {
      const list = current[key] as string[];
      let next: string[];
      if (value === exclusiveValue) next = list.includes(value) ? [] : [value];
      else {
        const withoutExclusive = exclusiveValue ? list.filter((item) => item !== exclusiveValue) : list;
        next = withoutExclusive.includes(value) ? withoutExclusive.filter((item) => item !== value) : [...withoutExclusive, value];
      }
      if (key === "selectedGoals") {
        const nextPrimary = next.includes(current.primaryGoal) ? current.primaryGoal : "";
        return { ...current, selectedGoals: next, primaryGoal: next.length === 1 ? next[0] : nextPrimary };
      }
      return { ...current, [key]: next } as FormState;
    });
    setErrors({});
  }

  function updateMovement(name: MovementName, field: keyof MovementValue, value: string) {
    setForm((current) => ({ ...current, movementComfort: { ...current.movementComfort, [name]: { ...current.movementComfort[name], [field]: value } } }));
    if (field === "rating" && value === "Painful") {
      setMovementNotesOpen((current) => current.includes(name) ? current : [...current, name]);
    }
    setErrors({});
  }

  function toggleMovementNote(name: MovementName) {
    setMovementNotesOpen((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  }

  function updatePain(area: PainArea, field: keyof PainValue, value: string) {
    setForm((current) => ({ ...current, painMap: { ...current.painMap, [area]: { ...current.painMap[area], [field]: value } } }));
    setErrors({});
  }

  function togglePainArea(area: PainArea) {
    setForm((current) => {
      const active = current.painMap[area].severity && current.painMap[area].severity !== "None";
      return {
        ...current,
        painMap: {
          ...current.painMap,
          [area]: active ? { severity: "None", trigger: "" } : { severity: "Mild", trigger: "" },
        },
      };
    });
    setErrors({});
  }

  function updateCheck(group: "kneeChecks" | "shoulderChecks", question: string, field: keyof CheckValue, value: string) {
    setForm((current) => {
      const currentGroup = current[group] as Record<string, CheckValue>;
      return { ...current, [group]: { ...currentGroup, [question]: { ...currentGroup[question], [field]: value } } } as FormState;
    });
  }

  function goToStep(next: number, returnFocus = "") {
    setErrors({});
    setMessage("");
    setFocusTarget(returnFocus);
    setStep(Math.max(1, Math.min(steps.length, next)));
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function startNew() {
    if (safeDraft && !window.confirm("Start a new assessment and remove the safe draft stored on this device?")) return;
    void ascendDraftAdapter.remove();
    setSafeDraft(null);
    setForm(createInitialState());
    setStarted(true);
    goToStep(1, "full-name");
  }

  function resumeDraft() {
    if (!safeDraft) return;
    setForm(restoreSafeDraft(safeDraft));
    setStarted(true);
    goToStep(safeDraft.currentStep);
  }

  function returnToEntrance() {
    setErrors({});
    setMessage("");
    setStarted(false);
    setStep(0);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    window.setTimeout(() => document.getElementById("application-entrance-heading")?.focus(), 0);
  }

  function focusFirstError(nextErrors: ErrorMap) {
    const firstId = Object.keys(nextErrors)[0];
    window.setTimeout(() => {
      const field = document.getElementById(firstId);
      if (!field) return;
      const target = field.matches("input, textarea, select, button, [tabindex]")
        ? field
        : field.querySelector<HTMLElement>("input, textarea, select, button, [tabindex]") || field;
      target.focus({ preventScroll: true });
      field.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    }, 0);
  }

  function validateAndContinue() {
    const nextErrors = validateStep(step, form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }
    goToStep(step + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateStep(steps.length, form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    setStatus("sending");
    setMessage("");
    try {
      const result = await submitAscendApplication(buildSubmissionPayload(form, idempotencyKey.current));
      await ascendDraftAdapter.remove();
      setSafeDraft(null);
      setStatus("success");
      setMessage(result.reference || "Assessment received");
      window.setTimeout(() => document.getElementById("assessment-success-heading")?.focus(), 0);
    } catch {
      setStatus("error");
      setMessage("We could not send your assessment. Your answers are still available on this page. Try again when your connection is stable.");
      window.setTimeout(() => document.getElementById("submission-error")?.focus(), 0);
    }
  }

  if (status === "success") {
    return (
      <section className="application-form-card application-success" aria-live="polite">
        <div className="success-mark" aria-hidden="true">◆</div>
        <p className="eyebrow">Assessment received</p>
        <h2 id="assessment-success-heading" tabIndex={-1}>Your assessment<br /><em>has been sent.</em></h2>
        <p>Thank you, {form.fullName.split(" ")[0]}. ASCEND will review your answers and use the contact details you provided for next steps.</p>
        {safetyReview && <p className="intake-note">Your application includes information that needs a safety or scope review before hard training is considered.</p>}
        <div className="reference-card"><span>Assessment reference</span><strong>{message}</strong></div>
        <Link className="button button-gold" to="/">Return to ASCEND</Link>
      </section>
    );
  }

  if (!started) {
    return (
      <section className="application-entrance" aria-labelledby="application-entrance-heading">
        <div className="application-entrance-ornament" aria-hidden="true"><span>◆</span></div>
        <div className="application-entrance-copy">
          <p className="eyebrow">Private coaching assessment</p>
          <h1 id="application-entrance-heading" tabIndex={-1}>Before the ascent,<br /><em>begin with truth.</em></h1>
          <p className="application-entrance-lede">Your answers shape the training, nutrition, recovery and safety decisions ahead. Be honest; estimates are enough.</p>
          <div className="application-entrance-disclaimer" role="note" aria-label="Coaching disclaimer">
            <span>Coaching, not diagnosis</span>
            <p>ASCEND supports coaching decisions; it does not replace medical care. Serious or worsening symptoms need qualified attention before hard training.</p>
          </div>
          <SpecularButton
            type="button"
            className="application-entrance-cta"
            onClick={startNew}
            radius={2}
            tint="#c7a45b"
            tintOpacity={1}
            textColor="#15110b"
            lineColor="#dfbf77"
            baseColor="#80632f"
            intensity={1.35}
            shineSize={12}
            shineFade={38}
            thickness={1.2}
            speed={0.24}
            followMouse
            proximity={280}
            autoAnimate
          >
            <span>Begin Your</span>
            <strong>Ascension Journey</strong>
            <AscendIcon name="arrow-up-right" />
          </SpecularButton>
          <p className="application-entrance-privacy">Your answers are used only for application review and coaching decisions. Only low-sensitivity draft choices may be saved on this device.</p>
          {safeDraft && <div className="entrance-resume"><span>A safe draft from {formatDraftDate(safeDraft.updatedAt)} is available.</span><button type="button" onClick={resumeDraft}>Resume instead →</button></div>}
        </div>
        <div className="application-entrance-index" aria-hidden="true"><span>ASCEND</span><b>The Path to Divinity</b></div>
      </section>
    );
  }

  return (
    <section className="application-form-card full-intake-form">
      <StepProgress label={currentStep.label} icon={currentStep.icon} percentage={progress} />

      <form onSubmit={submit} noValidate>
        <ErrorSummary errors={errors} summaryRef={errorSummaryRef} />

        {step === 1 && (
          <div className="form-step">
            <div className="form-step-heading"><p className="eyebrow">Personal context</p><h2 ref={headingRef} tabIndex={-1}>About you</h2><p>Share the essentials ASCEND needs to review your application. Estimates are fine.</p></div>
            <div className="form-grid">
              <TextField id="full-name" label="Full name" value={form.fullName} onChange={(value) => setField("fullName", value)} required error={errors["full-name"]} autoComplete="name" wide />
              <TextField id="age" label="Age in years" value={form.age} onChange={(value) => setField("age", value.replace(/[^0-9]/g, "").slice(0, 3))} required error={errors.age} inputMode="numeric" autoComplete="off" inputWidth="short" wide />
              <FieldPair>
                <TextField id="country" label="Country" value={form.country} onChange={(value) => setField("country", value)} required error={errors.country} autoComplete="country-name" />
                <TextField id="city" label="City" value={form.city} onChange={(value) => setField("city", value)} autoComplete="address-level2" />
              </FieldPair>
              <FieldPair>
                <UnitField id="height" label="Height" value={form.height} onChange={(value) => setField("height", value)} unit="cm" example="165" />
                <UnitField id="current-bodyweight" label="Current bodyweight" value={form.currentBodyweight} onChange={(value) => setField("currentBodyweight", value)} unit="kg" example="70" />
              </FieldPair>
              <TextField id="schedule-context" label="Work, study or caring schedule" value={form.occupationSchedule} onChange={(value) => setField("occupationSchedule", value)} helper="Only include what affects training, meals or recovery." rows={3} wide />
            </div>
            <ChoiceGroup id="preferred-contact" legend="How should ASCEND contact you?" options={["Phone / WhatsApp", "Email"]} value={form.preferredContactMethod} onChange={(value) => setField("preferredContactMethod", value)} required error={errors["preferred-contact"]} compact />
            {form.preferredContactMethod === "Phone / WhatsApp" && <TextField id="whatsapp" label="Phone / WhatsApp" value={form.whatsapp} onChange={(value) => setField("whatsapp", value)} required error={errors.whatsapp} type="tel" inputMode="tel" autoComplete="tel" wide />}
            {form.preferredContactMethod === "Email" && <TextField id="email" label="Email" value={form.email} onChange={(value) => setField("email", value)} required error={errors.email} type="email" inputMode="email" autoComplete="email" wide />}
            <ChoiceGroup id="gender-context" legend="Sex / gender context" options={["Male", "Female", "Prefer not to say", "Other"]} value={form.genderContext} onChange={(value) => setField("genderContext", value)} compact helper="Optional. We ask only because this can change relevant nutrition or recovery questions; no answer is inferred." />
            {form.genderContext === "Other" && <TextField id="gender-other" label="Other context" value={form.genderOther} onChange={(value) => setField("genderOther", value)} />}
            {under14 && <div className="scope-notice guardian-notice" role="note"><strong>Guardian and coach review</strong><p>Because you are under 14, a parent or guardian must be involved before coaching can begin. You may complete this assessment; ASCEND will review the next step with them. Do not enter another person&apos;s details here.</p></div>}
            <label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setField("website", event.target.value)} /></label>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <div className="form-step-heading"><p className="eyebrow">Coaching direction</p><h2 ref={headingRef} tabIndex={-1}>Your goals</h2><p>Choose every result that matters, then identify the priority that should guide the first coaching decisions.</p></div>
            <ChoiceGroup id="selected-goals" legend="Fitness goals" options={goals} value={form.selectedGoals} onChange={(value) => toggleList("selectedGoals", value)} multiple compact required error={errors["selected-goals"]} />
            {form.selectedGoals.includes("Other") && <TextField id="goal-other" label="Other goal" value={form.primaryGoalOther} onChange={(value) => setField("primaryGoalOther", value)} required error={errors["goal-other"]} />}
            {form.selectedGoals.length > 1 && <ChoiceGroup id="primary-goal" legend="Which selected goal should guide your first coaching priorities?" options={form.selectedGoals} value={form.primaryGoal} onChange={(value) => setField("primaryGoal", value)} required error={errors["primary-goal"]} />}
            <TextField id="goal-detail" label="Describe the result you want in plain words" value={form.goalDetail} onChange={(value) => setField("goalDetail", value)} helper="You do not need perfect numbers or a deadline." rows={3} />
            <ScaleField id="goal-priority" label="How high a priority is this goal right now?" value={form.goalUrgency} onChange={(value) => setField("goalUrgency", value)} helper="1 means low priority right now; 10 means your highest current priority." />
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <div className="form-step-heading"><p className="eyebrow">Training context</p><h2 ref={headingRef} tabIndex={-1}>Your starting point</h2><p>This helps the coach match the plan to your experience and confidence—not label what your body can become.</p></div>
            <ChoiceGroup id="starting-status" legend="Current starting status" options={startingStatuses} value={form.startingStatus} onChange={(value) => toggleList("startingStatus", value, "Not sure")} multiple compact helper="Choose any that feel close. This does not define what your body can become." />
            <ChoiceGroup id="measurements-opt-in" legend="Would you like to provide optional measurements?" options={["Yes", "No", "Not comfortable"]} value={form.measurementsOptIn} onChange={(value) => setField("measurementsOptIn", value)} compact helper="Measurements are optional and do not affect eligibility." />
            {form.measurementsOptIn === "Yes" && <ConditionalPanel className="form-grid measurement-grid">
              <UnitField id="weekly-weight" label="Average bodyweight this week" value={form.bodyweightAverage} onChange={(value) => setField("bodyweightAverage", value)} unit="kg" helper={form.currentBodyweight ? `Current entry: ${form.currentBodyweight} kg.` : "An estimate is fine."} />
              <UnitField id="waist" label="Waist at navel" value={form.waistAtNavel} onChange={(value) => setField("waistAtNavel", value)} unit="cm" />
              <UnitField id="hips" label="Hips / glutes" value={form.hipsGlutes} onChange={(value) => setField("hipsGlutes", value)} unit="cm" />
              <UnitField id="chest" label="Chest / bust" value={form.chestBust} onChange={(value) => setField("chestBust", value)} unit="cm" />
              <UnitField id="left-arm" label="Upper arm — left" value={form.upperArmLeft} onChange={(value) => setField("upperArmLeft", value)} unit="cm" />
              <UnitField id="right-arm" label="Upper arm — right" value={form.upperArmRight} onChange={(value) => setField("upperArmRight", value)} unit="cm" />
              <UnitField id="left-thigh" label="Thigh — left" value={form.thighLeft} onChange={(value) => setField("thighLeft", value)} unit="cm" />
              <UnitField id="right-thigh" label="Thigh — right" value={form.thighRight} onChange={(value) => setField("thighRight", value)} unit="cm" />
            </ConditionalPanel>}
            <ChoiceGroup id="progress-photos" legend="Progress photos taken?" options={["Yes", "No", "Not comfortable"]} value={form.progressPhotos} onChange={(value) => setField("progressPhotos", value)} compact helper="No photo upload is requested and choosing No will not block the application." />
            <ChoiceGroup id="structure-notes" legend="Structure and leverage notes" options={structureOptions} value={form.structureNotes} onChange={(value) => toggleList("structureNotes", value)} multiple compact helper="Choose only what you already know. The coach can assess this later." />
            <h3 className="intake-subheading">Training history</h3>
            <ChoiceGroup id="training-age" legend="Training experience" options={["Never trained properly", "0–3 months", "3–12 months", "1–2 years", "2+ years", "Returning after break"]} value={form.trainingAge} onChange={(value) => setField("trainingAge", value)} compact required error={errors["training-age"]} />
            <ChoiceGroup id="current-training" legend="Current weekly training" options={["None", "1–2 days", "3 days", "4 days", "5+ days"]} value={form.currentWeeklyTraining} onChange={(value) => setField("currentWeeklyTraining", value)} compact required error={errors["current-training"]} />
            {form.currentWeeklyTraining !== "None" && form.trainingAge !== "Never trained properly" && <div className="conditional-panel">
              <TextField id="current-split" label="Current split or routine" value={form.currentSplit} onChange={(value) => setField("currentSplit", value)} rows={2} wide />
              <h3 className="intake-subheading">Best lifts or weights you know</h3>
              <div className="lift-grid">{(Object.keys(form.bestLifts) as Array<keyof FormState["bestLifts"]>).map((lift) => <TextField id={`lift-${slug(lift)}`} label={lift} value={form.bestLifts[lift]} onChange={(value) => setForm((current) => ({ ...current, bestLifts: { ...current.bestLifts, [lift]: value } }))} key={lift} inputMode="decimal" />)}</div>
            </div>}
            <div className="form-grid intake-spaced-grid">
              <TextField id="favourite-exercises" label="Exercises you enjoy or feel confident doing" value={form.favoriteExercises} onChange={(value) => setField("favoriteExercises", value)} rows={2} />
              <TextField id="disliked-exercises" label="Exercises you prefer not to do" value={form.dislikedExercises} onChange={(value) => setField("dislikedExercises", value)} rows={2} />
              <TextField id="discomfort-exercises" label="Exercises that cause discomfort" value={form.discomfortExercises} onChange={(value) => setField("discomfortExercises", value)} required error={errors["discomfort-exercises"]} helper="Write None or add a short description." rows={2} wide />
            </div>
            <h3 className="intake-subheading">Confidence</h3>
            <div className="scale-grid"><ScaleField id="gym-confidence" label="Gym confidence" value={form.gymConfidence} onChange={(value) => setField("gymConfidence", value)} /><ScaleField id="form-confidence" label="Form confidence" value={form.formConfidence} onChange={(value) => setField("formConfidence", value)} /><ScaleField id="consistency-confidence" label="Consistency confidence" value={form.consistencyConfidence} onChange={(value) => setField("consistencyConfidence", value)} /></div>
            <TextField id="consistency-barrier" label="What usually makes consistency harder?" value={form.consistencyBarrier} onChange={(value) => setField("consistencyBarrier", value)} helper="Examples: time, confidence, travel, pain, cost or not knowing what to do." rows={3} wide />
          </div>
        )}

        {step === 4 && (
          <div className="form-step">
            <div className="form-step-heading"><p className="eyebrow">Practical fit</p><h2 ref={headingRef} tabIndex={-1}>What your week can support</h2><p>A plan only works when it fits the days, time, places and equipment you can access reliably.</p></div>
            <fieldset className={`choice-fieldset ${errors["days-available"] ? "field-invalid" : ""}`} id="days-available" tabIndex={-1} aria-invalid={errors["days-available"] ? true : undefined}><legend><span>Days available</span><FieldStatus required /></legend><div className="day-grid">{days.map((day) => <label className={form.daysAvailable.includes(day) ? "day active" : "day"} key={day}><input type="checkbox" checked={form.daysAvailable.includes(day)} onChange={() => toggleList("daysAvailable", day)} /><span>{day}</span></label>)}</div>{errors["days-available"] && <p className="field-error">{errors["days-available"]}</p>}</fieldset>
            <ChoiceGroup id="best-time" legend="Best training time" options={["Morning", "Afternoon", "Evening", "Flexible"]} value={form.bestTrainingTime} onChange={(value) => setField("bestTrainingTime", value)} compact />
            <ChoiceGroup id="session-length" legend="Maximum session length" options={["30 min", "45 min", "60 min", "75+ min"]} value={form.sessionLength} onChange={(value) => setField("sessionLength", value)} compact required error={errors["session-length"]} />
            <ChoiceGroup id="preferred-frequency" legend="Preferred frequency" options={["2 days", "3 days", "4 days", "5 days", "Coach decides"]} value={form.preferredFrequency} onChange={(value) => setField("preferredFrequency", value)} compact helper="This is a preference; the final recommendation may differ based on recovery and schedule." />
            <TextField id="travel-issues" label="Travel or schedule issues" value={form.travelScheduleIssues} onChange={(value) => setField("travelScheduleIssues", value)} rows={2} wide />
            <ChoiceGroup id="access-types" legend="Where will you train?" options={accessOptions} value={form.accessTypes} onChange={(value) => toggleList("accessTypes", value)} multiple compact required error={errors["access-types"]} />
            {form.accessTypes.length > 0 && <ConditionalPanel>
              <ChoiceGroup id="equipment" legend="Equipment you can access reliably" options={equipmentOptions} value={form.equipment} onChange={(value) => toggleList("equipment", value, "Not sure")} multiple compact required error={errors.equipment} />
              {form.equipment.includes("Other") && <TextField id="equipment-other" label="Other equipment" value={form.equipmentOther} onChange={(value) => setField("equipmentOther", value)} required error={errors["equipment-other"]} />}
              <TextField id="missing-equipment" label="Missing or unreliable equipment the coach must not require" value={form.missingEquipment} onChange={(value) => setField("missingEquipment", value)} helper="Write None if nothing needs to be excluded." rows={2} wide />
            </ConditionalPanel>}
          </div>
        )}

        {step === 5 && (
          <div className="form-step">
            <div className="form-step-heading"><p className="eyebrow">Movement fit</p><h2 ref={headingRef} tabIndex={-1}>Movement and exercise fit</h2><p>Share what you enjoy, what feels unfamiliar and what should be avoided. Do not test a painful movement just to answer this form.</p></div>
            <ChoiceGroup id="training-style" legend="Training styles you like" options={trainingStyles} value={form.trainingStyle} onChange={(value) => toggleList("trainingStyle", value)} multiple compact />
            <h3 className="intake-subheading">Movement comfort</h3>
            <div className="movement-list">{movementNames.map((name) => {
              const id = `movement-${slug(name)}`;
              const noteOpen = movementNotesOpen.includes(name);
              return <fieldset className={`movement-row ${errors[id] ? "field-invalid" : ""}`} id={id} tabIndex={-1} key={name}><legend>{name}<FieldStatus required /></legend><div className="inline-choice-group">{["Good", "Okay", "Painful", "Never tried"].map((option) => <InlineChoice name={id} option={option} selected={form.movementComfort[name].rating === option} onChange={() => updateMovement(name, "rating", option)} key={option} />)}</div>{form.movementComfort[name].rating && <div className="row-note-disclosure"><button type="button" className="row-note-toggle" aria-expanded={noteOpen} aria-controls={`${id}-note-panel`} onClick={() => toggleMovementNote(name)}>{noteOpen ? "Hide movement note" : form.movementComfort[name].rating === "Painful" ? "Describe the discomfort" : "Add a movement note"}</button>{noteOpen && <div id={`${id}-note-panel`}><TextField id={`${id}-notes`} label={form.movementComfort[name].rating === "Painful" ? "What feels uncomfortable?" : "Movement note"} value={form.movementComfort[name].notes} onChange={(value) => updateMovement(name, "notes", value)} /></div>}</div>}{errors[id] && <FieldError id={`${id}-error`} message={errors[id]} />}</fieldset>;
            })}</div>
            <div className="form-grid intake-spaced-grid"><TextField id="exercises-wanted" label="Exercises you want included if possible" value={form.exercisesWanted} onChange={(value) => setField("exercisesWanted", value)} rows={2} /><TextField id="exercises-excluded" label="Exercises you do not want included" value={form.exercisesAvoided} onChange={(value) => setField("exercisesAvoided", value)} rows={2} /></div>
          </div>
        )}

        {step === 6 && (
          <div className="form-step">
            <div className="form-step-heading"><p className="eyebrow">Safety and scope</p><h2 ref={headingRef} tabIndex={-1}>Pain and safety</h2><p>This helps choose safer ranges, warm-ups and substitutions. It does not diagnose an injury or condition.</p></div>
            <ChoiceGroup id="pain-gateway" legend="Do you have any current pain or discomfort that may affect training?" options={["Yes", "No", "Not sure"]} value={form.anyCurrentPain} onChange={(value) => setField("anyCurrentPain", value)} compact required error={errors["pain-gateway"]} />
            {hasPainDetails && <ConditionalPanel id="pain-details"><p className="why-we-ask"><strong>Why we ask</strong> Choose only areas that affect training. Do not test a painful movement for this form.</p>
              <ChoiceGroup id="pain-areas" legend="Where do you feel pain or discomfort?" options={[...painAreas]} value={activePainAreas} onChange={(value) => togglePainArea(value as PainArea)} multiple compact required error={errors["pain-areas"]} />
              {activePainAreas.length > 0 && <div className="pain-map-list">{activePainAreas.map((area) => {
                const triggerId = `pain-${slug(area)}-trigger`;
                return <fieldset className="pain-map-row" key={area}><legend>{area}</legend><div className="inline-choice-group">{["Mild", "Moderate", "Severe"].map((option) => <InlineChoice name={`pain-${slug(area)}`} option={option} selected={form.painMap[area].severity === option} onChange={() => updatePain(area, "severity", option)} key={option} />)}</div><TextField id={triggerId} label="What triggers it?" value={form.painMap[area].trigger} onChange={(value) => updatePain(area, "trigger", value)} required error={errors[triggerId]} /></fieldset>;
              })}</div>}
              {activePainAreas.length > 0 && <>
                <ChoiceGroup id="pain-duration" legend="How long has this been present?" options={["Less than 1 week", "1–4 weeks", "1–3 months", "More than 3 months", "Not sure", "Other"]} value={form.painDuration} onChange={(value) => setField("painDuration", value)} required error={errors["pain-duration"]} compact />
                {form.painDuration === "Other" && <TextField id="pain-duration-other" label="Other duration" value={form.painDurationOther} onChange={(value) => setField("painDurationOther", value)} required error={errors["pain-duration-other"]} />}
                <ChoiceGroup id="pain-next-day" legend="Is it worse the next day after light activity?" options={["No", "Sometimes", "Yes", "Not sure"]} value={form.painNextDay} onChange={(value) => setField("painNextDay", value)} required error={errors["pain-next-day"]} compact />
              </>}
            </ConditionalPanel>}
            <ChoiceGroup id="red-flags" legend="Do any of these apply now or recently?" options={redFlagOptions} value={form.redFlags} onChange={(value) => toggleList("redFlags", value, "None of these")} multiple required error={errors["red-flags"]} helper="If you are unsure, choose the closest answer and add context during coaching review." />
            {form.redFlags.some((item) => item !== "None of these") && <div className="scope-notice safety-notice" role="note"><strong>Safety review needed</strong><p>Some answers suggest it may be safer to get qualified medical advice before hard training. This form cannot diagnose the cause. You may finish your application, but ASCEND should not prescribe hard training until the appropriate review or clearance is complete.</p></div>}
            {kneeBranch && <><h3 className="intake-subheading">Knee ability checks</h3><p className="field-helper">Answer only from movements you already do. Do not test these just for the form.</p><div className="screening-list">{kneeQuestions.map((question) => <fieldset className="screening-row" key={question}><legend>{question}</legend><div className="inline-choice-group">{["Yes", "No", "Painful", "Sometimes", "Not sure"].map((option) => <InlineChoice name={`knee-${slug(question)}`} option={option} selected={form.kneeChecks[question].answer === option} onChange={() => updateCheck("kneeChecks", question, "answer", option)} key={option} />)}</div><TextField id={`knee-${slug(question)}-notes`} label="Notes" value={form.kneeChecks[question].notes} onChange={(value) => updateCheck("kneeChecks", question, "notes", value)} /></fieldset>)}</div></>}
            {shoulderBranch && <><h3 className="intake-subheading">Shoulder and pressing checks</h3><p className="field-helper">Answer from your current experience. Do not provoke symptoms to test an answer.</p><div className="screening-list">{shoulderQuestions.map((question) => <fieldset className="screening-row" key={question}><legend>{question}</legend><div className="inline-choice-group">{["No", "Yes", "Sometimes", "Not sure"].map((option) => <InlineChoice name={`shoulder-${slug(question)}`} option={option} selected={form.shoulderChecks[question].answer === option} onChange={() => updateCheck("shoulderChecks", question, "answer", option)} key={option} />)}</div><TextField id={`shoulder-${slug(question)}-notes`} label="Notes" value={form.shoulderChecks[question].notes} onChange={(value) => updateCheck("shoulderChecks", question, "notes", value)} /></fieldset>)}</div></>}
          </div>
        )}

        {step === 7 && (
          <div className="form-step">
            <div className="form-step-heading"><p className="eyebrow">Nutrition readiness</p><h2 ref={headingRef} tabIndex={-1}>Nutrition readiness</h2><p>ASCEND uses food access, budget, appetite and preferences to choose a practical starting direction—not a crash diet or fake precision.</p></div>
            <ChoiceGroup id="meals-per-day" legend="Meals per day" options={["1", "2", "3", "4+", "Inconsistent"]} value={form.mealsPerDay} onChange={(value) => setField("mealsPerDay", value)} required error={errors["meals-per-day"]} compact />
            <ChoiceGroup id="protein-each-meal" legend="Protein with each meal" options={["Rarely", "Sometimes", "Mostly", "Always", "Not sure"]} value={form.proteinEachMeal} onChange={(value) => setField("proteinEachMeal", value)} compact />
            <ChoiceGroup id="appetite" legend="Appetite" options={["Low", "Normal", "High", "Changes a lot"]} value={form.appetite} onChange={(value) => setField("appetite", value)} compact />
            <ChoiceGroup id="cooking-access" legend="Cooking and meal access" options={["Full kitchen", "Limited", "Eat out mostly", "Family meals"]} value={form.cookingAccess} onChange={(value) => toggleList("cookingAccess", value)} multiple required error={errors["cooking-access"]} compact />
            <ChoiceGroup id="food-budget" legend="Food budget" options={["Tight", "Moderate", "Flexible"]} value={form.foodBudget} onChange={(value) => setField("foodBudget", value)} compact />
            {form.foodBudget && <TextField id="food-budget-notes" label="Food budget notes" value={form.foodBudgetNotes} onChange={(value) => setField("foodBudgetNotes", value)} />}
            <div className="form-grid intake-spaced-grid"><TextField id="preferred-foods" label="Cultural or preferred foods" value={form.culturalFoods} onChange={(value) => setField("culturalFoods", value)} helper="List foods or meals you want the plan to respect." rows={4} /><TextField id="supplements" label="Supplements currently used" value={form.supplementsUsed} onChange={(value) => setField("supplementsUsed", value)} helper="Do not include prescription or payment details." rows={4} /></div>
            <ChoiceGroup id="allergies-status" legend="Allergies or food restrictions" options={["None", "Not sure", "I have allergies or restrictions"]} value={form.allergiesStatus} onChange={(value) => setField("allergiesStatus", value)} required error={errors["allergies-status"]} compact />
            {form.allergiesStatus === "I have allergies or restrictions" && <><TextField id="allergies-detail" label="Describe allergies or restrictions" value={form.allergiesRestrictions} onChange={(value) => setField("allergiesRestrictions", value)} required error={errors["allergies-detail"]} helper="List relevant foods or intolerances. Do not upload medical records." rows={4} wide /><div className="scope-notice"><strong>Coaching scope</strong><p>ASCEND can respect stated restrictions but does not diagnose allergies or provide clinical dietetics.</p></div></>}
            <ChoiceGroup id="nutrition-direction" legend="Which directions feel realistic right now?" options={nutritionDirections} value={form.nutritionGoalDirection} onChange={(value) => toggleList("nutritionGoalDirection", value)} multiple />
            <h3 className="intake-subheading">Optional health context</h3>
            <p className="why-we-ask"><strong>Why we ask</strong> This can change safe training, recovery or nutrition guidance. Share only what you are comfortable providing.</p>
            <ChoiceGroup id="menstruation-relevant" legend="Are menstruation-related questions relevant to your coaching?" options={["Yes", "No", "Prefer not to say"]} value={form.menstruationRelevant} onChange={(value) => setField("menstruationRelevant", value)} compact />
            {form.menstruationRelevant === "Yes" && <div className="conditional-panel"><ChoiceGroup id="cycle-regular" legend="Regular cycle?" options={["Yes", "No", "Not applicable", "Prefer not to say"]} value={form.regularCycle} onChange={(value) => setField("regularCycle", value)} compact /><ChoiceGroup id="cycle-energy" legend="Does your cycle affect training energy?" options={["No", "Mildly", "A lot", "Prefer not to say"]} value={form.cycleEnergy} onChange={(value) => setField("cycleEnergy", value)} compact /><TextField id="cycle-notes" label="Cycle and training notes" value={form.cycleEnergyNotes} onChange={(value) => setField("cycleEnergyNotes", value)} /></div>}
            <ChoiceGroup id="pregnancy-context" legend="Pregnant, postpartum or breastfeeding?" options={["No", "Yes", "Prefer not to say"]} value={form.pregnancyStatus} onChange={(value) => setField("pregnancyStatus", value)} compact />
            {form.pregnancyStatus === "Yes" && <div className="scope-notice safety-notice" role="note"><strong>Appropriate health clearance is needed</strong><p>Pregnancy, postpartum or breastfeeding can change safe training and nutrition guidance. ASCEND coaching does not replace medical or dietetic care.</p></div>}
          </div>
        )}

        {step === 8 && (
          <div className="form-step">
            <div className="form-step-heading"><p className="eyebrow">Recovery capacity</p><h2 ref={headingRef} tabIndex={-1}>Recovery and cardio</h2><p>Your sleep, daily load and available conditioning options shape what you can recover from.</p></div>
            <ChoiceGroup id="average-sleep" legend="Average sleep" options={["Under 5 hrs", "5–6 hrs", "7–8 hrs", "8+ hrs"]} value={form.averageSleep} onChange={(value) => setField("averageSleep", value)} required error={errors["average-sleep"]} compact />
            <ChoiceGroup id="sleep-quality" legend="Sleep quality" options={["Poor", "Okay", "Good", "Great"]} value={form.sleepQuality} onChange={(value) => setField("sleepQuality", value)} required error={errors["sleep-quality"]} compact />
            <ChoiceGroup id="stress-level" legend="Stress level" options={["Low", "Moderate", "High", "Very high"]} value={form.stressLevel} onChange={(value) => setField("stressLevel", value)} required error={errors["stress-level"]} compact />
            <ChoiceGroup id="daily-activity" legend="Daily activity" options={["Mostly sitting", "Mixed", "Active job / school", "Very active"]} value={form.dailyActivity} onChange={(value) => setField("dailyActivity", value)} required error={errors["daily-activity"]} compact />
            <ChoiceGroup id="steps-estimate" legend="Steps estimate" options={["Under 4k", "4–7k", "7–10k", "10k+", "Not sure"]} value={form.stepsEstimate} onChange={(value) => setField("stepsEstimate", value)} required error={errors["steps-estimate"]} compact />
            <ChoiceGroup id="soreness-recovery" legend="Soreness recovery" options={["Fast", "Normal", "Slow", "Not sure"]} value={form.sorenessRecovery} onChange={(value) => setField("sorenessRecovery", value)} required error={errors["soreness-recovery"]} compact />
            <ChoiceGroup id="workout-energy" legend="Energy during workouts" options={["Low", "Okay", "Good", "Great", "Not training yet"]} value={form.workoutEnergy} onChange={(value) => setField("workoutEnergy", value)} required error={errors["workout-energy"]} compact />
            <h3 className="intake-subheading">Cardio and conditioning</h3>
            <ChoiceGroup id="cardio-options" legend="Cardio options you can do" options={cardioChoices} value={form.cardioOptions} onChange={(value) => toggleList("cardioOptions", value, "None right now")} multiple required error={errors["cardio-options"]} />
            {form.cardioOptions.includes("Other") && <TextField id="cardio-other" label="Other cardio option" value={form.cardioOther} onChange={(value) => setField("cardioOther", value)} required error={errors["cardio-other"]} />}
            {!form.cardioOptions.includes("None right now") && <ChoiceGroup id="cardio-preference" legend="Cardio preference" options={["Prefer as little as practical", "Okay", "Like it", "Need it for sport"]} value={form.cardioPreference} onChange={(value) => setField("cardioPreference", value)} compact />}
            <ChoiceGroup id="cardio-pain" legend="Cardio pain issues" options={["None", "Knee", "Back", "Ankle / foot", "Other"]} value={form.cardioPainIssues} onChange={(value) => toggleList("cardioPainIssues", value, "None")} multiple required error={errors["cardio-pain"]} compact />
            {form.cardioPainIssues.includes("Other") && <TextField id="cardio-pain-other" label="Other cardio pain issue" value={form.cardioPainOther} onChange={(value) => setField("cardioPainOther", value)} required error={errors["cardio-pain-other"]} />}
            <TextField id="conditioning-goal" label="Conditioning goal" value={form.conditioningGoal} onChange={(value) => setField("conditioningGoal", value)} rows={2} wide />
          </div>
        )}

        {step === 9 && (
          <div className="form-step">
            <div className="form-step-heading"><p className="eyebrow">Final details</p><h2 ref={headingRef} tabIndex={-1}>Tracking and confirmation</h2><p>Choose a feedback system you can sustain, then review and send your assessment.</p></div>
            <ChoiceGroup id="tracking-readiness" legend="What are you willing to track?" options={trackingOptions} value={form.trackingReadiness} onChange={(value) => toggleList("trackingReadiness", value)} multiple compact required error={errors["tracking-readiness"]} helper="Choose what you could record consistently without making fitness feel obsessive." />
            <ChoiceGroup id="understands-tracking" legend="Can you record the weight used and completed reps?" options={["Yes", "No", "I need an explanation"]} value={form.understandsKgReps} onChange={(value) => setField("understandsKgReps", value)} required error={errors["understands-tracking"]} compact />
            <ChoiceGroup id="weekly-tracker" legend="Can you fill a weekly workout tracker?" options={["Yes", "No", "Need printable version"]} value={form.canFillTracker} onChange={(value) => setField("canFillTracker", value)} compact />
            <ChoiceGroup id="tracking-method" legend="Preferred tracking method" options={["Phone notes", "Spreadsheet", "Printed sheet", "App", "Coach form"]} value={form.preferredTrackingMethod} onChange={(value) => setField("preferredTrackingMethod", value)} compact />
            <ChoiceGroup id="checkin-preference" legend="Check-in preference" options={["Weekly", "Every 2 weeks", "Monthly"]} value={form.checkinPreference} onChange={(value) => setField("checkinPreference", value)} compact helper="This is a preference; the coaching service will confirm its actual check-in schedule." />
            <ChoiceGroup id="non-negotiables" legend="What must the plan respect?" options={nonNegotiableOptions} value={form.nonNegotiables} onChange={(value) => toggleList("nonNegotiables", value)} multiple compact required error={errors["non-negotiables"]} />
            <h3 className="intake-subheading">Review your answers</h3>
            <p className="field-helper">Use Change to return to a section. Your answers stay in place.</p>
            <div className="review-sections">{reviewSections(form).map((section) => <details className="review-section" key={section.title}><summary><h3>{section.title}</h3><span>Review</span></summary><div className="review-change"><button type="button" onClick={() => goToStep(section.step)} aria-label={`Change answers in ${section.title}`}>Change this section</button></div><dl>{section.entries.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{String(value)}</dd></div>)}</dl></details>)}</div>
            {safetyReview && <div className="scope-notice safety-notice" role="note"><strong>Coach review required</strong><p>Your answers include a red flag, allergy/restriction or pregnancy-related context. This is not a diagnosis. Hard training or prescriptive nutrition should wait for the appropriate review or clearance.</p></div>}
            <section className="data-use-summary" aria-labelledby="data-use-heading"><h3 id="data-use-heading">How your answers are used</h3><p>ASCEND will use your answers to review this application and, if coaching proceeds, support plan decisions. The detailed assessment is available only inside the authorised coach workflow. Do not include medical files or another person&apos;s information.</p></section>
            <h3 className="intake-subheading">Final confirmations</h3>
            <div className="confirmation-list">{([
              ["honestConfirmation", "honest-confirmation", "I answered honestly to the best of my ability."],
              ["coachingScopeConfirmation", "scope-confirmation", "I understand this is coaching intake, not medical diagnosis."],
              ["symptomsConfirmation", "symptoms-confirmation", "I will tell the coach if pain, dizziness, swelling, numbness or unusual symptoms appear."],
              ["trackingAgreement", "tracking-agreement", "I agree to track workouts enough for the plan to be adjusted properly."],
            ] as const).map(([key, id, label]) => <label className={`${form[key] ? "consent-box active" : "consent-box"} ${errors[id] ? "field-invalid" : ""}`} key={key} id={id}><input type="checkbox" checked={form[key]} onChange={(event) => setField(key, event.target.checked)} /><span className="consent-check" aria-hidden="true">✓</span><span><strong>{label}</strong><FieldStatus required />{errors[id] && <small className="field-error">{errors[id]}</small>}</span></label>)}</div>
          </div>
        )}

        {status === "error" && <div className="form-message error" id="submission-error" role="alert" tabIndex={-1}><strong>We could not send your assessment.</strong><p>{message}</p></div>}
        {started && step > 1 && <p className={`autosave-status ${saveStatus === "error" ? "error" : ""}`} role="status">{saveStatus === "saving" ? "Saving low-sensitivity draft choices…" : saveStatus === "saved" ? "Safe draft saved on this device — contact, body, pain, health and consent answers were not stored." : saveStatus === "error" ? "We could not save the safe draft. Your current answers are still open, but closing this page may lose them." : ""}</p>}

        <StepActions
          backLabel={step === 1 ? "Introduction" : "Previous"}
          onBack={step === 1 ? returnToEntrance : () => goToStep(step - 1)}
          onContinue={validateAndContinue}
          continueLabel={step === 8 ? "Review and finish" : "Continue"}
          submit={step === steps.length}
          sending={status === "sending"}
        />
      </form>
    </section>
  );
}
