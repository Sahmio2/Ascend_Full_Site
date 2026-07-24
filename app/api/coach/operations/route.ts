import { getAuthorizedCoach } from "../../../../lib/coach-auth";
import { cleanText, ensureDatabase, getDatabase } from "../../../../lib/database";

export async function GET() {
  const coach = await getAuthorizedCoach();
  if (!coach) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDatabase();
  const db = await getDatabase();
  const [assignments, workouts, progress, subscriptions] = await Promise.all([
    db.prepare(`SELECT pa.*, p.full_name FROM program_assignments pa
      JOIN people p ON p.id = pa.person_id ORDER BY datetime(pa.updated_at) DESC LIMIT 100`).all(),
    db.prepare(`SELECT ws.*, p.full_name FROM workout_sessions ws
      JOIN people p ON p.id = ws.person_id ORDER BY date(ws.workout_date) DESC LIMIT 100`).all(),
    db.prepare(`SELECT pe.*, p.full_name FROM progress_entries pe
      JOIN people p ON p.id = pe.person_id ORDER BY date(pe.recorded_on) DESC LIMIT 100`).all(),
    db.prepare(`SELECT s.*, p.full_name FROM subscriptions s
      JOIN people p ON p.id = s.person_id ORDER BY datetime(s.updated_at) DESC LIMIT 100`).all(),
  ]);
  return Response.json({
    assignments: assignments.results,
    workouts: workouts.results,
    progress: progress.results,
    subscriptions: subscriptions.results,
  });
}

export async function POST(request: Request) {
  const coach = await getAuthorizedCoach();
  if (!coach) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const personId = cleanText(body.personId, 80);
  const title = cleanText(body.title, 120);
  if (!personId || !title) return Response.json({ error: "Athlete and programme title are required." }, { status: 400 });
  await ensureDatabase();
  const db = await getDatabase();
  const person = await db.prepare("SELECT full_name FROM people WHERE id = ? AND kind = 'client'").bind(personId).first<{ full_name: string }>();
  if (!person) return Response.json({ error: "Active athlete not found." }, { status: 404 });
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(`INSERT INTO program_assignments
      (id, person_id, title, phase, days_per_week, status, starts_on, ends_on, coach_instructions, athlete_instructions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, personId, title, cleanText(body.phase, 80) || "Taming the Flesh",
        Math.max(1, Math.min(7, Number(body.daysPerWeek) || 3)), cleanText(body.status, 20) || "draft",
        cleanText(body.startsOn, 30), cleanText(body.endsOn, 30),
        cleanText(body.coachInstructions, 3000), cleanText(body.athleteInstructions, 3000), now, now),
    db.prepare("INSERT INTO activities (id, person_id, type, summary, created_at) VALUES (?, ?, 'programme_created', ?, ?)")
      .bind(crypto.randomUUID(), personId, `${title} was created for ${person.full_name}.`, now),
  ]);
  const assignment = await db.prepare("SELECT * FROM program_assignments WHERE id = ?").bind(id).first();
  return Response.json({ assignment }, { status: 201 });
}
