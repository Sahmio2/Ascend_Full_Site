import CoachLoginForm from "@/features/ascend/access/CoachLoginForm";

export const metadata = {
  title: "ASCEND · Coach Access",
  description: "Restricted sign-in for Sahmi's coaching workspace.",
};

export default function CoachLoginPage() {
  return <CoachLoginForm />;
}
