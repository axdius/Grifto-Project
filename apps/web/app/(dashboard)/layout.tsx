import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { DashboardNav } from "@/features/dashboard/components/dashboard-nav";
import { RequireAuth } from "@/features/auth/components/require-auth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <RequireAuth>
        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-8 sm:px-6">
          <DashboardNav />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </RequireAuth>
    </div>
  );
}
