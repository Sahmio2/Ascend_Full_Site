import type { ReactNode } from "react";
import PortalHeader from "@/features/ascend/portal/components/PortalHeader";
import "@/styles/ascend-portal-clean.css";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="portal-root">
      <PortalHeader scope="demo" />
      <main>{children}</main>
    </div>
  );
}
