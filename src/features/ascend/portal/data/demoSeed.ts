import type { ClientPortalData, ProgrammeDay, WorkoutSession } from "./types";

export const GET_DIVINE_DEMO_EXPECTED = {
  loggedCalories: 1620,
  caloriesRemaining: 630,
  loggedProtein: 126,
  loggedCarbs: 164,
  loggedFats: 54,
} as const;

const days: ProgrammeDay[] = [
  {
    id: "upper-a",
    name: "Upper A — Press & Pull",
    focus: "Controlled strength through horizontal pressing and rowing.",
    estimatedMinutes: "60–70",
    exercises: [
      { id: "upper-a-incline-press", name: "Incline Dumbbell Press", type: "Main lift", prescribedSets: 3, reps: "8–10", rest: "120 sec", tempo: "3-1-1", notes: "Keep the shoulder blades set and stop before form changes." },
      { id: "upper-a-row", name: "Chest-Supported Row", type: "Main lift", prescribedSets: 3, reps: "8–12", rest: "120 sec", tempo: "2-1-1", notes: "Drive the elbows back without lifting the chest from the pad." },
      { id: "upper-a-raise", name: "Cable Lateral Raise", type: "Isolation", prescribedSets: 3, reps: "12–15", rest: "60 sec", tempo: "2-1-2", notes: "Lead with the elbow and keep the upper trap quiet." },
      { id: "upper-a-pulldown", name: "Neutral-Grip Lat Pulldown", type: "Secondary", prescribedSets: 3, reps: "10–12", rest: "90 sec", tempo: "2-1-2", notes: "Pull to the upper chest without leaning back." },
    ],
  },
  {
    id: "lower-a",
    name: "Lower A — Squat Emphasis",
    focus: "Leg strength with stable positions and repeatable depth.",
    estimatedMinutes: "65–75",
    exercises: [
      { id: "lower-a-squat", name: "High-Bar Back Squat", type: "Main lift", prescribedSets: 4, reps: "6–8", rest: "180 sec", tempo: "3-1-1", notes: "Use the same stance and depth on every working rep." },
      { id: "lower-a-rdl", name: "Romanian Deadlift", type: "Secondary", prescribedSets: 3, reps: "8–10", rest: "120 sec", tempo: "3-1-1", notes: "Keep the bar close and stop before the pelvis tucks." },
      { id: "lower-a-leg-curl", name: "Seated Leg Curl", type: "Isolation", prescribedSets: 3, reps: "10–15", rest: "75 sec", tempo: "2-1-2", notes: "Hold the shortened position for one count." },
      { id: "lower-a-calf", name: "Standing Calf Raise", type: "Isolation", prescribedSets: 3, reps: "10–15", rest: "60 sec", tempo: "2-1-2", notes: "Pause in the stretch and at the top." },
    ],
  },
  {
    id: "upper-b",
    name: "Upper B — Back & Delts",
    focus: "Quality upper-back and shoulder work without losing control.",
    estimatedMinutes: "55–65",
    exercises: [
      { id: "upper-b-pull-up", name: "Assisted Pull-Up", type: "Main lift", prescribedSets: 3, reps: "6–10", rest: "120 sec", tempo: "2-1-2", notes: "Use the least assistance that preserves full range." },
      { id: "upper-b-press", name: "Machine Shoulder Press", type: "Secondary", prescribedSets: 3, reps: "8–12", rest: "90 sec", tempo: "2-1-2", notes: "Keep the ribcage stacked and use a pain-free range." },
      { id: "upper-b-row", name: "Single-Arm Cable Row", type: "Secondary", prescribedSets: 3, reps: "10–12", rest: "75 sec", tempo: "2-1-2", notes: "Finish with the elbow, not torso rotation." },
      { id: "upper-b-rear-delt", name: "Reverse Pec Deck", type: "Isolation", prescribedSets: 3, reps: "12–15", rest: "60 sec", tempo: "2-1-2", notes: "Keep the shoulders down as the arms open." },
    ],
  },
  {
    id: "lower-b",
    name: "Lower B — Hinge & Glutes",
    focus: "Posterior-chain loading with deliberate positions and stable joints.",
    estimatedMinutes: "60–70",
    exercises: [
      { id: "lower-b-hip-thrust", name: "Barbell Hip Thrust", type: "Main lift", prescribedSets: 4, reps: "8–10", rest: "150 sec", tempo: "2-1-2", notes: "Finish with the glutes without overextending the lower back." },
      { id: "lower-b-leg-press", name: "Leg Press", type: "Secondary", prescribedSets: 3, reps: "10–12", rest: "120 sec", tempo: "3-1-1", notes: "Use the deepest stable range that keeps the pelvis planted." },
      { id: "lower-b-split-squat", name: "Rear-Foot Elevated Split Squat", type: "Secondary", prescribedSets: 3, reps: "8–10 / side", rest: "90 sec", tempo: "3-1-1", notes: "Keep the front foot planted and the descent controlled." },
      { id: "lower-b-leg-curl", name: "Lying Leg Curl", type: "Isolation", prescribedSets: 3, reps: "10–15", rest: "75 sec", tempo: "2-1-2", notes: "Keep the hips heavy on the pad." },
    ],
  },
];

