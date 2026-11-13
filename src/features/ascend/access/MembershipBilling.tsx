"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccessShell from "./AccessShell";
import type { AccountSnapshot } from "@/server/auth";

export default function MembershipBilling() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAck, setCancelAck] = useState(false);
  const [msg, setMsg] = useState<{ text: string; good?: boolean } | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/account/snapshot");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load membership.");
      }
      const data = await res.json();
      setSnapshot(data.snapshot);
    } catch {
      setMsg({ text: "Failed to load membership details." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleConfirmCancel = async () => {
    if (!cancelAck) {
      alert("Please confirm you understand the cancellation terms.");
      return;
    }

    setCancelling(true);
    setMsg(null);

    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to cancel renewal.");
      }

      setShowCancelModal(false);
      setMsg({
        text: "Subscription renewal cancelled. Paid access remains active until the end of your billing cycle.",
        good: true,
      });
      await loadData();
    } catch (err: any) {
      setMsg({ text: err.message || "Failed to cancel renewal." });
    } finally {
      setCancelling(false);
    }
  };

  const isPaidPeriod =
    snapshot &&
    (snapshot.status === "active" ||
      snapshot.status === "cancelled" ||
      snapshot.status === "assessment" ||
      snapshot.status === "review" ||
      snapshot.status === "safety");

  const isCancelled = snapshot?.membership.cancelAtPeriodEnd || snapshot?.status === "cancelled";

  const formattedDate = snapshot?.membership.paidThrough
    ? new Date(snapshot.membership.paidThrough).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <AccessShell title="Membership" description="" hideSideArt>
      <main className="access-account-layout">
        <div className="access-crumb">ACCOUNT / MEMBERSHIP</div>
        <div className="access-account-head">
          <div>
            <h1>Membership & billing</h1>
            <p>Your coaching subscription, payment status and cancellation preferences.</p>
          </div>
          <Link href="/account" className="access-btn-secondary">
            ← Account overview
          </Link>
        </div>

        <nav className="access-nav-account" aria-label="Account navigation">
          <Link href="/account">Overview</Link>
          <Link className="active" href="/account/membership">
            Membership & billing
          </Link>
          <Link href="/waitlist">Waitlist</Link>
        </nav>

        {msg && (
          <div className={`access-alert ${msg.good ? "good" : "err"}`} role="alert">
            {msg.text}
          </div>
        )}

        <div className="access-account-grid">
          <section>
            <div className="access-account-intro">
              <div className="access-art-kicker" style={{ color: "var(--access-gold)" }}>
                ASCEND COACHING
              </div>
              <h2>
                ₦40,000{" "}
                <span style={{ fontWeight: 400, color: "var(--access-muted)", fontSize: "16px" }}>
                  / billing month
                </span>
              </h2>
              <p>
                The current founding price is provisional. ASCEND absorbs payment-processing fees.
              </p>
              <span className={`access-tag ${isPaidPeriod ? "green" : ""}`}>
                {isPaidPeriod
                  ? isCancelled
                    ? "Non-renewing"
                    : "Active subscription"
                  : "No active subscription"}
              </span>
            </div>

            <div className="access-action-card">
              <div className="access-art-kicker" style={{ color: "var(--access-gold)" }}>
                SUBSCRIPTION MANAGEMENT
              </div>
              <h3>{isCancelled ? "Your cancellation is recorded" : "Control your renewal"}</h3>
              <p>
                {isCancelled
                  ? "Future billing is disabled. Your paid-period access is retained until your cycle end date."
                  : "You may cancel before your renewal date. Cancellation stops future billing and preserves already-paid access. There is no subscription pause."}
              </p>

              <div className="access-button-row">
                {isPaidPeriod && !isCancelled && (
                  <button
                    type="button"
                    className="access-btn-secondary"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel future renewal
                  </button>
                )}
                <button
                  type="button"
                  className="access-btn-secondary"
                  onClick={() =>
                    setMsg({
                      text: "Payment method changes are routed through the secure payment provider.",
                      good: true,
                    })
                  }
                >
                  Update payment method
                </button>
              </div>

              <p className="access-fine-print" style={{ marginTop: "16px" }}>
                No raw bank-card details are collected by ASCEND. Transactions are handled through
                an approved payment provider.
              </p>
            </div>
          </section>

          <aside>
            <div className="access-action-card">
              <div className="access-art-kicker" style={{ color: "var(--access-gold)" }}>
                BILLING RECORD
              </div>
              <h3>Account summary</h3>
              <div className="access-muted-row">
                <span>Amount</span>
                <strong>₦40,000</strong>
              </div>
              <div className="access-muted-row">
                <span>Billing cadence</span>
                <strong>Monthly</strong>
              </div>
              <div className="access-muted-row">
                <span>Status</span>
                <strong>
                  {isPaidPeriod
                    ? isCancelled
                      ? "Non-renewing"
                      : "Paid · Active"
                    : "Not active"}
                </strong>
              </div>
              <div className="access-muted-row">
                <span>Paid through</span>
                <strong>{formattedDate || "Not scheduled"}</strong>
              </div>
            </div>

            <div className="access-action-card">
              <div className="access-art-kicker" style={{ color: "var(--access-gold)" }}>
                PAYMENT RECEIPTS
              </div>
              <h3>Receipts and transactions</h3>
              <p>
                Verified payment transaction history and provider receipts remain permanently
                accessible in your account.
              </p>
            </div>
          </aside>
        </div>

        {showCancelModal && (
          <div
            className="access-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm cancellation"
          >
            <div className="access-modal-panel">
              <div className="access-crumb">CONFIRM CANCELLATION</div>
              <h2>Stop your next renewal?</h2>
              <p className="access-fine-print" style={{ margin: "14px 0" }}>
                Cancellation takes effect at the end of your currently paid period ({formattedDate || "cycle end"}).
                You keep full coaching access until then.
              </p>

              <label className="access-cancel-check">
                <input
                  type="checkbox"
                  checked={cancelAck}
                  onChange={(e) => setCancelAck(e.target.checked)}
                />
                <span>
                  I understand future renewal will stop and no automatic partial-period refund is
                  created.
                </span>
              </label>

              <div className="access-button-row" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="access-btn-secondary"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                >
                  Keep membership
                </button>
                <button
                  type="button"
                  className="access-btn-main"
                  onClick={handleConfirmCancel}
                  disabled={cancelling || !cancelAck}
                >
                  {cancelling ? "Processing..." : "Confirm cancellation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AccessShell>
  );
}
