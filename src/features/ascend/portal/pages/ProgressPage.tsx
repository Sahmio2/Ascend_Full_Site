"use client";

import type { PortalScope } from "../data/types";
import ProgressInteractivePage from "./ProgressInteractivePage";

export default function ProgressPage({ scope }: { scope: PortalScope }) {
  return <ProgressInteractivePage scope={scope} />;
}
