"use client";

import { useRef, useState } from "react";
import type { CmsEntry, CmsEntryKind } from "@grifto/contracts";
import {
  fileToBase64,
  useAdminCmsEntries,
  useCreateCmsEntry,
  useDeleteCmsEntry,
  useUpdateCmsEntry,
  useUploadMedia,
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
              <div className="flex max-w-lg items-center gap-3">
                {kind === "banner" && e.imageUrl ? (
                  <img
                    src={e.imageUrl}
                    alt=""
                    className="size-12 shrink-0 rounded-md object-cover"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900">{e.title}</p>
                  <p className="truncate text-xs text-neutral-400">{e.body}</p>
                </div>
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

function BannerImageField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadMedia();

  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    try {
      const dataBase64 = await fileToBase64(file);
      const asset = await upload.mutateAsync({
        filename: file.name,
        mimeType: file.type || "image/jpeg",
        dataBase64,
      });
      onChange(asset.url);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Field label={label} htmlFor={id}>
      <p className="mb-2 text-xs text-neutral-500">{hint}</p>
      {value ? (
        <div className="mb-2 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
          <img src={value} alt="" className="h-28 w-full object-cover" />
        </div>
      ) : (
        <div className="mb-2 flex h-28 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400">
          No image
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {value ? "Replace" : "Upload"}
        </Button>
        {value ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
            Clear
          </Button>
        ) : null}
      </div>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => void onFile(e.target.files)}
      />
    </Field>
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
  const [ctaLabel, setCtaLabel] = useState(entry?.ctaLabel ?? "");
  const [ctaHref, setCtaHref] = useState(entry?.ctaHref ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(entry?.imageUrl ?? null);
  const [mobileImageUrl, setMobileImageUrl] = useState<string | null>(
    entry?.mobileImageUrl ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const busy = create.isPending || update.isPending;
  const isBanner = kind === "banner";

  function submit() {
    if (!title.trim()) return setError(`${titleLabel} is required`);
    if (!body.trim()) return setError(`${bodyLabel} is required`);
    setError(null);
    const cta = isBanner
      ? {
          ctaLabel: ctaLabel.trim() || null,
          ctaHref: ctaHref.trim() || null,
          imageUrl,
          mobileImageUrl,
        }
      : {};
    if (entry) {
      update.mutate(
        { entryId: entry.id, body: { title: title.trim(), body: body.trim(), ...cta } },
        { onSuccess: onClose, onError: (e) => setError(e.message) },
      );
    } else {
      create.mutate(
        { kind, title: title.trim(), body: body.trim(), published: true, ...cta },
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
        {isBanner ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <BannerImageField
                id="c-desktop-image"
                label="Desktop image"
                hint="Used on tablets and desktop (and as fallback on mobile)."
                value={imageUrl}
                onChange={setImageUrl}
              />
              <BannerImageField
                id="c-mobile-image"
                label="Mobile image"
                hint="Optional. Shown below 768px width."
                value={mobileImageUrl}
                onChange={setMobileImageUrl}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CTA button label" htmlFor="c-cta-label">
                <Input
                  id="c-cta-label"
                  value={ctaLabel}
                  placeholder="e.g. Explore"
                  onChange={(e) => setCtaLabel(e.target.value)}
                />
              </Field>
              <Field label="CTA link" htmlFor="c-cta-href">
                <Input
                  id="c-cta-href"
                  value={ctaHref}
                  placeholder="e.g. /register"
                  onChange={(e) => setCtaHref(e.target.value)}
                />
              </Field>
            </div>
          </>
        ) : null}
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
