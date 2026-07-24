import { getAuthorizedCoach } from "../../../../../lib/coach-auth";
import { cleanText, ensureDatabase, getDatabase } from "../../../../../lib/database";

const allowedStatus = new Set(["new", "qualified", "consultation", "active", "paused", "completed", "declined"]);
const allowedKind = new Set(["lead", "client"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const coach = await getAuthorizedCoach();
  if (!coach) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const status = cleanText(body.status, 30);
  const kind = cleanText(body.kind, 20);
  if (status && !allowedStatus.has(status)) {
    return Response.json({ error: "Unsupported status." }, { status: 400 });
  }
  if (kind && !allowedKind.has(kind)) {
    return Response.json({ error: "Unsupported record type." }, { status: 400 });
  }

  await ensureDatabase();
  const db = await getDatabase();
  const current = await db.prepare("SELECT * FROM people WHERE id = ?").bind(id).first<Record<string, unknown>>();
  if (!current) return Response.json({ error: "Record not found." }, { status: 404 });

  const nextStatus = status || String(current.status);
  const nextKind = kind || (nextStatus === "active" ? "client" : String(current.kind));
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(`UPDATE people SET
      kind = ?, status = ?, phase = ?, training_level = ?, next_check_in = ?,
      coach_note = ?, updated_at = ? WHERE id = ?`)
      .bind(
        nextKind,
        nextStatus,
        cleanText(body.phase, 80) || String(current.phase ?? "Unassigned"),
        cleanText(body.trainingLevel, 80) || String(current.training_level ?? "To assess"),
        body.nextCheckIn === undefined ? String(current.next_check_in ?? "") : cleanText(body.nextCheckIn, 30),
        body.coachNote === undefined ? String(current.coach_note ?? "") : cleanText(body.coachNote, 2000),
        now,
        id,
      ),
    db.prepare("INSERT INTO activities (id, person_id, type, summary, created_at) VALUES (?, ?, 'record_updated', ?, ?)")
      .bind(crypto.randomUUID(), id, `${String(current.full_name)} was updated to ${nextStatus}.`, now),
  ]);

  const person = await db.prepare("SELECT * FROM people WHERE id = ?").bind(id).first();
  return Response.json({ person });
}
