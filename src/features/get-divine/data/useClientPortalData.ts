import { useSyncExternalStore } from "react";
import { clientPortalAdapter } from "./clientPortalAdapter";
import type { PortalScope } from "./types";

export function useClientPortalData(scope: PortalScope) {
  return useSyncExternalStore(
    (listener) => clientPortalAdapter.subscribe(scope, listener),
    () => clientPortalAdapter.getSnapshot(scope),
    () => clientPortalAdapter.getSnapshot(scope),
  );
}
