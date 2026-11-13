"use client";

import type { PortalScope } from "../data/types";
import NutritionMealsPage from "./NutritionMealsPage";

export default function NutritionPage({ scope }: { scope: PortalScope }) {
  return <NutritionMealsPage scope={scope} />;
}
