"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authStore } from "../../services/authStore";

export default function ClientLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleClientLogin(e: FormEvent) {
    e.preventDefault();
    if (email && password) {
      setLoading(true);
      try {
        await fetch("/api/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: window.location.origin,
          },
          body: JSON.stringify({ email, password }),
        });
      } catch (err) {
        console.error("Failed to establish server session", err);
      }
      authStore.setSession({
        role: "client",
        mode: "live",
        clientEmail: email,
        clientName: email.split("@")[0],
      });
      router.push("/client/dashboard");
    }
  }

  function handleDemoLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    authStore.setSession({
      role: "client",
      mode: "demo",
      clientEmail: "demo@ascend.co",
      clientName: "Amara Okeke",
    });
    window.setTimeout(() => router.push("/demo/dashboard"), 450);
  }

  return (
    <main className="demo-login">
      <Link className="wordmark" href="/"><span>ASCEND</span></Link>
      <section className="demo-login-card unified-login-card">
        <div className="demo-login-copy">
          <p className="eyebrow">ASCEND by Sahmi El</p>
          <h1>Client Access</h1>
          <p>Active clients can enter their private workspace. If you are reviewing ASCEND, use the demo athlete details to inspect the complete client experience.</p>
          
          <form onSubmit={handleClientLogin} style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--gd-text-muted)" }}>Client Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ padding: "10px", background: "rgba(0,0,0,0.4)", border: "1px solid var(--gd-line-soft)", color: "#fff", borderRadius: "4px" }}
            />
            <label style={{ fontSize: "0.8rem", color: "var(--gd-text-muted)" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ padding: "10px", background: "rgba(0,0,0,0.4)", border: "1px solid var(--gd-line-soft)", color: "#fff", borderRadius: "4px" }}
            />
            <button className="button button-ivory client-signin-button" type="submit">Client sign in →</button>
          </form>

          <small className="client-signin-note" style={{ marginTop: "12px", display: "block" }}>Use the email connected to your ASCEND client record.</small>
          <ul><li>BMI &amp; energy calculators</li><li>Training and nutrition documents</li><li>Programme-loaded workout logging</li><li>Previous weights and coach feedback</li></ul>
        </div>
        <form onSubmit={handleDemoLogin}>
          <span className="demo-lock">◆</span>
          <h2>Demo client login</h2>
          <p>Use these demo credentials to inspect every client feature.</p>
          <label><span>Email</span><input value="demo@ascend.co" readOnly /></label>
          <label><span>Password</span><input value="ascend-demo" type="password" readOnly /></label>
          <button className="button button-gold" type="submit" disabled={loading}>{loading ? "Opening workspace…" : "Login to demo →"}</button>
          <small>Demo actions are temporary and do not affect real client records.</small>
        </form>
      </section>
    </main>
  );
}
