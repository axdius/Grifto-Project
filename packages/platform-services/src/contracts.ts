/**
 * Client-side capability interfaces — the places where "mock today, real later"
 * does NOT go through HTTP, so the swap seam is a class implementation instead.
 *
 * Today                          Later
 * -----                          -----
 * LocalObjectStorageService  →   S3 presigned-upload StorageService
 * FakePaymentCheckout        →   Razorpay checkout.js adapter
 * NoopPushService            →   FCM web push adapter
 * ConsoleAnalyticsClient     →   real ingestion endpoint client
 */

// --- Storage -----------------------------------------------------------------

export interface UploadedAsset {
  id: string;
  /** Renderable URL (object URL / public path today; CDN URL later). */
  url: string;
  filename: string;
  mime: string;
  bytes: number;
}

export interface StorageService {
  upload(file: File): Promise<UploadedAsset>;
  remove(assetId: string): Promise<void>;
}

// --- Payment checkout ---------------------------------------------------------

export interface CheckoutRequest {
  /** Server-issued order/intent reference (contribution id in Grifto). */
  orderRef: string;
  amountMinor: number;
  currency: string;
  /** Display metadata for the checkout surface. */
  description: string;
  payerName?: string;
  payerEmail?: string;
}

export type CheckoutResult =
  | { status: "success"; gatewayPaymentId: string }
  | { status: "failed"; reason: string }
  | { status: "cancelled" };

export interface PaymentCheckout {
  /** Opens the gateway checkout surface and resolves with the outcome. */
  open(request: CheckoutRequest): Promise<CheckoutResult>;
}

// --- Push --------------------------------------------------------------------

export interface PushService {
  requestPermission(): Promise<boolean>;
  getDeviceToken(): Promise<string | null>;
}

// --- Analytics ---------------------------------------------------------------

export interface AnalyticsClient {
  track(event: string, properties?: Record<string, unknown>): void;
  page(path: string): void;
  identify(userId: string | null): void;
}

// --- Key-value store -----------------------------------------------------------

/** Small client-side persistence (guest session, UI prefs). localStorage today. */
export interface KeyValueStore {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

// --- Aggregate ----------------------------------------------------------------

export interface PlatformServices {
  storage: StorageService;
  paymentCheckout: PaymentCheckout;
  push: PushService;
  analytics: AnalyticsClient;
  kv: KeyValueStore;
}