const workouts: WorkoutSession[] = [
  {
    id: "demo-workout-upper-a",
    programmeDayId: "upper-a",
    workoutName: "Upper A — Press & Pull",
    workoutDate: "2026-08-04",
    completionStatus: "completed",
    durationMinutes: 68,
    effortRating: 8,
    athleteNote: "Strong session. Pressing stayed controlled.",
    painNote: "No sharp pain.",
    coachFeedback: "Excellent control. Add 2 kg when every press set reaches 10 clean reps.",
    exercises: [
      { exerciseId: "upper-a-incline-press", name: "Incline Dumbbell Press", sets: [{ set: 1, load: "24", reps: "10", completed: true }, { set: 2, load: "24", reps: "9", completed: true }, { set: 3, load: "24", reps: "8", completed: true }] },
      { exerciseId: "upper-a-row", name: "Chest-Supported Row", sets: [{ set: 1, load: "45", reps: "12", completed: true }, { set: 2, load: "45", reps: "11", completed: true }, { set: 3, load: "45", reps: "10", completed: true }] },
      { exerciseId: "upper-a-raise", name: "Cable Lateral Raise", sets: [{ set: 1, load: "5", reps: "15", completed: true }, { set: 2, load: "5", reps: "14", completed: true }, { set: 3, load: "5", reps: "13", completed: true }] },
      { exerciseId: "upper-a-pulldown", name: "Neutral-Grip Lat Pulldown", sets: [{ set: 1, load: "48", reps: "12", completed: true }, { set: 2, load: "48", reps: "11", completed: true }, { set: 3, load: "48", reps: "10", completed: true }] },
    ],
  },
  {
    id: "demo-workout-lower-a",
    programmeDayId: "lower-a",
    workoutName: "Lower A — Squat Emphasis",
    workoutDate: "2026-08-01",
    completionStatus: "completed",
    durationMinutes: 74,
    effortRating: 8,
    athleteNote: "Depth stayed consistent.",
    painNote: "Knee response stayed stable.",
    coachFeedback: "Repeat the squat load and add one clean rep to set three.",
    exercises: [
      { exerciseId: "lower-a-squat", name: "High-Bar Back Squat", sets: [{ set: 1, load: "70", reps: "8", completed: true }, { set: 2, load: "70", reps: "8", completed: true }, { set: 3, load: "70", reps: "7", completed: true }, { set: 4, load: "70", reps: "6", completed: true }] },
      { exerciseId: "lower-a-rdl", name: "Romanian Deadlift", sets: [{ set: 1, load: "62.5", reps: "10", completed: true }, { set: 2, load: "62.5", reps: "9", completed: true }, { set: 3, load: "62.5", reps: "8", completed: true }] },
    ],
  },
];

