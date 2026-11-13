"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepChoice {
  id: string;
  type: "choice";
  question: string;
  help: string;
  options: string[];
}

interface StepInput {
  id: string;
  type: "text" | "tel" | "email";
  question: string;
  help: string;
  label: string;
  placeholder: string;
}

type Step = StepChoice | StepInput;

const STEPS: Step[] = [
  {
    id: "main_physique_goal",
    type: "choice",
    question: "What's your main physique goal?",
    help: "Choose what matters most to you right now. You can clarify your goal privately later.",
    options: [
      "Lose body fat",
      "Build muscle",
      "Build muscle and lose fat",
      "Get stronger",
      "Improve my overall physique",
      "Not sure yet",
    ],
  },
  {
    id: "gym_experience",
    type: "choice",
    question: "Which best describes your gym experience?",
    help: "You do not need previous gym experience to join ASCEND.",
    options: [
      "Completely new",
      "Tried but stopped",
      "Train inconsistently",
      "Currently train regularly",
    ],
  },
  {
    id: "training_location",
    type: "choice",
    question: "Where can you realistically train?",
    help: "Select the place and equipment you can reliably use—not what you hope to have later.",
    options: [
      "A gym",
      "Home with equipment",
      "Both",
      "Home without equipment",
      "No reliable training space yet",
    ],
  },
  {
    id: "days_per_week",
    type: "choice",
    question: "How many days per week can you realistically train?",
    help: "Choose what you can repeat most weeks, even when life gets busy.",
    options: ["1 day", "2 days", "3 days", "4 days", "5 or more days"],
  },
  {
    id: "age_range",
    type: "choice",
    question: "Which age group are you in?",
    help: "ASCEND currently accepts clients aged 16 and above. Ages 16–17 need guardian consent before paid coaching begins.",
    options: ["Under 16", "16–17", "18–24", "25–34", "35–44", "45+"],
  },
  {
    id: "medical_clearance",
    type: "choice",
    question: "Has a medical professional advised you to seek clearance before exercising?",
    help: "If Yes or Unsure, coaching cannot start until the necessary professional guidance is clarified. This is not a medical diagnosis.",
    options: ["Yes", "No", "Unsure"],
  },
  {
    id: "ready_seven_days",
    type: "choice",
    question: "If eligible and a coaching place is available, are you prepared to begin within the next seven days?",
    help: "This checks your current availability, not how motivated you are.",
    options: ["Yes", "No"],
  },
  {
    id: "first_name",
    type: "text",
    question: "What's your first name?",
    help: "So we can address you properly.",
    label: "First name",
    placeholder: "Enter your first name",
  },
  {
    id: "whatsapp_number",
    type: "tel",
    question: "What's your WhatsApp number?",
    help: "Include your country code, for example +234 801 234 5678.",
    label: "WhatsApp number",
    placeholder: "+234 801 234 5678",
  },
  {
    id: "email_address",
    type: "email",
    question: "What's your email address?",
    help: "Used for account information and receipts. Routine coaching happens in the ASCEND portal.",
    label: "Email address",
    placeholder: "you@example.com",
  },
];

type OutcomeType =
  | "under16"
  | "clearance-hold"
  | "equipment-hold"
  | "not-ready"
  | "guardian-consent"
  | "waitlist"
  | "membership";

