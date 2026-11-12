import { registerGetDivineLiveBridge } from "../features/ascend/portal/data/clientPortalAdapter";
import { createGetDivineDemoSeed } from "../features/ascend/portal/data/demoSeed";
import type { ClientPortalData, FoodEntryInput, WorkoutSessionInput, CheckInInput } from "../features/ascend/portal/data/types";

export type Person = {
  id: string;
  kind: "lead" | "client";
  status: string;
  full_name: string;
  email: string;
  whatsapp: string;
  city_country: string;
  age: string;
  primary_goal: string;
  goal_detail: string;
  goal_urgency: number;
  training_age: string;
  preferred_frequency: string;
  session_length: string;
  access_type: string;
  days_available: string;
  equipment: string;
  pain_context: string;
  consistency_barrier: string;
  tracking_readiness: string;
  phase: string;
  training_level: string;
  next_check_in: string;
  coach_note: string;
  created_at: string;
  updated_at: string;
  sample?: boolean;
};

export type Activity = { id: string; person_id: string; type: string; summary: string; created_at: string };
export type CheckIn = { id: string; person_id: string; week_of: string; workouts_completed: number; workouts_planned: number; recovery: string; pain_soreness: string; created_at: string };
export type Assignment = { id: string; person_id: string; full_name?: string; title: string; phase: string; days_per_week: number; status: string; starts_on: string; ends_on: string; athlete_instructions: string; updated_at: string };
export type ExerciseSet = { set: number; reps: string; load: string; rir: string };
export type Exercise = { name: string; sets: ExerciseSet[] };
export type Workout = { id: string; person_id: string; full_name?: string; workout_date: string; workout_name: string; completion_status: string; duration_minutes: number; effort_rating: number; athlete_note: string; coach_feedback: string; exercise_log: string };

export type WorkoutDayPlan = {
  day_title: string;
  notes?: string;
  exercises: {
    name: string;
    sets: string;
    reps: string;
    rir: string;
    notes?: string;
  }[];
};

export type NutritionPlan = {
  target_calories: number;
  maintenance_calories: number;
  deficit_calories: number;
  surplus_calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  hydration_liters: number;
  meal_structure: string[];
  supplements: string[];
  guidelines: string[];
};

export type PlanDocument = {
  id: string;
  person_id: string;
  title: string;
  document_type: "training" | "nutrition" | "overview";
  file_name: string;
  file_size: number;
  workout_days?: WorkoutDayPlan[];
  nutrition?: NutritionPlan;
  athlete_instructions?: string;
  status: "active" | "draft" | "archived";
  updated_at: string;
};

const STORAGE_KEYS = {
  PEOPLE: "gd_people_v1",
  ASSIGNMENTS: "gd_assignments_v1",
  WORKOUTS: "gd_workouts_v1",
  PLANS: "gd_plans_v1",
};

const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notify();
  } catch {
    // ignore
  }
}

const INITIAL_PEOPLE: Person[] = [
  {
    id: "client-1",
    kind: "client",
    status: "active",
    full_name: "Amara Okeke",
    email: "amara@example.com",
    whatsapp: "+234 800 000 0001",
    city_country: "Lagos, Nigeria",
    age: "28",
    primary_goal: "Body recomposition",
    goal_detail: "Build visible shape and regain consistency after a demanding work season.",
    goal_urgency: 9,
    training_age: "1–2 years",
    preferred_frequency: "4 days per week",
    session_length: "60 minutes",
    access_type: "Commercial gym",
    days_available: '["Mon","Tue","Thu","Sat"]',
    equipment: '["Barbell","Dumbbells","Cable machine","Leg press"]',
    pain_context: "No active pain. Previous mild wrist irritation with straight-bar curls.",
    consistency_barrier: "Late work meetings and missed meal preparation.",
    tracking_readiness: '["Workout loads and reps","Protein target days","Sleep and recovery"]',
    phase: "Phase II — Forging the Form",
    training_level: "Intermediate",
    next_check_in: "2026-08-10",
    coach_note: "Strong start. Keep lower-body volume stable for one more week before adding work.",
    created_at: "2026-06-03T09:00:00Z",
    updated_at: "2026-07-16T09:00:00Z",
    sample: true,
  },
];

