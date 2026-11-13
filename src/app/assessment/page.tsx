import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { tokenHash, sessionIsActive } from "@/server/auth";
import NineStageAssessment from "@/features/ascend/public-apply/assessment/NineStageAssessment";

export const metadata = {
  title: "ASCEND · Nine-Stage Private Assessment",
  description: "Complete your nine-stage intake for Coach Sahmi El.",
};

export default async function AssessmentPage() {
  const cookieJar = await cookies();
  const token = cookieJar.get("ascend_session")?.value;
  let user = null;

  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const session = await db().session.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { user: true },
    });
    if (sessionIsActive(session)) {
      user = session!.user;
    }
  }

  if (!user) {
    redirect("/register");
  }

  return (
    <NineStageAssessment
      prefillProfile={{
        email: user.email,
        fullName: user.email.split("@")[0],
      }}
    />
  );
}
