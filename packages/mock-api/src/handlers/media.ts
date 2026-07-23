import { http, HttpResponse } from "msw";
import { uploadMediaBodySchema, type MediaAsset } from "@grifto/contracts";
import { db, newId } from "../db/db";
import type { DbMediaAsset } from "../db/schema";
import { ok, problem, simulateLatency } from "../http";

function byteLength(dataBase64: string): number {
  try {
    return Buffer.from(dataBase64, "base64").byteLength;
  } catch {
    return 0;
  }
}

function toDto(asset: DbMediaAsset, origin: string): MediaAsset {
  return {
    id: asset.id,
    filename: asset.filename,
    mimeType: asset.mimeType,
    bytes: byteLength(asset.dataBase64),
    url: `${origin}/v1/media/${asset.id}`,
    createdAt: asset.createdAt,
  };
}

function requestOrigin(request: Request): string {
  return new URL(request.url).origin;
}

export const mediaHandlers = [
  http.get("*/v1/admin/media", async ({ request }) => {
    await simulateLatency();
    const origin = requestOrigin(request);
    const items = [...db.get().media]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((a) => toDto(a, origin));
    return ok({ items });
  }),

  http.post("*/v1/admin/media", async ({ request }) => {
    await simulateLatency();
    const parsed = uploadMediaBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const body = parsed.data;
    if (!body.mimeType.startsWith("image/")) {
      return problem(422, "VALIDATION_ERROR", "Only image uploads are supported");
    }
    if (byteLength(body.dataBase64) === 0) {
      return problem(422, "VALIDATION_ERROR", "Image data is empty or invalid");
    }
    const asset = db.mutate((data) => {
      const created: DbMediaAsset = {
        id: newId("med"),
        filename: body.filename,
        mimeType: body.mimeType,
        dataBase64: body.dataBase64,
        createdAt: new Date().toISOString(),
      };
      data.media.unshift(created);
      return created;
    });
    return ok(toDto(asset, requestOrigin(request)), 201);
  }),

  http.delete("*/v1/admin/media/:mediaId", async ({ params }) => {
    await simulateLatency();
    const mediaId = params.mediaId as string;
    const removed = db.mutate((data) => {
      const before = data.media.length;
      data.media = data.media.filter((m) => m.id !== mediaId);
      return data.media.length < before;
    });
    if (!removed) return problem(404, "MEDIA_NOT_FOUND", "Media asset not found");
    return ok({ ok: true });
  }),

  /** Public binary fetch for <img src> / picture — not JSON. */
  http.get("*/v1/media/:mediaId", async ({ params }) => {
    const mediaId = params.mediaId as string;
    const asset = db.get().media.find((m) => m.id === mediaId);
    if (!asset) return problem(404, "MEDIA_NOT_FOUND", "Media asset not found");
    try {
      const bytes = Buffer.from(asset.dataBase64, "base64");
      return new HttpResponse(bytes, {
        status: 200,
        headers: {
          "Content-Type": asset.mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      return problem(500, "MEDIA_CORRUPT", "Stored media could not be decoded");
    }
  }),
];
