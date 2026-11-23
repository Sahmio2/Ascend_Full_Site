import type { ReactNode } from "react";
import PortalHeader from "@/features/ascend/portal/components/PortalHeader";
import "@/styles/ascend-portal-clean.css";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="portal-root">
      <PortalHeader scope="live" />
      <main>{children}</main>
    </div>
  );
}
