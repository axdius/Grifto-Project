import { z } from "zod";
import { defineEndpoint } from "./endpoint";
import { isoDateTime } from "./common";

export const mediaAssetSchema = z.object({
  id: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  bytes: z.number().int().nonnegative(),
  /** Absolute URL served by GET /v1/media/:id */
  url: z.string(),
  createdAt: isoDateTime,
});
export type MediaAsset = z.infer<typeof mediaAssetSchema>;

export const uploadMediaBodySchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  /** Raw file bytes as base64 (no data: prefix). */
  dataBase64: z.string().min(1),
});
export type UploadMediaBody = z.infer<typeof uploadMediaBodySchema>;

export const mediaEndpoints = {
  listAdmin: defineEndpoint({
    method: "GET",
    path: "/v1/admin/media",
    response: z.object({ items: z.array(mediaAssetSchema) }),
  }),
  upload: defineEndpoint({
    method: "POST",
    path: "/v1/admin/media",
    body: uploadMediaBodySchema,
    response: mediaAssetSchema,
  }),
  remove: defineEndpoint({
    method: "DELETE",
    path: "/v1/admin/media/:mediaId",
    params: z.object({ mediaId: z.string() }),
    response: z.object({ ok: z.literal(true) }),
  }),
} as const;
