// In-memory & LocalStorage Data Store for Get Divine Single-Page Application

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

const INITIAL_PEOPLE: Person[] = [
  {
    id: "sample-1", kind: "client", status: "active", full_name: "Amara O.", email: "amara@example.com", whatsapp: "+234 800 000 0001", city_country: "Lagos, Nigeria", age: "28", primary_goal: "Body recomposition", goal_detail: "Build visible shape and regain consistency after a demanding work season.", goal_urgency: 9, training_age: "1–2 years", preferred_frequency: "4 days per week", session_length: "60 minutes", access_type: "Commercial gym", days_available: '["Mon","Tue","Thu","Sat"]', equipment: '["Barbell","Dumbbells","Cable machine","Leg press"]', pain_context: "No active pain. Previous mild wrist irritation with straight-bar curls.", consistency_barrier: "Late work meetings and missed meal preparation.", tracking_readiness: '["Workout loads and reps","Protein target days","Sleep and recovery"]', phase: "Forging the Form", training_level: "Intermediate", next_check_in: "2026-07-31", coach_note: "Strong start. Keep lower-body volume stable for one more week before adding work.", created_at: "2026-06-03T09:00:00Z", updated_at: "2026-07-16T09:00:00Z", sample: true,
  },
  {
    id: "sample-2", kind: "client", status: "active", full_name: "David K.", email: "david@example.com", whatsapp: "+234 800 000 0002", city_country: "Abuja, Nigeria", age: "34", primary_goal: "Lean muscle gain", goal_detail: "Add size while remaining athletic and improving training discipline.", goal_urgency: 8, training_age: "2+ years", preferred_frequency: "4 days per week", session_length: "75+ minutes", access_type: "Commercial gym", days_available: '["Mon","Wed","Fri","Sat"]', equipment: '["Barbell","Dumbbells","Cable machine"]', pain_context: "Right shoulder becomes uncomfortable at deep pressing ranges.", consistency_barrier: "Travels twice monthly.", tracking_readiness: '["Workout loads and reps","Weekly bodyweight average","Pain or soreness"]', phase: "Taming the Flesh", training_level: "Intermediate — provisional", next_check_in: "2026-07-28", coach_note: "Review pressing range and next-day shoulder response before progressing load.", created_at: "2026-06-22T09:00:00Z", updated_at: "2026-07-16T08:20:00Z", sample: true,
  },
  {
    id: "sample-3", kind: "lead", status: "new", full_name: "Zainab M.", email: "zainab@example.com", whatsapp: "+234 800 000 0003", city_country: "Kano, Nigeria", age: "26", primary_goal: "Beginner confidence", goal_detail: "Learn to use the gym without feeling lost and become stronger.", goal_urgency: 7, training_age: "Never trained properly", preferred_frequency: "3 days per week", session_length: "45 minutes", access_type: "Commercial gym", days_available: '["Tue","Thu","Sat"]', equipment: '["Dumbbells","Cable machine","Cardio equipment"]', pain_context: "None reported.", consistency_barrier: "Does not know what to do in the gym.", tracking_readiness: '["Workout loads and reps","Sleep and recovery"]', phase: "Unassigned", training_level: "To assess", next_check_in: "", coach_note: "", created_at: "2026-07-16T07:40:00Z", updated_at: "2026-07-16T07:40:00Z", sample: true,
  },
];

const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: "assign-1",
    person_id: "sample-1",
    full_name: "Amara O.",
    title: "Ascension Block 01 — Hypertrophy & Density",
    phase: "Forging the Form",
    days_per_week: 4,
    status: "active",
    starts_on: "2026-07-20",
    ends_on: "2026-08-16",
    athlete_instructions: "Move with control, record every working set, and stop any movement that creates sharp pain.",
    updated_at: new Date().toISOString(),
  },
];

const STORAGE_KEYS = {
  PEOPLE: "gd_people_v1",
  ACTIVITIES: "gd_activities_v1",
  ASSIGNMENTS: "gd_assignments_v1",
  WORKOUTS: "gd_workouts_v1",
};

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
  } catch {
    // ignore
  }
}

export const dataStore = {
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
      full_name: data.full_name || "",
      email: (data.email || "").toLowerCase(),
      whatsapp: data.whatsapp || "",
      city_country: data.city_country || "",
      age: data.age || "",
      primary_goal: data.primary_goal || "",
      goal_detail: data.goal_detail || "",
      goal_urgency: data.goal_urgency || 5,
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
};
