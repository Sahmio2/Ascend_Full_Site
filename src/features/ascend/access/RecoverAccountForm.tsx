"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccessShell from "./AccessShell";

export default function RecoverAccountForm() {
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
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Recovery request failed.");
      }

      sessionStorage.setItem("ascend_login_email", email.trim().toLowerCase());
      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&context=recovery`);
    } catch (err: any) {
      setError(err.message || "Failed to process recovery request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccessShell
      title="Get back to your account."
      description="Enter the email associated with ASCEND. We’ll help you regain access without creating a second account."
      crumb="ACCOUNT RECOVERY"
    >
      <form className="access-panel" onSubmit={handleSubmit}>
        {error && (
          <div className="access-alert err" role="alert">
            {error}
          </div>
        )}

        <div className="access-field">
          <label htmlFor="recover-email">Email address</label>
          <input
            id="recover-email"
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
          {loading ? "Processing..." : "Continue securely →"}
        </button>

        <div className="access-mini-foot">
          <Link href="/login">← Back to login</Link>
        </div>
      </form>
    </AccessShell>
  );
}
