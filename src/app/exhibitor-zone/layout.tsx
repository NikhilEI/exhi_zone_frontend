import type { Metadata } from "next";
import { SessionProvider } from "./_lib/SessionProvider";
import "./ez-globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Exhibitor Zone",
    default: "Exhibitor Zone | Wellness India Expo 2027"
  },
  description: "Exhibitor portal and admin panel for Wellness India Expo 2027."
};

// This has no layout.tsx above it in app/, so it becomes its own root layout —
// entirely separate <html>/<body> and stylesheet set from the marketing
// site's (marketing)/layout.tsx, with no shared ancestor. The marketing site
// already loads a global Bootstrap 5 build, so co-mounting this design
// system (its own from-scratch CSS, ported 1:1 from the reference project at
// D:\ci_ex_zone\frontend) under one root would conflict.
export default function ExhibitorZoneRootLayout({ children }: LayoutProps<"/exhibitor-zone">) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
