import type {
  AnalyticsClient,
  CheckoutRequest,
  CheckoutResult,
  KeyValueStore,
  PaymentCheckout,
  PlatformServices,
  PushService,
  StorageService,
  UploadedAsset,
} from "./contracts";

/** Local dev implementations. Replaced adapter-by-adapter when real infra arrives. */

export class LocalObjectStorageService implements StorageService {
  private assets = new Map<string, UploadedAsset>();

  async upload(file: File): Promise<UploadedAsset> {
    const asset: UploadedAsset = {
      id: `asset_${Math.random().toString(36).slice(2, 10)}`,
      url: URL.createObjectURL(file),
      filename: file.name,
      mime: file.type,
      bytes: file.size,
    };
    this.assets.set(asset.id, asset);
    return asset;
  }

  async remove(assetId: string): Promise<void> {
    const asset = this.assets.get(assetId);
    if (asset) {
      URL.revokeObjectURL(asset.url);
      this.assets.delete(assetId);
    }
  }
}

/**
 * Fake checkout used until Razorpay integration: resolves after a short delay.
 * The M5 milestone replaces this with a modal UI that lets the tester choose
 * success / failure / cancel — same interface.
 */
export class FakePaymentCheckout implements PaymentCheckout {
  async open(request: CheckoutRequest): Promise<CheckoutResult> {
    await new Promise((r) => setTimeout(r, 600));
    return {
      status: "success",
      gatewayPaymentId: `fakepay_${request.orderRef}_${Date.now()}`,
    };
  }
}

export class NoopPushService implements PushService {
  async requestPermission(): Promise<boolean> {
    return false;
  }
  async getDeviceToken(): Promise<string | null> {
    return null;
  }
}

export class ConsoleAnalyticsClient implements AnalyticsClient {
  track(event: string, properties?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, properties ?? {});
  }
  page(path: string): void {
    // eslint-disable-next-line no-console
    console.debug("[analytics] page", path);
  }
  identify(userId: string | null): void {
    // eslint-disable-next-line no-console
    console.debug("[analytics] identify", userId);
  }
}

export class LocalKeyValueStore implements KeyValueStore {
  constructor(private readonly prefix = "grifto.kv.") {}

  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(this.prefix + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  remove(key: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(this.prefix + key);
  }
}

export function createLocalPlatformServices(
  overrides: Partial<PlatformServices> = {},
): PlatformServices {
  return {
    storage: new LocalObjectStorageService(),
    paymentCheckout: new FakePaymentCheckout(),
    push: new NoopPushService(),
    analytics: new ConsoleAnalyticsClient(),
    kv: new LocalKeyValueStore(),
    ...overrides,
  };
}
