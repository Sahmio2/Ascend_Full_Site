import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { tokenHash, sessionIsActive } from "@/server/auth";
import NineStageAssessment from "@/features/ascend/public-apply/assessment/NineStageAssessment";

export const metadata = {
  title: "ASCEND · Nine-Stage Private Assessment",
  description: "Complete your nine-stage intake for Coach Sahmi El.",
};

export default async function ApplyPage() {
  const cookieJar = await cookies();
  const token = cookieJar.get("ascend_session")?.value;
  let user: any = null;

  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const session = await db().session.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: {
        user: {
          include: {
            screening: true,
            membership: true,
          },
        },
      },
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
        fullName: user.screening?.firstName || user.email.split("@")[0],
        whatsapp: user.screening?.whatsappNumber || "",
        goal: user.screening?.mainGoal || "",
        experience: user.screening?.gymExperience || "",
      }}
    />
  );
}