const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: "assign-1",
    person_id: "client-1",
    full_name: "Amara Okeke",
    title: "Ascension Block 01 — Hypertrophy & Density",
    phase: "Phase II — Forging the Form",
    days_per_week: 4,
    status: "active",
    starts_on: "2026-07-20",
    ends_on: "2026-08-16",
    athlete_instructions: "Move with control, record every working set, and stop any movement that creates sharp pain.",
    updated_at: "2026-07-20T00:00:00Z",
  },
];

const INITIAL_PLANS: PlanDocument[] = [
  {
    id: "plan-1",
    person_id: "client-1",
    title: "Ascension Master Training Plan",
    document_type: "training",
    file_name: "Ascension_Block_01.pdf",
    file_size: 2048,
    status: "active",
    updated_at: "2026-07-20T00:00:00Z",
  },
];

export const dataStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getPeople(): Person[] {
    return loadStored<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE);
  },
  savePeople(people: Person[]) {
    saveStored(STORAGE_KEYS.PEOPLE, people);
  },

  addApplication(data: Partial<Person>): string {
    const people = this.getPeople();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newPerson: Person = {
      id,
      kind: "lead",
      status: "new",
      full_name: data.full_name || "Applicant",
      email: data.email || "",
      whatsapp: data.whatsapp || "",
      city_country: data.city_country || "",
      age: data.age || "",
      primary_goal: data.primary_goal || "",
      goal_detail: data.goal_detail || "",
      goal_urgency: data.goal_urgency || 7,
      training_age: data.training_age || "",
      preferred_frequency: data.preferred_frequency || "",
      session_length: data.session_length || "",
      access_type: data.access_type || "",
      days_available: data.days_available || "[]",
      equipment: data.equipment || "[]",
      pain_context: data.pain_context || "",
      consistency_barrier: data.consistency_barrier || "",
      tracking_readiness: data.tracking_readiness || "[]",
      phase: "Unassigned",
      training_level: "To assess",
      next_check_in: "",
      coach_note: "",
      created_at: now,
      updated_at: now,
    };
    people.unshift(newPerson);
    this.savePeople(people);
    return `GD-${id.slice(0, 8).toUpperCase()}`;
  },

  getAssignments(): Assignment[] {
    return loadStored<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  },
  saveAssignments(assignments: Assignment[]) {
    saveStored(STORAGE_KEYS.ASSIGNMENTS, assignments);
  },

  getWorkouts(): Workout[] {
    return loadStored<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
  },
  addWorkout(workout: Omit<Workout, "id">): string {
    const workouts = this.getWorkouts();
    const id = crypto.randomUUID();
    const newWorkout: Workout = { ...workout, id };
    workouts.unshift(newWorkout);
    saveStored(STORAGE_KEYS.WORKOUTS, workouts);
    return id;
  },

  getPlans(): PlanDocument[] {
    return loadStored<PlanDocument[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  },
  getPlanByPersonId(personId: string): PlanDocument | undefined {
    const plans = this.getPlans();
    return plans.find((p) => p.person_id === personId);
  },
  savePlan(plan: PlanDocument) {
    const plans = this.getPlans();
    const existingIndex = plans.findIndex((p) => p.id === plan.id || p.person_id === plan.person_id);
    if (existingIndex >= 0) {
      plans[existingIndex] = { ...plan, updated_at: new Date().toISOString() };
    } else {
      plans.unshift({ ...plan, updated_at: new Date().toISOString() });
    }
    saveStored(STORAGE_KEYS.PLANS, plans);
  },

  getClientPortalSnapshot(): ClientPortalData {
    const seed = createGetDivineDemoSeed();
    const people = this.getPeople();
    const client = people.find((p) => p.kind === "client") || people[0];
    if (client) {
      seed.client.fullName = client.full_name;
      seed.client.email = client.email;
      seed.client.primaryGoal = client.primary_goal || seed.client.primaryGoal;
    }
    return seed;
  },

  addFood(_input: FoodEntryInput) {
    notify();
  },

  saveWorkout(_input: WorkoutSessionInput) {
    notify();
  },

  saveCheckIn(_input: CheckInInput) {
    notify();
  },
};

// Register live bridge immediately
registerGetDivineLiveBridge({
  getSnapshot: () => dataStore.getClientPortalSnapshot(),
  subscribe: (listener) => dataStore.subscribe(listener),
  addFood: (input) => dataStore.addFood(input),
  saveWorkout: (input) => dataStore.saveWorkout(input),
  saveCheckIn: (input) => dataStore.saveCheckIn(input),
});
