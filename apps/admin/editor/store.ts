"use client";

import { create } from "zustand";
import type { ThemeDocument } from "@grifto/contracts";
import { sectionDefaults } from "@grifto/theme-schemas";

/**
 * Editor state (architecture doc 07): the draft document plus selection and a
 * snapshot-based undo/redo history. Server persistence (save/publish/versions)
 * stays in the SDK hooks — this store is purely client-side editing state.
 */

function newSectionId(): string {
  return `sec_${Math.random().toString(36).slice(2, 10)}`;
}

interface EditorState {
  document: ThemeDocument | null;
  /** Document as last loaded/saved from the server — used for dirty checks. */
  baseline: ThemeDocument | null;
  selectedId: string | null;
  past: ThemeDocument[];
  future: ThemeDocument[];

  load: (document: ThemeDocument) => void;
  markSaved: () => void;
  select: (id: string | null) => void;
  updateSetting: (sectionId: string, key: string, value: unknown) => void;
  addSection: (type: string) => void;
  removeSection: (sectionId: string) => void;
  moveSection: (fromId: string, toId: string) => void;
  undo: () => void;
  redo: () => void;
}

function pushHistory(state: EditorState): Pick<EditorState, "past" | "future"> {
  if (!state.document) return { past: state.past, future: [] };
  return { past: [...state.past.slice(-49), state.document], future: [] };
}

export const useEditorStore = create<EditorState>((set) => ({
  document: null,
  baseline: null,
  selectedId: null,
  past: [],
  future: [],

  load: (document) =>
    set({
      document: structuredClone(document),
      baseline: structuredClone(document),
      selectedId: null,
      past: [],
      future: [],
    }),

  markSaved: () =>
    set((state) => ({ baseline: state.document ? structuredClone(state.document) : null })),

  select: (id) => set({ selectedId: id }),

  updateSetting: (sectionId, key, value) =>
    set((state) => {
      if (!state.document) return state;
      return {
        ...pushHistory(state),
        document: {
          sections: state.document.sections.map((s) =>
            s.id === sectionId ? { ...s, settings: { ...s.settings, [key]: value } } : s,
          ),
        },
      };
    }),

  addSection: (type) =>
    set((state) => {
      if (!state.document) return state;
      const section = { id: newSectionId(), type, settings: sectionDefaults(type) };
      return {
        ...pushHistory(state),
        document: { sections: [...state.document.sections, section] },
        selectedId: section.id,
      };
    }),

  removeSection: (sectionId) =>
    set((state) => {
      if (!state.document) return state;
      return {
        ...pushHistory(state),
        document: { sections: state.document.sections.filter((s) => s.id !== sectionId) },
        selectedId: state.selectedId === sectionId ? null : state.selectedId,
      };
    }),

  moveSection: (fromId, toId) =>
    set((state) => {
      if (!state.document || fromId === toId) return state;
      const sections = [...state.document.sections];
      const from = sections.findIndex((s) => s.id === fromId);
      const to = sections.findIndex((s) => s.id === toId);
      if (from === -1 || to === -1) return state;
      const [moved] = sections.splice(from, 1);
      if (!moved) return state;
      sections.splice(to, 0, moved);
      return { ...pushHistory(state), document: { sections } };
    }),

  undo: () =>
    set((state) => {
      const previous = state.past[state.past.length - 1];
      if (!previous || !state.document) return state;
      return {
        document: previous,
        past: state.past.slice(0, -1),
        future: [state.document, ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      const [next, ...rest] = state.future;
      if (!next || !state.document) return state;
      return { document: next, past: [...state.past, state.document], future: rest };
    }),
}));

export function useIsDirty(): boolean {
  return useEditorStore(
    (state) => JSON.stringify(state.document) !== JSON.stringify(state.baseline),
  );
}
