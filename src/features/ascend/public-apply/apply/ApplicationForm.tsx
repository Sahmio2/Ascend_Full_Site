"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import AscendIcon from "../components/AscendIcon";
import SpecularButton from "../components/SpecularButton";
import NineStageAssessment from "../assessment/NineStageAssessment";
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
        <Link className="button button-gold" href="/">Return to ASCEND</Link>
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
    <NineStageAssessment
      onBackToEntrance={() => setStarted(false)}
      prefillProfile={{
        fullName: form.fullName,
        email: form.email,
        whatsapp: form.whatsapp,
        goal: form.primaryGoal,
        experience: Array.isArray(form.startingStatus) ? form.startingStatus.join(', ') : form.startingStatus,
      }}
    />
  );
}
