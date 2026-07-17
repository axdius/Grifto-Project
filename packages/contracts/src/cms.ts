import { z } from "zod";
import { defineEndpoint } from "./endpoint";
import { isoDate, isoDateTime, moneySchema } from "./common";

// --- CMS entries (testimonials / FAQs / banners) --------------------------------

export const cmsEntryKindSchema = z.enum(["testimonial", "faq", "banner"]);
export type CmsEntryKind = z.infer<typeof cmsEntryKindSchema>;

export const cmsEntrySchema = z.object({
  id: z.string(),
  kind: cmsEntryKindSchema,
  /** testimonial: couple names · faq: question · banner: headline */
  title: z.string(),
  /** testimonial: quote · faq: answer · banner: subtext */
  body: z.string(),
  imageUrl: z.string().nullable(),
  published: z.boolean(),
  sortOrder: z.number().int(),
  updatedAt: isoDateTime,
});
export type CmsEntry = z.infer<typeof cmsEntrySchema>;

export const upsertCmsEntryBodySchema = z.object({
  kind: cmsEntryKindSchema,
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Content is required"),
  imageUrl: z.string().nullable().optional(),
  published: z.boolean().default(true),
});
export type UpsertCmsEntryBody = z.infer<typeof upsertCmsEntryBodySchema>;

// --- Analytics (admin) ------------------------------------------------------------

export const adminAnalyticsSchema = z.object({
  contributionsByDay: z.array(z.object({ date: isoDate, amount: moneySchema })),
  signupsByDay: z.array(z.object({ date: isoDate, count: z.number().int() })),
  funnel: z.object({
    wishlistVisits: z.number().int(),
    guestsIdentified: z.number().int(),
    guestsContributed: z.number().int(),
  }),
  topItems: z.array(z.object({ title: z.string(), funded: moneySchema })),
});
export type AdminAnalytics = z.infer<typeof adminAnalyticsSchema>;

export const cmsEndpoints = {
  /** Public: storefront reads published entries (FAQ page, testimonials, banners). */
  listPublic: defineEndpoint({
    method: "GET",
    path: "/v1/cms/entries",
    query: z.object({ kind: cmsEntryKindSchema.optional() }),
    response: z.object({ items: z.array(cmsEntrySchema) }),
  }),
  listAdmin: defineEndpoint({
    method: "GET",
    path: "/v1/admin/cms/entries",
    query: z.object({ kind: cmsEntryKindSchema.optional() }),
    response: z.object({ items: z.array(cmsEntrySchema) }),
  }),
  create: defineEndpoint({
    method: "POST",
    path: "/v1/admin/cms/entries",
    body: upsertCmsEntryBodySchema,
    response: cmsEntrySchema,
  }),
  update: defineEndpoint({
    method: "PATCH",
    path: "/v1/admin/cms/entries/:entryId",
    params: z.object({ entryId: z.string() }),
    body: upsertCmsEntryBodySchema.partial(),
    response: cmsEntrySchema,
  }),
  remove: defineEndpoint({
    method: "DELETE",
    path: "/v1/admin/cms/entries/:entryId",
    params: z.object({ entryId: z.string() }),
    response: z.object({ ok: z.literal(true) }),
  }),
} as const;

export const analyticsEndpoints = {
  get: defineEndpoint({
    method: "GET",
    path: "/v1/admin/analytics",
    response: adminAnalyticsSchema,
  }),
} as const;
