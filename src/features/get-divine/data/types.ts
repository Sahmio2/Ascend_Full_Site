export type PortalScope = "live" | "demo";

export type MacroKey = "protein" | "carbs" | "fats";

export interface ProgrammeExercise {
  id: string;
  name: string;
  type: string;
  prescribedSets: number;
  reps: string;
  rest: string;
  tempo: string;
  notes: string;
}

export interface ProgrammeDay {
  id: string;
  name: string;
  focus: string;
  estimatedMinutes: string;
  exercises: ProgrammeExercise[];
}

export interface ExerciseSet {
  set: number;
  load: string;
  reps: string;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  name: string;
  sets: ExerciseSet[];
}

export interface WorkoutSession {
  id: string;
  programmeDayId: string;
  workoutName: string;
  workoutDate: string;
  completionStatus: "completed" | "draft";
  durationMinutes: number;
  effortRating: number;
  athleteNote: string;
  painNote: string;
  coachFeedback: string;
  exercises: ExerciseLog[];
}

export interface FoodEntry {
  id: string;
  time: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface NutritionTarget {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  waterLitres: number;
  maintenance: number;
  deficit: number;
  surplus: number;
}

export interface BodyweightPoint {
  date: string;
  weightKg: number;
}

export interface CheckInRecord {
  id: string;
  date: string;
  status: "draft" | "submitted" | "reviewed";
  bodyweightKg: number | null;
  sleep: number;
  energy: number;
  recovery: number;
  nutritionAdherence: number;
  reflection: string;
  coachFeedback: string;
}

export interface ClientPortalData {
  schemaVersion: 2;
  client: {
    id: string;
    fullName: string;
    email: string;
    coachName: string;
    phaseNumber: "I" | "II" | "III";
    phaseName: string;
    primaryGoal: string;
    streakDays: number;
    adherencePercent: number;
    workoutsThisWeek: number;
    nextCheckIn: string;
  };
  programme: {
    id: string;
    title: string;
    subtitle: string;
    week: number;
    totalWeeks: number;
    startsOn: string;
    endsOn: string;
    athleteDirection: string;
    days: ProgrammeDay[];
  };
  nutrition: {
    targets: NutritionTarget;
    hydrationLoggedLitres: number;
    meals: FoodEntry[];
    mealTimings: Array<{ label: string; time: string }>;
    supplements: string[];
    coachGuidelines: string[];
  };
  workouts: WorkoutSession[];
  documents: Array<{
    id: string;
    title: string;
    type: "training" | "nutrition";
    fileName: string;
    publishedOn: string;
  }>;
  progress: {
    bodyweight: BodyweightPoint[];
    photoStatus: string;
    readiness: Array<{ label: string; status: "Ready" | "Due" }>;
  };
  checkIns: CheckInRecord[];
  coachFeedback: Array<{ id: string; date: string; message: string }>;
}

export interface FoodEntryInput {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  time?: string;
}

export interface WorkoutSessionInput {
  programmeDayId: string;
  workoutName: string;
  workoutDate: string;
  durationMinutes: number;
  effortRating: number;
  athleteNote: string;
  painNote: string;
  exercises: ExerciseLog[];
}

export interface CheckInInput {
  bodyweightKg: number | null;
  sleep: number;
  energy: number;
  recovery: number;
  nutritionAdherence: number;
  reflection: string;
}

export function normalizedExerciseKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function nutritionTotals(data: ClientPortalData) {
  return data.nutrition.meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fats: totals.fats + meal.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
}
