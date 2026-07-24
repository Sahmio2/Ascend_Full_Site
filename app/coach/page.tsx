import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
  type ChatGPTUser,
} from "../chatgpt-auth";
import { getCoachEmailAllowlist } from "../../lib/database";
import CoachDashboard from "./CoachDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coach Command Centre",
  description: "Private Get Divine coaching operations.",
};

export default async function CoachPage() {
  let user: ChatGPTUser | null = null;

  if (process.env.NODE_ENV === "development") {
    user = {
      displayName: "Sahmi El",
      email: "preview@getdivine.local",
      fullName: "Sahmi El",
    };
  } else {
    user = await getChatGPTUser();
    if (!user) redirect(chatGPTSignInPath("/coach"));
    const allowlist = await getCoachEmailAllowlist();
    if (!allowlist.includes(user.email.toLowerCase())) {
      return (
        <main className="coach-denied">
          <p className="eyebrow">Private Get Divine workspace</p>
          <h1>This area is reserved for the coaching team.</h1>
          <p>Your account is signed in, but it is not authorised to view confidential athlete records.</p>
          <div>
            <Link className="button button-outline" href="/">Return home</Link>
            <a className="button button-gold" href={chatGPTSignOutPath("/")}>Sign out</a>
          </div>
        </main>
      );
    }
  }

  return <CoachDashboard coachName={user.displayName} signOutPath={chatGPTSignOutPath("/")} />;
}
