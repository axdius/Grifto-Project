"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ThemeSection } from "@grifto/contracts";
import { RenderSection, type ThemeRenderContext } from "@grifto/theme-runtime";
import { sectionRegistry } from "@grifto/theme-schemas";
import { cn } from "@grifto/ui";
import { useEditorStore } from "./store";

function SortableSection({
  section,
  context,
}: {
  section: ThemeSection;
  context: ThemeRenderContext;
}) {
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.select);
  const removeSection = useEditorStore((s) => s.removeSection);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const selected = selectedId === section.id;
  const label = sectionRegistry[section.type]?.label ?? section.type;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative cursor-pointer",
        isDragging && "z-10 opacity-70",
        selected ? "ring-2 ring-brand-500 ring-offset-0" : "hover:ring-2 hover:ring-brand-200",
      )}
      onClick={() => select(section.id)}
    >
      {/* Section chrome: label, drag handle, delete — visible on hover/selection. */}
      <div
        className={cn(
          "absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md bg-neutral-900/80 px-1.5 py-1 text-xs text-white",
          selected ? "flex" : "hidden group-hover:flex",
        )}
      >
        <button
          type="button"
          aria-label="Drag to reorder"
          className="cursor-grab touch-none px-1 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <span>{label}</span>
        <button
          type="button"
          aria-label="Remove section"
          className="px-1 text-neutral-300 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            removeSection(section.id);
          }}
        >
          ✕
        </button>
      </div>
      {/* Prevent nested interactive elements (links) from navigating in the editor. */}
      <div className="pointer-events-none">
        <RenderSection section={section} context={context} />
      </div>
    </div>
  );
}

export function EditorCanvas({ context }: { context: ThemeRenderContext }) {
  const document = useEditorStore((s) => s.document);
  const moveSection = useEditorStore((s) => s.moveSection);
  const select = useEditorStore((s) => s.select);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveSection(String(active.id), String(over.id));
    }
  }

  if (!document) return null;

  return (
    <div
      className="flex-1 overflow-y-auto bg-neutral-100 p-6"
      onClick={() => select(null)}
    >
      <div
        className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {document.sections.length === 0 ? (
          <p className="p-16 text-center text-sm text-neutral-400">
            Empty page — add sections from the left panel.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={document.sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {document.sections.map((section) => (
                <SortableSection key={section.id} section={section} context={context} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
