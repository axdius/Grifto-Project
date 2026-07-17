"use client";

import { useRef, useState } from "react";
import type { UploadedAsset } from "@grifto/platform-services";
import { useStorageService } from "@grifto/platform-services";
import { Button, Card, CardBody, EmptyState } from "@grifto/ui";
import { PageHeader } from "@/components/admin-shell";

/**
 * Media library on StorageService — the plug-and-play seam:
 * today LocalObjectStorageService (object URLs, session-scoped);
 * later S3 presigned upload + CDN listing with zero changes here.
 */
export function MediaLibrary() {
  const storage = useStorageService();
  const inputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [uploading, setUploading] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map((f) => storage.upload(f)));
      setAssets((prev) => [...uploaded, ...prev]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(asset: UploadedAsset) {
    await storage.remove(asset.id);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  }

  return (
    <>
      <PageHeader
        title="Media Library"
        actions={
          <Button loading={uploading} onClick={() => inputRef.current?.click()}>
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
        Local mode: uploads live for this session via object URLs. The S3 adapter swaps in behind
        the same StorageService interface.
      </p>
      {assets.length === 0 ? (
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
                    onClick={() => void remove(asset)}
                    className="text-[11px] font-medium text-danger-600 hover:underline"
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
