import { z } from "zod";
import { defineEndpoint } from "./endpoint";
import { isoDateTime } from "./common";

/**
 * Theme document model per architecture doc 07: a page is an ordered list of
 * schema-driven sections; settings are validated against the section schema
 * from @grifto/theme-schemas (the component registry).
 */

export const themeSectionSchema = z.object({
  id: z.string(),
  /** Registry key, e.g. "hero_banner". */
  type: z.string(),
  settings: z.record(z.unknown()),
});
export type ThemeSection = z.infer<typeof themeSectionSchema>;

export const themeDocumentSchema = z.object({
  sections: z.array(themeSectionSchema),
});
export type ThemeDocument = z.infer<typeof themeDocumentSchema>;

export const themeDraftSchema = z.object({
  document: themeDocumentSchema,
  updatedAt: isoDateTime,
  /** True when the draft differs from the published document. */
  dirty: z.boolean(),
});
export type ThemeDraft = z.infer<typeof themeDraftSchema>;

export const themeVersionSchema = z.object({
  id: z.string(),
  version: z.number().int(),
  label: z.string(),
  publishedAt: isoDateTime,
});
export type ThemeVersion = z.infer<typeof themeVersionSchema>;

export const themeEndpoints = {
  /** Public: the published homepage document rendered by the storefront. */
  getPublished: defineEndpoint({
    method: "GET",
    path: "/v1/theme/published",
    response: themeDocumentSchema,
  }),
  getDraft: defineEndpoint({
    method: "GET",
    path: "/v1/admin/theme/draft",
    response: themeDraftSchema,
  }),
  saveDraft: defineEndpoint({
    method: "PUT",
    path: "/v1/admin/theme/draft",
    body: themeDocumentSchema,
    response: themeDraftSchema,
  }),
  publish: defineEndpoint({
    method: "POST",
    path: "/v1/admin/theme/publish",
    response: themeVersionSchema,
  }),
  discardDraft: defineEndpoint({
    method: "POST",
    path: "/v1/admin/theme/draft/discard",
    response: themeDraftSchema,
  }),
  listVersions: defineEndpoint({
    method: "GET",
    path: "/v1/admin/theme/versions",
    response: z.object({ items: z.array(themeVersionSchema) }),
  }),
  restoreVersion: defineEndpoint({
    method: "POST",
    path: "/v1/admin/theme/versions/:versionId/restore",
    params: z.object({ versionId: z.string() }),
    response: themeDraftSchema,
  }),
} as const;
