import { getAuthorizedClient } from "../../../lib/client-auth";
import { ensureDatabase, getDatabase } from "../../../lib/database";

const sample = {
  person: { full_name: "Amara O.", phase: "Forging the Form", primary_goal: "Body recomposition", next_check_in: "2026-07-31" },
  assignments: [{ id: "sample-assignment", title: "Ascension Block 01", phase: "Forging the Form", days_per_week: 4, status: "active", starts_on: "2026-07-20", ends_on: "2026-08-16", athlete_instructions: "Move with control, record every working set, and stop any movement that creates sharp pain." }],
  workouts: [],
};

export async function GET() {
  const client = await getAuthorizedClient();
  if (!client) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (client.personId === "sample-client") return Response.json(sample);
  await ensureDatabase();
  const db = await getDatabase();
  const [person, assignments, workouts] = await Promise.all([
    db.prepare("SELECT id, full_name, phase, primary_goal, next_check_in FROM people WHERE id = ?").bind(client.personId).first(),
    db.prepare("SELECT id, title, phase, days_per_week, status, starts_on, ends_on, athlete_instructions FROM program_assignments WHERE person_id = ? ORDER BY datetime(updated_at) DESC").bind(client.personId).all(),
    db.prepare("SELECT id, workout_date, workout_name, completion_status, duration_minutes, effort_rating, athlete_note, coach_feedback, exercise_log FROM workout_sessions WHERE person_id = ? ORDER BY date(workout_date) DESC, datetime(created_at) DESC LIMIT 50").bind(client.personId).all(),
  ]);
  return Response.json({ person, assignments: assignments.results, workouts: workouts.results });
}
