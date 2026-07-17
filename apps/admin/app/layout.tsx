import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grifto Admin",
  description: "Grifto platform administration",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
