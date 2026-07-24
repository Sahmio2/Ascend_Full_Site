import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "../chatgpt-auth";
import { getAuthorizedClient } from "../../lib/client-auth";
import ClientWorkspace from "./ClientWorkspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Client Login", description: "Your private Get Divine training experience." };

export default async function ClientPage() {
  const signedIn = process.env.NODE_ENV === "development" ? null : await getChatGPTUser();
  if (process.env.NODE_ENV !== "development" && !signedIn) redirect(chatGPTSignInPath("/client"));
  const client = await getAuthorizedClient();
  if (!client) {
    return (
      <main className="client-access-state">
        <Link className="wordmark" href="/"><span>GET</span> DIVINE</Link>
        <p className="eyebrow">Client access</p>
        <h1>Your account is signed in.</h1>
        <p>This email is not connected to an active Get Divine client record yet. Ask your coach to use the same email address you use for ChatGPT.</p>
        <div><Link className="button button-outline" href="/">Return home</Link><a className="button button-gold" href={chatGPTSignOutPath("/client")}>Use another account</a></div>
      </main>
    );
  }
  return <ClientWorkspace clientName={client.displayName} signOutPath={chatGPTSignOutPath("/")} />;
}
