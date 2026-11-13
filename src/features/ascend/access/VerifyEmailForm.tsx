"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AccessShell from "./AccessShell";

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [context, setContext] = useState<"client" | "coach" | "recovery">("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const qEmail = searchParams?.get("email");
    const qContext = searchParams?.get("context") as "client" | "coach" | "recovery" | null;

    if (qContext) setContext(qContext);

    if (qEmail) {
      setEmail(qEmail);
    } else {
      const stored = sessionStorage.getItem("ascend_login_email");
      if (stored) setEmail(stored);
    }
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const isCoach = context === "coach";

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Email address is required. Please go back and sign in again.");
      return;
    }
    if (code.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = isCoach ? "/api/auth/coach/verify" : "/api/auth/client/verify";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({ email, code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Verification failed. Check the code.");
      }

      setSuccess("Verification successful. Redirecting...");
      const destination = data.nextPath || (isCoach ? "/coach-portal" : "/account");
      setTimeout(() => router.push(destination), 400);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/auth/challenge/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          email,
          type: isCoach ? "COACH_MFA" : "CLIENT_EMAIL_OTP",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to resend code.");
      }

      setSuccess("A fresh 6-digit verification code has been dispatched.");
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Could not resend code. Please wait before retrying.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccessShell
      title={isCoach ? "Verify it’s you." : "Check your inbox."}
      description={
        isCoach
          ? "Enter your coach verification code to finish signing in."
          : `We sent a six-digit code to ${email ? email : "your email"}. Enter it below to continue.`
      }
      crumb={isCoach ? "COACH VERIFICATION" : "EMAIL VERIFICATION"}
      artVariant={isCoach ? "coach" : "client"}
    >
      <form className="access-panel" onSubmit={handleVerify}>
        {error && (
          <div className="access-alert err" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="access-alert good" role="alert">
            {success}
          </div>
        )}

        <div className="access-top-mini">
          <strong>6-digit code</strong>
          <span>Single-use code</span>
        </div>

        <div className="access-field">
          <input
            id="otp-code"
            name="code"
            type="text"
            className="access-input code"
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className="access-btn-main" disabled={loading || code.length !== 6}>
          {loading ? "Verifying..." : "Verify and continue →"}
        </button>

        <div className="access-button-row" style={{ marginTop: "14px" }}>
          <button
            type="button"
            className="access-btn-secondary"
            onClick={handleResend}
            disabled={loading || cooldown > 0}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
          <Link
            href={isCoach ? "/coach/login" : "/login"}
            className="access-btn-secondary"
          >
            Back
          </Link>
        </div>

        <p className="access-fine-print" style={{ marginTop: "20px" }}>
          Codes expire in 10 minutes and attempts are rate limited. Do not share your code.
        </p>
      </form>
    </AccessShell>
  );
}
