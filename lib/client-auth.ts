import { getChatGPTUser, type ChatGPTUser } from "../app/chatgpt-auth";
import { ensureDatabase, getDatabase } from "./database";

export type ClientIdentity = ChatGPTUser & { personId: string };

export async function getAuthorizedClient(): Promise<ClientIdentity | null> {
  const user = await getChatGPTUser();
  if (process.env.NODE_ENV === "development" && !user) {
    return {
      displayName: "Amara O.",
      email: "amara@example.com",
      fullName: "Amara O.",
      personId: "sample-client",
    };
  }
  if (!user) return null;
  await ensureDatabase();
  const db = await getDatabase();
  const person = await db
    .prepare("SELECT id FROM people WHERE lower(email) = ? AND kind = 'client' AND status IN ('active','paused') LIMIT 1")
    .bind(user.email.toLowerCase())
    .first<{ id: string }>();
  return person ? { ...user, personId: person.id } : null;
}
