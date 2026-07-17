import { z } from "zod";

/** RFC 9457 problem+json error shape returned by every endpoint on failure. */
export const problemSchema = z.object({
  type: z.string().default("about:blank"),
  title: z.string(),
  status: z.number(),
  detail: z.string().optional(),
  /** Stable machine-readable code, e.g. "AUTH_INVALID_CREDENTIALS". */
  code: z.string(),
  traceId: z.string().optional(),
});
export type Problem = z.infer<typeof problemSchema>;

/** Money is always integer minor units (paise) + ISO currency. Never floats. */
export const moneySchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default("INR"),
});
export type Money = z.infer<typeof moneySchema>;

export const cursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function cursorPage<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

export const imageRefSchema = z.object({
  url: z.string(),
  alt: z.string().default(""),
});
export type ImageRef = z.infer<typeof imageRefSchema>;

export const isoDateTime = z.string().datetime();
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