export function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [outcome, setOutcome] = useState<OutcomeType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<"available" | "active_full" | "weekly_full">("available");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentStep = STEPS[currentIndex];
  const currentAnswer = answers[currentStep.id] || "";

  const isValid = (step: Step, val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) return false;
    if (step.type === "choice") {
      return step.options.includes(trimmed);
    }
    if (step.id === "first_name") {
      return trimmed.length >= 2;
    }
    if (step.id === "whatsapp_number") {
      const normalized = trimmed.replace(/[\s().-]/g, "");
      return /^\+[1-9]\d{7,14}$/.test(normalized);
    }
    if (step.id === "email_address") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
    }
    return false;
  };

  const handleSelectChoice = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: option }));
    setError(null);
  };

  const handleInputChange = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: val }));
    setError(null);
  };

  const routeRegistration = (ans: Record<string, string>): OutcomeType => {
    if (ans.age_range === "Under 16") return "under16";
    if (ans.medical_clearance === "Yes" || ans.medical_clearance === "Unsure") return "clearance-hold";
    if (
      ans.training_location === "Home without equipment" ||
      ans.training_location === "No reliable training space yet"
    ) {
      return "equipment-hold";
    }
    if (ans.ready_seven_days !== "Yes") return "not-ready";
    if (capacity !== "available") return "waitlist";
    if (ans.age_range === "16–17") return "guardian-consent";
    return "membership";
  };

  const handleAdvance = () => {
    if (!isValid(currentStep, currentAnswer)) {
      if (currentStep.type === "choice") {
        setError("Choose an option to continue.");
      } else if (currentStep.id === "whatsapp_number") {
        setError("Enter a full phone number starting with + and your country code.");
      } else {
        setError("Please check this answer and try again.");
      }
      return;
    }

    if (currentStep.id === "age_range" && currentAnswer === "Under 16") {
      setOutcome("under16");
      return;
    }

    if (currentIndex < STEPS.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      const finalOutcome = routeRegistration(answers);
      setOutcome(finalOutcome);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setError(null);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIndex(0);
    setOutcome(null);
    setError(null);
  };

  const handleEditFrom = (index: number) => {
    setOutcome(null);
    setCurrentIndex(index);
    setError(null);
  };

  return (
    <div
      className="registration-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Registration Modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(7, 7, 6, 0.85)",
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: "min(100%, 720px)",
          background: "#F8F7F2",
          color: "#191A17",
          border: "1px solid #4D402C",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            background: "#131312",
            color: "#F1EADA",
            padding: "12px 20px",
            borderBottom: "1px solid #4D402C",
          }}
        >
          <div>
            <strong style={{ fontSize: "13px", letterSpacing: "0.08em" }}>
              ASCEND · REGISTER FOR COACHING
            </strong>
            <small style={{ display: "block", fontSize: "11px", color: "#C3B8A2", marginTop: "2px" }}>
              One-time questionnaire · Founding coaching capacity
            </small>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close registration"
            style={{
              background: "transparent",
              color: "#F1EADA",
              border: "1px solid #A88D5D",
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Close ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "32px 36px" }}>
          {!outcome ? (
            <div>
              {/* Progress Indicator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: "'Cinzel', serif",
                    letterSpacing: "0.2em",
                    color: "#7E633C",
                    fontWeight: 700,
                  }}
                >
                  REGISTER FOR COACHING
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.06em",
                    color: "#7B7C73",
                  }}
                >
                  {String(currentIndex + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                </span>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  height: "3px",
                  width: "100%",
                  background: "#E4E0D5",
                  marginBottom: "28px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${((currentIndex + 1) / STEPS.length) * 100}%`,
                    background: "#7E633C",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              {/* Question */}
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(28px, 4vw, 36px)",
                  fontWeight: 500,
                  lineHeight: 1.15,
                  margin: "0 0 10px",
                  color: "#10120F",
                }}
              >
                {currentStep.question}
              </h2>
              <p style={{ color: "#514D44", fontSize: "15px", lineHeight: 1.5, margin: "0 0 24px" }}>
                {currentStep.help}
              </p>

              {/* Step Controls */}
              {currentStep.type === "choice" ? (
                <div style={{ display: "grid", gap: "10px" }} role="group" aria-label={currentStep.question}>
                  {currentStep.options.map((option) => {
                    const isSelected = currentAnswer === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelectChoice(option)}
                        style={{
                          minHeight: "52px",
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          padding: "12px 16px",
                          textAlign: "left",
                          border: isSelected ? "1.5px solid #A58A5A" : "1px solid #DCD8CF",
                          background: isSelected ? "#F4EEE0" : "#FFFEFA",
                          borderRadius: "8px",
                          color: "#353630",
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: "15px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            border: isSelected ? "5px solid #9E8253" : "1.5px solid #BEB8AA",
                            background: isSelected ? "#FFF" : "transparent",
                            flexShrink: 0,
                          }}
                        />
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "grid", gap: "8px" }}>
                  <label htmlFor="modal-answer-field" style={{ fontWeight: 600, fontSize: "14px", color: "#444640" }}>
                    {currentStep.label}
                  </label>
                  <input
                    id="modal-answer-field"
                    type={currentStep.type}
                    value={currentAnswer}
                    placeholder={currentStep.placeholder}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAdvance();
                      }
                    }}
                    style={{
                      height: "54px",
                      padding: "0 16px",
                      borderRadius: "8px",
                      border: "1px solid #D4D0C5",
                      background: "#FFFEFA",
                      fontSize: "16px",
                      color: "#191A17",
                      width: "100%",
                    }}
                    autoFocus
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div
                  role="alert"
                  style={{
                    background: "#FFF2ED",
                    color: "#8D3524",
                    borderLeft: "3px solid #B95B41",
                    padding: "10px 14px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    marginTop: "16px",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "32px",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentIndex === 0}
                  style={{
                    minHeight: "48px",
                    border: "1px solid #E4E1D8",
                    borderRadius: "8px",
                    background: "transparent",
                    color: currentIndex === 0 ? "#A0A09A" : "#66675E",
                    padding: "10px 20px",
                    cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleAdvance}
                  style={{
                    minHeight: "48px",
                    borderRadius: "8px",
                    padding: "10px 24px",
                    background: "#10120F",
                    color: "#FFF",
                    border: "1px solid #10120F",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {currentIndex === STEPS.length - 1 ? "Complete registration" : "Continue"} →
                </button>
              </div>

              {/* Footer Note */}
              <p style={{ marginTop: "24px", fontSize: "12px", color: "#8B8A80", lineHeight: 1.5 }}>
                Register once. No application or acceptance decision. Your answers personalise your coaching direction; required safety checks apply before coaching begins.
              </p>
            </div>
          ) : outcome === "membership" ? (
            /* Membership Preview Outcome */
            <div>
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "11px",
                  letterSpacing: "0.2em",
                  color: "#7E633C",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                REGISTRATION COMPLETE · MEMBERSHIP DETAILS
              </div>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "36px",
                  fontWeight: 500,
                  margin: "0 0 12px",
                  lineHeight: 1.1,
                }}
              >
                Begin with structure.
              </h2>
              <p style={{ color: "#514D44", fontSize: "16px", margin: "0 0 20px" }}>
                A personalised coaching system for building a stronger, better-shaped physique—without guesswork.
              </p>

              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "44px",
                  fontWeight: 600,
                  color: "#10120F",
                  margin: "18px 0 6px",
                }}
              >
                ₦40,000{" "}
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#777", fontWeight: 400 }}>
                  / billing month
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#7A6840", margin: "0 0 24px", fontWeight: 600 }}>
                Provisional founding price · Strictly 10 active client capacity
              </p>

              <div style={{ borderTop: "1px solid #E4E1D8", paddingTop: "20px", marginBottom: "24px" }}>
                <strong style={{ fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#514D44" }}>
                  What your coaching includes:
                </strong>
                <ul style={{ margin: "14px 0 0", paddingLeft: "18px", color: "#353630", fontSize: "14px", lineHeight: 1.7 }}>
                  <li>Training designed around your goal, experience and available equipment.</li>
                  <li>Practical Nigerian nutrition built around foods you can buy and eat.</li>
                  <li>Private tracking portal for workouts, nutrition and progress.</li>
                  <li>Two personal coaching reviews every billing month by Sahmi El.</li>
                  <li>Two high-priority direct coaching messages every billing month.</li>
                  <li>Evidence-led plan changes after Sahmi’s personal review.</li>
                </ul>
              </div>

              <div
                style={{
                  background: "#F1EEE6",
                  borderLeft: "2px solid #C9A24B",
                  padding: "14px 16px",
                  fontSize: "13px",
                  color: "#5A584F",
                  lineHeight: 1.6,
                  marginBottom: "28px",
                }}
              >
                <strong>Next Step:</strong> You can proceed to complete your private nine-stage physical assessment. Sahmi personally prepares your plan within five business days of submission.
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link
                  href="/apply"
                  style={{
                    background: "#10120F",
                    color: "#FFF",
                    padding: "14px 24px",
                    fontWeight: 700,
                    fontSize: "13px",
                    letterSpacing: "0.06em",
                    borderRadius: "0",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Proceed to Private Assessment →
                </Link>
                <button
                  type="button"
                  onClick={() => handleEditFrom(0)}
                  style={{
                    background: "transparent",
                    color: "#5A5C51",
                    border: "1px solid #D7D3C8",
                    padding: "14px 20px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Edit Answers
                </button>
              </div>
            </div>
          ) : (
            /* Hold / Safety / Age Outcomes */
            <div>
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  color: "#7E633C",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                REGISTRATION STATUS
              </div>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "32px",
                  fontWeight: 500,
                  margin: "0 0 14px",
                  lineHeight: 1.15,
                }}
              >
                {outcome === "under16" && "Age requirement check"}
                {outcome === "clearance-hold" && "Exercise clearance is required first"}
                {outcome === "equipment-hold" && "Let's confirm a practical training setup"}
                {outcome === "not-ready" && "Return when you are ready to begin"}
                {outcome === "guardian-consent" && "Guardian consent is the next step"}
                {outcome === "waitlist" && "Coaching is currently full"}
              </h2>

              <p style={{ color: "#514D44", fontSize: "15px", lineHeight: 1.7, margin: "0 0 20px" }}>
                {outcome === "under16" &&
                  "ASCEND currently accepts clients aged 16 and above. You cannot register for coaching at this time. No account or payment has been created."}
                {outcome === "clearance-hold" &&
                  "Your answer indicates that professional medical guidance is advised before starting strenuous exercise. Coaching cannot begin until this clearance is secured."}
                {outcome === "equipment-hold" &&
                  "Before beginning paid coaching, ASCEND needs to confirm that your available space and equipment can support an effective programme. Please update your training location if you have gym or home equipment access."}
                {outcome === "not-ready" &&
                  "Your answers are noted. We look forward to working with you when you are ready to begin training within seven days."}
                {outcome === "guardian-consent" &&
                  "Clients aged 16–17 require verified parent or legal guardian consent before payment and coaching commencement."}
                {outcome === "waitlist" &&
                  "Founding capacity is currently capped at 10 active clients. You may join our waitlist to be notified when an onboarding spot opens."}
              </p>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    background: "#10120F",
                    color: "#FFF",
                    padding: "12px 20px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  Start Over
                </button>
                <button
                  type="button"
                  onClick={() => handleEditFrom(0)}
                  style={{
                    background: "transparent",
                    color: "#5A5C51",
                    border: "1px solid #D7D3C8",
                    padding: "12px 18px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Edit Answers
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
