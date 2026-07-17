import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grifto — Wedding Gifting",
  description: "Create and share wedding wishlists. Receive gifts that matter.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
