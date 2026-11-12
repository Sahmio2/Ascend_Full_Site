import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Get Divine | High-Performance Physique & Longevity Coaching",
  description:
    "Bespoke high-performance physique, bodybuilding, biomechanics, and metabolic coaching led by Sahmi El.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
