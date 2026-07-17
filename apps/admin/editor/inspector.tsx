"use client";

import { sectionDefaults, sectionRegistry, type SettingField } from "@grifto/theme-schemas";
import { Input, Label, Select } from "@grifto/ui";
import { useEditorStore } from "./store";

/**
 * Right pane: settings form for the selected section, generated entirely from
 * the section's registry schema — no per-section UI code.
 */

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: SettingField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.type) {
    case "textarea":
      return (
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={String(value ?? "")}
          min={field.min}
          max={field.max}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={String(value ?? "#ffffff")}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-neutral-300"
          />
          <Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "select":
      return (
        <Select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      );
    case "toggle":
      return (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="size-4 accent-brand-600"
          />
          Enabled
        </label>
      );
    default:
      return <Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function SectionInspector() {
  const document = useEditorStore((s) => s.document);
  const selectedId = useEditorStore((s) => s.selectedId);
  const updateSetting = useEditorStore((s) => s.updateSetting);

  const section = document?.sections.find((s) => s.id === selectedId);

  if (!section) {
    return (
      <aside className="w-80 shrink-0 overflow-y-auto border-l border-neutral-200 bg-white p-4">
        <p className="text-sm text-neutral-400">Select a section on the canvas to edit it.</p>
      </aside>
    );
  }

  const def = sectionRegistry[section.type];
  const defaults = sectionDefaults(section.type);

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-neutral-900">{def?.label ?? section.type}</h2>
      {def ? <p className="mt-1 text-xs text-neutral-500">{def.description}</p> : null}
      <div className="mt-4 space-y-4">
        {(def?.fields ?? []).map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label>{field.label}</Label>
            <FieldControl
              field={field}
              value={section.settings[field.key] ?? defaults[field.key]}
              onChange={(value) => updateSetting(section.id, field.key, value)}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
