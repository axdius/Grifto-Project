import type { ItemSource, ItemStatus, UserRoleType } from "@grifto/contracts";

/**
 * Internal mock database records. These deliberately mirror the *database*
 * schema from the architecture docs (file 08), not the API DTOs — the handlers
 * map records → DTOs the same way the real backend will, so DTO derivations
 * (progressPercent, remaining) are computed in one place.
 */

export interface DbUser {
  id: string;
  email: string;
  phone: string;
  passwordPlain: string; // mock only — never do this for real
  firstName: string;
  lastName: string;
  roleType: UserRoleType;
  weddingDate: string;
  partnerName: string | null;
  weddingVenue: string | null;
  weddingMessage: string | null;
  createdAt: string;
}

export interface DbSession {
  refreshToken: string;
  userId: string;
  createdAt: string;
}

export interface DbWishlist {
  id: string;
  userId: string;
  title: string;
  shareSlug: string;
  createdAt: string;
}

export interface DbWishlistItem {
  id: string;
  wishlistId: string;
  source: ItemSource;
  productId: string | null;
  title: string;
  imageUrl: string | null;
  productUrl: string | null;
  priceMinor: number;
  fundedMinor: number;
  status: ItemStatus;
  sortOrder: number;
  createdAt: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
}

export interface DbProduct {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  priceMinor: number;
}

export interface DbGuest {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface DbContribution {
  id: string;
  itemId: string;
  wishlistId: string;
  guestId: string;
  amountMinor: number;
  status: "pending" | "paid" | "failed";
  gatewayPaymentId: string | null;
  idempotencyKey: string;
  createdAt: string;
}

export interface DbReservation {
  id: string;
  itemId: string;
  guestId: string;
  createdAt: string;
}

export interface DbGiftMessage {
  id: string;
  itemId: string;
  guestId: string;
  message: string | null;
  createdAt: string;
}

export interface DbAddressRequest {
  id: string;
  giftMessageId: string;
  itemId: string;
  guestId: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  decidedAt: string | null;
  createdAt: string;
}

export interface DbNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

/**
 * Double-entry-shaped ledger entry (simplified to the couple's wallet view).
 * Mirrors the production ledger design (architecture doc 09) closely enough
 * that the wallet UI built on it needs no rework against the real API.
 */
export interface DbLedgerEntry {
  id: string;
  userId: string;
  direction: "credit" | "debit";
  amountMinor: number;
  entryType: "contribution_credit" | "withdrawal_hold" | "hold_release" | "withdrawal_settle" | "fee";
  referenceType: "contribution" | "withdrawal";
  referenceId: string;
  description: string;
  createdAt: string;
}

export interface DbWithdrawal {
  id: string;
  userId: string;
  amountMinor: number;
  feeMinor: number;
  status: "requested" | "approved" | "processing" | "completed" | "rejected";
  accountHolder: string;
  accountNumberLast4: string;
  ifsc: string;
  idempotencyKey: string;
  createdAt: string;
  settledAt: string | null;
}

export interface DbSettings {
  /** Platform withdrawal fee in basis points (200 = 2%). Editable in admin (M7). */
  withdrawalFeeBps: number;
  /** Platform cut on contributions in basis points. */
  contributionFeeBps: number;
}

export interface DbCmsEntry {
  id: string;
  kind: "testimonial" | "faq" | "banner";
  title: string;
  body: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  published: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface DbThemeSection {
  id: string;
  type: string;
  settings: Record<string, unknown>;
}

export interface DbThemeState {
  draft: { sections: DbThemeSection[] };
  draftUpdatedAt: string;
  published: { sections: DbThemeSection[] };
  versions: {
    id: string;
    version: number;
    label: string;
    publishedAt: string;
    document: { sections: DbThemeSection[] };
  }[];
}

export interface MockDbData {
  settings: DbSettings;
  theme: DbThemeState;
  cmsEntries: DbCmsEntry[];
  users: DbUser[];
  sessions: DbSession[];
  wishlists: DbWishlist[];
  wishlistItems: DbWishlistItem[];
  categories: DbCategory[];
  products: DbProduct[];
  guests: DbGuest[];
  contributions: DbContribution[];
  reservations: DbReservation[];
  giftMessages: DbGiftMessage[];
  addressRequests: DbAddressRequest[];
  notifications: DbNotification[];
  ledgerEntries: DbLedgerEntry[];
  withdrawals: DbWithdrawal[];
}

export const emptyThemeState: DbThemeState = {
  draft: { sections: [] },
  draftUpdatedAt: "2026-05-01T10:00:00.000Z",
  published: { sections: [] },
  versions: [],
};

export const emptyDb: MockDbData = {
  settings: { withdrawalFeeBps: 200, contributionFeeBps: 0 },
  theme: emptyThemeState,
  cmsEntries: [],
  users: [],
  sessions: [],
  wishlists: [],
  wishlistItems: [],
  categories: [],
  products: [],
  guests: [],
  contributions: [],
  reservations: [],
  giftMessages: [],
  addressRequests: [],
  notifications: [],
  ledgerEntries: [],
  withdrawals: [],
};
