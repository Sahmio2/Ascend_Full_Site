"use client";

import { useEffect, useMemo, useState } from "react";
import PortalShell from "../components/PortalShell";
import { clientPortalAdapter } from "../data/clientPortalAdapter";
import { useClientPortalData } from "../data/useClientPortalData";
import type { PortalScope } from "../data/types";
import type { ProgressRecord, ProgressResponse } from "@/contracts/progress";

export default function ProgressPage({ scope }: { scope: PortalScope }) {
  const data = useClientPortalData(scope);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [notice, setNotice] = useState("");
  const [liveRecords, setLiveRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ bodyweight: "", sleep: "7", energy: "7", recovery: "7", nutrition: "85", reflection: "" });

  const fetchLiveProgress = async () => {
    if (scope !== "live") return;
    try {
      setLoading(true);
      const res = await fetch("/api/progress?metric=BODYWEIGHT_KG&period=12w", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      if (res.ok) {
        const json: ProgressResponse = await res.json();
        const sorted = [...json.records].sort(
          (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
        );
        setLiveRecords(sorted);
      }
    } catch (e) {
      console.error("Failed to fetch live progress", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProgress();
  }, [scope]);

  const bodyweightPoints = useMemo(() => {
    if (scope === "live" && liveRecords.length > 0) {
      return liveRecords.map((r) => ({
        date: r.measuredAt.slice(0, 10),
        weightKg: Number(r.value),
      }));
    }
    return data.progress.bodyweight;
  }, [scope, liveRecords, data.progress.bodyweight]);

  const start = bodyweightPoints[0]?.weightKg || 0;
  const latest = bodyweightPoints.at(-1)?.weightKg || start;
  const change = latest - start;
  const strength = useMemo(() => data.workouts.flatMap((workout) => workout.exercises).slice(0, 6).map((exercise) => ({ name: exercise.name, load: Math.max(...exercise.sets.map((set) => Number(set.load) || 0)) })), [data.workouts]);

  async function submitCheckIn() {
    const weight = Number(form.bodyweight);
    if (scope === "live" && weight) {
      try {
        const res = await fetch("/api/progress/observations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: window.location.origin,
          },
          body: JSON.stringify({
            requestId: crypto.randomUUID(),
            metric: "BODYWEIGHT_KG",
            value: weight,
            measuredAt: new Date().toISOString(),
          }),
        });
        if (res.ok) {
          setNotice("Measurement recorded to database.");
          await fetchLiveProgress();
          setShowCheckIn(false);
          return;
        } else if (res.status === 401) {
          setNotice("Session unauthenticated. Please sign in to record live data.");
          return;
        } else {
          const err = await res.json().catch(() => ({}));
          setNotice(`Error saving measurement: ${err.error || "Bad request"}`);
          return;
        }
      } catch (err) {
        setNotice("Network error saving measurement.");
        return;
      }
    }

    clientPortalAdapter.saveCheckIn(scope, {
      bodyweightKg: weight || null,
      sleep: Number(form.sleep),
      energy: Number(form.energy),
      recovery: Number(form.recovery),
      nutritionAdherence: Number(form.nutrition),
      reflection: form.reflection,
    });
    setNotice(scope === "live" ? "Check-in submitted." : "Check-in submitted. Your demo progress record is updated.");
    setShowCheckIn(false);
  }

  return (
    <PortalShell scope={scope} current="progress" clientName={data.client.fullName} phase={data.client.phaseName}>
      {notice && <div className="portal-notice" role="status"><span>Update</span><p>{notice}</p><button type="button" onClick={() => setNotice("")} aria-label="Dismiss update">×</button></div>}
      <section className="portal-page-heading">
        <div>
          <p className="portal-kicker">Progress & check-ins</p>
          <h1>Proof of the work.</h1>
          <p>See training consistency, strength progress and the feedback guiding your next week.</p>
        </div>
        <button className="portal-page-action" type="button" onClick={() => setShowCheckIn(true)}>Prepare check-in <span>→</span></button>
      </section>
      <section className="portal-overview portal-page-overview">
        <article>
          <span>Completed workouts</span>
          <strong>{String(data.workouts.filter((workout) => workout.completionStatus === "completed").length).padStart(2, "0")}</strong>
          <small>All recorded sessions</small>
        </article>
        <article>
          <span>Training adherence</span>
          <strong>{data.client.adherencePercent}%</strong>
          <small>Current block</small>
        </article>
        <article>
          <span>Live Observations</span>
          <strong>{scope === "live" ? (loading ? "..." : liveRecords.length) : "Demo"}</strong>
          <small>{scope === "live" ? "MySQL recorded entries" : "Sample dataset"}</small>
        </article>
      </section>
      <section className="portal-progress-layout">
        <div className="portal-panel portal-progress-chart">
          <header>
            <div>
              <p className="portal-kicker">Bodyweight trend</p>
              <h2>Moving with control.</h2>
            </div>
            <strong>{change.toFixed(1)} kg</strong>
          </header>
          <div className="portal-chart-bars">
            {bodyweightPoints.map((point, index) => {
              const weights = bodyweightPoints.map((item) => item.weightKg);
              const min = Math.min(...weights) - 0.5;
              const max = Math.max(...weights) + 0.5;
              const height = weights.length === 1 ? 60 : 32 + ((point.weightKg - min) / Math.max(0.1, max - min)) * 55;
              return <span key={`${point.date}-${index}`} style={{ height: `${height}%` }}><i>{point.weightKg} kg</i></span>;
            })}
          </div>
          <div className="portal-chart-labels">
            <span>{bodyweightPoints[0]?.date || "Start"}</span>
            <span>{bodyweightPoints.at(-1)?.date || "Latest"}</span>
          </div>
        </div>
        <aside className="portal-panel portal-checkin-summary">
          <p className="portal-kicker">Check-in readiness</p>
          <h2>Sunday, 10 August</h2>
          {data.progress.readiness.map((item) => <div key={item.label}><span>{item.label}</span><b>{item.status}</b></div>)}
          <button type="button" onClick={() => setShowCheckIn(true)}>Open check-in <span>→</span></button>
        </aside>
      </section>
      {showCheckIn && (
        <section className="portal-panel portal-checkin-form">
          <header>
            <div>
              <p className="portal-kicker">Weekly check-in</p>
              <h2>Tell your coach what the numbers cannot.</h2>
            </div>
            <button type="button" onClick={() => setShowCheckIn(false)} aria-label="Close check-in">×</button>
          </header>
          <div className="portal-checkin-fields">
            <label><span>Bodyweight (kg)</span><input type="number" step=".1" value={form.bodyweight} onChange={(event) => setForm({ ...form, bodyweight: event.target.value })} /></label>
            <label><span>Sleep / 10</span><input type="number" min="1" max="10" value={form.sleep} onChange={(event) => setForm({ ...form, sleep: event.target.value })} /></label>
            <label><span>Energy / 10</span><input type="number" min="1" max="10" value={form.energy} onChange={(event) => setForm({ ...form, energy: event.target.value })} /></label>
            <label><span>Recovery / 10</span><input type="number" min="1" max="10" value={form.recovery} onChange={(event) => setForm({ ...form, recovery: event.target.value })} /></label>
            <label><span>Nutrition adherence %</span><input type="number" min="0" max="100" value={form.nutrition} onChange={(event) => setForm({ ...form, nutrition: event.target.value })} /></label>
            <label className="wide"><span>Weekly reflection</span><textarea rows={4} value={form.reflection} onChange={(event) => setForm({ ...form, reflection: event.target.value })} /></label>
          </div>
          <button className="portal-primary-action" type="button" onClick={submitCheckIn}>Submit check-in →</button>
        </section>
      )}
      <section className="portal-lower-grid">
        <article className="portal-panel">
          <p className="portal-kicker">Strength progression</p>
          <div className="portal-target-list">{strength.map((item, index) => <div key={`${item.name}-${index}`}><span>{item.name}</span><strong>{item.load || "—"} kg</strong></div>)}</div>
        </article>
        <article className="portal-panel">
          <p className="portal-kicker">Progress photos</p>
          <h2>Visual record.</h2>
          <p>{data.progress.photoStatus}</p>
        </article>
      </section>
      <section className="portal-panel portal-history-panel">
        <header>
          <div>
            <p className="portal-kicker">Training history</p>
            <h2>Recent sessions</h2>
          </div>
          <strong>{data.workouts.length} logged</strong>
        </header>
        <div className="portal-history-table">
          {data.workouts.map((workout) => (
            <article key={workout.id}>
              <span>{workout.workoutDate}</span>
              <p>
                <strong>{workout.workoutName}</strong>
                <small>{workout.durationMinutes} minutes · Session RPE {workout.effortRating}</small>
                {workout.coachFeedback && <em>“{workout.coachFeedback}”</em>}
              </p>
              <b>Complete</b>
            </article>
          ))}
        </div>
      </section>
      <section className="portal-panel portal-history-panel">
        <header>
          <div>
            <p className="portal-kicker">Coach feedback history</p>
            <h2>Direction, preserved.</h2>
          </div>
        </header>
        <div className="portal-history-table">
          {data.coachFeedback.map((feedback) => (
            <article key={feedback.id}>
              <span>{feedback.date}</span>
              <p><strong>{data.client.coachName}</strong><em>“{feedback.message}”</em></p>
              <b>Reviewed</b>
            </article>
          ))}
        </div>
      </section>
    </PortalShell>
  );
}
