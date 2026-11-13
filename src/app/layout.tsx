import type { Metadata, Viewport } from "next";
import "@/globals.css";
import "@/styles/ascend-fonts.css";
import "@/styles/ascend-latest-build.css";
import "@/styles/get-divine-mobile-type.css";
import "@/styles/get-divine-patch-02.css";

export const metadata: Metadata = {
  title: "ASCEND — Coaching Platform & Client Workspace",
  description:
    "Personalised physique coaching built around structure, progression and longevity. ASCEND by Sahmi El.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

