"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@grifto/ui";
import { useSession } from "../hooks/use-session";

/**
 * Client-side route guard. With the real backend + cookie sessions this
 * becomes server-side (middleware); the component boundary stays identical.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8 text-brand-500" />
      </div>
    );
  }
  return <>{children}</>;
}
