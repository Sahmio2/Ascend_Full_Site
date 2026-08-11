import { registerGetDivineLiveBridge } from "./clientPortalAdapter";
import type { ClientPortalData, FoodEntryInput, WorkoutSessionInput, CheckInInput } from "./types";

/**
 * Copy this mapping into the target project's dataStore integration point.
 * Replace each marked call with the existing store's real method. Do not replace
 * dataStore.ts wholesale and do not seed demo records into gd_app_data_v1.
 */
export function connectExistingDataStore(dataStore: {
  getClientPortalSnapshot(): ClientPortalData;
  subscribe(listener: () => void): () => void;
  addFood(input: FoodEntryInput): void;
  saveWorkout(input: WorkoutSessionInput): void;
  saveCheckIn(input: CheckInInput): void;
}) {
  return registerGetDivineLiveBridge({
    getSnapshot: () => dataStore.getClientPortalSnapshot(),
    subscribe: (listener) => dataStore.subscribe(listener),
    addFood: (input) => dataStore.addFood(input),
    saveWorkout: (input) => dataStore.saveWorkout(input),
    saveCheckIn: (input) => dataStore.saveCheckIn(input),
  });
}
