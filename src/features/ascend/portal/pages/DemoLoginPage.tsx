import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { beginGetDivineDemoSession, clientPortalAdapter } from "../data/clientPortalAdapter";

export default function DemoLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@ascend.co");
  const [password, setPassword] = useState("ascend-demo");
  const [notice, setNotice] = useState("");

  function enter(event: FormEvent) {
    event.preventDefault();
    if (email.trim().toLowerCase() !== "demo@ascend.co" || password !== "ascend-demo") {
      setNotice("Use the prefilled demo credentials to inspect the client experience.");
      return;
    }
    beginGetDivineDemoSession();
    navigate("/demo/dashboard");
  }

  return (
    <main className="demo-login">
      <Link className="wordmark" to="/"><span>ASCEND</span></Link>
      <section className="demo-login-card unified-login-card">
        <div className="demo-login-copy"><p className="eyebrow">ASCEND by Sahmi El</p><h1>Client Access</h1><p>Sign in to continue your ASCEND coaching experience. The demo remains available for anyone reviewing the complete client workspace.</p><Link className="button button-ivory client-signin-button" to="/client/dashboard">Client sign in →</Link><small className="client-signin-note">Use the email connected to your ASCEND client record.</small><ul><li>BMI &amp; energy calculators</li><li>Training and nutrition documents</li><li>Programme-loaded workout logging</li><li>Previous weights and coach feedback</li></ul></div>
        <form onSubmit={enter}><span className="demo-lock">◆</span><h2>Demo client login</h2><p>Use these demo credentials to inspect every client feature.</p>{notice && <div className="portal-notice" role="alert"><p>{notice}</p></div>}<label><span>Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" /></label><label><span>Password</span><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" /></label><button className="button button-gold" type="submit">Login to demo →</button><button className="demo-reset-button" type="button" onClick={() => { clientPortalAdapter.resetDemo(); setNotice("Demo data restored to its original populated state."); }}>Reset demo data</button><small>Demo actions are temporary and do not affect real client records.</small><div className="applicant-route"><p>Not currently an ASCEND client?</p><Link to="/apply">Apply for Coaching →</Link></div></form>
      </section>
    </main>
  );
}
