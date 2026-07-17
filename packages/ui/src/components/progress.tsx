import { cn } from "../lib/cn";

/** Funding progress bar — the core visual of wishlist items. */
export function Progress({
  value,
  className,
  tone = "brand",
}: {
  /** 0-100 */
  value: number;
  className?: string;
  tone?: "brand" | "success";
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-neutral-100", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          tone === "success" ? "bg-success-600" : "bg-brand-500",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
