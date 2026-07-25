import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authStore } from "../services/authStore";

export default function CoachLoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const res = authStore.loginAsCoach(passcode);
    if (res.success) {
      navigate("/coach");
    } else {
      setError(res.message);
    }
  }

  return (
    <main className="public-site" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <header className="public-nav shell" style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <Link className="wordmark" to="/">
          <span>GET</span> DIVINE
        </Link>
        <Link className="quiet-link" to="/">
          Return to site
        </Link>
      </header>

      <div className="shell" style={{ maxWidth: "480px", margin: "0 auto", padding: "100px 20px 40px" }}>
        <div style={{ background: "rgba(18, 18, 20, 0.85)", border: "1px solid rgba(212, 175, 55, 0.2)", borderRadius: "12px", padding: "40px 32px", backdropFilter: "blur(12px)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <span className="eyebrow" style={{ color: "#d4af37", fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase" }}>
              Private Coach Portal
            </span>
            <h1 style={{ fontSize: "1.8rem", margin: "12px 0 8px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              Staff Access
            </h1>
            <p style={{ color: "#8a8a93", fontSize: "0.9rem" }}>
              Enter your coach passcode to manage athletes and applications.
            </p>
          </div>

          {error && (
            <div style={{ background: "rgba(220, 38, 38, 0.15)", border: "1px solid rgba(220, 38, 38, 0.4)", color: "#f87171", padding: "12px 16px", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "20px", textAlign: "center" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "1px", color: "#a1a1aa", marginBottom: "8px" }}>
                Coach Security Passcode
              </label>

              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "#09090b",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "1rem",
                  letterSpacing: "3px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <button
              type="submit"
              className="button button-gold"
              style={{ width: "100%", padding: "14px", fontSize: "0.95rem", justifyContent: "center", cursor: "pointer", marginTop: "8px" }}
            >
              Access Dashboard →
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <small style={{ color: "#52525b", fontSize: "0.78rem" }}>
              Get Divine System v2.4 · Authorized personnel only
            </small>
          </div>
        </div>
      </div>
    </main>
  );
}
