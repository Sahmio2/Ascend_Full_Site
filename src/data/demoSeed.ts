import { ClientData } from "../types/getDivine";

export type FoodMeal = {
  time: string;
  name: string;
  calories: number;
  protein: number;
};

export type DemoPortalState = {
  clientData: ClientData;
  nutrition: {
    calories: { logged: number; target: number };
    protein: { logged: number; target: number; unit: string };
    carbs: { logged: number; target: number; unit: string };
    fats: { logged: number; target: number; unit: string };
    water: { logged: number; target: number; unit: string };
    maintenance: number;
    deficit: number;
    surplus: number;
  };
  meals: FoodMeal[];
  streakDays: number;
  adherencePercent: number;
  bodyweightHistory: { week: string; weight: number }[];
};

export function createFreshDemoState(): DemoPortalState {
  const programmePlan = [
    {
      id: "d1",
      name: "Upper A — Press & Pull",
      focus: "Chest, Upper Back & Lateral Delts",
      optional: false,
      exercises: [
        {
          id: "e1",
          name: "Incline Dumbbell Press",
          type: "Primary Compound",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "8–10",
          rest: "120s",
          tempo: "3-1-1",
          notes: "Control 3-second eccentric down to deep stretch.",
        },
        {
          id: "e2",
          name: "Chest-Supported Row",
          type: "Primary Pull",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "8–12",
          rest: "120s",
          tempo: "2-1-1",
          notes: "Drive elbows back and pause 1 sec at peak contraction.",
        },
        {
          id: "e3",
          name: "Cable Lateral Raise",
          type: "Isolation",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "12–15",
          rest: "60s",
          tempo: "2-1-2",
          notes: "Keep slight forward lean and lead with elbows.",
        },
        {
          id: "e4",
          name: "Neutral-Grip Lat Pulldown",
          type: "Vertical Pull",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "10–12",
          rest: "90s",
          tempo: "2-1-2",
          notes: "Pull to upper chest with chest high.",
        },
      ],
    },
    {
      id: "d2",
      name: "Lower A — Squat Emphasis",
      focus: "Quads, Glutes & Calves",
      optional: false,
      exercises: [
        {
          id: "e5",
          name: "High-Bar Back Squat",
          type: "Primary Compound",
          prescribedSets: 4,
          setPrescription: "4",
          reps: "6–8",
          rest: "180s",
          tempo: "3-1-1",
          notes: "Break at knees and hips simultaneously.",
        },
        {
          id: "e6",
          name: "Romanian Deadlift",
          type: "Posterior Chain",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "8–10",
          rest: "120s",
          tempo: "3-1-1",
          notes: "Push hips back until hamstrings reach full tension.",
        },
        {
          id: "e7",
          name: "Seated Leg Curl",
          type: "Isolation",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "10–15",
          rest: "75s",
          tempo: "2-1-2",
          notes: "Squeeze hard at knee flexion.",
        },
        {
          id: "e8",
          name: "Standing Calf Raise",
          type: "Isolation",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "10–15",
          rest: "60s",
          tempo: "2-1-2",
          notes: "Pause 2 seconds in bottom stretch.",
        },
      ],
    },
    {
      id: "d3",
      name: "Upper B — Back & Delts",
      focus: "Lats, Upper Back & Shoulders",
      optional: false,
      exercises: [
        {
          id: "e9",
          name: "Assisted Pull-Up",
          type: "Vertical Pull",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "6–10",
          rest: "120s",
          tempo: "2-1-2",
          notes: "Full arm extension at bottom.",
        },
        {
          id: "e10",
          name: "Machine Shoulder Press",
          type: "Overhead Press",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "8–12",
          rest: "90s",
          tempo: "2-1-2",
          notes: "Keep elbows in front of torso plane.",
        },
        {
          id: "e11",
          name: "Single-Arm Cable Row",
          type: "Horizontal Pull",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "10–12",
          rest: "75s",
          tempo: "2-1-2",
          notes: "Avoid torso rotation.",
        },
        {
          id: "e12",
          name: "Reverse Pec Deck",
          type: "Rear Delt",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "12–15",
          rest: "60s",
          tempo: "2-1-2",
          notes: "Initiate movement with rear deltoids.",
        },
      ],
    },
    {
      id: "d4",
      name: "Lower B — Hinge & Glutes",
      focus: "Glutes, Hamstrings & Quads",
      optional: false,
      exercises: [
        {
          id: "e13",
          name: "Barbell Hip Thrust",
          type: "Glute Compound",
          prescribedSets: 4,
          setPrescription: "4",
          reps: "8–10",
          rest: "150s",
          tempo: "2-1-2",
          notes: "Lock out glutes firmly at top.",
        },
        {
          id: "e14",
          name: "Leg Press",
          type: "Quad Compound",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "10–12",
          rest: "120s",
          tempo: "3-1-1",
          notes: "Keep lower back flat against pad.",
        },
        {
          id: "e15",
          name: "Rear-Foot Elevated Split Squat",
          type: "Unilateral Quad/Glute",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "8–10/side",
          rest: "90s",
          tempo: "3-1-1",
          notes: "Torso angled slightly forward.",
        },
        {
          id: "e16",
          name: "Lying Leg Curl",
          type: "Isolation",
          prescribedSets: 3,
          setPrescription: "3",
          reps: "10–15",
          rest: "75s",
          tempo: "2-1-2",
          notes: "Avoid lifting hips off bench.",
        },
      ],
    },
  ];

  const previousWorkout1Log = JSON.stringify([
    {
      name: "Incline Dumbbell Press",
      sets: [
        { set: 1, reps: "10", load: "24 kg", completed: true },
        { set: 2, reps: "9", load: "24 kg", completed: true },
        { set: 3, reps: "8", load: "24 kg", completed: true },
      ],
    },
    {
      name: "Chest-Supported Row",
      sets: [
        { set: 1, reps: "12", load: "45 kg", completed: true },
        { set: 2, reps: "11", load: "45 kg", completed: true },
        { set: 3, reps: "10", load: "45 kg", completed: true },
      ],
    },
    {
      name: "Cable Lateral Raise",
      sets: [
        { set: 1, reps: "15", load: "5 kg", completed: true },
        { set: 2, reps: "14", load: "5 kg", completed: true },
        { set: 3, reps: "13", load: "5 kg", completed: true },
      ],
    },
    {
      name: "Neutral-Grip Lat Pulldown",
      sets: [
        { set: 1, reps: "12", load: "48 kg", completed: true },
        { set: 2, reps: "11", load: "48 kg", completed: true },
        { set: 3, reps: "10", load: "48 kg", completed: true },
      ],
    },
  ]);

  const previousWorkout2Log = JSON.stringify([
    {
      name: "High-Bar Back Squat",
      sets: [
        { set: 1, reps: "8", load: "70 kg", completed: true },
        { set: 2, reps: "8", load: "70 kg", completed: true },
        { set: 3, reps: "7", load: "70 kg", completed: true },
        { set: 4, reps: "6", load: "70 kg", completed: true },
      ],
    },
    {
      name: "Romanian Deadlift",
      sets: [
        { set: 1, reps: "10", load: "62.5 kg", completed: true },
        { set: 2, reps: "9", load: "62.5 kg", completed: true },
        { set: 3, reps: "8", load: "62.5 kg", completed: true },
      ],
    },
  ]);

  return {
    clientData: {
      person: {
        full_name: "Amara Okeke",
        phase: "Phase II — Forging the Form",
        primary_goal: "Build visible shoulder & glute shape while maintaining low body fat.",
        next_check_in: "2026-08-10",
      },
      assignments: [
        {
          id: "assign-1",
          title: "Ascension Block 01 — Hypertrophy & Density",
          phase: "Phase II — Forging the Form",
          days_per_week: 4,
          starts_on: "2026-07-20",
          ends_on: "2026-08-16",
          athlete_instructions: "Move with control, record every working set, and stop any movement that creates sharp pain.",
          primary_workouts: "Upper A\nLower A\nUpper B\nLower B",
          optional_workouts: "Recovery / Cardio",
          workout_plan: JSON.stringify(programmePlan),
          status: "active",
        },
      ],
      workouts: [
        {
          id: "w-prev-2",
          workout_date: "2026-08-06",
          workout_name: "Lower A — Squat Emphasis",
          completion_status: "completed",
          duration_minutes: 65,
          effort_rating: 8,
          athlete_note: "Squats felt smooth today.",
          coach_feedback: "Great depth on squats.",
          exercise_log: previousWorkout2Log,
        },
        {
          id: "w-prev-1",
          workout_date: "2026-08-04",
          workout_name: "Upper A — Press & Pull",
          completion_status: "completed",
          duration_minutes: 60,
          effort_rating: 8,
          athlete_note: "Felt strong on incline press.",
          coach_feedback: "Excellent control this week. Keep the squat load, add one clean rep to set three, and let the technique—not ego—decide the progression.",
          exercise_log: previousWorkout1Log,
        },
      ],
      documents: [
        {
          id: "doc-1",
          title: "Ascension Training Plan",
          document_type: "training",
          file_name: "Ascension_Block_01.pdf",
          file_size: 2048,
          updated_at: "2026-07-20",
          demo: true,
        },
        {
          id: "doc-2",
          title: "Personalised Nutrition & Meal Guide",
          document_type: "nutrition",
          file_name: "Nutrition_Guidelines.pdf",
          file_size: 1024,
          updated_at: "2026-07-20",
          demo: true,
        },
      ],
    },
    nutrition: {
      calories: { logged: 1620, target: 2250 },
      protein: { logged: 126, target: 170, unit: "g" },
      carbs: { logged: 164, target: 245, unit: "g" },
      fats: { logged: 54, target: 70, unit: "g" },
      water: { logged: 1.8, target: 3.0, unit: "L" },
      maintenance: 2470,
      deficit: 2100,
      surplus: 2720,
    },
    meals: [
      { time: "08:10", name: "Greek yoghurt, oats & berries", calories: 480, protein: 34 },
      { time: "12:45", name: "Jollof rice, grilled chicken & greens", calories: 690, protein: 52 },
      { time: "16:20", name: "Banana & whey shake", calories: 280, protein: 27 },
      { time: "19:30", name: "Salmon, potatoes & vegetables", calories: 170, protein: 13 },
    ],
    streakDays: 7,
    adherencePercent: 86,
    bodyweightHistory: [
      { week: "Week 1", weight: 76.8 },
      { week: "Week 2", weight: 76.55 },
      { week: "Week 3", weight: 76.3 },
      { week: "Week 4", weight: 76.05 },
      { week: "Week 5", weight: 75.8 },
      { week: "Week 6", weight: 75.55 },
      { week: "Week 7", weight: 75.3 },
      { week: "Week 8", weight: 75.0 },
    ],
  };
}

export const DEMO_CLIENT = {
  id: "client-demo-1",
  full_name: "Amara Okeke",
  email: "demo@getdivine.co",
  phone_whatsapp: "+234 800 000 0001",
  city_country: "Lagos, Nigeria",
  primary_goal: "Build visible shoulder & glute shape while maintaining low body fat.",
  phase: "Phase II — Forging the Form",
  status: "active",
};
