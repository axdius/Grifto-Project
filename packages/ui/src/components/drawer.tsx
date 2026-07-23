"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Right-side slide-out panel on the native <dialog> element (focus trap, Esc,
 * backdrop for free — same approach as Dialog). The slide animation is done by
 * toggling a transform class one frame after showModal().
 */
export function Drawer({
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Next frame so the initial translate-x-full state paints first.
      requestAnimationFrame(() => setVisible(true));
    }
    if (!open && dialog.open) {
      setVisible(false);
      const timer = setTimeout(() => dialog.close(), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // backdrop click
      }}
      className={cn(
        "fixed inset-y-0 right-0 m-0 h-dvh max-h-none w-80 max-w-[85vw] bg-white p-0 shadow-xl transition-transform duration-200 ease-out backdrop:bg-neutral-900/40",
        visible ? "translate-x-0" : "translate-x-full",
        className,
      )}
      style={{ left: "auto" }}
    >
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M6.28 6.28a.75.75 0 011.06 0L10 8.94l2.66-2.66a.75.75 0 111.06 1.06L11.06 10l2.66 2.66a.75.75 0 11-1.06 1.06L10 11.06l-2.66 2.66a.75.75 0 01-1.06-1.06L8.94 10 6.28 7.34a.75.75 0 010-1.06z" />
          </svg>
        </button>
      </div>
      <div className="overflow-y-auto px-3 py-3">{children}</div>
    </dialog>
  );
}
