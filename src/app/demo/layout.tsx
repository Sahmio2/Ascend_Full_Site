import type { ReactNode } from "react";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return <div style={{ minHeight: "100vh", background: "#050505", color: "#f5f0e9" }}>{children}</div>;
}
