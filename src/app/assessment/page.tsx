import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { assessmentAccess, requireUser } from "@/server/auth";
import { ApiError } from "@/server/http";
import NineStageAssessment from "@/features/ascend/public-apply/assessment/NineStageAssessment";

export const metadata = {
  title: "ASCEND · Nine-Stage Private Assessment",
  description: "Complete your nine-stage intake for Coach Sahmi El.",
};

export default async function AssessmentPage() {
  let userId: string;
  try {
    userId = await requireUser();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/register");
    throw error;
  }

  const { allowed, screening } = await assessmentAccess(userId);
  if (!allowed) redirect("/account");

  const user = await db().user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) redirect("/register");

  return (
    <NineStageAssessment
      prefillProfile={{
        email: user.email,
        fullName: screening?.firstName || user.email.split("@")[0],
        whatsapp: screening?.whatsappNumber || "",
        goal: screening?.mainGoal || "",
        experience: screening?.gymExperience || "",
      }}
    />
  );
}
