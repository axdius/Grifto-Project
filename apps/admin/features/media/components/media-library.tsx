"use client";

import { useRef } from "react";
import { fileToBase64, useAdminMedia, useDeleteMedia, useUploadMedia } from "@grifto/sdk";
import { Button, Card, CardBody, EmptyState, Spinner } from "@grifto/ui";
import { PageHeader } from "@/components/admin-shell";

/**
 * Media library backed by the shared mock media API (persisted in mock DB).
 * Later this swaps to S3/CDN via the same SDK endpoints / StorageService seam.
 */
export function MediaLibrary() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError } = useAdminMedia();
  const upload = useUploadMedia();
  const remove = useDeleteMedia();
  const assets = data?.items ?? [];

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      for (const file of Array.from(files)) {
        const dataBase64 = await fileToBase64(file);
        await upload.mutateAsync({
          filename: file.name,
          mimeType: file.type || "image/jpeg",
          dataBase64,
        });
      }
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <PageHeader
        title="Media Library"
        actions={
          <Button loading={upload.isPending} onClick={() => inputRef.current?.click()}>
            Upload media
          </Button>
        }
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => void onFiles(e.target.files)}
      />
      <p className="mb-4 text-sm text-neutral-500">
        Uploads persist in the shared mock API and can be used for banner desktop/mobile images.
      </p>
      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="size-8 text-brand-500" />
        </div>
      ) : isError ? (
        <p className="py-12 text-center text-sm text-neutral-500">
          Couldn&apos;t load media. Is the mock API running on port 4000?
        </p>
      ) : assets.length === 0 ? (
        <EmptyState
          title="No media yet"
          description="Upload images for banners, products and CMS content."
          action={
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              Upload your first image
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {assets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="aspect-square bg-neutral-100">
                <img src={asset.url} alt={asset.filename} className="size-full object-cover" />
              </div>
              <CardBody className="px-3 py-2">
                <p className="truncate text-xs font-medium text-neutral-900">{asset.filename}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[11px] text-neutral-400">
                    {(asset.bytes / 1024).toFixed(0)} KB
                  </p>
                  <button
                    type="button"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate({ mediaId: asset.id })}
                    className="text-[11px] font-medium text-danger-600 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
