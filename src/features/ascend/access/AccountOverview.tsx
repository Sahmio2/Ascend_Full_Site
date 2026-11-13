"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccessShell from "./AccessShell";
import type { AccountSnapshot } from "@/server/auth";

const STATE_PREVIEWS: Record<
  string,
  {
    badge: string;
    badgeVariant: "green" | "red" | "";
    statusTitle: string;
    statusDescription: string;
    statusActionLabel: string;
    statusActionPath: string;
  }
> = {
  payment: {
    badge: "Not paid",
    badgeVariant: "",
    statusTitle: "Your membership is not yet active",
    statusDescription: "Your account is ready. Once eligibility and capacity requirements are met, you can review the membership offer and pay securely.",
    statusActionLabel: "View membership",
    statusActionPath: "/account/membership",
  },
  active: {
    badge: "Active coaching",
    badgeVariant: "green",
    statusTitle: "Your coaching is active",
    statusDescription: "Your approved plan is ready. Open Today to see the next useful action in your programme.",
    statusActionLabel: "Open client portal (Today & Meals)",
    statusActionPath: "/client/dashboard",
  },
  assessment: {
    badge: "Awaiting assessment",
    badgeVariant: "green",
    statusTitle: "Assessment to complete",
    statusDescription: "Your membership is confirmed. Finish the private nine-stage assessment to help Sahmi prepare your programme.",
    statusActionLabel: "Continue 9-stage assessment",
    statusActionPath: "/apply",
  },
  review: {
    badge: "In review",
    badgeVariant: "",
    statusTitle: "Programme under review",
    statusDescription: "Your completed assessment has been received. Sahmi will review your training and nutrition programme within five business days.",
    statusActionLabel: "View review status",
    statusActionPath: "/account",
  },
  cancelled: {
    badge: "Paid through · not renewing",
    badgeVariant: "",
    statusTitle: "Renewal cancelled",
    statusDescription: "Your subscription will not renew. Continue using the paid coaching period until the recorded end date.",
    statusActionLabel: "View membership",
    statusActionPath: "/account/membership",
  },
  expired: {
    badge: "Expired",
    badgeVariant: "",
    statusTitle: "Your paid period has ended",
    statusDescription: "You can still access permitted account and billing details. Rejoining coaching depends on current eligibility and available capacity.",
    statusActionLabel: "View membership options",
    statusActionPath: "/account/membership",
  },
  safety: {
    badge: "Safety hold",
    badgeVariant: "red",
    statusTitle: "Safety review required",
    statusDescription: "A coaching safety restriction is being reviewed. No new programme can be activated while this restriction remains.",
    statusActionLabel: "View required action",
    statusActionPath: "/account",
  },
  guardian: {
    badge: "Guardian consent pending",
    badgeVariant: "",
    statusTitle: "Guardian verification pending",
    statusDescription: "A verified parent or legal guardian must complete the required consent and payment steps before a minor can begin paid coaching.",
    statusActionLabel: "View next steps",
    statusActionPath: "/account",
  },
  waitlist: {
    badge: "Capacity full",
    badgeVariant: "",
    statusTitle: "Currently at capacity",
    statusDescription: "Your account is saved, but all coaching places are currently occupied or this week’s onboarding cap has been reached.",
    statusActionLabel: "Join optional waitlist",
    statusActionPath: "/waitlist",
  },
};

