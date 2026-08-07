import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authStore } from "../../services/authStore";

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleClientLogin(e: FormEvent) {
    e.preventDefault();
    if (email && password) {
      authStore.setSession({
        role: "client",
        mode: "live",
        clientEmail: email,
        clientName: email.split("@")[0],
      });
      navigate("/client/dashboard");
    }
  }

  function handleDemoLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    authStore.setSession({
      role: "client",
      mode: "demo",
      clientEmail: "demo@getdivine.co",
      clientName: "Amara Okeke",
    });
    window.setTimeout(() => navigate("/demo/dashboard"), 450);
  }

  return (
    <main className="demo-login">
      <Link className="wordmark" to="/"><span>GET</span> DIVINE</Link>
      <section className="demo-login-card unified-login-card">
        <div className="demo-login-copy">
          <p className="eyebrow">Client access</p>
          <h1>One space for your coaching journey.</h1>
          <p>Active clients can enter their private workspace. If you are reviewing Get Divine, use the demo athlete details to inspect the complete client experience.</p>
          
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

          <small className="client-signin-note" style={{ marginTop: "12px", display: "block" }}>Use the email connected to your Get Divine client record.</small>
          <ul><li>BMI & energy calculators</li><li>Training and nutrition documents</li><li>Programme-loaded workout logging</li><li>Previous weights and coach feedback</li></ul>
        </div>
        <form onSubmit={handleDemoLogin}>
          <span className="demo-lock">◆</span>
          <h2>Demo client login</h2>
          <p>Use these demo credentials to inspect every client feature.</p>
          <label><span>Email</span><input value="demo@getdivine.co" readOnly /></label>
          <label><span>Password</span><input value="getdivine-demo" type="password" readOnly /></label>
          <button className="button button-gold" type="submit" disabled={loading}>{loading ? "Opening workspace…" : "Login to demo →"}</button>
          <small>Demo actions are temporary and do not affect real client records.</small>
        </form>
      </section>
    </main>
  );
}
