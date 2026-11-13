"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AccessShell from "./AccessShell";

export default function CoachVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const qEmail = searchParams?.get("email");
    if (qEmail) {
      setEmail(qEmail);
    } else {
      const stored = sessionStorage.getItem("ascend_coach_email");
      if (stored) setEmail(stored);
    }
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Coach email required. Please sign in again.");
      return;
    }
    if (code.trim().length !== 6) {
      setError("Please enter your 6-digit coach MFA code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/coach/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({ email, code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "MFA verification failed.");
      }

      setSuccess("Coach identity verified. Loading Coach Studio...");
      setTimeout(() => router.push("/coach-portal"), 400);
    } catch (err: any) {
      setError(err.message || "Invalid or expired coach MFA code.");
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
        body: JSON.stringify({ email, type: "COACH_MFA" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to resend code.");
      }

      setSuccess("A new MFA code has been dispatched to your coach device.");
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccessShell
      title="Verify it’s you."
      description="Enter your coach verification code to finish signing in."
      crumb="COACH VERIFICATION"
      artVariant="coach"
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
          <strong>Coach 6-digit code</strong>
          <span>MFA required</span>
        </div>

        <div className="access-field">
          <input
            id="coach-mfa-code"
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
          {loading ? "Verifying MFA..." : "Verify and open Coach Studio →"}
        </button>

        <div className="access-button-row" style={{ marginTop: "14px" }}>
          <button
            type="button"
            className="access-btn-secondary"
            onClick={handleResend}
            disabled={loading || cooldown > 0}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend MFA code"}
          </button>
          <Link href="/coach/login" className="access-btn-secondary">
            Back to login
          </Link>
        </div>

        <p className="access-fine-print" style={{ marginTop: "20px" }}>
          Coach sessions require both password credentials and MFA verification. Access is logged.
        </p>
      </form>
    </AccessShell>
  );
}
