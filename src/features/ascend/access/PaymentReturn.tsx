"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccessShell from "./AccessShell";

const messages = {
  pending: "Paystack is still processing your payment. Check its status before trying checkout again.",
  unsuccessful: "Payment was not completed. Return to your account to see your membership options.",
  invalid: "This payment could not be matched to your account. Return to Account Overview to check your membership.",
  retry: "We couldn’t check the payment right now. Try checking its status again.",
  signedOut: "Sign in again to see your membership status.",
  missing: "There’s no payment reference to check. Return to your account to see your membership status.",
} as const;

export default function PaymentReturn({ reference }: { reference?: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<keyof typeof messages | "checking">(reference ? "checking" : "missing");

  useEffect(() => {
    if (!reference) return;
    const controller = new AbortController();
    const paymentReference = reference;

    async function checkPayment() {
      try {
        const response = await fetch(`/api/billing/verify?reference=${encodeURIComponent(paymentReference)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (response.ok && result.status === "ACTIVE") {
          router.replace("/account");
        } else if (response.status === 202) {
          setState("pending");
        } else if (response.status === 402) {
          setState("unsuccessful");
        } else if (response.status === 401) {
          setState("signedOut");
        } else if ([400, 404, 409].includes(response.status)) {
          setState("invalid");
        } else {
          setState("retry");
        }
      } catch {
        if (!controller.signal.aborted) setState("retry");
      }
    }

    void checkPayment();
    return () => controller.abort();
  }, [attempt, reference, router]);

  return (
    <AccessShell title="Membership payment" description="" hideSideArt accountOverview>
      <main className="account-overview">
        <div className="account-overview-container">
          <section className="account-overview-card">
              <h2>Membership payment</h2>
              <p role="status">
                {state === "checking" ? "Verifying your payment…" : messages[state]}
              </p>
              {(state === "pending" || state === "retry") && (
                <div className="account-overview-actions">
                  <button type="button" className="account-overview-btn-primary" onClick={() => {
                    setState("checking");
                    setAttempt(value => value + 1);
                  }}>
                    Check payment status
                  </button>
                </div>
              )}
              {state !== "checking" && (
                <div className="account-overview-journey">
                  <Link href={state === "signedOut" ? "/login" : "/account"} className="account-overview-pay">
                    {state === "signedOut" ? "Sign in" : "Back to Account Overview"}
                  </Link>
                </div>
              )}
          </section>
        </div>
      </main>
    </AccessShell>
  );
}
