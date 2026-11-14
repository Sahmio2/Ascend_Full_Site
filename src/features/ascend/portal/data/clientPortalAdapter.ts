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

type Listener = () => void;

export interface LivePortalBridge {
  getSnapshot(): ClientPortalData;
  subscribe(listener: Listener): () => void;
  addFood(input: FoodEntryInput): void | Promise<void>;
  saveWorkout(input: WorkoutSessionInput): void | Promise<void>;
  saveCheckIn(input: CheckInInput): void | Promise<void>;
}

let liveBridge: LivePortalBridge | null = null;
let demoAuthStarter: (() => void | Promise<void>) | null = null;
let demoSnapshot: ClientPortalData | null = null;
const demoListeners = new Set<Listener>();

let liveSnapshot: ClientPortalData | null = null;
const liveListeners = new Set<Listener>();
let isFetchingLive = false;

async function fetchLiveProgramme() {
  if (typeof window === "undefined" || isFetchingLive) return;
  isFetchingLive = true;
  try {
    const [progRes, snapRes] = await Promise.all([
      fetch("/api/client/programme"),
      fetch("/api/account/snapshot"),
    ]);

    if (!progRes.ok) return;
    const progData = await progRes.json();
    const snapData = snapRes.ok ? await snapRes.json() : null;

    const base = liveSnapshot || createGetDivineDemoSeed();
    const updated = structuredClone(base);

    if (snapData?.snapshot) {
      updated.client.fullName = snapData.snapshot.firstName || updated.client.fullName;
      updated.client.email = snapData.snapshot.email || updated.client.email;
    }

    if (progData.status === "ACTIVE" && progData.programme) {
      updated.programme.title = "Ascension Block 01";
      updated.programme.subtitle = progData.programme.version || "Active v1";
      if (progData.programme.coachNotes) {
        updated.programme.athleteDirection = progData.programme.coachNotes;
      }

      // Map training JSON to days
      if (Array.isArray(progData.programme.training) && progData.programme.training.length > 0) {
        const rawItems = progData.programme.training;
        const exercises = rawItems.map((item: any, i: number) => ({
          id: `ex-${i}`,
          name: item.name || "Exercise",
          type: "Main lift",
          prescribedSets: parseInt(item.sets || "3", 10) || 3,
          reps: item.reps || "8–12",
          rest: item.rest || "120 sec",
          tempo: "2-1-1",
          notes: item.swap ? `Approved swap: ${item.swap}` : "Clean controlled reps.",
        }));

        updated.programme.days = [
          {
            id: "fullbody-a",
            name: "Full Body A",
            focus: "Compound lower & upper pressing and pulling.",
            estimatedMinutes: "60",
            exercises: exercises.slice(0, 4),
          },
          {
            id: "fullbody-b",
            name: "Full Body B",
            focus: "Hinge and upper body balance.",
            estimatedMinutes: "60",
            exercises: exercises.slice(1, 5),
          },
          {
            id: "fullbody-c",
            name: "Full Body C",
            focus: "Squat and overhead stability.",
            estimatedMinutes: "60",
            exercises: exercises.slice(2, 6),
          },
        ];
      }

      // Map nutrition JSON to meals without fabricating unvalidated macro sums
      if (Array.isArray(progData.programme.nutrition) && progData.programme.nutrition.length > 0) {
        updated.nutrition.meals = progData.programme.nutrition.map((item: any, i: number) => {
          const hasVerifiedKcal = typeof item.calories === 'number';
          const hasVerifiedP = typeof item.protein === 'number';
          const hasVerifiedC = typeof item.carbs === 'number';
          const hasVerifiedF = typeof item.fats === 'number';

          return {
            id: `meal-${i}`,
            time: item.time || (i === 0 ? "08:00" : i === 1 ? "13:00" : "19:00"),
            name: `${item.meal ? item.meal + ' · ' : ''}${item.food || ''} (${item.amount || ''}) ${item.other ? '· ' + item.other : ''}`.trim(),
            calories: hasVerifiedKcal ? item.calories : 0,
            protein: hasVerifiedP ? item.protein : 0,
            carbs: hasVerifiedC ? item.carbs : 0,
            fats: hasVerifiedF ? item.fats : 0,
          };
        });
      }
    } else if (progData.status === "AWAITING_REVIEW") {
      updated.programme.subtitle = "Under Review by Sahmi";
      updated.programme.athleteDirection = "Your 9-stage assessment has been received. Coach Sahmi is preparing your personalised programme (delivery within 5 business days).";
    } else if (progData.status === "SAFETY_HELD") {
      updated.programme.subtitle = "Safety Review";
      updated.programme.athleteDirection = "A pre-participation safety question requires coaching clarification before training activation.";
    }

    liveSnapshot = updated;
    liveListeners.forEach((l) => l());
  } catch {} finally {
    isFetchingLive = false;
  }
}

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
      if (parsed?.schemaVersion === 2 && parsed.client?.email === "demo@ascend.co") {
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

export function registerGetDivineDemoAuthStarter(
  starter: () => void | Promise<void>,
) {
  demoAuthStarter = starter;
  return () => {
    if (demoAuthStarter === starter) demoAuthStarter = null;
  };
}

export const clientPortalAdapter = {
  getSnapshot(scope: PortalScope): ClientPortalData {
    if (scope === "demo") return hydrateDemo();
    if (!liveSnapshot) {
      liveSnapshot = hydrateDemo();
      fetchLiveProgramme();
    }
    return liveSnapshot;
  },

  subscribe(scope: PortalScope, listener: Listener) {
    if (scope === "live") {
      liveListeners.add(listener);
      fetchLiveProgramme();
      return () => {
        liveListeners.delete(listener);
      };
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

  async addFood(scope: PortalScope, input: FoodEntryInput) {
    if (scope === "live") {
      if (!liveBridge) throw new Error("Live dataStore bridge is not registered.");
      await liveBridge.addFood(input);
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

  async saveWorkout(scope: PortalScope, input: WorkoutSessionInput) {
    if (scope === "live") {
      if (!liveBridge) throw new Error("Live dataStore bridge is not registered.");
      await liveBridge.saveWorkout(input);
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

  async saveCheckIn(scope: PortalScope, input: CheckInInput) {
    if (scope === "live") {
      if (!liveBridge) throw new Error("Live dataStore bridge is not registered.");
      await liveBridge.saveCheckIn(input);
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

export async function beginGetDivineDemoSession() {
  clientPortalAdapter.initializeDemo();
  await demoAuthStarter?.();
}
