"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AccessShell from "./AccessShell";

export default function WaitlistConsentForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If user is logged in, fetch email from account snapshot
    async function fetchAccount() {
      try {
        const res = await fetch("/api/account/snapshot");
        if (res.ok) {
          const data = await res.json();
          if (data?.snapshot?.email) {
            setEmail(data.snapshot.email);
          }
        }
      } catch {}
    }
    fetchAccount();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("Please confirm your consent to be contacted regarding coaching availability.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          consentGiven: true,
          channel: "email_whatsapp",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to join waitlist.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to join waitlist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccessShell
      title="Join the waitlist."
      description="When coaching places are unavailable, you can opt in to hear from ASCEND. Joining never guarantees a place or starts a subscription."
      crumb="COACHING AVAILABILITY"
    >
      <form className="access-panel" onSubmit={handleSubmit}>
        {error && (
          <div className="access-alert err" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="access-alert good" role="alert">
            ✓ You have joined the ASCEND availability waitlist. We will contact you when capacity opens.
          </div>
        )}

        <div className="access-tag" style={{ marginBottom: "16px" }}>
          Capacity & availability
        </div>

        <h3 style={{ margin: "0 0 10px", fontSize: "18px" }}>No payment required.</h3>
        <p className="access-fine-print" style={{ marginBottom: "20px" }}>
          Your registration stays saved. ASCEND will check coaching capacity, safety and any
          required guardian permissions again before inviting you to checkout.
        </p>

        <div className="access-field">
          <label htmlFor="waitlist-email">Email address</label>
          <input
            id="waitlist-email"
            name="email"
            type="email"
            className="access-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading || success}
          />
        </div>

        <label className="access-cancel-check">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
            disabled={loading || success}
          />
          <span>
            I agree to receive a contact about coaching availability. This is separate from
            marketing consent and I can opt out.
          </span>
        </label>

        <button
          type="submit"
          className="access-btn-main"
          disabled={loading || !consent || success}
          style={{ marginTop: "16px" }}
        >
          {loading ? "Joining..." : success ? "Joined waitlist" : "Join optional waitlist →"}
        </button>

        <div className="access-mini-foot">
          <Link href="/account">← Back to account</Link>
        </div>
      </form>
    </AccessShell>
  );
}
