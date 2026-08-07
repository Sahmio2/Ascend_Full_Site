export type ExerciseSet = { set: number; reps: string; load: string; completed?: boolean; previousReps?: string; previousLoad?: string };
export type ProgrammeExercise = { id: string; name: string; type: string; prescribedSets: number; setPrescription: string; reps: string; rest: string; tempo: string; notes: string };
export type ProgrammeWorkout = { id: string; name: string; focus: string; optional: boolean; exercises: ProgrammeExercise[] };
export type Exercise = ProgrammeExercise & { sets: ExerciseSet[]; lastPerformedOn?: string; lastWorkoutName?: string };
export type Assignment = { id: string; title: string; phase: string; days_per_week: number; starts_on: string; ends_on: string; athlete_instructions: string; primary_workouts: string; optional_workouts: string; workout_plan: string; status: string };
export type Workout = { id: string; workout_date: string; workout_name: string; completion_status: string; duration_minutes: number; effort_rating: number; athlete_note: string; coach_feedback: string; exercise_log: string };
export type PlanDocument = { id: string; title: string; document_type: string; file_name: string; file_size: number; updated_at: string; demo?: boolean };
export type ClientData = { person: { full_name: string; phase: string; primary_goal: string; next_check_in: string }; assignments: Assignment[]; workouts: Workout[]; documents: PlanDocument[] };

export function parseSessions(value: string | undefined, fallback: string[]) {
  try {
    const sessions = JSON.parse(value || "[]");
    return Array.isArray(sessions) && sessions.length ? sessions.map(String) : fallback;
  } catch {
    return fallback;
  }
}

export function parseWorkoutPlan(value: string | undefined): ProgrammeWorkout[] {
  try {
    const plan = JSON.parse(value || "[]") as ProgrammeWorkout[];
    return Array.isArray(plan) ? plan.filter((workout) => workout?.name && Array.isArray(workout.exercises) && workout.exercises.length) : [];
  } catch {
    return [];
  }
}

export function dateLabel(value: string) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export type UserRole = "coach" | "client";
export type AuthMode = "live" | "demo";

export type AuthSession = {
  role: UserRole | null;
  mode: AuthMode;
  clientEmail?: string;
  clientId?: string;
  clientName?: string;
  coachName?: string;
};
