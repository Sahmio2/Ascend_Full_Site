"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccessShell from "./AccessShell";

export default function ClientLoginForm() {
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
        throw new Error(data.message || data.error || "Failed to send code.");
      }

      // Store email temporarily in sessionStorage for verify page
      sessionStorage.setItem("ascend_login_email", email.trim().toLowerCase());
      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccessShell
      title="Welcome back."
      description="Sign in to continue exactly where you left off in your ASCEND account."
      crumb="ACCOUNT ACCESS"
    >
      <form className="access-panel" onSubmit={handleSubmit}>
        {error && (
          <div className="access-alert err" role="alert">
            {error}
          </div>
        )}

        <div className="access-field">
          <label htmlFor="client-email">Email address</label>
          <input
            id="client-email"
            name="email"
            type="email"
            className="access-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <button type="submit" className="access-btn-main" disabled={loading}>
          {loading ? "Sending code..." : "Send sign-in code →"}
        </button>

        <div className="access-fine-print" style={{ marginTop: "16px" }}>
          <span>♧ We’ll send a one-time verification code to your email. Password is not required.</span>
        </div>

        <div className="access-rule">New to ASCEND?</div>

        <Link href="/register" className="access-btn-secondary" style={{ width: "100%" }}>
          Register for coaching →
        </Link>

        <div className="access-mini-foot">
          <Link href="/auth/recover">Having trouble accessing your account?</Link>
        </div>
      </form>
    </AccessShell>
  );
}
