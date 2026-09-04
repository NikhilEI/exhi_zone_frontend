import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exhibitor Zone",
  description: "Exhibitor portal and admin panel."
};

// Root layout for "/" only — /exhibitor-zone/* has its own root layout
// (src/app/exhibitor-zone/layout.tsx) with its own <html>/<body> and design
// system, entirely separate from this one.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
