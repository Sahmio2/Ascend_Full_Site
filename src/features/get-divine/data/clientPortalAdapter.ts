import { createFreshDemoState, DemoPortalState, FoodMeal } from "../../../data/demoSeed";
import { dataStore } from "../../../services/dataStore";
import { ClientData, Workout } from "../../../types/getDivine";

export type PortalScope = "live" | "demo";

export type FoodEntryInput = {
  name: string;
  calories: number;
  protein?: number;
};

export type WorkoutSessionInput = {
  workoutDate: string;
  workoutName: string;
  durationMinutes: number;
  effortRating: number;
  athleteNote: string;
  exercises: { name: string; sets: { set: number; reps: string; load: string; completed?: boolean }[] }[];
};

export type CheckInInput = {
  bodyweight?: number;
  photosUploaded?: boolean;
  reflectionNotes?: string;
};

const DEMO_STORAGE_KEY = "gd_demo_data_v1";

function loadDemoState(): DemoPortalState {
  try {
    const raw = sessionStorage.getItem(DEMO_STORAGE_KEY) || localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.clientData && parsed.nutrition && Array.isArray(parsed.meals)) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  const fresh = createFreshDemoState();
  saveDemoState(fresh);
  return fresh;
}

function saveDemoState(state: DemoPortalState) {
  try {
    const serialized = JSON.stringify(state);
    sessionStorage.setItem(DEMO_STORAGE_KEY, serialized);
    localStorage.setItem(DEMO_STORAGE_KEY, serialized);
  } catch {
    // ignore
  }
}

let currentDemoState: DemoPortalState = loadDemoState();
const demoListeners: Set<() => void> = new Set();

function notifyDemo() {
  saveDemoState(currentDemoState);
  demoListeners.forEach((listener) => listener());
}

export const clientPortalAdapter = {
  getSnapshot(scope: PortalScope): DemoPortalState {
    if (scope === "demo") {
      return currentDemoState;
    }

    const people = dataStore.getPeople();
    const liveClient = people.find((p) => p.kind === "client") || people[0];
    const liveName = liveClient?.full_name || "Client Athlete";
    const liveWorkouts = dataStore.getWorkouts();
    const liveAssignments = dataStore.getAssignments();

    const freshDemo = createFreshDemoState();

    const clientData: ClientData = {
      person: {
        full_name: liveName,
        phase: liveClient?.phase || "Phase II — Forging the Form",
        primary_goal: liveClient?.primary_goal || "Body recomposition",
        next_check_in: liveClient?.next_check_in || "2026-08-10",
      },
      assignments: liveAssignments.length ? (liveAssignments as unknown as ClientData["assignments"]) : freshDemo.clientData.assignments,
      workouts: liveWorkouts.length ? (liveWorkouts as unknown as ClientData["workouts"]) : freshDemo.clientData.workouts,
      documents: freshDemo.clientData.documents,
    };

    return {
      ...freshDemo,
      clientData,
    };
  },

  subscribe(scope: PortalScope, listener: () => void): () => void {
    if (scope === "demo") {
      demoListeners.add(listener);
      return () => {
        demoListeners.delete(listener);
      };
    } else {
      return dataStore.subscribe(listener);
    }
  },

  addFood(scope: PortalScope, input: FoodEntryInput) {
    const newMeal: FoodMeal = {
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      name: input.name.trim(),
      calories: Number(input.calories) || 0,
      protein: Number(input.protein) || 0,
    };

    if (scope === "demo") {
      const newMeals = [...currentDemoState.meals, newMeal];
      const newLoggedCalories = newMeals.reduce((sum, m) => sum + m.calories, 0);
      const newLoggedProtein = newMeals.reduce((sum, m) => sum + m.protein, 0);

      currentDemoState = {
        ...currentDemoState,
        meals: newMeals,
        nutrition: {
          ...currentDemoState.nutrition,
          calories: { ...currentDemoState.nutrition.calories, logged: newLoggedCalories },
          protein: { ...currentDemoState.nutrition.protein, logged: newLoggedProtein },
        },
      };
      notifyDemo();
    }
  },

  saveWorkout(scope: PortalScope, input: WorkoutSessionInput) {
    const newWorkout: Workout = {
      id: `w-${Date.now()}`,
      workout_date: input.workoutDate || new Date().toISOString().split("T")[0],
      workout_name: input.workoutName,
      completion_status: "completed",
      duration_minutes: Number(input.durationMinutes) || 60,
      effort_rating: Number(input.effortRating) || 8,
      athlete_note: input.athleteNote || "",
      coach_feedback: "",
      exercise_log: JSON.stringify(input.exercises),
    };

    if (scope === "demo") {
      currentDemoState = {
        ...currentDemoState,
        clientData: {
          ...currentDemoState.clientData,
          workouts: [newWorkout, ...currentDemoState.clientData.workouts],
        },
      };
      notifyDemo();
    } else {
      dataStore.addWorkout({
        person_id: "client-1",
        full_name: "Client Athlete",
        workout_date: newWorkout.workout_date,
        workout_name: newWorkout.workout_name,
        completion_status: newWorkout.completion_status,
        duration_minutes: newWorkout.duration_minutes,
        effort_rating: newWorkout.effort_rating,
        athlete_note: newWorkout.athlete_note,
        coach_feedback: "",
        exercise_log: newWorkout.exercise_log,
      });
    }
  },

  saveCheckIn(scope: PortalScope, _input: CheckInInput) {
    if (scope === "demo") {
      notifyDemo();
    }
  },

  resetDemo() {
    currentDemoState = createFreshDemoState();
    notifyDemo();
  },
};
