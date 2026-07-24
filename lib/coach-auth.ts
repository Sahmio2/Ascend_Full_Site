import { getChatGPTUser, type ChatGPTUser } from "../app/chatgpt-auth";
import { getCoachEmailAllowlist } from "./database";

export async function getAuthorizedCoach(): Promise<ChatGPTUser | null> {
  const user = await getChatGPTUser();

  if (process.env.NODE_ENV === "development" && !user) {
    return {
      displayName: "Sahmi El",
      email: "preview@getdivine.local",
      fullName: "Sahmi El",
    };
  }

  if (!user) return null;
  const allowlist = await getCoachEmailAllowlist();
  if (!allowlist.includes(user.email.toLowerCase())) return null;
  return user;
}
