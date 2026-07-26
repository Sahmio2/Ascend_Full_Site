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
  guidelines: string;
};

export type PlanDocument = {
  id: string;
  person_id: string;
  full_name: string;
  title: string;
  phase: string;
  created_at: string;
  updated_at: string;
  workout_days: WorkoutDayPlan[];
  nutrition: NutritionPlan;
};

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

const INITIAL_PLANS: PlanDocument[] = [
  {
    id: "plan-sample-1",
    person_id: "sample-1",
    full_name: "Amara O.",
    title: "Get Divine Master Plan — Body Recomposition",
    phase: "Forging the Form",
    created_at: "2026-07-20T10:00:00Z",
    updated_at: "2026-07-20T10:00:00Z",
    workout_days: [
      {
        day_title: "Day 1 — Upper Body Hypertrophy & Density",
        notes: "Rest 90-120 seconds between working sets. Focus on controlled eccentrics.",
        exercises: [
          { name: "Incline Dumbbell Bench Press", sets: "4", reps: "8–10", rir: "2", notes: "Keep shoulder blades retracted and depressed." },
          { name: "Chest-Supported Dumbbell Row", sets: "4", reps: "10–12", rir: "2", notes: "Squeeze upper back at full contraction." },
          { name: "Standing Cable Lateral Raise", sets: "3", reps: "12–15", rir: "1", notes: "Lead with elbows; smooth tempo." },
          { name: "Lat Pulldown (Neutral Grip)", sets: "3", reps: "10–12", rir: "2", notes: "Pull through elbows to upper chest." },
          { name: "Overhead Rope Tricep Extension", sets: "3", reps: "12–15", rir: "1", notes: "Keep upper arms locked in position." },
        ],
      },
      {
        day_title: "Day 2 — Lower Body & Glute Focus",
        notes: "Ensure thorough dynamic warm-up before working sets.",
        exercises: [
          { name: "Barbell Hip Thrust", sets: "4", reps: "8–10", rir: "2", notes: "Hold top contraction for 1 second." },
          { name: "Romanian Deadlift (Dumbbell or Barbell)", sets: "3", reps: "10–12", rir: "2", notes: "Hinge at hips; feel deep hamstring stretch." },
          { name: "Leg Press (Medium Stance)", sets: "3", reps: "12–15", rir: "1–2", notes: "Full depth without lumbar rounding." },
          { name: "Walking Dumbbell Lunges", sets: "3", reps: "10 per leg", rir: "2", notes: "Slight forward torso lean for glute engagement." },
          { name: "Standing Calf Raise", sets: "4", reps: "12–15", rir: "1", notes: "2 second pause at full stretch." },
        ],
      },
      {
        day_title: "Day 3 — Upper Body & Arms",
        notes: "Maintain tension and focus on muscle connection.",
        exercises: [
          { name: "Seated Dumbbell Shoulder Press", sets: "4", reps: "8–10", rir: "2", notes: "Elbows at 45 degree angle." },
          { name: "Single-Arm Cable Row", sets: "3", reps: "10–12 per arm", rir: "2", notes: "Drive elbow into hip." },
          { name: "Dumbbell Incline Bicep Curl", sets: "3", reps: "12–15", rir: "1", notes: "Full extension at bottom." },
          { name: "Face Pulls (Rope Cable)", sets: "3", reps: "15", rir: "2", notes: "Pull towards forehead; external rotation." },
        ],
      },
      {
        day_title: "Day 4 — Lower Body & Posterior Chain",
        notes: "Quality execution over heavy load.",
        exercises: [
          { name: "Bulgarian Split Squat", sets: "3", reps: "10 per leg", rir: "2", notes: "Maintain balance and vertical front shin." },
          { name: "Lying Hamstring Curl", sets: "4", reps: "12–15", rir: "1", notes: "Control the 3-second lowering phase." },
          { name: "Cable Glute Kickbacks", sets: "3", reps: "15 per leg", rir: "1", notes: "Squeeze glute at peak extension." },
          { name: "Hanging Knee Raises / Ab Core", sets: "3", reps: "15–20", rir: "2", notes: "Control movement without swinging." },
        ],
      },
    ],
    nutrition: {
      maintenance_calories: 2150,
      target_calories: 1720,
      deficit_calories: 1720,
      surplus_calories: 2365,
      protein_g: 135,
      carbs_g: 170,
      fats_g: 55,
      hydration_liters: 3.5,
      meal_structure: [
        "Meal 1 (Breakfast): 3 whole eggs + 50g rolled oats cooked in almond milk + 1/2 avocado",
        "Meal 2 (Lunch): 150g grilled chicken breast + 150g cooked jasmine rice + steamed broccoli/asparagus",
        "Meal 3 (Pre/Post Snack): 1 scoop Get Divine Whey Protein + 1 medium banana + 15g raw almonds",
        "Meal 4 (Dinner): 160g baked salmon or lean sirloin steak + roasted sweet potato + mixed green salad with olive oil",
      ],
      supplements: [
        "Creatine Monohydrate — 5g daily (any time)",
        "Omega-3 Fish Oil — 2,000mg daily with meals",
        "Vitamin D3 + K2 — 4,000 IU daily",
        "Magnesium Glycinate — 300mg before sleep",
      ],
      guidelines: "Hit your daily protein target (+/- 5g). Drink 1 Liter of water before 12:00 PM. Keep dinner at least 2.5 hours before sleep for optimal digestion and recovery.",
    },
  },
  {
    id: "plan-sample-2",
    person_id: "sample-2",
    full_name: "David K.",
    title: "Get Divine Master Plan — Athletic Muscle Growth",
    phase: "Taming the Flesh",
    created_at: "2026-07-22T10:00:00Z",
    updated_at: "2026-07-22T10:00:00Z",
    workout_days: [
      {
        day_title: "Day 1 — Push (Chest, Shoulders, Triceps)",
        notes: "Warm up shoulder capsule with light band pull-aparts.",
        exercises: [
          { name: "Incline Barbell Bench Press", sets: "4", reps: "6–8", rir: "2", notes: "Touch upper chest softly; explosive press." },
          { name: "Seated Dumbbell Shoulder Press", sets: "3", reps: "8–10", rir: "2", notes: "Avoid deep shoulder dip if right shoulder feels tight." },
          { name: "Low-to-High Cable Flyes", sets: "3", reps: "12–15", rir: "1", notes: "Focus on upper chest squeeze." },
          { name: "Cable Lateral Raises", sets: "4", reps: "12–15", rir: "1", notes: "Continuous cable tension." },
          { name: "EZ-Bar Skullcrushers", sets: "3", reps: "10–12", rir: "2", notes: "Keep elbows tucked." },
        ],
      },
      {
        day_title: "Day 2 — Pull (Back, Rear Delts, Biceps)",
        notes: "Focus on elbow drive for maximum back contraction.",
        exercises: [
          { name: "Barbell Pendlay Row", sets: "4", reps: "6–8", rir: "2", notes: "Reset on floor each rep." },
          { name: "Lat Pulldown (Wide Grip)", sets: "3", reps: "10–12", rir: "2", notes: "Squeeze lats at bottom." },
          { name: "Single-Arm Dumbbell Row", sets: "3", reps: "10–12 per arm", rir: "1", notes: "Pull to hip pocket." },
          { name: "Face Pulls", sets: "4", reps: "15", rir: "2", notes: "Hold contraction 1 sec." },
          { name: "Standing Dumbbell Bicep Curls", sets: "3", reps: "10–12", rir: "1", notes: "Strict form, no momentum." },
        ],
      },
      {
        day_title: "Day 3 — Lower Body Athletic Strength",
        notes: "Prioritize hip mobility and controlled squat depth.",
        exercises: [
          { name: "Trap Bar Deadlift", sets: "4", reps: "6–8", rir: "2", notes: "Drive through heels, brace core." },
          { name: "Goblet Squats", sets: "3", reps: "10–12", rir: "2", notes: "Upright torso depth." },
          { name: "Seated Hamstring Curl", sets: "4", reps: "12–15", rir: "1", notes: "Full flex at peak contraction." },
          { name: "Standing Calf Raises", sets: "4", reps: "15", rir: "1", notes: "Slow eccentric stretch." },
        ],
      },
    ],
    nutrition: {
      maintenance_calories: 2650,
      target_calories: 2900,
      deficit_calories: 2120,
      surplus_calories: 2900,
      protein_g: 175,
      carbs_g: 340,
      fats_g: 75,
      hydration_liters: 4.0,
      meal_structure: [
        "Meal 1: 4 eggs + 80g rolled oats + 1 tbsp peanut butter + 100g blueberries",
        "Meal 2: 200g lean beef mince + 200g jasmine rice + avocado slices",
        "Meal 3: 1.5 scoops whey protein + 1 banana + 2 slices sourdough bread with honey",
        "Meal 4: 200g chicken breast / thighs + 250g baked potato + stir-fry vegetables",
      ],
      supplements: [
        "Creatine Monohydrate — 5g daily",
        "Whey Protein Isolate — 1-2 scoops post workout",
        "Multivitamin — 1 capsule morning",
      ],
      guidelines: "Maintain a +250 kcal daily surplus to support lean muscle gain without unnecessary body fat accumulation.",
    },
  },
];

const STORAGE_KEYS = {
  PEOPLE: "gd_people_v1",
  ACTIVITIES: "gd_activities_v1",
  ASSIGNMENTS: "gd_assignments_v1",
  WORKOUTS: "gd_workouts_v1",
  PLANS: "gd_plans_v1",
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
};
