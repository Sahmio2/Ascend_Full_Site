"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccessShell from "./AccessShell";

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
    id: "mainGoal",
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
    id: "gymExperience",
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
    id: "trainingLocation",
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
    id: "daysPerWeek",
    type: "choice",
    question: "How many days per week can you realistically train?",
    help: "Choose what you can repeat most weeks, even when life gets busy.",
    options: ["1 day", "2 days", "3 days", "4 days", "5 or more days"],
  },
  {
    id: "ageRange",
    type: "choice",
    question: "Which age group are you in?",
    help: "ASCEND accepts clients aged 16 and above. Ages 16–17 need guardian consent before paid coaching begins.",
    options: ["Under 16", "16–17", "18–24", "25–34", "35–44", "45+"],
  },
  {
    id: "medicalClearance",
    type: "choice",
    question: "Has a medical professional advised you to seek clearance before exercising?",
    help: "If Yes or Unsure, coaching cannot start until professional guidance is clarified.",
    options: ["No", "Yes", "Unsure"],
  },
  {
    id: "readySevenDays",
    type: "choice",
    question: "If eligible and a coaching place is available, are you prepared to begin within the next seven days?",
    help: "This checks your current availability, not motivation level.",
    options: ["Yes", "No"],
  },
  {
    id: "firstName",
    type: "text",
    question: "What's your first name?",
    help: "So Coach Sahmi knows how to address you.",
    label: "First name",
    placeholder: "e.g. Samuel",
  },
  {
    id: "whatsappNumber",
    type: "tel",
    question: "What's your WhatsApp number?",
    help: "Include your country code, e.g. +234 801 234 5678.",
    label: "WhatsApp number",
    placeholder: "+234 801 234 5678",
  },
  {
    id: "email",
    type: "email",
    question: "What's your email address?",
    help: "We'll send a single-use 6-digit code to verify your account. Password is not required.",
    label: "Email address",
    placeholder: "you@example.com",
  },
];

