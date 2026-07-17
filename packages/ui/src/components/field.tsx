import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-neutral-700", className)}
      {...props}
    />
  );
}

/** Form field wrapper: label + control + error message slot. */
export function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1 text-sm text-danger-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
