"use client";

import type { PortalScope } from "../data/types";
import TodayDashboard from "./TodayDashboard";

export default function DashboardPage({ scope }: { scope: PortalScope }) {
  return <TodayDashboard scope={scope} />;
}
