import { Suspense } from "react";
import CoachVerifyForm from "@/features/ascend/access/CoachVerifyForm";

export const metadata = {
  title: "ASCEND · Coach MFA Verification",
  description: "Second factor verification for coach studio access.",
};

export default function CoachVerifyPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading coach verification...</div>}>
      <CoachVerifyForm />
    </Suspense>
  );
}
