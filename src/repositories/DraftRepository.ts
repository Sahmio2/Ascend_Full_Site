import type { SafeDraft } from "../features/ascend/public-apply/apply/assessment-model";

export interface DraftRepository {
  load(): Promise<SafeDraft | null>;
  save(draft: SafeDraft): Promise<void>;
  remove(): Promise<void>;
}
