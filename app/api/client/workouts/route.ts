import { getAuthorizedClient } from "../../../../lib/client-auth";
import { cleanText, ensureDatabase, getDatabase } from "../../../../lib/database";

export async function POST(request: Request) {
  const client = await getAuthorizedClient();
  if (!client) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (client.personId === "sample-client") return Response.json({ ok: true, sample: true }, { status: 201 });
  const body = await request.json() as Record<string, unknown>;
  const workoutName = cleanText(body.workoutName, 120);
  const workoutDate = cleanText(body.workoutDate, 30);
  if (!workoutName || !workoutDate) return Response.json({ error: "Workout name and date are required." }, { status: 400 });
  const rawExercises = Array.isArray(body.exercises) ? body.exercises : [];
  const exerciseLog = rawExercises.slice(0, 30).map((item) => {
    const exercise = item as { name?: unknown; sets?: unknown };
    return {
      name: cleanText(exercise.name, 120),
      sets: (Array.isArray(exercise.sets) ? exercise.sets : []).slice(0, 12).map((raw) => {
        const set = raw as Record<string, unknown>;
        return { set: Math.max(1, Number(set.set) || 1), reps: cleanText(set.reps, 20), load: cleanText(set.load, 30), rir: cleanText(set.rir, 20) };
      }),
    };
  }).filter((item) => item.name);
  if (!exerciseLog.length) return Response.json({ error: "Add at least one exercise." }, { status: 400 });
  await ensureDatabase();
  const db = await getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(`INSERT INTO workout_sessions
      (id, person_id, assignment_id, workout_date, workout_name, completion_status, duration_minutes, effort_rating, athlete_note, exercise_log, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?)`)
      .bind(id, client.personId, cleanText(body.assignmentId, 80), workoutDate, workoutName,
        Math.max(0, Math.min(300, Number(body.durationMinutes) || 0)),
        Math.max(0, Math.min(10, Number(body.effortRating) || 0)),
        cleanText(body.athleteNote, 1500), JSON.stringify(exerciseLog), now, now),
    db.prepare("INSERT INTO activities (id, person_id, type, summary, created_at) VALUES (?, ?, 'workout_completed', ?, ?)")
      .bind(crypto.randomUUID(), client.personId, `${workoutName} was completed and logged.`, now),
  ]);
  return Response.json({ ok: true, id }, { status: 201 });
}
