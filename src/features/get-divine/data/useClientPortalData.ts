import { useSyncExternalStore } from "react";
import { clientPortalAdapter, PortalScope } from "./clientPortalAdapter";

export function useClientPortalData(scope: PortalScope) {
  return useSyncExternalStore(
    (listener) => clientPortalAdapter.subscribe(scope, listener),
    () => clientPortalAdapter.getSnapshot(scope),
    () => clientPortalAdapter.getSnapshot(scope)
  );
}