export default function AccountOverview() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);
  const [simulatedState, setSimulatedState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadSnapshot() {
      try {
        const res = await fetch("/api/account/snapshot");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to load account status.");
        }
        const data = await res.json();
        if (active) setSnapshot(data.snapshot);
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load account.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSnapshot();
    return () => {
      active = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Origin: window.location.origin },
      });
    } catch {}
    router.push("/login");
  };

  if (loading) {
    return (
      <AccessShell title="Loading..." description="Checking account status" hideSideArt>
        <div className="access-account-layout">
          <p>Verifying secure account credentials...</p>
        </div>
      </AccessShell>
    );
  }

  if (error || !snapshot) {
    return (
      <AccessShell title="Account Notice" description="Unable to load account" hideSideArt>
        <div className="access-account-layout">
          <div className="access-alert err">{error || "Account not found."}</div>
          <Link href="/login" className="access-btn-main" style={{ maxWidth: "240px" }}>
            Return to sign in →
          </Link>
        </div>
      </AccessShell>
    );
  }

  const activeView =
    simulatedState && STATE_PREVIEWS[simulatedState]
      ? {
          ...snapshot,
          ...STATE_PREVIEWS[simulatedState],
        }
      : snapshot;

  return (
    <AccessShell title="Account" description="" hideSideArt>
      <main className="access-account-layout">
        <div className="access-crumb">ACCOUNT / OVERVIEW</div>
        <div className="access-account-head">
          <div>
            <h1>Welcome back, {snapshot.firstName}.</h1>
            <p>Manage your membership and continue your ASCEND journey.</p>
          </div>
          <button type="button" className="access-btn-secondary" onClick={handleSignOut}>
            Sign out
          </button>
        </div>

        <nav className="access-nav-account" aria-label="Account navigation">
          <Link className="active" href="/account">
            Overview
          </Link>
          <Link href="/account/membership">Membership & billing</Link>
          <Link href="/waitlist">Waitlist</Link>
        </nav>

        {/* Dev State Switcher & Direct Portal Inspection */}
        <div
          style={{
            background: "rgba(223, 191, 119, 0.1)",
            border: "1px dashed rgba(223, 191, 119, 0.35)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ color: "var(--access-gold)", fontWeight: 700, fontSize: "12px", letterSpacing: "0.05em" }}>
              ⚡ PREVIEW CLIENT STATE:
            </span>
            <select
              value={simulatedState || snapshot.status}
              onChange={(e) => setSimulatedState(e.target.value)}
              style={{
                background: "var(--access-surface)",
                border: "1px solid var(--access-line)",
                color: "var(--access-ink)",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <option value="payment">Not Paid (Initial)</option>
              <option value="active">Active Coaching (Full Portal)</option>
              <option value="assessment">Awaiting 9-Stage Assessment</option>
              <option value="review">Programme In Review</option>
              <option value="cancelled">Renewal Cancelled</option>
              <option value="expired">Paid Period Expired</option>
              <option value="safety">Safety Hold</option>
              <option value="guardian">Guardian Pending</option>
              <option value="waitlist">Capacity Full / Waitlist</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Link
              href="/client/nutrition"
              className="access-btn-secondary"
              style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px", textDecoration: "none" }}
            >
              🍲 Open Meal Plan →
            </Link>
            <Link
              href="/client/dashboard"
              className="access-btn-secondary"
              style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px", textDecoration: "none" }}
            >
              ⚡ Open Today Portal →
            </Link>
          </div>
        </div>

        <div className="access-account-intro">
          <div className={`access-tag ${activeView.badgeVariant}`}>{activeView.badge}</div>
          <h2>{activeView.statusTitle}</h2>
          <p>{activeView.statusDescription}</p>
          <div className="access-button-row" style={{ maxWidth: "480px" }}>
            <Link href={activeView.statusActionPath} className="access-btn-main">
              {activeView.statusActionLabel} →
            </Link>
            {activeView.statusActionPath !== "/client/nutrition" && (
              <Link
                href="/client/nutrition"
                className="access-btn-secondary"
                style={{ textDecoration: "none", whiteSpace: "nowrap" }}
              >
                Inspect Meal Plan →
              </Link>
            )}
          </div>
        </div>

        <div className="access-account-grid">
          <div>
            <div className="access-cardset">
              <div className="access-small-card">
                <div className="smallcap">Membership status</div>
                <div className="big">{activeView.badge}</div>
                <div className="micro">Authoritative account status</div>
              </div>
              <div className="access-small-card">
                <div className="smallcap">Next coaching step</div>
                <div className="big" style={{ fontSize: "18px" }}>
                  {activeView.statusActionLabel}
                </div>
                <div className="micro">Server-determined next action</div>
              </div>
            </div>

            <div className="access-action-card">
              <div className="access-art-kicker" style={{ color: "var(--access-gold)" }}>
                YOUR ACCOUNT
              </div>
              <h3>One account. No repeated registration.</h3>
              <p>
                Your ten registration answers stay linked to the same account. Any private
                assessment, paid membership and coaching records belong to that verified account.
              </p>
              <Link href="/account/membership" className="access-btn-secondary">
                Manage membership →
              </Link>
            </div>
          </div>

          <aside className="access-action-card">
            <div className="access-art-kicker" style={{ color: "var(--access-gold)" }}>
              YOUR ACCESS
            </div>
            <h3>Coaching isn’t the same as logging in</h3>
            <p>
              Signing in verifies identity. Active programme access depends separately on paid
              membership, guardian requirements, approved plans and applicable safety
              restrictions.
            </p>
            <div className="access-muted-row">
              <span>Registration</span>
              <strong>Saved</strong>
            </div>
            <div className="access-muted-row">
              <span>Coaching access</span>
              <strong>{snapshot.clientPortalAccess ? "Active" : "Pending"}</strong>
            </div>
          </aside>
        </div>
      </main>
    </AccessShell>
  );
}
