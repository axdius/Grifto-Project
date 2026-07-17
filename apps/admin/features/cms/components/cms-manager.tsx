"use client";

import { useState } from "react";
import type { CmsEntry, CmsEntryKind } from "@grifto/contracts";
import {
  useAdminCmsEntries,
  useCreateCmsEntry,
  useDeleteCmsEntry,
  useUpdateCmsEntry,
} from "@grifto/sdk";
import { Badge, Button, Dialog, Field, Input, cn } from "@grifto/ui";
import { PageHeader } from "@/components/admin-shell";
import { DataTable } from "@/components/data-table";

const kinds: { key: CmsEntryKind; label: string; titleLabel: string; bodyLabel: string }[] = [
  { key: "testimonial", label: "Testimonials", titleLabel: "Couple names", bodyLabel: "Quote" },
  { key: "faq", label: "FAQs", titleLabel: "Question", bodyLabel: "Answer" },
  { key: "banner", label: "Banners", titleLabel: "Headline", bodyLabel: "Subtext" },
];

export function CmsManager() {
  const [kind, setKind] = useState<CmsEntryKind>("testimonial");
  const { data, isLoading } = useAdminCmsEntries(kind);
  const deleteEntry = useDeleteCmsEntry();
  const updateEntry = useUpdateCmsEntry();
  const [editing, setEditing] = useState<CmsEntry | "new" | null>(null);

  const kindMeta = kinds.find((k) => k.key === kind)!;

  return (
    <>
      <PageHeader
        title="Content"
        actions={<Button onClick={() => setEditing("new")}>Add {kindMeta.label.slice(0, -1)}</Button>}
      />
      <div className="mb-4 flex gap-1 rounded-lg bg-neutral-100 p-1" role="tablist">
        {kinds.map((k) => (
          <button
            key={k.key}
            role="tab"
            aria-selected={kind === k.key}
            onClick={() => setKind(k.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              kind === k.key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>
      <DataTable
        loading={isLoading}
        rows={data?.items}
        emptyText={`No ${kindMeta.label.toLowerCase()} yet`}
        columns={[
          {
            key: "content",
            header: kindMeta.titleLabel,
            render: (e) => (
              <div className="max-w-lg">
                <p className="font-medium text-neutral-900">{e.title}</p>
                <p className="truncate text-xs text-neutral-400">{e.body}</p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (e) => (
              <Badge tone={e.published ? "success" : "neutral"}>
                {e.published ? "Published" : "Draft"}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (e) => (
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  loading={updateEntry.isPending && updateEntry.variables?.entryId === e.id}
                  onClick={() =>
                    updateEntry.mutate({ entryId: e.id, body: { published: !e.published } })
                  }
                >
                  {e.published ? "Unpublish" : "Publish"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(e)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger-600"
                  loading={deleteEntry.isPending && deleteEntry.variables?.entryId === e.id}
                  onClick={() => deleteEntry.mutate({ entryId: e.id })}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
      />
      {editing ? (
        <EntryDialog
          entry={editing === "new" ? null : editing}
          kind={kind}
          titleLabel={kindMeta.titleLabel}
          bodyLabel={kindMeta.bodyLabel}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function EntryDialog({
  entry,
  kind,
  titleLabel,
  bodyLabel,
  onClose,
}: {
  entry: CmsEntry | null;
  kind: CmsEntryKind;
  titleLabel: string;
  bodyLabel: string;
  onClose: () => void;
}) {
  const create = useCreateCmsEntry();
  const update = useUpdateCmsEntry();
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const busy = create.isPending || update.isPending;

  function submit() {
    if (!title.trim()) return setError(`${titleLabel} is required`);
    if (!body.trim()) return setError(`${bodyLabel} is required`);
    setError(null);
    if (entry) {
      update.mutate(
        { entryId: entry.id, body: { title: title.trim(), body: body.trim() } },
        { onSuccess: onClose, onError: (e) => setError(e.message) },
      );
    } else {
      create.mutate(
        { kind, title: title.trim(), body: body.trim(), published: true },
        { onSuccess: onClose, onError: (e) => setError(e.message) },
      );
    }
  }

  return (
    <Dialog open onClose={onClose} title={entry ? "Edit entry" : "New entry"}>
      <div className="space-y-4">
        <Field label={titleLabel} htmlFor="c-title">
          <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label={bodyLabel} htmlFor="c-body">
          <textarea
            id="c-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-2 focus:outline-offset-0 focus:outline-brand-200"
          />
        </Field>
        {error ? (
          <p className="text-sm text-danger-600" role="alert">
            {error}
          </p>
        ) : null}
        <Button className="w-full" loading={busy} onClick={submit}>
          {entry ? "Save changes" : "Create entry"}
        </Button>
      </div>
    </Dialog>
  );
}