const seed: ClientPortalData = {
  schemaVersion: 2,
  client: {
    id: "demo-amara-okeke",
    fullName: "Amara Okeke",
    email: "demo@ascend.co",
    coachName: "Sahmi El",
    phaseNumber: "II",
    phaseName: "Forging the Form",
    primaryGoal: "Body recomposition",
    streakDays: 7,
    adherencePercent: 86,
    workoutsThisWeek: 2,
    nextCheckIn: "2026-08-10",
  },
  programme: {
    id: "ascension-block-01",
    title: "Ascension Block 01",
    subtitle: "Hypertrophy & Density",
    week: 3,
    totalWeeks: 4,
    startsOn: "2026-07-20",
    endsOn: "2026-08-16",
    athleteDirection: "Move with control, record every working set, and stop any movement that creates sharp pain.",
    days,
  },
  nutrition: {
    targets: { calories: 2250, protein: 170, carbs: 245, fats: 70, waterLitres: 3, maintenance: 2470, deficit: 2100, surplus: 2720 },
    hydrationLoggedLitres: 1.8,
    meals: [
      { id: "meal-1", time: "08:10", name: "Greek yoghurt, oats & berries", calories: 480, protein: 34, carbs: 62, fats: 10 },
      { id: "meal-2", time: "12:45", name: "Jollof rice, grilled chicken & greens", calories: 690, protein: 52, carbs: 78, fats: 18 },
      { id: "meal-3", time: "16:20", name: "Banana & whey shake", calories: 280, protein: 27, carbs: 24, fats: 6 },
      { id: "meal-4", time: "19:30", name: "Salmon, potatoes & vegetables", calories: 170, protein: 13, carbs: 0, fats: 20 },
    ],
    mealTimings: [
      { label: "Meal 01", time: "08:00–09:00" },
      { label: "Meal 02", time: "12:30–13:30" },
      { label: "Pre-training", time: "60–90 min before" },
      { label: "Final meal", time: "19:00–20:30" },
    ],
    supplements: ["Creatine monohydrate — 5 g daily", "Whey protein — only as needed to reach protein"],
    coachGuidelines: ["Build every meal around a clear protein source.", "Place most carbohydrates around training.", "Hit hydration before adding supplements."],
  },
  workouts,
  documents: [
    { id: "demo-training-document", title: "Ascension Training Plan", type: "training", fileName: "Get_Divine_Training_Plan.pdf", publishedOn: "2026-07-25" },
    { id: "demo-nutrition-document", title: "Personalised Nutrition & Meal Guide", type: "nutrition", fileName: "Get_Divine_Nutrition_Plan.pdf", publishedOn: "2026-07-25" },
  ],
  progress: {
    bodyweight: [
      { date: "2026-06-19", weightKg: 78.4 }, { date: "2026-06-26", weightKg: 78.1 },
      { date: "2026-07-03", weightKg: 77.9 }, { date: "2026-07-10", weightKg: 77.5 },
      { date: "2026-07-17", weightKg: 77.2 }, { date: "2026-07-24", weightKg: 76.9 },
      { date: "2026-07-31", weightKg: 76.8 }, { date: "2026-08-07", weightKg: 76.6 },
    ],
    photoStatus: "Front, side and back progress photos are due with the next check-in.",
    readiness: [
      { label: "Bodyweight", status: "Ready" },
      { label: "Progress photos", status: "Due" },
      { label: "Recovery reflection", status: "Due" },
      { label: "Nutrition review", status: "Ready" },
    ],
  },
  checkIns: [
    { id: "checkin-2026-08-03", date: "2026-08-03", status: "reviewed", bodyweightKg: 76.8, sleep: 7, energy: 8, recovery: 7, nutritionAdherence: 86, reflection: "Training quality improved and meal prep was consistent.", coachFeedback: "Keep the squat load and add one clean rep to set three." },
  ],
  coachFeedback: [
    { id: "feedback-2026-08-06", date: "2026-08-06", message: "Excellent control this week. Keep the squat load, add one clean rep to set three, and let the technique—not ego—decide the progression." },
    { id: "feedback-2026-07-30", date: "2026-07-30", message: "Your consistency is becoming the result. Keep meals repeatable and leave the session with clean technique." },
  ],
};

export function createGetDivineDemoSeed(): ClientPortalData {
  return structuredClone(seed);
}
