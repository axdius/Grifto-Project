import { setupWorker } from "msw/browser";
import { handlers } from "./index";

/**
 * Browser MSW worker. Apps start this from their providers bootstrap when
 * NEXT_PUBLIC_API_MODE === "mock" (the only place allowed to import mock-api).
 */
export function createMockWorker() {
  return setupWorker(...handlers);
}

let started: Promise<void> | null = null;

/** Idempotent start — safe under React strict mode double-invocation. */
export function startMockWorker(): Promise<void> {
  started ??= createMockWorker()
    .start({
      onUnhandledRequest: "bypass",
      quiet: false,
    })
    .then(() => undefined);
  return started;
}
