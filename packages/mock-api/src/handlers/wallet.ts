import { http } from "msw";
import {
  createWithdrawalBodySchema,
  type LedgerEntry,
  type WalletSummary,
  type Withdrawal,
} from "@grifto/contracts";
import { db, newId } from "../db/db";
import type { DbWithdrawal, MockDbData } from "../db/schema";
import { authenticate, ok, problem, simulateLatency, unauthorized } from "../http";

const INR = "INR";

/**
 * Wallet math from the ledger — same derivation the real backend performs:
 *   available = credits(contribution_credit, hold_release) − debits(withdrawal_hold)
 *   locked    = holds of withdrawals still in flight (requested/approved/processing)
 */
export function computeWallet(data: MockDbData, userId: string): WalletSummary {
  let available = 0;
  let totalReceived = 0;
  for (const entry of data.ledgerEntries) {
    if (entry.userId !== userId) continue;
    if (entry.direction === "credit") available += entry.amountMinor;
    else available -= entry.amountMinor;
    if (entry.entryType === "contribution_credit") totalReceived += entry.amountMinor;
  }
  const locked = data.withdrawals
    .filter(
      (w) =>
        w.userId === userId &&
        (w.status === "requested" || w.status === "approved" || w.status === "processing"),
    )
    .reduce((sum, w) => sum + w.amountMinor, 0);
  return {
    available: { amountMinor: available, currency: INR },
    locked: { amountMinor: locked, currency: INR },
    totalReceived: { amountMinor: totalReceived, currency: INR },
  };
}

export function toWithdrawalDto(w: DbWithdrawal): Withdrawal {
  return {
    id: w.id,
    amount: { amountMinor: w.amountMinor, currency: INR },
    fee: { amountMinor: w.feeMinor, currency: INR },
    netAmount: { amountMinor: w.amountMinor - w.feeMinor, currency: INR },
    status: w.status,
    bankAccountLast4: w.accountNumberLast4,
    createdAt: w.createdAt,
    settledAt: w.settledAt,
  };
}

export const walletHandlers = [
  http.get("*/v1/wallet", async ({ request }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    return ok(computeWallet(db.get(), user.id));
  }),

  http.get("*/v1/wallet/transactions", async ({ request }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    const items: LedgerEntry[] = db
      .get()
      .ledgerEntries.filter((e) => e.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((e) => ({
        id: e.id,
        direction: e.direction,
        amount: { amountMinor: e.amountMinor, currency: INR },
        entryType: e.entryType,
        description: e.description,
        createdAt: e.createdAt,
      }));
    return ok({ items });
  }),

  http.get("*/v1/withdrawals", async ({ request }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    const items = db
      .get()
      .withdrawals.filter((w) => w.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toWithdrawalDto);
    return ok({ items });
  }),

  http.post("*/v1/withdrawals", async ({ request }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    const parsed = createWithdrawalBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return problem(422, "VALIDATION_ERROR", "Validation failed", parsed.error.issues[0]?.message);
    }
    const body = parsed.data;
    const data = db.get();

    const existing = data.withdrawals.find((w) => w.idempotencyKey === body.idempotencyKey);
    if (existing) return ok(toWithdrawalDto(existing));

    const wallet = computeWallet(data, user.id);
    if (body.amountMinor > wallet.available.amountMinor) {
      return problem(
        422,
        "INSUFFICIENT_BALANCE",
        "Insufficient balance",
        "The requested amount exceeds your available balance.",
      );
    }

    const withdrawal = db.mutate((d) => {
      const feeMinor = Math.round((body.amountMinor * d.settings.withdrawalFeeBps) / 10000);
      const created: DbWithdrawal = {
        id: newId("wdr"),
        userId: user.id,
        amountMinor: body.amountMinor,
        feeMinor,
        status: "requested",
        accountHolder: body.accountHolder,
        accountNumberLast4: body.accountNumber.slice(-4),
        ifsc: body.ifsc,
        idempotencyKey: body.idempotencyKey,
        createdAt: new Date().toISOString(),
        settledAt: null,
      };
      d.withdrawals.push(created);
      // Locking: funds leave `available` immediately via a hold entry.
      d.ledgerEntries.push({
        id: newId("led"),
        userId: user.id,
        direction: "debit",
        amountMinor: body.amountMinor,
        entryType: "withdrawal_hold",
        referenceType: "withdrawal",
        referenceId: created.id,
        description: `Withdrawal to bank account ····${created.accountNumberLast4}`,
        createdAt: created.createdAt,
      });
      d.notifications.unshift({
        id: newId("ntf"),
        userId: user.id,
        type: "withdrawal_requested",
        title: "Withdrawal requested",
        body: `Your withdrawal of ₹${(body.amountMinor / 100).toLocaleString("en-IN")} is pending approval.`,
        readAt: null,
        createdAt: created.createdAt,
      });
      return created;
    });
    return ok(toWithdrawalDto(withdrawal), 201);
  }),
];

export const notificationHandlers = [
  http.get("*/v1/notifications", async ({ request }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    const items = db
      .get()
      .notifications.filter((n) => n.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        readAt: n.readAt,
        createdAt: n.createdAt,
      }));
    return ok({ items, unreadCount: items.filter((n) => !n.readAt).length });
  }),

  http.post("*/v1/notifications/read", async ({ request }) => {
    await simulateLatency();
    const user = authenticate(request);
    if (!user) return unauthorized();
    const body = (await request.json()) as { ids?: string[] };
    db.mutate((data) => {
      const now = new Date().toISOString();
      for (const n of data.notifications) {
        if (n.userId !== user.id || n.readAt) continue;
        if (!body.ids || body.ids.includes(n.id)) n.readAt = now;
      }
    });
    return ok({ ok: true });
  }),
];
