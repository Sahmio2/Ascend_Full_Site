import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { beginGetDivineDemoSession, clientPortalAdapter } from "../data/clientPortalAdapter";

export default function DemoLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@getdivine.co");
  const [password, setPassword] = useState("getdivine-demo");
  const [notice, setNotice] = useState("");

  function enter(event: FormEvent) {
    event.preventDefault();
    if (email.trim().toLowerCase() !== "demo@getdivine.co" || password !== "getdivine-demo") {
      setNotice("Use the prefilled demo credentials to inspect the client experience.");
      return;
    }
    beginGetDivineDemoSession();
    navigate("/demo/dashboard");
  }

  return (
    <main className="demo-login">
      <Link className="wordmark" to="/"><span>GET</span> DIVINE</Link>
      <section className="demo-login-card unified-login-card">
        <div className="demo-login-copy"><p className="eyebrow">Client access</p><h1>One space for your coaching journey.</h1><p>Active clients enter their private workspace. Use the demo athlete details to inspect the complete client experience.</p><Link className="button button-ivory client-signin-button" to="/client/dashboard">Client sign in →</Link><small className="client-signin-note">Use the email connected to your Get Divine client record.</small><ul><li>Health and energy calculators</li><li>Training, nutrition and meal logging</li><li>Programme-loaded workout logging</li><li>Previous weights, progress and coach feedback</li></ul></div>
        <form onSubmit={enter}><span className="demo-lock">◆</span><h2>Demo client login</h2><p>Use these credentials to inspect every client feature.</p>{notice && <div className="portal-notice" role="alert"><p>{notice}</p></div>}<label><span>Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" /></label><label><span>Password</span><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" /></label><button className="button button-gold" type="submit">Login to demo →</button><button className="demo-reset-button" type="button" onClick={() => { clientPortalAdapter.resetDemo(); setNotice("Demo data restored to its original populated state."); }}>Reset demo data</button><small>Demo actions stay separate from real client records.</small></form>
      </section>
    </main>
  );
}
