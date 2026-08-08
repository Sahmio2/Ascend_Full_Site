import { createGetDivineDemoSeed } from "./demoSeed";
import type {
  CheckInInput,
  ClientPortalData,
  ExerciseSet,
  FoodEntryInput,
  PortalScope,
  WorkoutSessionInput,
} from "./types";
import { normalizedExerciseKey } from "./types";

export const GET_DIVINE_DEMO_KEY = "gd_demo_data_v2";
export const GET_DIVINE_AUTH_KEY = "gd_auth_session_v1";

type Listener = () => void;

export interface LivePortalBridge {
  getSnapshot(): ClientPortalData;
  subscribe(listener: Listener): () => void;
  addFood(input: FoodEntryInput): void;
  saveWorkout(input: WorkoutSessionInput): void;
  saveCheckIn(input: CheckInInput): void;
}

let liveBridge: LivePortalBridge | null = null;
let demoSnapshot: ClientPortalData | null = null;
const demoListeners = new Set<Listener>();

function browserSessionStorage() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function persistDemo(next: ClientPortalData) {
  demoSnapshot = next;
  browserSessionStorage()?.setItem(GET_DIVINE_DEMO_KEY, JSON.stringify(next));
  demoListeners.forEach((listener) => listener());
}

function hydrateDemo() {
  if (demoSnapshot) return demoSnapshot;
  const storage = browserSessionStorage();
  if (storage) {
    try {
      const parsed = JSON.parse(storage.getItem(GET_DIVINE_DEMO_KEY) || "null") as ClientPortalData | null;
      if (parsed?.schemaVersion === 2 && parsed.client?.email === "demo@getdivine.co") {
        demoSnapshot = parsed;
        return parsed;
      }
    } catch {
      storage.removeItem(GET_DIVINE_DEMO_KEY);
    }
  }
  const seed = createGetDivineDemoSeed();
  demoSnapshot = seed;
  storage?.setItem(GET_DIVINE_DEMO_KEY, JSON.stringify(seed));
  return seed;
}

function mutateDemo(mutator: (draft: ClientPortalData) => void) {
  const draft = structuredClone(hydrateDemo());
  mutator(draft);
  persistDemo(draft);
}

function nowId(prefix: string) {
  const unique = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${unique}`;
}

export function registerGetDivineLiveBridge(bridge: LivePortalBridge) {
  liveBridge = bridge;
  return () => {
    if (liveBridge === bridge) liveBridge = null;
  };
}

export const clientPortalAdapter = {
  getSnapshot(scope: PortalScope): ClientPortalData {
    if (scope === "demo") return hydrateDemo();
    if (!liveBridge) {
      throw new Error("Register the existing dataStore through registerGetDivineLiveBridge before rendering live client routes.");
    }
    return liveBridge.getSnapshot();
  },

  subscribe(scope: PortalScope, listener: Listener) {
    if (scope === "live") {
      if (!liveBridge) return () => undefined;
      return liveBridge.subscribe(listener);
    }
    demoListeners.add(listener);
    return () => demoListeners.delete(listener);
  },

  initializeDemo() {
    return hydrateDemo();
  },

  resetDemo() {
    demoSnapshot = null;
    browserSessionStorage()?.removeItem(GET_DIVINE_DEMO_KEY);
    const next = hydrateDemo();
    demoListeners.forEach((listener) => listener());
    return next;
  },

  addFood(scope: PortalScope, input: FoodEntryInput) {
    if (scope === "live") {
      if (!liveBridge) throw new Error("Live dataStore bridge is not registered.");
      liveBridge.addFood(input);
      return;
    }
    mutateDemo((draft) => {
      draft.nutrition.meals.push({
        id: nowId("meal"),
        time: input.time || new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()),
        name: input.name.trim(),
        calories: input.calories,
        protein: input.protein || 0,
        carbs: input.carbs || 0,
        fats: input.fats || 0,
      });
    });
  },

  saveWorkout(scope: PortalScope, input: WorkoutSessionInput) {
    if (scope === "live") {
      if (!liveBridge) throw new Error("Live dataStore bridge is not registered.");
      liveBridge.saveWorkout(input);
      return;
    }
    mutateDemo((draft) => {
      draft.workouts.unshift({
        id: nowId("workout"),
        programmeDayId: input.programmeDayId,
        workoutName: input.workoutName,
        workoutDate: input.workoutDate,
        completionStatus: "completed",
        durationMinutes: input.durationMinutes,
        effortRating: input.effortRating,
        athleteNote: input.athleteNote,
        painNote: input.painNote,
        coachFeedback: "",
        exercises: structuredClone(input.exercises),
      });
      draft.client.workoutsThisWeek += 1;
      draft.client.streakDays += 1;
    });
  },

  saveCheckIn(scope: PortalScope, input: CheckInInput) {
    if (scope === "live") {
      if (!liveBridge) throw new Error("Live dataStore bridge is not registered.");
      liveBridge.saveCheckIn(input);
      return;
    }
    mutateDemo((draft) => {
      draft.checkIns.unshift({
        id: nowId("checkin"),
        date: new Date().toISOString().slice(0, 10),
        status: "submitted",
        bodyweightKg: input.bodyweightKg,
        sleep: input.sleep,
        energy: input.energy,
        recovery: input.recovery,
        nutritionAdherence: input.nutritionAdherence,
        reflection: input.reflection,
        coachFeedback: "Awaiting coach review.",
      });
      if (input.bodyweightKg) {
        draft.progress.bodyweight.push({ date: new Date().toISOString().slice(0, 10), weightKg: input.bodyweightKg });
      }
    });
  },

  getLastSets(scope: PortalScope, exerciseName: string): ExerciseSet[] {
    const data = clientPortalAdapter.getSnapshot(scope);
    const key = normalizedExerciseKey(exerciseName);
    for (const workout of data.workouts) {
      const match = workout.exercises.find((exercise) => normalizedExerciseKey(exercise.name) === key);
      if (match?.sets.length) return structuredClone(match.sets);
    }
    return [];
  },
};

export function beginGetDivineDemoSession() {
  clientPortalAdapter.initializeDemo();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(GET_DIVINE_AUTH_KEY, JSON.stringify({ role: "client", mode: "demo", email: "demo@getdivine.co", signedInAt: new Date().toISOString() }));
  }
}
