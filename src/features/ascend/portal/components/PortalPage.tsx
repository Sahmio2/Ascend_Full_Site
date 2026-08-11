import type { ReactNode } from "react";
import PortalShell, { type PortalSection } from "./PortalShell";
import { useClientPortalData } from "../data/useClientPortalData";
import type { PortalScope } from "../data/types";

export default function PortalPage({ scope, current, children }: { scope: PortalScope; current: PortalSection; children: ReactNode | ((clientName: string) => ReactNode) }) {
  const data = useClientPortalData(scope);
  return (
    <PortalShell scope={scope} current={current} clientName={data.client.fullName} phase={data.client.phaseName}>
      {typeof children === "function" ? children(data.client.fullName) : children}
    </PortalShell>
  );
}
