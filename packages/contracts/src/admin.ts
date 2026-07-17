import { z } from "zod";
import { defineEndpoint } from "./endpoint";
import { isoDate, isoDateTime, moneySchema } from "./common";
import { userRoleTypeSchema } from "./auth";
import { productSchema } from "./catalog";
import { wishlistItemSchema } from "./wishlist";
import { withdrawalStatusSchema } from "./wallet";

/**
 * Admin API. NOTE: unauthenticated in mock mode — admin login + RBAC ships with
 * the real backend (architecture doc 05 §authorization); paths already carry
 * the /v1/admin prefix so the cutover is contract-compatible.
 */

// --- Dashboard metrics -----------------------------------------------------------

export const adminMetricsSchema = z.object({
  totalContributions: moneySchema,
  walletBalances: moneySchema,
  activeWeddings: z.number().int(),
  pendingPayouts: z.number().int(),
  totalCustomers: z.number().int(),
  totalGuests: z.number().int(),
});
export type AdminMetrics = z.infer<typeof adminMetricsSchema>;

// --- Customers ---------------------------------------------------------------------

export const adminCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  roleType: userRoleTypeSchema,
  weddingDate: isoDate,
  itemCount: z.number().int(),
  totalReceived: moneySchema,
  walletAvailable: moneySchema,
  createdAt: isoDateTime,
});
export type AdminCustomer = z.infer<typeof adminCustomerSchema>;

export const adminContributionSchema = z.object({
  id: z.string(),
  guestName: z.string(),
  guestEmail: z.string(),
  customerName: z.string(),
  itemTitle: z.string(),
  amount: moneySchema,
  status: z.enum(["pending", "paid", "failed"]),
  createdAt: isoDateTime,
});
export type AdminContribution = z.infer<typeof adminContributionSchema>;

export const adminWithdrawalSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  amount: moneySchema,
  fee: moneySchema,
  netAmount: moneySchema,
  status: withdrawalStatusSchema,
  accountHolder: z.string(),
  bankAccountLast4: z.string(),
  ifsc: z.string(),
  createdAt: isoDateTime,
  settledAt: isoDateTime.nullable(),
});
export type AdminWithdrawal = z.infer<typeof adminWithdrawalSchema>;

/** Customer 360 view. */
export const adminCustomerDetailSchema = z.object({
  customer: adminCustomerSchema,
  wishlistItems: z.array(wishlistItemSchema),
  contributions: z.array(adminContributionSchema),
  withdrawals: z.array(adminWithdrawalSchema),
});
export type AdminCustomerDetail = z.infer<typeof adminCustomerDetailSchema>;

// --- Products ---------------------------------------------------------------------

export const upsertProductBodySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  categoryId: z.string().min(1, "Category is required"),
  priceMinor: z.number().int().positive("Price is required"),
  imageUrl: z.string().nullable().optional(),
});
export type UpsertProductBody = z.infer<typeof upsertProductBodySchema>;

// --- Settings ---------------------------------------------------------------------

export const platformSettingsSchema = z.object({
  withdrawalFeeBps: z.number().int().min(0).max(2000),
  contributionFeeBps: z.number().int().min(0).max(2000),
});
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

export const adminEndpoints = {
  getMetrics: defineEndpoint({
    method: "GET",
    path: "/v1/admin/metrics",
    response: adminMetricsSchema,
  }),
  listCustomers: defineEndpoint({
    method: "GET",
    path: "/v1/admin/customers",
    query: z.object({ search: z.string().optional() }),
    response: z.object({ items: z.array(adminCustomerSchema) }),
  }),
  getCustomer: defineEndpoint({
    method: "GET",
    path: "/v1/admin/customers/:customerId",
    params: z.object({ customerId: z.string() }),
    response: adminCustomerDetailSchema,
  }),
  listContributions: defineEndpoint({
    method: "GET",
    path: "/v1/admin/contributions",
    response: z.object({ items: z.array(adminContributionSchema) }),
  }),
  listWithdrawals: defineEndpoint({
    method: "GET",
    path: "/v1/admin/withdrawals",
    query: z.object({ status: withdrawalStatusSchema.optional() }),
    response: z.object({ items: z.array(adminWithdrawalSchema) }),
  }),
  decideWithdrawal: defineEndpoint({
    method: "POST",
    path: "/v1/admin/withdrawals/:withdrawalId/decide",
    params: z.object({ withdrawalId: z.string() }),
    body: z.object({ decision: z.enum(["approved", "completed", "rejected"]) }),
    response: adminWithdrawalSchema,
  }),
  createProduct: defineEndpoint({
    method: "POST",
    path: "/v1/admin/products",
    body: upsertProductBodySchema,
    response: productSchema,
  }),
  updateProduct: defineEndpoint({
    method: "PATCH",
    path: "/v1/admin/products/:productId",
    params: z.object({ productId: z.string() }),
    body: upsertProductBodySchema.partial(),
    response: productSchema,
  }),
  deleteProduct: defineEndpoint({
    method: "DELETE",
    path: "/v1/admin/products/:productId",
    params: z.object({ productId: z.string() }),
    response: z.object({ ok: z.literal(true) }),
  }),
  getSettings: defineEndpoint({
    method: "GET",
    path: "/v1/admin/settings",
    response: platformSettingsSchema,
  }),
  updateSettings: defineEndpoint({
    method: "PATCH",
    path: "/v1/admin/settings",
    body: platformSettingsSchema.partial(),
    response: platformSettingsSchema,
  }),
} as const;
