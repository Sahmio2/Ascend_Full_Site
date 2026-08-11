import type { DraftRepository } from "../../../../repositories/DraftRepository";
import { LocalStorageDraftRepository } from "../../../../repositories/LocalStorageDraftRepository";
import { ASCEND_STORAGE_KEYS } from "../../../../storage/storageKeys";

let activeDraftRepository: DraftRepository = new LocalStorageDraftRepository(
  ASCEND_STORAGE_KEYS.safeAssessmentDraft,
);

export function registerAscendDraftRepository(repository: DraftRepository) {
  const previous = activeDraftRepository;
  activeDraftRepository = repository;
  return () => {
    if (activeDraftRepository === repository) activeDraftRepository = previous;
  };
}

export const ascendDraftAdapter: DraftRepository = {
  load: () => activeDraftRepository.load(),
  save: (draft) => activeDraftRepository.save(draft),
  remove: () => activeDraftRepository.remove(),
};
