"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Minimal accessible modal on the native <dialog> element (focus trap, Esc,
 * ::backdrop for free). Swappable for a Radix Dialog later without prop churn.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // backdrop click
      }}
      className={cn(
        "m-auto w-full max-w-md rounded-card border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/40",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M6.28 6.28a.75.75 0 011.06 0L10 8.94l2.66-2.66a.75.75 0 111.06 1.06L11.06 10l2.66 2.66a.75.75 0 11-1.06 1.06L10 11.06l-2.66 2.66a.75.75 0 01-1.06-1.06L8.94 10 6.28 7.34a.75.75 0 010-1.06z" />
          </svg>
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
