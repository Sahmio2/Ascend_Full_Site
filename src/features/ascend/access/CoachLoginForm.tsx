"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccessShell from "./AccessShell";

export default function CoachLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both coach email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/coach/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Invalid coach credentials.");
      }

      sessionStorage.setItem("ascend_coach_email", email.trim().toLowerCase());
      router.push(`/coach/verify?email=${encodeURIComponent(email.trim().toLowerCase())}&context=coach`);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Privately provisioned accounts only.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccessShell
      title="Coach access."
      description="This is the restricted sign-in for Sahmi’s private coaching workspace."
      crumb="RESTRICTED ACCESS"
      artVariant="coach"
    >
      <form className="access-panel" onSubmit={handleSubmit}>
        {error && (
          <div className="access-alert err" role="alert">
            {error}
          </div>
        )}

        <div className="access-field">
          <label htmlFor="coach-email">Coach email</label>
          <input
            id="coach-email"
            name="email"
            type="email"
            className="access-input"
            placeholder="coach@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            disabled={loading}
          />
        </div>

        <div className="access-field">
          <label htmlFor="coach-password">Password</label>
          <input
            id="coach-password"
            name="password"
            type="password"
            className="access-input"
            placeholder="Enter your secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
          />
        </div>

        <button type="submit" className="access-btn-main" disabled={loading}>
          {loading ? "Verifying credentials..." : "Continue to verification →"}
        </button>

        <p className="access-fine-print" style={{ marginTop: "17px" }}>
          Coach accounts are provisioned privately. Multi-factor authentication is required. Public
          signup does not grant coach access.
        </p>

        <div className="access-mini-foot">
          <Link href="/login">← Client sign-in</Link>
        </div>
      </form>
    </AccessShell>
  );
}
