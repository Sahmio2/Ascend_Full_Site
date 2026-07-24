type RuntimeEnv = {
  DB?: D1Database;
  COACH_EMAILS?: string;
};

let ready = false;

async function getRuntimeEnv(): Promise<RuntimeEnv> {
  const workers = await import("cloudflare:workers");
  return workers.env as unknown as RuntimeEnv;
}

export async function getDatabase(): Promise<D1Database> {
  const runtime = await getRuntimeEnv();
  if (!runtime.DB) {
    throw new Error("The Get Divine database is not available.");
  }
  return runtime.DB;
}

export async function getCoachEmailAllowlist(): Promise<string[]> {
  const runtime = await getRuntimeEnv();
  return (runtime.COACH_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function ensureDatabase() {
  if (ready) return;
  const db = await getDatabase();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL DEFAULT 'lead',
      status TEXT NOT NULL DEFAULT 'new',
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      whatsapp TEXT NOT NULL DEFAULT '',
      city_country TEXT NOT NULL DEFAULT '',
      age TEXT NOT NULL DEFAULT '',
      height TEXT NOT NULL DEFAULT '',
      bodyweight TEXT NOT NULL DEFAULT '',
      primary_goal TEXT NOT NULL DEFAULT '',
      goal_detail TEXT NOT NULL DEFAULT '',
      goal_urgency INTEGER NOT NULL DEFAULT 5,
      training_age TEXT NOT NULL DEFAULT '',
      preferred_frequency TEXT NOT NULL DEFAULT '',
      session_length TEXT NOT NULL DEFAULT '',
      access_type TEXT NOT NULL DEFAULT '',
      days_available TEXT NOT NULL DEFAULT '[]',
      equipment TEXT NOT NULL DEFAULT '[]',
      pain_context TEXT NOT NULL DEFAULT '',
      consistency_barrier TEXT NOT NULL DEFAULT '',
      tracking_readiness TEXT NOT NULL DEFAULT '[]',
      phase TEXT NOT NULL DEFAULT 'Unassigned',
      training_level TEXT NOT NULL DEFAULT 'To assess',
      next_check_in TEXT NOT NULL DEFAULT '',
      coach_note TEXT NOT NULL DEFAULT '',
      application_data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      week_of TEXT NOT NULL,
      workouts_completed INTEGER NOT NULL DEFAULT 0,
      workouts_planned INTEGER NOT NULL DEFAULT 0,
      average_bodyweight TEXT NOT NULL DEFAULT '',
      protein_days INTEGER NOT NULL DEFAULT 0,
      average_sleep TEXT NOT NULL DEFAULT '',
      recovery TEXT NOT NULL DEFAULT 'Normal',
      pain_soreness TEXT NOT NULL DEFAULT '',
      coach_response TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      type TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS program_assignments (
      id TEXT PRIMARY KEY, person_id TEXT NOT NULL, title TEXT NOT NULL,
      phase TEXT NOT NULL DEFAULT 'Taming the Flesh', days_per_week INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'draft', starts_on TEXT NOT NULL DEFAULT '',
      ends_on TEXT NOT NULL DEFAULT '', coach_instructions TEXT NOT NULL DEFAULT '',
      athlete_instructions TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY, person_id TEXT NOT NULL, assignment_id TEXT NOT NULL DEFAULT '',
      workout_date TEXT NOT NULL, workout_name TEXT NOT NULL,
      completion_status TEXT NOT NULL DEFAULT 'planned', duration_minutes INTEGER NOT NULL DEFAULT 0,
      effort_rating INTEGER NOT NULL DEFAULT 0, athlete_note TEXT NOT NULL DEFAULT '',
      coach_feedback TEXT NOT NULL DEFAULT '', exercise_log TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS progress_entries (
      id TEXT PRIMARY KEY, person_id TEXT NOT NULL, recorded_on TEXT NOT NULL,
      bodyweight TEXT NOT NULL DEFAULT '', waist TEXT NOT NULL DEFAULT '',
      chest TEXT NOT NULL DEFAULT '', hips TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY, person_id TEXT NOT NULL,
      plan_name TEXT NOT NULL DEFAULT 'Get Divine Coaching', status TEXT NOT NULL DEFAULT 'pending',
      amount_minor INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'NGN',
      renews_on TEXT NOT NULL DEFAULT '', provider_reference TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS people_status_idx ON people(status)"),
    db.prepare("CREATE INDEX IF NOT EXISTS people_kind_idx ON people(kind)"),
    db.prepare("CREATE INDEX IF NOT EXISTS check_ins_person_idx ON check_ins(person_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS activities_person_idx ON activities(person_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS assignments_person_idx ON program_assignments(person_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS workouts_person_date_idx ON workout_sessions(person_id, workout_date)"),
    db.prepare("CREATE INDEX IF NOT EXISTS progress_person_date_idx ON progress_entries(person_id, recorded_on)"),
    db.prepare("CREATE INDEX IF NOT EXISTS subscriptions_person_idx ON subscriptions(person_id)"),
  ]);
  ready = true;
}

export function parseList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 30);
  }
  return [];
}

export function cleanText(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
