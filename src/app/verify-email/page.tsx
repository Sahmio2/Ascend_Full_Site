import { Suspense } from "react";
import VerifyEmailForm from "@/features/ascend/access/VerifyEmailForm";

export const metadata = {
  title: "ASCEND · Verify Email",
  description: "Verify your one-time sign-in code.",
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading verification...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
