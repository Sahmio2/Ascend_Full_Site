import type { ReactNode } from "react";
import ClientPortalHeader from "@/features/ascend/portal/components/ClientPortalHeader";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#f5f0e9" }}>
      <ClientPortalHeader scope="live" />
      <main>{children}</main>
    </div>
  );
}
