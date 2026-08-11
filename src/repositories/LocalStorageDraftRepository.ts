import { parseSafeDraft, type SafeDraft } from "../features/ascend/public-apply/apply/assessment-model";
import type { DraftRepository } from "./DraftRepository";

function browserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

/** Stores only the explicit SafeDraft whitelist; never a full application. */
export class LocalStorageDraftRepository implements DraftRepository {
  constructor(private readonly storageKey: string) {}

  async load() {
    return parseSafeDraft(browserStorage()?.getItem(this.storageKey) ?? null);
  }

  async save(draft: SafeDraft) {
    browserStorage()?.setItem(this.storageKey, JSON.stringify(draft));
  }

  async remove() {
    browserStorage()?.removeItem(this.storageKey);
  }
}
