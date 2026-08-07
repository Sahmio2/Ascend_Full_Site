import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authStore } from "../../services/authStore";

export default function CoachLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleCoachLogin(e: FormEvent) {
    e.preventDefault();
    if (email && password) {
      authStore.setSession({
        role: "coach",
        mode: "live",
        coachName: "Sahmi El",
      });
      navigate("/coach-portal");
    } else {
      setError("Please enter your coach credentials.");
    }
  }

  return (
    <main className="demo-login">
      <Link className="wordmark" to="/"><span>GET</span> DIVINE</Link>
      <section className="demo-login-card unified-login-card" style={{ maxWidth: "460px", margin: "40px auto" }}>
        <form onSubmit={handleCoachLogin} style={{ width: "100%" }}>
          <span className="demo-lock">◆</span>
          <h2>Coach Command Access</h2>
          <p>Restricted access for Sahmi El & Get Divine coaching team.</p>
          
          {error && <p style={{ color: "var(--gd-error)", fontSize: "0.85rem", marginBottom: "12px" }}>{error}</p>}

          <label>
            <span>Coach Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@getdivine.co"
              required
            />
          </label>
          
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <button className="button button-gold" type="submit" style={{ marginTop: "16px" }}>
            Enter Command Centre →
          </button>
        </form>
      </section>
    </main>
  );
}
