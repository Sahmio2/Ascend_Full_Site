"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccessShell from "./AccessShell";
import type { AccountSnapshot, AccountStatusKey } from "@/server/auth";

const membershipPath = "/account/membership";
const journeyLabel = "Begin your Ascension journey";
type OverviewAction = { label: string; href: string } | { label: string; guidance: string };

const overviewActions: Record<AccountStatusKey, OverviewAction | null> = {
  payment: null,
  active: { label: "Manage coaching membership", href: membershipPath },
  assessment: { label: journeyLabel, href: "/assessment" },
  review: { label: "Review submitted assessment", href: "/assessment" },
  cancelled: { label: "View cancellation details", href: `${membershipPath}#membership-renewal` },
  expired: { label: "View rejoining options", href: membershipPath },
  safety: {
    label: "View safety next steps",
    guidance: "Check the contact details you used to register for a message from Sahmi. If Sahmi has requested more information, reply there before continuing.",
  },
  guardian: {
    label: "View guardian requirements",
    guidance: "Ask a parent or legal guardian to help with verification. Wait for ASCEND to confirm consent before making a payment.",
  },
  waitlist: { label: "Join the waitlist", href: "/waitlist" },
  screening: { label: "View registration requirements", guidance: "A suitable training setup and readiness to begin are required before you can continue with coaching." },
  under_16: { label: "Return to ASCEND", href: "/" },
};

const dateFormat = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "long",
  timeZone: "Africa/Lagos",
});

export default function AccountOverview() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSnapshot() {
      try {
        const response = await fetch("/api/account/snapshot", { signal: controller.signal });
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok) throw new Error("Account unavailable.");

        const data: { snapshot: AccountSnapshot } = await response.json();
        if (!controller.signal.aborted) {
          setSnapshot(data.snapshot);
          setLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadSnapshot();
    return () => controller.abort();
  }, [loadAttempt, router]);

  function retryLoad() {
    setLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  }

  async function handleCheckout() {
    setPaying(true);
    setCheckoutError(null);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST" });
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await response.json().catch(() => null);
      if (data?.error === "CAPACITY_FULL_FOUNDING_10" || data?.error === "CAPACITY_FULL_WEEKLY_3") {
        throw new Error("Coaching is currently at capacity. Check your account again before trying to pay.");
      }
      if (!response.ok || !data?.authorizationUrl) {
        throw new Error("Payment could not start. Please try again.");
      }
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Payment could not start. Please try again.");
      setPaying(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError(false);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok && response.status !== 401) throw new Error("Sign-out failed.");
      router.replace("/login");
    } catch {
      setSignOutError(true);
      setSigningOut(false);
    }
  }

  const needsPayment = snapshot?.status === "payment";
  const action = snapshot ? overviewActions[snapshot.status] : null;
  const actionHref = action && "href" in action ? action.href : null;
  const paidThrough = snapshot?.membership.paidThrough;

  return (
    <AccessShell title="Account overview" description="" hideSideArt accountOverview>
      <main className="account-overview">
        <div className="account-overview-container">
          <header className="account-overview-header">
            <div>
              <h1>Account overview</h1>
              {snapshot && <p>Welcome back, {snapshot.firstName}.</p>}
            </div>
            {snapshot && (
              <button
                type="button"
                className="account-overview-signout-btn"
                onClick={handleSignOut}
                disabled={signingOut || paying}
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            )}
          </header>

          {signOutError && (
            <p className="account-overview-error" role="alert">
              Sign-out failed. Please try again.
            </p>
          )}

          {loading ? (
            <div className="account-overview-card">
              <p role="status">Loading your account…</p>
            </div>
          ) : !snapshot ? (
            <section className="account-overview-card" aria-labelledby="account-load-error">
              <h2 id="account-load-error">We couldn’t load your account</h2>
              <p role="alert">Try again to see your coaching and membership details.</p>
              <div className="account-overview-actions">
                <button type="button" className="account-overview-btn-primary" onClick={retryLoad}>
                  Try again
                </button>
              </div>
            </section>
          ) : (
            <div className="account-overview-grid">
              <section className="account-overview-card account-overview-status-card" aria-labelledby="coaching-status">
                <span className="account-overview-badge" data-variant={snapshot.badgeVariant}>
                  {snapshot.badge}
                </span>
                <h2 id="coaching-status">{snapshot.statusTitle}</h2>
                <p id={needsPayment ? "journey-payment-note" : undefined}>{snapshot.statusDescription}</p>
                {needsPayment ? (
                  <div className="account-overview-journey">
                    <button type="button" className="account-overview-btn-primary" disabled aria-describedby="journey-payment-note">
                      {journeyLabel}
                    </button>
                    <button type="button" className="account-overview-pay" onClick={handleCheckout} disabled={paying || signingOut}>
                      {paying ? "Connecting to Paystack…" : `Pay membership · ${snapshot.membership.priceFormatted}/month`}
                    </button>
                  </div>
                ) : action && (
                  "href" in action ? (
                    <div className={snapshot.status === "assessment" ? "account-overview-journey" : "account-overview-actions"}>
                      <Link className="account-overview-btn-primary" href={action.href}>{action.label}</Link>
                      {snapshot.status === "assessment" && <p>Your progress is saved as you go.</p>}
                    </div>
                  ) : (
                    <details className="account-overview-guidance">
                      <summary className="account-overview-btn-primary">{action.label}</summary>
                      <p>{action.guidance}</p>
                    </details>
                  )
                )}
                {checkoutError && (
                  <p className="account-overview-error" role="alert" style={{ marginTop: "12px", marginBottom: "0" }}>
                    {checkoutError}
                  </p>
                )}
              </section>

              <section className="account-overview-card account-overview-details-card" aria-labelledby="account-details">
                <div className="account-overview-details-heading">
                  <h2 id="account-details">Membership &amp; billing</h2>
                  {actionHref?.split("#")[0] !== membershipPath && (
                    <Link href={membershipPath}>View billing →</Link>
                  )}
                </div>
                <div className="account-overview-details">
                  <dl>
                    {needsPayment ? (
                      <div>
                        <dt>Monthly membership</dt>
                        <dd>{snapshot.membership.priceFormatted}</dd>
                      </div>
                    ) : (
                      paidThrough && (
                        <div>
                          <dt>{snapshot.status === "expired" ? "Paid period ended" : "Paid through"}</dt>
                          <dd>
                            <time dateTime={paidThrough}>{dateFormat.format(new Date(paidThrough))}</time>
                          </dd>
                        </div>
                      )
                    )}
                    <div>
                      <dt>Account email</dt>
                      <dd>{snapshot.email}</dd>
                    </div>
                  </dl>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </AccessShell>
  );
}
