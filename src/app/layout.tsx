import type { Metadata, Viewport } from "next";
import "@/globals.css";
import "@/styles/ascend-fonts.css";
import "@/styles/ascend-latest-build.css";
import "@/styles/get-divine-mobile-type.css";
import "@/styles/get-divine-patch-02.css";
import DevScreenNavigator from "@/components/DevScreenNavigator";

export const metadata: Metadata = {
  title: "ASCEND — Personalised Online Physique Coaching",
  description:
    "Personalised online coaching for gym beginners. Structured workouts, practical Nigerian nutrition, progress tracking and twice-monthly reviews with Sahmi El.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4EFE3",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('ascend_public_theme')==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',m);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <DevScreenNavigator />
      </body>
    </html>
  );
}
