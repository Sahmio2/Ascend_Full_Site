import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const people = sqliteTable("people", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull().default("lead"),
  status: text("status").notNull().default("new"),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  whatsapp: text("whatsapp").notNull().default(""),
  cityCountry: text("city_country").notNull().default(""),
  age: text("age").notNull().default(""),
  height: text("height").notNull().default(""),
  bodyweight: text("bodyweight").notNull().default(""),
  primaryGoal: text("primary_goal").notNull().default(""),
  goalDetail: text("goal_detail").notNull().default(""),
  goalUrgency: integer("goal_urgency").notNull().default(5),
  trainingAge: text("training_age").notNull().default(""),
  preferredFrequency: text("preferred_frequency").notNull().default(""),
  sessionLength: text("session_length").notNull().default(""),
  accessType: text("access_type").notNull().default(""),
  daysAvailable: text("days_available").notNull().default("[]"),
  equipment: text("equipment").notNull().default("[]"),
  painContext: text("pain_context").notNull().default(""),
  consistencyBarrier: text("consistency_barrier").notNull().default(""),
  trackingReadiness: text("tracking_readiness").notNull().default("[]"),
  phase: text("phase").notNull().default("Unassigned"),
  trainingLevel: text("training_level").notNull().default("To assess"),
  nextCheckIn: text("next_check_in").notNull().default(""),
  coachNote: text("coach_note").notNull().default(""),
  applicationData: text("application_data").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const checkIns = sqliteTable("check_ins", {
  id: text("id").primaryKey(),
  personId: text("person_id").notNull(),
  weekOf: text("week_of").notNull(),
  workoutsCompleted: integer("workouts_completed").notNull().default(0),
  workoutsPlanned: integer("workouts_planned").notNull().default(0),
  averageBodyweight: text("average_bodyweight").notNull().default(""),
  proteinDays: integer("protein_days").notNull().default(0),
  averageSleep: text("average_sleep").notNull().default(""),
  recovery: text("recovery").notNull().default("Normal"),
  painSoreness: text("pain_soreness").notNull().default(""),
  coachResponse: text("coach_response").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  personId: text("person_id").notNull(),
  type: text("type").notNull(),
  summary: text("summary").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const programAssignments = sqliteTable("program_assignments", {
  id: text("id").primaryKey(),
  personId: text("person_id").notNull(),
  title: text("title").notNull(),
  phase: text("phase").notNull().default("Taming the Flesh"),
  daysPerWeek: integer("days_per_week").notNull().default(3),
  status: text("status").notNull().default("draft"),
  startsOn: text("starts_on").notNull().default(""),
  endsOn: text("ends_on").notNull().default(""),
  coachInstructions: text("coach_instructions").notNull().default(""),
  athleteInstructions: text("athlete_instructions").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workoutSessions = sqliteTable("workout_sessions", {
  id: text("id").primaryKey(),
  personId: text("person_id").notNull(),
  assignmentId: text("assignment_id").notNull().default(""),
  workoutDate: text("workout_date").notNull(),
  workoutName: text("workout_name").notNull(),
  completionStatus: text("completion_status").notNull().default("planned"),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  effortRating: integer("effort_rating").notNull().default(0),
  athleteNote: text("athlete_note").notNull().default(""),
  coachFeedback: text("coach_feedback").notNull().default(""),
  exerciseLog: text("exercise_log").notNull().default("[]"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const progressEntries = sqliteTable("progress_entries", {
  id: text("id").primaryKey(),
  personId: text("person_id").notNull(),
  recordedOn: text("recorded_on").notNull(),
  bodyweight: text("bodyweight").notNull().default(""),
  waist: text("waist").notNull().default(""),
  chest: text("chest").notNull().default(""),
  hips: text("hips").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  personId: text("person_id").notNull(),
  planName: text("plan_name").notNull().default("Get Divine Coaching"),
  status: text("status").notNull().default("pending"),
  amountMinor: integer("amount_minor").notNull().default(0),
  currency: text("currency").notNull().default("NGN"),
  renewsOn: text("renews_on").notNull().default(""),
  providerReference: text("provider_reference").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
