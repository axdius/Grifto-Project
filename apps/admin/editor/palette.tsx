"use client";

import { listSections } from "@grifto/theme-schemas";
import { useEditorStore } from "./store";

/** Left pane: sections the editor can add, straight from the registry. */
export function SectionPalette() {
  const addSection = useEditorStore((s) => s.addSection);

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-2 overflow-y-auto border-r border-neutral-200 bg-white p-3">
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Sections
      </p>
      {listSections().map((def) => (
        <button
          key={def.type}
          type="button"
          onClick={() => addSection(def.type)}
          className="rounded-lg border border-neutral-200 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50"
        >
          <span className="block text-sm font-medium text-neutral-900">{def.label}</span>
          <span className="mt-0.5 block text-xs text-neutral-500">{def.description}</span>
        </button>
      ))}
    </aside>
  );
}
