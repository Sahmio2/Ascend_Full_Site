import { BrowserRouter } from "react-router-dom";
import { GetDivinePortalRoutes } from "./index";

/**
 * EXAMPLE ONLY: the target already has BrowserRouter. Add GetDivinePortalRoutes
 * inside that existing router instead of nesting or creating a second router.
 */
export function AppIntegrationSnippet() {
  return (
    <BrowserRouter>
      <GetDivinePortalRoutes />
    </BrowserRouter>
  );
}
