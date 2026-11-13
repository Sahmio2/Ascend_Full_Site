"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccessShell from "./AccessShell";
import type { AccountSnapshot } from "@/server/auth";

export default function AccountOverview() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);
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

        <div className="access-account-intro">
          <div className={`access-tag ${snapshot.badgeVariant}`}>{snapshot.badge}</div>
          <h2>{snapshot.statusTitle}</h2>
          <p>{snapshot.statusDescription}</p>
          <div className="access-button-row" style={{ maxWidth: "380px" }}>
            <Link href={snapshot.statusActionPath} className="access-btn-main">
              {snapshot.statusActionLabel} →
            </Link>
          </div>
        </div>

        <div className="access-account-grid">
          <div>
            <div className="access-cardset">
              <div className="access-small-card">
                <div className="smallcap">Membership status</div>
                <div className="big">{snapshot.badge}</div>
                <div className="micro">Authoritative account status</div>
              </div>
              <div className="access-small-card">
                <div className="smallcap">Next coaching step</div>
                <div className="big" style={{ fontSize: "18px" }}>
                  {snapshot.statusActionLabel}
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