export default function RegisterForm() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnder16, setIsUnder16] = useState(false);

  const currentStep = STEPS[currentIndex];
  const currentAnswer = answers[currentStep?.id] || "";

  const isValidAnswer = (step: Step, val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) return false;
    if (step.type === "choice") {
      return step.options.includes(trimmed);
    }
    if (step.id === "firstName") {
      return trimmed.length >= 2;
    }
    if (step.id === "whatsappNumber") {
      return trimmed.length >= 7;
    }
    if (step.id === "email") {
      return trimmed.includes("@") && trimmed.includes(".");
    }
    return true;
  };

  const handleSelectChoice = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: option }));
    setError(null);
  };

  const handleInputChange = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: val }));
    setError(null);
  };

  const handleAdvance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isValidAnswer(currentStep, currentAnswer)) {
      if (currentStep.type === "choice") {
        setError("Please choose an option to continue.");
      } else if (currentStep.id === "whatsappNumber") {
        setError("Please enter a valid phone number with country code.");
      } else if (currentStep.id === "email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Please check this answer to proceed.");
      }
      return;
    }

    if (currentStep.id === "ageRange" && currentAnswer === "Under 16") {
      setIsUnder16(true);
      return;
    }

    // If not final step, advance
    if (currentIndex < STEPS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setError(null);
      return;
    }

    // Final step: Submit complete screening & dispatch OTP
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/screening", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          firstName: answers.firstName || "",
          whatsappNumber: answers.whatsappNumber || "",
          email: (answers.email || currentAnswer).trim().toLowerCase(),
          mainGoal: answers.mainGoal || "",
          gymExperience: answers.gymExperience || "",
          trainingLocation: answers.trainingLocation || "",
          daysPerWeek: answers.daysPerWeek || "",
          ageRange: answers.ageRange || "",
          medicalClearance: answers.medicalClearance || "No",
          readySevenDays: answers.readySevenDays || "Yes",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to complete registration.");
      }

      const emailVal = (answers.email || currentAnswer).trim().toLowerCase();
      sessionStorage.setItem("ascend_login_email", emailVal);
      if (data.devCode) {
        sessionStorage.setItem("ascend_dev_otp", data.devCode);
      }

      router.push(`/verify-email?email=${encodeURIComponent(emailVal)}&context=signup`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setError(null);
    }
  };

  if (isUnder16) {
    return (
      <AccessShell
        title="Age Requirement"
        description="ASCEND currently accepts clients aged 16 and above."
        crumb="ELIGIBILITY CHECK"
      >
        <div className="access-panel">
          <p style={{ color: "#c8d0c4", fontSize: "14.5px", lineHeight: 1.6, marginBottom: "24px" }}>
            You cannot register for coaching at this time. No account or payment record has been created.
          </p>
          <button
            type="button"
            className="access-btn-main"
            onClick={() => {
              setIsUnder16(false);
              setCurrentIndex(0);
              setAnswers({});
            }}
          >
            Start Over
          </button>
        </div>
      </AccessShell>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / STEPS.length) * 100);

  return (
    <AccessShell
      title={currentStep.question}
      description={currentStep.help}
      crumb={`STEP ${currentIndex + 1} OF ${STEPS.length} · REGISTRATION`}
    >
      <form className="access-panel" onSubmit={handleAdvance}>
        {/* Progress Bar */}
        <div style={{ height: "4px", background: "rgba(255, 255, 255, 0.12)", borderRadius: "999px", marginBottom: "22px", overflow: "hidden" }}>
          <div style={{ width: `${progressPercent}%`, height: "100%", background: "linear-gradient(90deg, #c5a359, #dfbf77)", transition: "width 0.3s ease" }} />
        </div>

        {error && (
          <div className="access-alert err" role="alert" style={{ marginBottom: "18px" }}>
            {error}
          </div>
        )}

        {/* Input by step type */}
        {currentStep.type === "choice" ? (
          <div style={{ display: "grid", gap: "10px", marginBottom: "24px" }} role="group" aria-label={currentStep.question}>
            {currentStep.options.map((option) => {
              const isSelected = currentAnswer === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelectChoice(option)}
                  style={{
                    minHeight: "50px",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    textAlign: "left",
                    borderRadius: "10px",
                    border: isSelected ? "1.5px solid #dfbf77" : "1px solid rgba(255, 255, 255, 0.14)",
                    background: isSelected ? "rgba(199, 164, 91, 0.16)" : "rgba(255, 255, 255, 0.03)",
                    color: isSelected ? "#ffffff" : "#e5e8e2",
                    fontSize: "14.5px",
                    fontWeight: isSelected ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: isSelected ? "5px solid #dfbf77" : "1.5px solid rgba(199, 164, 91, 0.4)",
                      background: isSelected ? "#ffffff" : "transparent",
                      flexShrink: 0,
                    }}
                  />
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="access-field" style={{ marginBottom: "24px" }}>
            <label htmlFor="step-field">{currentStep.label}</label>
            <input
              id="step-field"
              type={currentStep.type}
              className="access-input"
              placeholder={currentStep.placeholder}
              value={currentAnswer}
              onChange={(e) => handleInputChange(e.target.value)}
              required
              autoFocus
              disabled={loading}
            />
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            type="button"
            className="access-btn-secondary"
            onClick={handleBack}
            disabled={currentIndex === 0 || loading}
            style={{ width: "90px" }}
          >
            ← Back
          </button>
          <button type="submit" className="access-btn-main" disabled={loading} style={{ flex: 1 }}>
            {loading ? "Starting registration..." : currentIndex === STEPS.length - 1 ? "Complete registration →" : "Continue →"}
          </button>
        </div>

        <div className="access-rule" style={{ marginTop: "24px" }}>Already registered?</div>

        <Link href="/login" className="access-btn-secondary" style={{ width: "100%" }}>
          Sign in to existing account →
        </Link>
      </form>
    </AccessShell>
  );
}
