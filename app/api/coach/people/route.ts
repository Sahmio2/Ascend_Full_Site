import { getAuthorizedCoach } from "../../../../lib/coach-auth";
import { cleanText, ensureDatabase, getDatabase } from "../../../../lib/database";

export async function GET() {
  const coach = await getAuthorizedCoach();
  if (!coach) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureDatabase();
  const db = await getDatabase();
  const [people, activities, checkIns] = await Promise.all([
    db.prepare("SELECT * FROM people ORDER BY datetime(updated_at) DESC LIMIT 250").all(),
    db.prepare("SELECT * FROM activities ORDER BY datetime(created_at) DESC LIMIT 30").all(),
    db.prepare("SELECT * FROM check_ins ORDER BY datetime(created_at) DESC LIMIT 60").all(),
  ]);

  return Response.json({
    people: people.results,
    activities: activities.results,
    checkIns: checkIns.results,
  });
}

export async function POST(request: Request) {
  const coach = await getAuthorizedCoach();
  if (!coach) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const fullName = cleanText(body.fullName, 120);
  const email = cleanText(body.email, 160).toLowerCase();
  if (!fullName || !email) {
    return Response.json({ error: "Name and email are required." }, { status: 400 });
  }

  await ensureDatabase();
  const db = await getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(`INSERT INTO people (
      id, kind, status, full_name, email, whatsapp, primary_goal,
      phase, training_level, next_check_in, coach_note, created_at, updated_at
    ) VALUES (?, 'client', 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        id,
        fullName,
        email,
        cleanText(body.whatsapp, 60),
        cleanText(body.primaryGoal, 80),
        cleanText(body.phase, 80) || "Unassigned",
        cleanText(body.trainingLevel, 80) || "To assess",
        cleanText(body.nextCheckIn, 30),
        cleanText(body.coachNote, 1200),
        now,
        now,
      ),
    db.prepare("INSERT INTO activities (id, person_id, type, summary, created_at) VALUES (?, ?, 'client_added', ?, ?)")
      .bind(crypto.randomUUID(), id, `${fullName} was added to the active roster.`, now),
  ]);

  const person = await db.prepare("SELECT * FROM people WHERE id = ?").bind(id).first();
  return Response.json({ person }, { status: 201 });
}
