"use client";

import { useEffect, useState } from "react";
import {
  useDiscardThemeDraft,
  usePublicCmsEntries,
  usePublishTheme,
  useRestoreThemeVersion,
  useSaveThemeDraft,
  useThemeDraft,
  useThemeVersions,
} from "@grifto/sdk";
import type { ThemeRenderContext } from "@grifto/theme-runtime";
import { Badge, Button, Dialog, Spinner } from "@grifto/ui";
import { formatDateTime } from "@grifto/utils";
import { EditorCanvas } from "./canvas";
import { SectionInspector } from "./inspector";
import { SectionPalette } from "./palette";
import { useEditorStore, useIsDirty } from "./store";

function VersionsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const versions = useThemeVersions();
  const restore = useRestoreThemeVersion();
  const load = useEditorStore((s) => s.load);

  return (
    <Dialog open={open} onClose={onClose} title="Version history">
      {versions.isPending ? (
        <div className="flex justify-center py-6">
          <Spinner className="size-5 text-brand-600" />
        </div>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {(versions.data?.items ?? []).map((version) => (
            <li
              key={version.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{version.label}</p>
                <p className="text-xs text-neutral-500">
                  Published {formatDateTime(version.publishedAt)}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                loading={restore.isPending && restore.variables?.versionId === version.id}
                onClick={() =>
                  restore.mutate(
                    { versionId: version.id },
                    {
                      onSuccess: (draft) => {
                        load(draft.document);
                        onClose();
                      },
                    },
                  )
                }
              >
                Restore to draft
              </Button>
            </li>
          ))}
          {versions.data?.items.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-400">Nothing published yet.</p>
          ) : null}
        </ul>
      )}
    </Dialog>
  );
}

export function ThemeEditor() {
  const draft = useThemeDraft();
  const saveDraft = useSaveThemeDraft();
  const publish = usePublishTheme();
  const discard = useDiscardThemeDraft();
  const testimonials = usePublicCmsEntries("testimonial");
  const faqs = usePublicCmsEntries("faq");
  const banners = usePublicCmsEntries("banner");

  const document = useEditorStore((s) => s.document);
  const load = useEditorStore((s) => s.load);
  const markSaved = useEditorStore((s) => s.markSaved);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const dirty = useIsDirty();

  const [versionsOpen, setVersionsOpen] = useState(false);

  // Load the server draft into the store once (or after external changes).
  useEffect(() => {
    if (draft.data && !document) load(draft.data.document);
  }, [draft.data, document, load]);

  // Cmd/Ctrl+Z undo, Shift+Cmd/Ctrl+Z redo.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  if (draft.isPending || !document) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="size-6 text-brand-600" />
      </div>
    );
  }

  const context: ThemeRenderContext = {
    testimonials: (testimonials.data?.items ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      body: t.body,
    })),
    faqs: (faqs.data?.items ?? []).map((f) => ({ id: f.id, title: f.title, body: f.body })),
    banners: banners.data?.items ?? [],
  };

  function handleSave(onSuccess?: () => void) {
    if (!document) return;
    saveDraft.mutate(document, {
      onSuccess: () => {
        markSaved();
        onSuccess?.();
      },
    });
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col overflow-hidden rounded-xl border border-neutral-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-neutral-900">Homepage</h1>
          {dirty ? (
            <Badge tone="warning">Unsaved changes</Badge>
          ) : draft.data?.dirty ? (
            <Badge tone="brand">Draft ahead of live</Badge>
          ) : (
            <Badge tone="success">In sync with live</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" disabled={!canUndo} onClick={undo}>
            Undo
          </Button>
          <Button size="sm" variant="ghost" disabled={!canRedo} onClick={redo}>
            Redo
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setVersionsOpen(true)}>
            Versions
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={discard.isPending}
            onClick={() => discard.mutate(undefined, { onSuccess: (d) => load(d.document) })}
          >
            Discard draft
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={saveDraft.isPending}
            disabled={!dirty}
            onClick={() => handleSave()}
          >
            Save draft
          </Button>
          <Button
            size="sm"
            loading={publish.isPending || saveDraft.isPending}
            onClick={() => handleSave(() => publish.mutate())}
          >
            Publish
          </Button>
        </div>
      </div>

      {/* Three-pane editor */}
      <div className="flex min-h-0 flex-1">
        <SectionPalette />
        <EditorCanvas context={context} />
        <SectionInspector />
      </div>

      <VersionsDialog open={versionsOpen} onClose={() => setVersionsOpen(false)} />
    </div>
  );
}
