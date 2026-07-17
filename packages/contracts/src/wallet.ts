import { z } from "zod";
import { defineEndpoint } from "./endpoint";
import { isoDateTime, moneySchema } from "./common";

// --- Wallet -------------------------------------------------------------------

export const walletSchema = z.object({
  /** Withdrawable now. */
  available: moneySchema,
  /** Held by in-flight withdrawals (locking state). */
  locked: moneySchema,
  /** Lifetime gross contributions received. */
  totalReceived: moneySchema,
});
export type WalletSummary = z.infer<typeof walletSchema>;

export const ledgerEntrySchema = z.object({
  id: z.string(),
  direction: z.enum(["credit", "debit"]),
  amount: moneySchema,
  entryType: z.enum([
    "contribution_credit",
    "withdrawal_hold",
    "hold_release",
    "withdrawal_settle",
    "fee",
  ]),
  description: z.string(),
  createdAt: isoDateTime,
});
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;

// --- Withdrawals ----------------------------------------------------------------

/** State machine per architecture doc 09. Funds are locked from `requested` until terminal. */
export const withdrawalStatusSchema = z.enum([
  "requested",
  "approved",
  "processing",
  "completed",
  "rejected",
]);
export type WithdrawalStatus = z.infer<typeof withdrawalStatusSchema>;

export const withdrawalSchema = z.object({
  id: z.string(),
  amount: moneySchema,
  fee: moneySchema,
  netAmount: moneySchema,
  status: withdrawalStatusSchema,
  bankAccountLast4: z.string(),
  createdAt: isoDateTime,
  settledAt: isoDateTime.nullable(),
});
export type Withdrawal = z.infer<typeof withdrawalSchema>;

export const createWithdrawalBodySchema = z.object({
  amountMinor: z.number().int().positive("Enter an amount to withdraw"),
  accountHolder: z.string().min(1, "Account holder name is required"),
  accountNumber: z.string().regex(/^\d{9,18}$/, "Enter a valid account number"),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code"),
  idempotencyKey: z.string(),
});
export type CreateWithdrawalBody = z.infer<typeof createWithdrawalBodySchema>;

// --- Notifications ---------------------------------------------------------------

export const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  readAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
});
export type Notification = z.infer<typeof notificationSchema>;

export const walletEndpoints = {
  getWallet: defineEndpoint({
    method: "GET",
    path: "/v1/wallet",
    auth: true,
    response: walletSchema,
  }),
  listTransactions: defineEndpoint({
    method: "GET",
    path: "/v1/wallet/transactions",
    auth: true,
    response: z.object({ items: z.array(ledgerEntrySchema) }),
  }),
  listWithdrawals: defineEndpoint({
    method: "GET",
    path: "/v1/withdrawals",
    auth: true,
    response: z.object({ items: z.array(withdrawalSchema) }),
  }),
  createWithdrawal: defineEndpoint({
    method: "POST",
    path: "/v1/withdrawals",
    auth: true,
    body: createWithdrawalBodySchema,
    response: withdrawalSchema,
  }),
} as const;

export const notificationEndpoints = {
  list: defineEndpoint({
    method: "GET",
    path: "/v1/notifications",
    auth: true,
    response: z.object({
      items: z.array(notificationSchema),
      unreadCount: z.number().int(),
    }),
  }),
  markRead: defineEndpoint({
    method: "POST",
    path: "/v1/notifications/read",
    auth: true,
    body: z.object({
      /** Omit to mark everything read. */
      ids: z.array(z.string()).optional(),
    }),
    response: z.object({ ok: z.literal(true) }),
  }),
} as const;
