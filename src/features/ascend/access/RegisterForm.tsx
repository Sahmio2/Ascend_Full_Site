"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccessShell from "./AccessShell";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/client/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to start registration.");
      }

      sessionStorage.setItem("ascend_login_email", email.trim().toLowerCase());
      if (data.devCode) {
        sessionStorage.setItem("ascend_dev_otp", data.devCode);
      }
      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&context=signup`);
    } catch (err: any) {
      setError(err.message || "Failed to start registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccessShell
      title="Begin your Ascension."
      description="Register your account with your email to start your private 9-stage intake."
      crumb="CLIENT REGISTRATION"
    >
      <form className="access-panel" onSubmit={handleSubmit}>
        {error && (
          <div className="access-alert err" role="alert">
            {error}
          </div>
        )}

        <div className="access-field">
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            className="access-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
            disabled={loading}
          />
        </div>

        <button type="submit" className="access-btn-main" disabled={loading}>
          {loading ? "Sending verification code..." : "Send registration code →"}
        </button>

        <div className="access-fine-print" style={{ marginTop: "16px" }}>
          <span>♧ We’ll send a single-use 6-digit code to verify your email. Password is not required.</span>
        </div>

        <div className="access-rule">Already registered?</div>

        <Link href="/login" className="access-btn-secondary" style={{ width: "100%" }}>
          Sign in to existing account →
        </Link>

        <div className="access-mini-foot">
          <Link href="/auth/recover">Need help accessing an account?</Link>
        </div>
      </form>
    </AccessShell>
  );
}
