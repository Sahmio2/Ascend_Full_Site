import { AscendCoachRoutes } from "./coach";
import GetDivinePortalRoutes from "./portal/GetDivinePortalRoutes";
import { AscendPublicRoutes } from "./public-apply";

/**
 * Integration example only: render this once inside the target BrowserRouter.
 * If the target App.tsx already declares these paths, register the supplied
 * page elements in that existing route tree instead of nesting a second router.
 */
export default function AscendFullSiteRoutes() {
  return (
    <>
      <AscendPublicRoutes />
      <GetDivinePortalRoutes />
      <AscendCoachRoutes />
    </>
  );
}
