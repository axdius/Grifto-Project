import { z } from "zod";
import { defineEndpoint } from "./endpoint";
import { isoDateTime, moneySchema } from "./common";

// --- Guest identification (PDF: name + email before viewing the wishlist) ----

export const guestIdentifyBodySchema = z.object({
  shareSlug: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
});
export type GuestIdentifyBody = z.infer<typeof guestIdentifyBodySchema>;

export const guestSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email(),
});
export type Guest = z.infer<typeof guestSchema>;

export const guestSessionSchema = z.object({
  guest: guestSchema,
  /** Opaque token scoped to guest actions on this wishlist. */
  guestToken: z.string(),
});
export type GuestSession = z.infer<typeof guestSessionSchema>;

// --- Contributions (Option 1) -------------------------------------------------

export const contributionStatusSchema = z.enum(["pending", "paid", "failed"]);

export const contributionSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  guestId: z.string(),
  amount: moneySchema,
  status: contributionStatusSchema,
  gatewayPaymentId: z.string().nullable(),
  createdAt: isoDateTime,
});
export type Contribution = z.infer<typeof contributionSchema>;

export const createContributionBodySchema = z.object({
  shareSlug: z.string(),
  itemId: z.string(),
  guestToken: z.string(),
  amountMinor: z.number().int().positive("Enter a contribution amount"),
  idempotencyKey: z.string(),
});
export type CreateContributionBody = z.infer<typeof createContributionBodySchema>;

// --- Reservations (Option 2: "I'm bringing this gift") -------------------------

export const createReservationBodySchema = z.object({
  shareSlug: z.string(),
  itemId: z.string(),
  guestToken: z.string(),
  consent: z.literal(true),
});
export type CreateReservationBody = z.infer<typeof createReservationBodySchema>;

// --- Gift messages (Option 3: send after the wedding) --------------------------

export const createGiftMessageBodySchema = z.object({
  shareSlug: z.string(),
  itemId: z.string(),
  guestToken: z.string(),
  message: z.string().max(500).optional(),
  requestAddress: z.boolean().default(false),
  consent: z.literal(true),
});
export type CreateGiftMessageBody = z.infer<typeof createGiftMessageBodySchema>;

// --- Address requests (couple approves/rejects) --------------------------------

export const addressRequestSchema = z.object({
  id: z.string(),
  itemTitle: z.string(),
  guestName: z.string(),
  guestEmail: z.string(),
  message: z.string().nullable(),
  status: z.enum(["pending", "approved", "rejected"]),
  createdAt: isoDateTime,
});
export type AddressRequest = z.infer<typeof addressRequestSchema>;

export const guestEndpoints = {
  identify: defineEndpoint({
    method: "POST",
    path: "/v1/guest/identify",
    body: guestIdentifyBodySchema,
    response: guestSessionSchema,
  }),
  createContribution: defineEndpoint({
    method: "POST",
    path: "/v1/contributions",
    body: createContributionBodySchema,
    response: contributionSchema,
  }),
  /**
   * Client-side payment confirmation. In production this is complemented by the
   * gateway webhook (the authoritative signal); the endpoint shape matches the
   * Razorpay handler-callback verification pattern.
   */
  verifyContribution: defineEndpoint({
    method: "POST",
    path: "/v1/contributions/:contributionId/verify",
    params: z.object({ contributionId: z.string() }),
    body: z.object({
      gatewayPaymentId: z.string().nullable(),
      outcome: z.enum(["success", "failed"]),
    }),
    response: contributionSchema,
  }),
  createReservation: defineEndpoint({
    method: "POST",
    path: "/v1/reservations",
    body: createReservationBodySchema,
    response: z.object({ ok: z.literal(true), itemId: z.string() }),
  }),
  createGiftMessage: defineEndpoint({
    method: "POST",
    path: "/v1/gift-messages",
    body: createGiftMessageBodySchema,
    response: z.object({ ok: z.literal(true), addressRequestId: z.string().nullable() }),
  }),
  listAddressRequests: defineEndpoint({
    method: "GET",
    path: "/v1/address-requests",
    auth: true,
    response: z.object({ items: z.array(addressRequestSchema) }),
  }),
  decideAddressRequest: defineEndpoint({
    method: "POST",
    path: "/v1/address-requests/:requestId/decide",
    auth: true,
    params: z.object({ requestId: z.string() }),
    body: z.object({ decision: z.enum(["approved", "rejected"]) }),
    response: addressRequestSchema,
  }),
} as const;
