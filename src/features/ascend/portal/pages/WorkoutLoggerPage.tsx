"use client";

import type { PortalScope } from "../data/types";
import WorkoutsFocusPage from "./WorkoutsFocusPage";

export default function WorkoutLoggerPage({ scope }: { scope: PortalScope }) {
  return <WorkoutsFocusPage scope={scope} />;
}
